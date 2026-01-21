import { DashboardLayout } from '@/components/layout';
import {
  KPICard,
  BranchTabs,
  RevenueChart,
  StockHealth,
  RecentTransactions,
  QuickActions,
} from '@/components/dashboard';
import { useBranchStore } from '@/stores/branchStore';
import { DollarSign, TrendingUp, RefreshCw, ShoppingBag, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { useMemo } from 'react';

export default function Dashboard() {
  const { currentBranchId } = useBranchStore();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', currentBranchId], // Recalculate when branch changes (though usually we filter client side if API returns all, but good practice)
    queryFn: () => salesApi.getAll(),
  });

  const stats = useMemo(() => {
    // Get today's date in local time or ISO date part if generic
    // Ensure we match the server's date format or just check YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const filteredSales = sales.filter((sale) => {
      // Branch filter
      const matchesBranch = currentBranchId === 'all' || sale.branchId === currentBranchId;
      // Date filter (checking if starts with today's date string YYYY-MM-DD)
      // Assuming sale.createdAt is ISO string
      const isToday = sale.createdAt?.startsWith(today);
      const isActive = sale.status !== 'CANCELLED';

      return matchesBranch && isToday && isActive;
    });

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const transactionCount = filteredSales.length;

    return {
      revenue: totalRevenue,
      transactions: transactionCount,
    };
  }, [sales, currentBranchId]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vista General</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo a Insumos Barrera ERP
          </p>
        </div>
        <BranchTabs />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Ventas del Día"
          value={isLoading ? "..." : `C$ ${stats.revenue.toLocaleString()}`}
          trend={0}
          trendLabel="Total hoy"
          icon={isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <DollarSign className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        {/* Keeping Mock/Placeholder for Profit/Net Income as we can't calculate it yet */}
        <KPICard
          title="Ganancia Estimada"
          value="C$ 0.00"
          trend={0}
          trendLabel="No disponible"
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          iconBgClass="bg-success/10"
        />
        <KPICard
          title="Transacciones"
          value={isLoading ? "..." : stats.transactions.toString()}
          trend={0}
          trendLabel="Ventas hoy"
          icon={<ShoppingBag className="h-6 w-6 text-blue-500" />}
          iconBgClass="bg-blue-500/10"
        />
        {/* Keeping one static or maybe "Pending Orders" if we had them. 
             Since we don't have pending orders in Sale type clearly (only Active/Cancelled), 
             we'll reuse the Rotación logic or just leave a placeholder or remove pending if not accurate.
             I will keep "Rotación de Stock" as placeholder to not break grid design.
         */}
        <KPICard
          title="Rotación de Stock"
          value="--%"
          trend={0}
          trendLabel="Calculando..."
          icon={<RefreshCw className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="space-y-6">
          <StockHealth />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
