import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongooseConnection } from 'mongoose';
import {
  ChangeStream,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamUpdateDocument,
  ChangeStreamReplaceDocument,
  ChangeStreamDeleteDocument,
  Collection,
  Document as MongoDocument,
  Timestamp as MongoTimestamp,
  // Specific event types if needed for very fine-grained control,
  // but the 'operationType' switch covers most document-related events.
  // ChangeStreamDropDocument, ChangeStreamRenameDocument, ChangeStreamInvalidateDocument
} from 'mongodb';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

// Define a more specific type for your event payload if you like
interface CdcEventPayload {
    operationType: string;
    ns?: any; // ns is optional at this level
    timestamp: Date;
    clusterTimeRaw?: MongoTimestamp;
    documentKey?: any;
    fullDocument?: any;
    fullDocumentBeforeChange?: any;
    updateDescription?: any;
    // Add any other fields you might extract
}


@Injectable()
export class OrdersCdcService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(OrdersCdcService.name);
  private changeStream: ChangeStream<MongoDocument, ChangeStreamDocument<MongoDocument>>;
  private redisClient: Redis;
  private readonly redisStreamName: string;

  constructor(
    @InjectConnection() private readonly mongooseConnection: MongooseConnection,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis();
    this.redisStreamName = this.configService.get<string>('ETL_REDIS_ORDERS_STREAM_NAME', 'orders_cdc_stream');
    this.logger.log(`Redis client configured for ${this.configService.get<string>('ETL_REDIS_HOST')}:${this.configService.get<number>('ETL_REDIS_PORT')}`);
  }

  async onModuleInit() {
    this.logger.log('Initializing CDC for Orders...');
    try {
      const orderCollection: Collection<MongoDocument> = this.mongooseConnection.collection('orders_source');

      this.changeStream = orderCollection.watch<MongoDocument>([], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable',
      });

      this.changeStream.on('change', async (change: ChangeStreamDocument<MongoDocument>) => {
        // Initial log with just operationType which is always present
        this.logger.debug(`Change event received. Operation Type: ${change.operationType}`);

        // Handle 'invalidate' separately as it won't have 'ns' or document data
        if (change.operationType === 'invalidate') {
          this.logger.warn('MongoDB Change Stream invalidated. The stream may close or need to be re-established. No further processing for this event.');
          // Depending on the driver version and error handling, the stream might close.
          // You might implement logic here to attempt to re-initialize the change stream.
          return; // Stop processing this event further
        }

        // Now that 'invalidate' is handled, other types should have 'ns'
        // However, to be absolutely safe with TypeScript, we can use a type guard
        let namespaceInfo = "N/A";
        if ('ns' in change && change.ns ) {
            namespaceInfo = `${change.ns.db}.${change.ns}`;
            this.logger.debug(`Change detected for operation ${change.operationType} on ${namespaceInfo}`);
        } else {
            this.logger.warn(`Change event type ${change.operationType} does not have 'ns' property as expected.`);
        }

        // Base payload construction
        const eventPayload: CdcEventPayload = { // Using the interface now
            operationType: change.operationType,
            timestamp: change.clusterTime instanceof MongoTimestamp
                ? new Date(change.clusterTime.getHighBits() * 1000 + change.clusterTime.getLowBits() / 1000)
                : new Date(),
            clusterTimeRaw: change.clusterTime,
        };

        if ('ns' in change && change.ns) {
            eventPayload.ns = change.ns;
        }

        // Add operation-specific fields
        switch (change.operationType) {
          case 'insert':
            const insertEvent = change as ChangeStreamInsertDocument<MongoDocument>;
            eventPayload.documentKey = insertEvent.documentKey;
            eventPayload.fullDocument = insertEvent.fullDocument;
            break;
          case 'update':
            const updateEvent = change as ChangeStreamUpdateDocument<MongoDocument>;
            eventPayload.documentKey = updateEvent.documentKey;
            eventPayload.updateDescription = updateEvent.updateDescription;
            if (updateEvent.fullDocument) {
              eventPayload.fullDocument = updateEvent.fullDocument;
            }
            break;
          case 'replace':
            const replaceEvent = change as ChangeStreamReplaceDocument<MongoDocument>;
            eventPayload.documentKey = replaceEvent.documentKey;
            eventPayload.fullDocument = replaceEvent.fullDocument;
            break;
          case 'delete':
            const deleteEvent = change as ChangeStreamDeleteDocument<MongoDocument>;
            eventPayload.documentKey = deleteEvent.documentKey;
            if (deleteEvent.fullDocumentBeforeChange) {
                eventPayload.fullDocumentBeforeChange = deleteEvent.fullDocumentBeforeChange;
            }
            break;
          // These types also have 'ns', but might not have documentKey/fullDocument
          case 'drop':
          case 'rename':
          case 'dropDatabase':
            this.logger.log(`Structural change event: ${change.operationType} on namespace (if available): ${namespaceInfo}`);
            // No specific document payload for these, but 'ns' is typically present
            break;
          default:
            // This case should ideally not be hit if 'invalidate' is handled and other known types are cased.
            // However, it's a good catch-all.
            this.logger.warn(`Unhandled operation type in switch: ${change.operationType}. Event might lack some fields.`);
            break;
        }

        try {
          // Only publish if it's a type we are interested in for the stream (e.g., document changes)
          // You can add more sophisticated filtering here.
          if (['insert', 'update', 'replace', 'delete'].includes(eventPayload.operationType)) {
            const result = await this.redisClient.xadd(
              this.redisStreamName,
              '*',
              'event_data',
              JSON.stringify(eventPayload),
            );
            this.logger.log(`Event [${eventPayload.operationType}] for docKey [${JSON.stringify(eventPayload.documentKey?._id)}] on [${namespaceInfo}] published to Redis Stream ${this.redisStreamName} with ID: ${result}`);
          } else if (eventPayload.operationType) { // Log other events but don't necessarily send them
            this.logger.log(`Event [${eventPayload.operationType}] on [${namespaceInfo}] was not a document modification. Not publishing to data stream.`);
          }
        } catch (err) {
          this.logger.error(`Failed to publish event to Redis Stream: ${err.message}`, err.stack, { payloadSnapshot: JSON.stringify(eventPayload).substring(0, 500) });
        }
      });

      this.changeStream.on('error', (error) => {
        this.logger.error('Error in MongoDB Change Stream:', error.stack);
        // Consider re-initializing the stream on certain types of errors, possibly with a resume token.
      });

      this.changeStream.on('close', () => {
        this.logger.warn('MongoDB Change Stream closed.');
        // This might happen after an 'invalidate' event or due to other reasons.
        // Implement logic to re-establish the stream if desired.
      });

      this.logger.log(`Watching "orders_source" collection for changes... Publishing to Redis stream "${this.redisStreamName}"`);
    } catch (error) {
      this.logger.error('Failed to initialize CDC pipeline', error.stack);
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down CDC producer (Signal: ${signal})...`);
    if (this.changeStream && !this.changeStream.closed) {
      await this.changeStream.close();
      this.logger.log('MongoDB Change Stream closed.');
    }
    if (this.redisClient.status === 'ready' || this.redisClient.status === 'connecting') {
      this.redisClient.disconnect();
      this.logger.log('Redis client disconnected.');
    }
  }
}