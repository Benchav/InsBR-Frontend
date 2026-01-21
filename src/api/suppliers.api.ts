import { apiClient } from './client';

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateSupplierDto {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> { }

export const suppliersApi = {
    getAll: async (): Promise<Supplier[]> => {
        const { data } = await apiClient.get('/api/suppliers');
        return data;
    },

    getById: async (id: string): Promise<Supplier> => {
        const { data } = await apiClient.get(`/api/suppliers/${id}`);
        return data;
    },

    create: async (supplier: CreateSupplierDto): Promise<Supplier> => {
        const { data } = await apiClient.post('/api/suppliers', supplier);
        return data;
    },

    update: async (id: string, supplier: UpdateSupplierDto): Promise<Supplier> => {
        const { data } = await apiClient.put(`/api/suppliers/${id}`, supplier);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/api/suppliers/${id}`);
    },
};
