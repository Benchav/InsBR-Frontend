import { apiClient } from './client';

export interface Customer {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    creditLimit?: number;
    type: 'RETAIL' | 'WHOLESALE';
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCustomerDto {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    creditLimit?: number;
    type?: 'RETAIL' | 'WHOLESALE';
    isActive?: boolean;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export const customersApi = {
    getAll: async (): Promise<Customer[]> => {
        const { data } = await apiClient.get('/api/customers');
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
