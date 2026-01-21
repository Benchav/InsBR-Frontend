import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  sku: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  unit: string;
  isActive?: boolean;
}

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await apiClient.get('/api/products');
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/api/products/${id}`);
    return data;
  },

  create: async (product: CreateProductDto): Promise<Product> => {
    const { data } = await apiClient.post('/api/products', product);
    return data;
  },

  update: async (id: string, product: Partial<CreateProductDto>): Promise<Product> => {
    const { data } = await apiClient.put(`/api/products/${id}`, product);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },
};
