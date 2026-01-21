import { apiClient } from './client';

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  branchId: string;
  supplierId: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  type: 'CASH' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  invoiceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreatePurchaseDto {
  supplierId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  type: 'CASH' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  invoiceNumber?: string;
  notes?: string;
}

export const purchasesApi = {
  getAll: async (): Promise<Purchase[]> => {
    const { data } = await apiClient.get('/api/purchases');
    return data;
  },

  create: async (purchase: CreatePurchaseDto): Promise<Purchase> => {
    const { data } = await apiClient.post('/api/purchases', purchase);
    return data;
  },

  update: async (
    purchaseId: string,
    updates: { notes?: string; invoiceNumber?: string }
  ): Promise<{ message: string; purchase: Purchase }> => {
    const { data } = await apiClient.put(`/api/purchases/${purchaseId}`, updates);
    return data;
  },
};
