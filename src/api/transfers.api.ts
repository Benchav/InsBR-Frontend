import { apiClient } from './client';

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  items: TransferItem[];
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateTransferDto {
  toBranchId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
}

export const transfersApi = {
  getAll: async (): Promise<Transfer[]> => {
    const { data } = await apiClient.get('/api/transfers');
    return data;
  },

  create: async (transfer: CreateTransferDto): Promise<Transfer> => {
    const { data } = await apiClient.post('/api/transfers', transfer);
    return data;
  },

  approve: async (transferId: string): Promise<Transfer> => {
    const { data } = await apiClient.post(`/api/transfers/${transferId}/approve`);
    return data;
  },

  complete: async (transferId: string): Promise<Transfer> => {
    const { data } = await apiClient.post(`/api/transfers/${transferId}/complete`);
    return data;
  },

  cancel: async (transferId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/transfers/${transferId}`);
    return data;
  },
};
