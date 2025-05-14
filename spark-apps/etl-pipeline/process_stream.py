from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, udf, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, MapType, TimestampType, IntegerType, DoubleType, BooleanType
import json
import os

# --- Configuration ---
# Redis Config (passed from environment or hardcoded for simplicity here)
REDIS_HOST = os.getenv("ETL_REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("ETL_REDIS_PORT", "6380")
REDIS_STREAM_NAME = os.getenv("ETL_REDIS_ORDERS_STREAM_NAME", "orders_cdc_stream")
# Spark usually needs group and consumer name for Redis Streams
REDIS_STREAM_GROUP_NAME = "spark_etl_group"
REDIS_STREAM_CONSUMER_NAME = "spark_consumer_1"


# MinIO/S3 Config
MINIO_ENDPOINT = os.getenv("ETL_MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("ETL_MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("ETL_MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("ETL_MINIO_BUCKET_NAME", "etl-warehouse")
OUTPUT_PATH_ORDERS = f"s3a://{MINIO_BUCKET_NAME}/transformed_orders/"

# Checkpoint location for Spark Streaming
CHECKPOINT_LOCATION = "/tmp/spark_checkpoints/orders_etl"


def main():
    spark = SparkSession.builder \
        .appName("RealTimeOrdersETL") \
        .config("spark.hadoop.fs.s3a.endpoint", MINIO_ENDPOINT) \
        .config("spark.hadoop.fs.s3a.access.key", MINIO_ACCESS_KEY) \
        .config("spark.hadoop.fs.s3a.secret.key", MINIO_SECRET_KEY) \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .config("spark.sql.streaming.schemaInference", "true") \
        .getOrCreate() # Removed .master("local[*]") for running in cluster or via spark-submit config

    # Configure logging
    spark.sparkContext.setLogLevel("WARN") # Options: INFO, WARN, ERROR
    log4jLogger = spark.sparkContext._jvm.org.apache.log4j
    LOGGER = log4jLogger.LogManager.getLogger(__name__)
    LOGGER.info("PySpark ETL Job Started. Reading from Redis Stream.")


    # Define the schema for the JSON data within the Redis Stream event_data
    # This matches the structure of `eventPayload` from cdc-producer
    cdc_event_schema = StructType([
        StructField("operationType", StringType(), True),
        StructField("documentKey", StructType([StructField("_id", StringType(), True)]), True),
        StructField("fullDocument", StringType(), True), # Initially read as string, then parse
        StructField("fullDocumentBeforeChange", StringType(), True), # Initially read as string
        StructField("updateDescription", StringType(), True), # Initially read as string
        StructField("timestamp", TimestampType(), True)
    ])

    # Define the schema for the 'fullDocument' (Order data)
    order_data_schema = StructType([
        StructField("order_id", StringType(), True),
        StructField("customer_id", StringType(), True),
        StructField("product_id", StringType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("price", DoubleType(), True),
        StructField("status", StringType(), True),
        StructField("createdAt", TimestampType(), True), # From MongoDB timestamps
        StructField("updatedAt", TimestampType(), True), # From MongoDB timestamps
        StructField("_id", StringType(), True) # MongoDB internal _id
    ])

    # Read from Redis Stream
    # Requires the spark-redis connector JAR. Pass with --packages com.redislabs:spark-redis_2.12:LATEST_VERSION
    # Ensure your Docker image for Spark has this connector.
    # For this example, we'll assume the stream has a single field 'event_data' containing JSON string
    redis_df = spark.readStream \
        .format("redis") \
        .option("stream.keys", REDIS_STREAM_NAME) \
        .option("stream.read.batch.size", "100") \
        .option("stream.read.block", "500") # ms to wait for new data
        .option("host", REDIS_HOST) \
        .option("port", REDIS_PORT) \
        .option("stream.group.name", REDIS_STREAM_GROUP_NAME) \
        .option("stream.consumer.name", REDIS_STREAM_CONSUMER_NAME) \
        .option("stream.consumer.ack.policy", "MANUAL") # Important for reliability
        .schema(StructType([StructField("event_data", StringType())])) \
        .load()


    LOGGER.info("Successfully connected to Redis Stream.")

    # --- Transformations ---
    # 1. Parse the JSON string from 'event_data'
    parsed_df = redis_df.withColumn("jsonData", from_json(col("event_data"), cdc_event_schema)) \
                        .select("jsonData.*")

    # 2. Parse 'fullDocument' and 'fullDocumentBeforeChange' JSON strings
    # UDF to handle potentially null or malformed JSON for fullDocument
    def safe_json_parse(json_string, schema):
        if json_string is None:
            return None
        try:
            return json.loads(json_string)
        except (json.JSONDecodeError, TypeError):
            # LOGGER.warn(f"Malformed JSON detected in fullDocument: {json_string[:100]}") # Be careful with logging PII
            return None # Or a default error structure

    safe_json_parse_udf = udf(lambda x: safe_json_parse(x, order_data_schema), order_data_schema)

    orders_df = parsed_df.withColumn("parsedFullDocument", safe_json_parse_udf(col("fullDocument"))) \
                         .withColumn("parsedFullDocumentBeforeChange", safe_json_parse_udf(col("fullDocumentBeforeChange")))

    # 3. Select relevant fields and handle different operation types
    # For inserts/updates, parsedFullDocument is key. For deletes, parsedFullDocumentBeforeChange.
    # We will create a unified structure for the warehouse.
    # If operationType is 'delete', take data from 'parsedFullDocumentBeforeChange'.
    # Otherwise, take from 'parsedFullDocument'. Add a flag for deletion.
    def determine_final_doc(op_type, doc, before_doc):
        if op_type == "delete":
            return before_doc
        return doc

    determine_final_doc_udf = udf(determine_final_doc, order_data_schema)

    final_data_df = orders_df.withColumn("data", determine_final_doc_udf(col("operationType"), col("parsedFullDocument"), col("parsedFullDocumentBeforeChange"))) \
                             .select(
                                 col("operationType").alias("cdc_operation_type"),
                                 col("timestamp").alias("cdc_timestamp"),
                                 col("documentKey._id").alias("mongo_doc_key"),
                                 col("data.order_id").alias("order_id"),
                                 col("data.customer_id").alias("customer_id"),
                                 col("data.product_id").alias("product_id"),
                                 col("data.quantity").alias("quantity"),
                                 col("data.price").alias("price"),
                                 col("data.status").alias("order_status"),
                                 col("data.createdAt").alias("order_created_at"),
                                 col("data.updatedAt").alias("order_updated_at"),
                                 (col("operationType") == "delete").alias("is_deleted")
                             )

    # Filter out records where essential data might be missing after parsing (especially if fullDocument was null)
    # This helps with malformed input.
    valid_data_df = final_data_df.filter(col("order_id").isNotNull())

    # 4. Enrich data (Example: Add processing timestamp)
    enriched_df = valid_data_df.withColumn("etl_processing_time", current_timestamp())


    # --- Sink to Data Warehouse (MinIO as Parquet files) ---
    # Writing in append mode. Partitioning can be useful.
    query = enriched_df.writeStream \
        .outputMode("append") \
        .format("parquet") \
        .option("path", OUTPUT_PATH_ORDERS) \
        .option("checkpointLocation", CHECKPOINT_LOCATION) \
        .trigger(processingTime="60 seconds") \
        .start() # Removed .awaitTermination() for cluster execution

    LOGGER.info(f"Streaming query started. Writing to {OUTPUT_PATH_ORDERS}")
    query.awaitTermination()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Attempt to get Spark logger if available, otherwise use print
        try:
            spark_context = SparkSession.getActiveSession().sparkContext
            log4jLogger = spark_context._jvm.org.apache.log4j
            LOGGER = log4jLogger.LogManager.getLogger(__name__ + "_error")
            LOGGER.error("ETL Job failed critically", exc_info=True)
        except:
            print(f"ETL Job failed critically: {e}")
        raise e