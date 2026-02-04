import { apiClient } from '@/api/client';

export interface BranchDashboardStats {
  id: string;
  name: string;
  code: string;
  salesTotal: number;
  cashBalance: number;
  totalStock: number;
  stockAlerts: number;
}

export interface DashboardStats {
  salesTotal: number;
  cashBalance: number;
  totalStock: number;
  activeCustomers: number;
  stockAlerts: number;
  branches?: BranchDashboardStats[];
}

export const dashboardService = {
  async getStats(branchId?: string): Promise<DashboardStats> {
    const params = branchId ? { branchId } : undefined;
    const { data } = await apiClient.get('/api/reports/dashboard', { params });
    return data;
  },
};
