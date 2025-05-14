import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
// import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);
  private intervalId: NodeJS.Timeout;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  onModuleInit() {
    this.logger.log('Starting data simulation...');
    this.simulateData();
    // Also simulate some updates/deletes after a while
    setTimeout(() => this.simulateUpdatesAndDeletes(), 30000); // Start updates after 30s
  }

  async createRandomOrder(): Promise<OrderDocument> {
    const orderData = {
      customer_id: `cust_${Math.floor(Math.random() * 100)}`,
      product_id: `prod_${Math.floor(Math.random() * 50)}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      status: 'created',
    };
    const newOrder = new this.orderModel(orderData);
    this.logger.log(`Creating new order: ${newOrder.order_id}`);
    return newOrder.save();
  }

  async updateRandomOrder(): Promise<OrderDocument | null> {
    const orders = await this.orderModel
      .find({ status: { $ne: 'shipped' } })
      .limit(10)
      .exec();
    if (orders.length === 0) return null;

    const orderToUpdate = orders[Math.floor(Math.random() * orders.length)];
    const statuses = ['processing', 'shipped', 'cancelled'];
    orderToUpdate.status =
      statuses[Math.floor(Math.random() * statuses.length)];
    orderToUpdate.quantity = Math.floor(Math.random() * 5) + 1; // Simulate quantity change
    this.logger.log(
      `Updating order: ${orderToUpdate.order_id} to status ${orderToUpdate.status}`,
    );
    return orderToUpdate.save();
  }

  async deleteRandomOrder(): Promise<any> {
    const orders = await this.orderModel
      .find({ status: 'cancelled' })
      .limit(5)
      .exec(); // Delete only cancelled orders
    if (orders.length === 0) return null;

    const orderToDelete = orders[Math.floor(Math.random() * orders.length)];
    this.logger.log(`Deleting order: ${orderToDelete.order_id}`);
    return this.orderModel.deleteOne({ _id: orderToDelete._id }).exec();
  }

  simulateData() {
    // Simulate creating a new order every 5-10 seconds
    const createInterval = Math.random() * 5000 + 5000;
    this.intervalId = setInterval(async () => {
      try {
        await this.createRandomOrder();
      } catch (error) {
        this.logger.error('Failed to create random order', error.stack);
      }
    }, createInterval);
  }

  simulateUpdatesAndDeletes() {
    // Simulate updates every 10-15 seconds
    const updateInterval = Math.random() * 5000 + 10000;
    setInterval(async () => {
      try {
        await this.updateRandomOrder();
      } catch (error) {
        this.logger.error('Failed to update random order', error.stack);
      }
    }, updateInterval);

    // Simulate deletes every 20-30 seconds (less frequent)
    const deleteInterval = Math.random() * 10000 + 20000;
    setInterval(async () => {
      try {
        await this.deleteRandomOrder();
      } catch (error) {
        this.logger.error('Failed to delete random order', error.stack);
      }
    }, deleteInterval);
  }

  // Ensure to clear interval on destroy if needed, though for this app it runs continuously
}
