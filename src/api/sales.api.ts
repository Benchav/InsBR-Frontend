import { apiClient } from './client';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  branchId: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  type: 'CASH' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  status?: 'ACTIVE' | 'CANCELLED';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateSaleDto {
  customerId?: string;
  type: 'CASH' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}

export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    const { data } = await apiClient.get('/api/sales');
    return data;
  },

  create: async (sale: CreateSaleDto): Promise<Sale> => {
    const { data } = await apiClient.post('/api/sales', sale);
    return data;
  },

  cancel: async (saleId: string): Promise<{ message: string; sale: Sale }> => {
    const { data } = await apiClient.post(`/api/sales/${saleId}/cancel`);
    return data;
  },
};
