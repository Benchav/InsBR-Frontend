import { DashboardLayout } from '@/components/layout';
import { KPICard, BranchTabs, QuickActions } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useBranchStore } from '@/stores/branchStore';
import { AlertTriangle, CreditCard, DollarSign, Loader2, Package, RefreshCcw, ShoppingCart, Users, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stock.api';
import { creditsApi } from '@/api/credits.api';
import { salesApi } from '@/api/sales.api';
import { formatCurrency, formatCurrencyShort, formatDateTime } from '@/utils/formatters';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BRANCHES } from '@/stores/branchStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;

  const {
    data: dashboardStats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchDashboardStats,
    dataUpdatedAt,
  } = useDashboardStats(branchId);

  const { data: pendingCredits = [], isLoading: isLoadingCredits } = useQuery({
    queryKey: ['credits-pending', branchId],
    queryFn: () => creditsApi.getAll({ type: 'CXC', status: 'PENDIENTE', branchId }),
    refetchInterval: 30000,
  });

  const { data: stockAlerts = [], isLoading: isLoadingStockAlerts } = useQuery({
    queryKey: ['stock-alerts', branchId],
    queryFn: () => stockApi.getLowStockAlerts({ branchId }),
    refetchInterval: 30000,
  });

  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales', branchId],
    queryFn: () => salesApi.getAll(branchId ? { branchId } : undefined),
    refetchInterval: 30000,
  });

  const pendingCreditsAmount = useMemo(() => {
    return pendingCredits.reduce((sum, credit) => sum + credit.balanceAmount, 0);
  }, [pendingCredits]);

  const lastUpdatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const statsCards = dashboardStats
    ? [
        {
          title: 'Ventas del Día',
          value: formatCurrency(dashboardStats.salesTotal),
          icon: <DollarSign className="h-6 w-6 text-primary" />, 
          iconBgClass: 'bg-primary/10',
        },
        {
          title: 'Balance de Caja',
          value: formatCurrency(dashboardStats.cashBalance),
          icon: <Wallet className="h-6 w-6 text-success" />, 
          iconBgClass: 'bg-success/10',
        },
        {
          title: 'Inventario Total',
          value: `${dashboardStats.totalStock.toLocaleString('es-NI')} unidades`,
          icon: <Package className="h-6 w-6 text-blue-500" />, 
          iconBgClass: 'bg-blue-500/10',
        },
        {
          title: 'Clientes Activos',
          value: dashboardStats.activeCustomers.toString(),
          icon: <Users className="h-6 w-6 text-purple-500" />, 
          iconBgClass: 'bg-purple-500/10',
        },
        {
          title: 'Créditos Pendientes',
          value: formatCurrency(pendingCreditsAmount),
          icon: <CreditCard className="h-6 w-6 text-warning" />, 
          iconBgClass: 'bg-warning/10',
        },
        {
          title: 'Alertas de Stock',
          value: dashboardStats.stockAlerts.toString(),
          icon: (
            <AlertTriangle
              className={`h-6 w-6 ${dashboardStats.stockAlerts > 0 ? 'text-destructive' : 'text-success'}`}
            />
          ),
          iconBgClass: dashboardStats.stockAlerts > 0 ? 'bg-destructive/10' : 'bg-success/10',
        },
      ]
    : [];

  const salesForBranch = useMemo(() => {
    return branchId ? sales.filter((sale) => sale.branchId === branchId) : sales;
  }, [sales, branchId]);

  const recentSales = useMemo(() => {
    return [...salesForBranch]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [salesForBranch]);

  const salesByDay = useMemo(() => {
    const toDateKey = (value: Date) => value.toISOString().split('T')[0];
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = toDateKey(date);
      return { key, label: date.toLocaleDateString('es-NI', { month: 'short', day: 'numeric' }), total: 0 };
    });

    const map = new Map(days.map((d) => [d.key, d]));
    salesForBranch.forEach((sale) => {
      if (!sale.createdAt) return;
      const saleKey = sale.createdAt.split('T')[0];
      const entry = map.get(saleKey);
      if (entry) {
        entry.total += sale.total;
      }
    });

    return days;
  }, [salesForBranch]);

  const topProducts = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    salesForBranch.forEach((sale) => {
      sale.items.forEach((item) => {
        const name = item.productName || item.productId;
        const current = totals.get(name) || { name, quantity: 0, total: 0 };
        const itemTotal = item.subtotal ?? item.unitPrice * item.quantity;
        current.quantity += item.quantity;
        current.total += itemTotal;
        totals.set(name, current);
      });
    });

    return Array.from(totals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [salesForBranch]);

  const getBranchLabel = (branchIdValue: string) => {
    return BRANCHES.find((b) => b.id === branchIdValue)?.shortName || branchIdValue;
  };

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

      <div className="grid gap-6 mb-6">
        <div className="kpi-card animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Estadísticas consolidadas</h3>
              {lastUpdatedLabel && (
                <p className="text-xs text-muted-foreground">Última actualización: {lastUpdatedLabel}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => refetchDashboardStats()}
              disabled={isStatsLoading}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
          {isStatsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando estadísticas...
            </div>
          ) : statsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Hubo un error al cargar las estadísticas. Intenta de nuevo.</span>
            </div>
          ) : !dashboardStats ? (
            <p className="text-sm text-muted-foreground">No hay datos disponibles.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {statsCards.map((card) => (
                <KPICard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  iconBgClass={card.iconBgClass}
                />
              ))}
            </div>
          )}
        </div>
        {dashboardStats?.branches && dashboardStats.branches.length > 0 && (
          <div className="kpi-card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Consolidado por Sucursal</h3>
                <p className="text-sm text-muted-foreground">Totales del día</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardStats.branches.map((branch) => (
                <div key={branch.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{branch.name}</p>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {branch.code}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Ventas</span>
                      <span className="font-semibold text-foreground">{formatCurrency(branch.salesTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Balance caja</span>
                      <span className="font-semibold text-foreground">{formatCurrency(branch.cashBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Inventario</span>
                      <span className="font-semibold text-foreground">
                        {branch.totalStock?.toLocaleString('es-NI') ?? 0} u
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Alertas</span>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          branch.stockAlerts > 0 ? 'text-destructive' : 'text-success'
                        )}
                      >
                        {branch.stockAlerts}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="kpi-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Ventas por Día</h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value: number) => formatCurrencyShort(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="kpi-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Productos</h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value: number) => formatCurrencyShort(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Bar dataKey="total" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Ventas Recientes: Cards en móvil, tabla en desktop */}
        <div className="lg:col-span-2 kpi-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Ventas Recientes</h3>
          </div>
          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {isLoadingSales ? (
              <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">Cargando ventas...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">No hay ventas recientes</div>
            ) : (
              recentSales.map((sale, idx) => (
                <div key={sale.id || idx} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base text-foreground truncate">{sale.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground ml-auto">{getBranchLabel(sale.branchId)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs mt-1">
                    <span>Cliente: <span className="font-medium text-foreground">{sale.customerName || sale.customerId || 'Consumidor final'}</span></span>
                    <span>Fecha: <span className="text-muted-foreground">{formatDateTime(sale.createdAt)}</span></span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="font-semibold text-base">{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                        (sale.status ?? 'ACTIVE') === 'ACTIVE'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {(sale.status ?? 'ACTIVE') === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left py-3 px-2">ID</th>
                  <th className="table-header text-left py-3 px-2">Fecha</th>
                  <th className="table-header text-left py-3 px-2">Sucursal</th>
                  <th className="table-header text-left py-3 px-2">Cliente</th>
                  <th className="table-header text-right py-3 px-2">Total</th>
                  <th className="table-header text-center py-3 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingSales ? (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={6}>
                      Cargando ventas...
                    </td>
                  </tr>
                ) : recentSales.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={6}>
                      No hay ventas recientes
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale, idx) => (
                    <tr key={sale.id || idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 text-sm font-medium text-foreground">{sale.id}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{formatDateTime(sale.createdAt)}</td>
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            'branch-badge',
                            sale.branchId === 'BRANCH-DIR-001'
                              ? 'branch-diriamba'
                              : sale.branchId === 'BRANCH-JIN-001'
                                ? 'branch-jinotepe'
                                : ''
                          )}
                        >
                          {getBranchLabel(sale.branchId)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {sale.customerName || sale.customerId || 'Consumidor final'}
                      </td>
                      <td className="py-3 px-2 text-sm text-foreground text-right font-medium">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                            (sale.status ?? 'ACTIVE') === 'ACTIVE'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {(sale.status ?? 'ACTIVE') === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Alertas de Stock: Cards en móvil, lista en desktop */}
        <div className="kpi-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Alertas de Stock</h3>
          </div>
          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {isLoadingStockAlerts ? (
              <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">Cargando alertas...</div>
            ) : stockAlerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">Sin alertas de stock</div>
            ) : (
              stockAlerts.slice(0, 6).map((alert, idx) => (
                <div key={alert.id || idx} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-base text-foreground truncate">{alert.product?.name || 'Producto'}</span>
                    <span className="text-xs text-muted-foreground truncate">{alert.product?.sku || ''}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn('text-xs font-semibold', alert.quantity <= alert.minStock ? 'text-destructive' : 'text-warning')}>
                      {alert.quantity} u
                    </span>
                    <span className="text-xs text-muted-foreground">mín {alert.minStock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop: Lista */}
          <div className="hidden sm:block space-y-3">
            {isLoadingStockAlerts ? (
              <p className="text-sm text-muted-foreground">Cargando alertas...</p>
            ) : stockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas de stock</p>
            ) : (
              stockAlerts.slice(0, 6).map((alert, idx) => (
                <div key={alert.id || idx} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {alert.product?.name || 'Producto'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.product?.sku || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', alert.quantity <= alert.minStock ? 'text-destructive' : 'text-warning')}>
                      {alert.quantity} u
                    </p>
                    <p className="text-xs text-muted-foreground">mín {alert.minStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 kpi-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Resumen de Ventas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
                <p className="text-lg font-semibold text-foreground">{sales.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cobrado</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}</p>
              </div>
            </div>
          </div>
        </div>
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
