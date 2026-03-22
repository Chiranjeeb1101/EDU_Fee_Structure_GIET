import api from './api';

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  data: {
    session_url: string;
    session_id: string;
    payment_id: string;
    amount: number;
    currency: string;
  };
}

class PaymentService {
  /**
   * Create a Stripe Checkout Session
   * @param amount The amount in INR the student wants to pay
   */
  async createCheckoutSession(amount: number): Promise<CheckoutSessionResponse> {
    const response = await api.post('/payments/create-checkout-session', { amount });
    return response.data;
  }

  /**
   * Fetch payment history for the logged-in student
   */
  async getPaymentHistory() {
    const response = await api.get('/payments/history');
    return response.data;
  }

  /**
   * Check the status of a specific payment
   */
  async getPaymentStatus(paymentId: string) {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  }
}

export default new PaymentService();
