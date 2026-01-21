import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  userId: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'SELLER';
  branchId: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/api/auth/login', credentials);
    return data;
  },

  // Obtener perfil del usuario actual
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get('/api/auth/me');
    return data;
  },
};
