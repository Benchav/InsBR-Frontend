import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Stock } from '../types/api.types';

export const useStock = (branchId?: string, categoryId?: string) => {
  return useQuery({
    queryKey: ['stock', branchId, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (categoryId) params.append('categoryId', categoryId);
      const { data } = await apiClient.get<Stock[]>(`/stock?${params.toString()}`);
      return data;
    },
    enabled: true
  });
};
