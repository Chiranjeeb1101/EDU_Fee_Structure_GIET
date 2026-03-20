import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────
export interface LoginPayload {
  college_id_number: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  college_id_number: string;
  password: string;
  personal_email?: string;
  profile_picture?: string;
  course_type?: string;
  stream?: string;
  year?: string;
  accommodation?: string;
  student_phone?: string;
  parent_name?: string;
  parent_whatsapp?: string;
}

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  college_id_number?: string;
  profile_complete?: boolean;
  profile_picture?: string;
  personal_email?: string;
  student_phone?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: UserData;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: any;
    student: any;
  };
}

// ─── Auth Service ───────────────────────────────────────────────
const authService = {
  /**
   * Login with college ID and password
   * Stores token + user data in AsyncStorage on success
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', payload);
    const { token, user } = response.data.data;

    // Persist token and user data
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));

    return response.data;
  },

  /**
   * Register a new student
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', payload);
    return response.data;
  },

  /**
   * Load stored user session (for app start / Remember Me)
   */
  getStoredSession: async (): Promise<{ token: string | null; user: UserData | null }> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      return {
        token,
        user: userData ? JSON.parse(userData) : null,
      };
    } catch {
      return { token: null, user: null };
    }
  },

  /**
   * Remember Me: store/clear credentials locally
   */
  saveCredentials: async (collegeId: string, password: string) => {
    await AsyncStorage.setItem('saved_credentials', JSON.stringify({ collegeId, password }));
  },

  getSavedCredentials: async (): Promise<{ collegeId: string; password: string } | null> => {
    try {
      const data = await AsyncStorage.getItem('saved_credentials');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearSavedCredentials: async () => {
    await AsyncStorage.removeItem('saved_credentials');
  },

  /**
   * Logout: Clear all stored auth data
   */
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('saved_credentials');
  },

  /**
   * Get profile from backend (protected route)
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Update profile details (protected route)
   */
  updateProfile: async (payload: Partial<RegisterPayload>): Promise<any> => {
    const response = await api.patch('/auth/update-profile', payload);
    
    // If update is successful and includes user data, update local storage
    if (response.data.success && response.data.data) {
      // The backend returns the full profile. We need to map it to UserData format.
      const rawUser = response.data.data;
      const updatedUser: UserData = {
        id: rawUser.id,
        email: rawUser.email,
        full_name: rawUser.full_name,
        role: rawUser.role,
        college_id_number: rawUser.students?.[0]?.college_id_number,
        profile_complete: rawUser.students?.[0]?.profile_complete,
        profile_picture: rawUser.profile_picture,
        personal_email: rawUser.personal_email,
        student_phone: rawUser.students?.[0]?.student_phone,
      };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }
    
    return response.data;
  },
};

export default authService;
