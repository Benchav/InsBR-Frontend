import { apiClient } from './client';

export interface CashMovement {
  id: string;
  branchId?: string;
  type: 'INCOME' | 'EXPENSE';
  category?: 'SALE' | 'PURCHASE' | 'CREDIT_PAYMENT' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';
  amount: number;
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CHECK';
  description: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface CashMovementPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: 'SALE' | 'PURCHASE' | 'CREDIT_PAYMENT' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  reference?: string;
  notes?: string;
}

export interface CashBalanceResponse {
  date: string;
  income: number;
  expenses: number;
  netBalance: number;
  movements: CashMovement[];
}

export interface DailyRevenueResponse {
  date: string;
  income: number;
}

export interface ConsolidatedRevenueResponse {
  date: string;
  branches: Array<{
    branchId: string;
    branchName: string;
    branchCode: string;
    income: number;
    expenses: number;
    netBalance: number;
  }>;
  totals: {
    income: number;
    expenses: number;
    netBalance: number;
  };
}

export const cashApi = {
  getBalance: async (filters?: { branchId?: string; date?: string }): Promise<CashBalanceResponse> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString();
    const { data } = await apiClient.get(`/api/cash/balance${query ? `?${query}` : ''}`);
    return data;
  },

  getMovements: async (filters?: { startDate?: string; endDate?: string; branchId?: string }): Promise<CashMovement[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    const query = params.toString();
    const { data } = await apiClient.get(`/api/cash/movements${query ? `?${query}` : ''}`);
    return data;
  },

  getDailyRevenue: async (filters?: { branchId?: string; date?: string }): Promise<DailyRevenueResponse> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString();
    const { data } = await apiClient.get(`/api/cash/daily-revenue${query ? `?${query}` : ''}`);
    return data;
  },

  getConsolidatedRevenue: async (filters?: { date?: string }): Promise<ConsolidatedRevenueResponse> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString();
    const { data } = await apiClient.get(`/api/cash/consolidated-revenue${query ? `?${query}` : ''}`);
    return data;
  },

  createMovement: async (payload: CashMovementPayload): Promise<CashMovement> => {
    const { data } = await apiClient.post('/api/cash/movements', payload);
    return data;
  },
};
