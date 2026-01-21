import { apiClient } from '@/api/client';

export const updateCreditDetails = async (
  creditId: string,
  data: { deliveryDate?: string; notes?: string }
) => {
  const { data: response } = await apiClient.patch(`/api/credits/${creditId}/details`, data);
  return response;
};
