import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true, collection: 'orders_source' }) // Use a specific collection name
export class Order {
  @Prop({
    type: String,
    default: () => new Types.ObjectId().toHexString(),
    unique: true,
  })
  order_id: string;

  @Prop({ required: true })
  customer_id: string;

  @Prop({ required: true })
  product_id: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop({
    required: true,
    enum: ['created', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'created',
  })
  status: string;

  // createdAt and updatedAt are provided by timestamps: true
}

export const OrderSchema = SchemaFactory.createForClass(Order);
