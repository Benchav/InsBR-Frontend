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
    try {
      const { data } = await apiClient.get('/api/branches');
      if (Array.isArray(data)) return data;
      if (Array.isArray((data as { branches?: Branch[] })?.branches)) return (data as { branches?: Branch[] }).branches as Branch[];
      return [];
    } catch (error: any) {
      // Si la API falla, retorna datos mock para desarrollo
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return [
          { id: 'BRANCH-001', name: 'Sucursal Central', code: 'CENTRAL', address: 'Calle Principal', phone: '555-1234', isActive: true },
          { id: 'BRANCH-002', name: 'Sucursal Norte', code: 'NORTE', address: 'Avenida Norte', phone: '555-5678', isActive: true },
        ];
      }
      return [];
    }
  },
};
