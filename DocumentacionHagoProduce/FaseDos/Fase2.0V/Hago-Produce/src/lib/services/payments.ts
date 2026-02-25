
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface IPaymentService {
  processPayment(amount: number, currency: string, source: string): Promise<PaymentResult>;
}

export class MockPaymentService implements IPaymentService {
  async processPayment(amount: number, currency: string, source: string): Promise<PaymentResult> {
    console.log(`[MockPaymentService] Processing payment of ${amount} ${currency} from source ${source}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate success (90% chance) or failure based on source content
    if (source === 'fail_payment') {
      return {
        success: false,
        error: 'Payment declined by mock gateway',
      };
    }

    return {
      success: true,
      transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// Singleton instance for dependency injection
export const paymentService = new MockPaymentService();
