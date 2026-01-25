import apiClient from '../api/client';
import { Branch } from '../types/api.types';

export const BranchService = {
  getAll: async (): Promise<Branch[]> => {
    const { data } = await apiClient.get<Branch[]>('/branches');
    return data;
  },
};
