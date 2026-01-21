import { apiClient } from './client';

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    documentId?: string; // Cédula or RUC
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    documentId?: string;
    isActive?: boolean;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> { }

export const customersApi = {
    getAll: async (): Promise<Customer[]> => {
        const { data } = await apiClient.get('/api/customers');
        return data;
    },

    getById: async (id: string): Promise<Customer> => {
        const { data } = await apiClient.get(`/api/customers/${id}`);
        return data;
    },

    create: async (customer: CreateCustomerDto): Promise<Customer> => {
        const { data } = await apiClient.post('/api/customers', customer);
        return data;
    },

    update: async (id: string, customer: UpdateCustomerDto): Promise<Customer> => {
        const { data } = await apiClient.put(`/api/customers/${id}`, customer);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/api/customers/${id}`);
    },
};
