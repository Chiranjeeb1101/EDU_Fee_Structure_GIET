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
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
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
  },

  getNotifications: async () => {
    const response = await api.get('/students/notifications');
    return response.data.data;
  },

  markNotificationRead: async (id: string) => {
    const response = await api.put(`/students/notifications/${id}/read`);
    return response.data;
  },
  
  // --- Documents ---
  getDocuments: async () => {
    const response = await api.get('/students/documents');
    return response.data.data;
  },
  
  uploadDocument: async (fileUri: string, mimetype: string, name: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimetype,
      name: name,
    } as any);

    const response = await api.post('/students/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  deleteDocument: async (id: string) => {
    const response = await api.delete(`/students/documents/${id}`);
    return response.data;
  }
};

export default studentService;
