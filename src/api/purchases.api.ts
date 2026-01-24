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
  branchName?: string;
  supplierId: string;
  supplierName?: string;
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
  branchId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal?: number;
  }>;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  type: 'CASH' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  dueDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface PurchasesFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  branchId?: string;
}

export const purchasesApi = {
  getAll: async (filters?: PurchasesFilters): Promise<Purchase[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    const query = params.toString();
    const { data } = await apiClient.get(`/api/purchases${query ? `?${query}` : ''}`);
    return data;
  },

  create: async (purchase: CreatePurchaseDto): Promise<Purchase> => {
    const items = purchase.items.map((item) => ({
      ...item,
      subtotal: item.subtotal ?? item.quantity * item.unitCost,
    }));
    const payload = {
      ...purchase,
      items,
      ...(purchase.type === 'CREDIT' ? { paymentMethod: undefined } : {}),
    };
    const { data } = await apiClient.post('/api/purchases', payload);
    return data;
  },

  getById: async (purchaseId: string): Promise<Purchase> => {
    const { data } = await apiClient.get(`/api/purchases/${purchaseId}`);
    return data;
  },

  update: async (
    purchaseId: string,
    updates: { notes?: string; invoiceNumber?: string }
  ): Promise<Purchase> => {
    const { data } = await apiClient.put(`/api/purchases/${purchaseId}`, updates);
    return data;
  },

  cancel: async (purchaseId: string): Promise<void> => {
    await apiClient.delete(`/api/purchases/${purchaseId}`);
  },
};
