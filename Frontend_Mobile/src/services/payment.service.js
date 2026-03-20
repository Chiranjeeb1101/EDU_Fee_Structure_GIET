import api from './api';
import * as Linking from 'expo-linking';

class PaymentService {
  /**
   * Request a new Stripe checkout session from the Backend.
   * @param {number} amount in INR
   */
  async createCheckoutSession(amount) {
    try {
      const response = await api.post('/payments/create-checkout-session', { amount });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Open the Stripe Checkout URL using the device browser.
   * Deep link configuration is handled server-side via success_url/cancel_url,
   * but for bare Expo we rely on Linking.
   */
  async openCheckoutPayment(sessionUrl) {
    try {
      const supported = await Linking.canOpenURL(sessionUrl);
      if (supported) {
        await Linking.openURL(sessionUrl);
      } else {
        throw new Error("Don't know how to open URI: " + sessionUrl);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch payment history for the current student.
   */
  async getPaymentHistory() {
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  _handleError(error) {
    if (error.response && error.response.data) {
      return new Error(error.response.data.message || 'Payment Service Error');
    }
    return new Error(error.message);
  }
}

export default new PaymentService();
