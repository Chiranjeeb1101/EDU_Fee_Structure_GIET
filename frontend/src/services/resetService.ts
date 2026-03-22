import api from './api';

export interface ResetRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  created_at: string;
  students: {
    college_id_number: string;
    users: {
      full_name: string;
    };
  };
}

const resetService = {
  /**
   * Student: Request a password reset
   */
  requestReset: async (collegeIdNumber: string) => {
    const response = await api.post('/reset/request', { college_id_number: collegeIdNumber });
    return response.data;
  },

  /**
   * Student: Check if request is approved and set new password
   */
  finalizeReset: async (requestId: string, newPassword: string) => {
    const response = await api.post('/reset/finalize', { requestId, newPassword });
    return response.data;
  },

  /**
   * Admin: Fetch all pending reset requests
   */
  getPendingRequests: async (): Promise<ResetRequest[]> => {
    const response = await api.get('/reset/pending');
    return response.data.data;
  },

  /**
   * Admin: Approve or Reject a request
   */
  updateRequestStatus: async (id: string, status: 'approved' | 'rejected') => {
    const response = await api.post('/reset/status', { id, status });
    return response.data;
  }
};

export default resetService;
