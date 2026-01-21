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
import { DollarSign, TrendingUp, RefreshCw, Clock } from 'lucide-react';

// Mock KPI data based on branch
const kpiData = {
  all: { revenue: 'C$ 124,500', profit: 'C$ 42,100', turnover: '12.5%', pending: 8 },
  diriamba: { revenue: 'C$ 68,200', profit: 'C$ 24,300', turnover: '14.2%', pending: 3 },
  jinotepe: { revenue: 'C$ 56,300', profit: 'C$ 17,800', turnover: '10.8%', pending: 5 },
};

export default function Dashboard() {
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const data = kpiData[currentBranchId];

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
          title="Ingresos Totales"
          value={data.revenue}
          trend={12}
          trendLabel="vs mes anterior"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <KPICard
          title="Ganancia Neta"
          value={data.profit}
          trend={5}
          trendLabel="vs mes anterior"
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          iconBgClass="bg-success/10"
        />
        <KPICard
          title="Rotación de Stock"
          value={data.turnover}
          trend={-2}
          trendLabel="Requiere atención"
          icon={<RefreshCw className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
        <KPICard
          title="Órdenes Pendientes"
          value={data.pending.toString()}
          trend={0}
          trendLabel="Igual que ayer"
          icon={<Clock className="h-6 w-6 text-muted-foreground" />}
          iconBgClass="bg-muted"
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
