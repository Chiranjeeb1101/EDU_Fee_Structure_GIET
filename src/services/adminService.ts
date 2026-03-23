import api from './api';

export interface AdminStats {
  total_students: number;
  active_fee_structures: number;
  total_collected: number;
  total_pending: number;
  recent_payments: any[];
  collection_by_stream: { name: string; amount: number }[];
  monthly_revenue: { month: string; amount: number }[];
  status_distribution: { success: number; pending: number; failed: number };
  pending_resets_count: number;
  unread_notifications_count: number;
}

class AdminService {
  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/admin/stats');
    return response.data.data;
  }

  async getStudents() {
    const response = await api.get('/admin/students');
    return response.data.data;
  }

  async getStudentById(id: string) {
    const response = await api.get(`/admin/students/${id}`);
    return response.data.data;
  }

  async updateStudent(id: string, updates: any) {
    const response = await api.put(`/admin/students/${id}`, updates);
    return response.data.data;
  }

  async deleteStudent(id: string) {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  }

  async getFeeStructures() {
    const response = await api.get('/admin/fee-structures');
    return response.data.data;
  }

  async createFeeStructure(data: any) {
    const response = await api.post('/admin/fee-structures', data);
    return response.data.data;
  }

  async updateFeeStructure(id: string, updates: any) {
    const response = await api.put(`/admin/fee-structures/${id}`, updates);
    return response.data.data;
  }

  async deleteFeeStructure(id: string) {
    const response = await api.delete(`/admin/fee-structures/${id}`);
    return response.data;
  }

  async getAllPayments() {
    const response = await api.get('/admin/payments');
    return response.data.data;
  }

  async getFeeMetadata() {
    const response = await api.get('/admin/fee-metadata');
    return response.data.data;
  }

  async getNotifications() {
    const response = await api.get('/admin/notifications');
    return response.data.data;
  }
}

export default new AdminService();
