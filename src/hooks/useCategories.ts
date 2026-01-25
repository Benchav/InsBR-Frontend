import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Category } from '../types/api.types';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/categories');
      return data;
    }
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCat: { name: string; description?: string }) =>
      apiClient.post('/categories', newCat),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });
};
