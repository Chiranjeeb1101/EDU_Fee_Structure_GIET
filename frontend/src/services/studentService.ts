import api from './api';

export interface FeeStatus {
  total_fee: number;
  paid_fee: number;
  remaining_fee: number;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  created_at: string;
}

export interface DashboardData {
  profile_complete: boolean;
  fee_status: FeeStatus;
  payment_history: PaymentHistoryItem[];
}

const studentService = {
  /**
   * Get student dashboard data (Fees + History)
   */
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/students/dashboard');
    return response.data.data;
  },

  /**
   * Get payment history (can be redundant if dashboard returns it, but good for separate history screen)
   */
  getPaymentHistory: async (): Promise<PaymentHistoryItem[]> => {
    const response = await api.get('/payments/history');
    return response.data.data;
  }
};

export default studentService;
