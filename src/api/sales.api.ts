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
  customerName?: string;
  deliveryDate?: string;
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
  branchId: string;
  customerId?: string;
  deliveryDate?: string;
  customerName?: string;
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
  getAll: async (filters?: { branchId?: string }): Promise<Sale[]> => {
    const { data } = await apiClient.get('/api/sales', {
      params: filters?.branchId ? { branchId: filters.branchId } : undefined,
    });
    return data;
  },

  getTicket: async (saleId: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/api/reports/sales/${saleId}/ticket`, {
      responseType: 'blob',
    });
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
