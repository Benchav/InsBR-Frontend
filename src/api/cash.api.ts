import { apiClient } from './client';

export interface CashMovement {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface CashMovementPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: 'EXPENSE' | 'ADJUSTMENT';
}

export const cashApi = {
  getBalance: async (filters?: { branchId?: string }): Promise<{ balance: number }> => {
    const { data } = await apiClient.get('/api/cash/balance', {
      params: filters?.branchId ? { branchId: filters.branchId } : undefined,
    });
    return data;
  },

  getMovements: async (filters?: { startDate?: string; endDate?: string; branchId?: string }): Promise<CashMovement[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const { data } = await apiClient.get(`/api/cash/movements?${params.toString()}`);
    return data;
  },

  getDailyRevenue: async (filters?: { branchId?: string }): Promise<{ totalRevenue: number }> => {
    const { data } = await apiClient.get('/api/cash/daily-revenue', {
      params: filters?.branchId ? { branchId: filters.branchId } : undefined,
    });
    return data;
  },

  createMovement: async (payload: CashMovementPayload): Promise<CashMovement> => {
    const { data } = await apiClient.post('/api/cash', payload);
    return data;
  },
};
