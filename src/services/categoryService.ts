import { Category } from '@/types/category';
import { apiClient } from '@/api/client';

export const CategoryService = {
    getAll: async (): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>('/api/categories');
        return response.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const response = await apiClient.post<Category>('/api/categories', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Category>) => {
        const response = await apiClient.put<Category>(`/api/categories/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await apiClient.delete(`/api/categories/${id}`);
    }
};
