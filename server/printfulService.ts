import { PrintfulClient } from 'printful-request';

if (!process.env.PRINTFUL_API_TOKEN) {
  throw new Error("PRINTFUL_API_TOKEN environment variable must be set");
}

class PrintfulService {
  private client: PrintfulClient;

  constructor() {
    this.client = new PrintfulClient(process.env.PRINTFUL_API_TOKEN!);
  }

  // Get all products from catalog
  async getCatalogProducts() {
    try {
      const response = await this.client.get('products');
      return response.result;
    } catch (error) {
      throw new Error(`Printful API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get specific product details with variants
  async getProduct(productId: number) {
    try {
      const response = await this.client.get(`products/${productId}`);
      return response.result;
    } catch (error) {
      throw new Error(`Product not found: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get product variants
  async getProductVariants(productId: number) {
    try {
      const response = await this.client.get(`products/${productId}`);
      return response.result.variants || [];
    } catch (error) {
      throw new Error(`Variants not found: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Calculate shipping costs
  async calculateShipping(orderData: any) {
    try {
      const response = await this.client.post('orders/estimate-costs', orderData);
      return response.result;
    } catch (error) {
      throw new Error(`Shipping calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Create order
  async createOrder(orderData: any) {
    try {
      const response = await this.client.post('orders', orderData);
      return response.result;
    } catch (error) {
      throw new Error(`Order creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get order status
  async getOrder(orderId: number) {
    try {
      const response = await this.client.get(`orders/${orderId}`);
      return response.result;
    } catch (error) {
      throw new Error(`Order not found: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get shipping rates for recipient
  async getShippingRates(recipient: any) {
    try {
      const response = await this.client.post('shipping/rates', { recipient });
      return response.result;
    } catch (error) {
      throw new Error(`Shipping rates error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Confirm order (submit for fulfillment)
  async confirmOrder(orderId: number) {
    try {
      const response = await this.client.post(`orders/${orderId}/confirm`);
      return response.result;
    } catch (error) {
      throw new Error(`Order confirmation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId: number) {
    try {
      const response = await this.client.delete(`orders/${orderId}`, {});
      return response.result;
    } catch (error) {
      throw new Error(`Order cancellation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const printfulService = new PrintfulService();