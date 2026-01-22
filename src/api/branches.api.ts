import { apiClient } from './client';

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export const branchesApi = {
  getAll: async (): Promise<Branch[]> => {
    const { data } = await apiClient.get('/api/branches');
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as { branches?: Branch[] })?.branches)) return (data as { branches?: Branch[] }).branches as Branch[];
    return [];
  },
};
