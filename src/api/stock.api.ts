import { apiClient } from './client';

export interface Stock {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
}

export interface AdjustStockDto {
  stockId: string;
  newQuantity: number;
  reason: string;
}

export interface StockSummary {
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
}

export const stockApi = {
  getMyBranchStock: async (): Promise<Stock[]> => {
    const { data } = await apiClient.get('/api/stock');
    return data;
  },

  getLowStockAlerts: async (): Promise<Stock[]> => {
    const { data } = await apiClient.get('/api/stock/alerts');
    return data;
  },

  getProductStock: async (productId: string): Promise<Stock[]> => {
    const { data } = await apiClient.get(`/api/stock/product/${productId}`);
    return data;
  },

  adjustStock: async (adjustment: AdjustStockDto): Promise<Stock> => {
    const { data } = await apiClient.post('/api/stock/adjust', adjustment);
    return data;
  },

  getSummary: async (): Promise<StockSummary> => {
    const { data } = await apiClient.get('/api/stock/summary');
    return data;
  },
};
