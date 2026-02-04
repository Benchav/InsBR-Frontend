import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStats } from '@/services/dashboardService';

export function useDashboardStats(branchId?: string) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', branchId],
    queryFn: () => dashboardService.getStats(branchId),
    refetchInterval: 30000,
    staleTime: 20000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
