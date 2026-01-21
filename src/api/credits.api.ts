import { apiClient } from './client';

export interface CreditAccount {
  id: string;
  type: 'CXC' | 'CPP';
  branchId: string;
  customerId?: string;
  supplierId?: string;
  saleId?: string;
  purchaseId?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO';
  dueDate: string;
  createdAt: string;
}

export interface RegisterPaymentDto {
  creditAccountId: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  reference?: string;
  notes?: string;
}

export const creditsApi = {
  getAll: async (filters?: { type?: 'CXC' | 'CPP'; status?: string; branchId?: string }): Promise<CreditAccount[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const { data } = await apiClient.get(`/api/credits?${params.toString()}`);
    return data;
  },

  registerPayment: async (payment: RegisterPaymentDto): Promise<CreditAccount> => {
    const { data } = await apiClient.post('/api/credits/payment', payment);
    return data;
  },

  getPaymentHistory: async (creditAccountId: string): Promise<unknown[]> => {
    const { data } = await apiClient.get(`/api/credits/${creditAccountId}/history`);
    return data;
  },

  cancel: async (creditAccountId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/credits/${creditAccountId}`);
    return data;
  },
};
