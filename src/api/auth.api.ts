import { apiClient } from './client';
import type { UserRole } from '@/types/api.types';

export interface LoginRequest {
  username: string;
  password: string;
}


export interface User {
  id: string; // Changed from userId to id to match common patterns, check backend usually uses id or _id. Based on mock usage it was id and userId. Let's standardize on id for frontend if backend returns userId we map it? Or assume backend returns id or userId. Let's look at getProfile response.
  // The mock in Usuarios.tsx uses 'id'. The type User in auth.api.ts uses 'userId'.
  // I will support both or standardize. Let's stick to the interface definition but maybe expand it.
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  branchId: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
  branchId?: string; // Often required if changing logic
  email?: string;
  phone?: string;
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

  // Get all users (Admin only)
  getAllUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/api/auth/users');
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as { users?: User[] })?.users)) return (data as { users?: User[] }).users as User[];
    if (Array.isArray((data as { data?: User[] })?.data)) return (data as { data?: User[] }).data as User[];
    return [];
  },

  // Update user
  updateUser: async (id: string, updates: UpdateUserDto): Promise<User> => {
    const payload: any = {
      name: updates.name,
      username: updates.username,
      role: updates.role,
      isActive: updates.isActive,
      branchId: updates.branchId,
    };

    // Only include password if it is a non-empty string
    if (updates.password && updates.password.trim() !== '') {
      payload.password = updates.password;
    }

    const { data } = await apiClient.put(`/api/auth/users/${id}`, payload);
    return data;
  },

  // Delete user (Admin only)
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/auth/users/${id}`);
  },

  // Create user (needed for "Nuevo Usuario")
  createUser: async (user: any): Promise<User> => {
    const { data } = await apiClient.post('/api/auth/register', user);
    return data;
  }
};
