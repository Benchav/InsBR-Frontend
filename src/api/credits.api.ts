import { apiClient } from './client';

export interface CreditAccount {
  id: string;
  type: 'CXC' | 'CPP';
  branchId: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  purchaseId?: string;
  saleId?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' | 'PENDING' | 'PARTIAL' | 'PAID';
  remainingBalance?: number;
  dueDate: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  invoiceNumber?: string;
}

export interface RegisterPaymentDto {
  creditAccountId: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  reference?: string;
  notes?: string;
}

export interface CreateCreditDto {
  customerId: string;
  totalAmount: number;
  dueDate: string;
  type: 'CXC';
  notes?: string;
}

export const creditsApi = {
  getAll: async (filters?: { type?: 'CXC' | 'CPP'; status?: string; branchId?: string; supplierId?: string }): Promise<CreditAccount[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);

    const { data } = await apiClient.get(`/api/credits?${params.toString()}`);
    return data;
  },

  registerPayment: async (payment: RegisterPaymentDto): Promise<unknown> => {
    const { data } = await apiClient.post('/api/credits/payments', payment);
    return data;
  },

  updateDetails: async (
    creditAccountId: string,
    details: { deliveryDate?: string; notes?: string }
  ): Promise<CreditAccount> => {
    const { data } = await apiClient.patch(`/api/credits/${creditAccountId}/details`, details);
    return data;
  },

  create: async (credit: CreateCreditDto): Promise<CreditAccount> => {
    const { data } = await apiClient.post('/api/credits', credit);
    return data;
  },

  getPaymentHistory: async (creditAccountId: string): Promise<unknown[]> => {
    const { data } = await apiClient.get(`/api/credits/${creditAccountId}/payments`);
    return data;
  },

  cancel: async (creditAccountId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/credits/${creditAccountId}`);
    return data;
  },
};
