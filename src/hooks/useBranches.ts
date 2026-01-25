import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Branch } from '../types/api.types';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await apiClient.get<Branch[]>('/branches');
      return data;
    }
  });
};
