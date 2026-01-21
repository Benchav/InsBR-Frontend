import type { User } from '@/api/auth.api';

export const saveAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const saveUserData = (user: User): void => {
  localStorage.setItem('user_data', JSON.stringify(user));
};

export const getUserData = (): User | null => {
  const data = localStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

export const clearStorage = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};
