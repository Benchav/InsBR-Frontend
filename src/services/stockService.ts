import apiClient from '../api/client';
import { Stock } from '../types/api.types';

export const StockService = {
  getByBranch: async (branchId: string, categoryId?: string): Promise<Stock[]> => {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (branchId) params.append('branchId', branchId);
    const { data } = await apiClient.get<Stock[]>(`/stock?${params.toString()}`);
    return data;
  },
};
