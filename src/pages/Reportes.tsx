import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Users,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { productsApi } from '@/api/products.api';
import { customersApi } from '@/api/customers.api';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

const reportTypes = [
  {
    id: 'sales',
    name: 'Reporte de Ventas',
    icon: ShoppingCart,
    description: 'Análisis detallado de ventas por período',
    endpoint: '/api/reports/sales/excel',
    roles: ['ADMIN', 'GERENTE'] as const,
    color: 'blue',
    needsRange: true,
  },
  {
    id: 'cash',
    name: 'Reporte Financiero',
    icon: DollarSign,
    description: 'Ingresos, gastos y utilidades',
    endpoint: '/api/reports/cash/excel',
    roles: ['ADMIN', 'GERENTE'] as const,
    color: 'green',
    needsRange: true,
  },
  {
    id: 'inventory',
    name: 'Reporte de Inventario',
    icon: Package,
    description: 'Estado actual del stock por sucursal',
    endpoint: '/api/reports/inventory/excel',
    roles: ['ADMIN'] as const,
    color: 'orange',
    needsRange: false,
  },
  {
    id: 'clients',
    name: 'Reporte de Clientes',
    icon: Users,
    description: 'Análisis de cartera de clientes',
    endpoint: '/api/reports/clients/excel',
    roles: ['ADMIN'] as const,
    color: 'purple',
    needsRange: false,
  },
];

export default function Reportes() {
  const { user } = useAuth();
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const isAllBranches = currentBranchId === 'ALL';
  const currentBranch = getCurrentBranch();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-report', branchId],
    queryFn: () => salesApi.getAll(branchId ? { branchId } : undefined),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-report'],
    queryFn: () => productsApi.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-report', branchId],
    queryFn: () => customersApi.getAll({ isActive: true, branchId }),
  });

  const getPeriodRange = (period: string) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start);
    if (period === 'week') {
      prevStart.setDate(prevStart.getDate() - 7);
    } else if (period === 'month') {
      prevStart.setMonth(prevStart.getMonth() - 1);
    } else if (period === 'quarter') {
      prevStart.setMonth(prevStart.getMonth() - 3);
    } else if (period === 'year') {
      prevStart.setFullYear(prevStart.getFullYear() - 1);
    }

    return { start, end, prevStart, prevEnd };
  };

  const periodSales = useMemo(() => {
    const { start, end } = getPeriodRange(selectedPeriod);
    return sales.filter((sale) => {
      if (!sale.createdAt) return false;
      const date = new Date(sale.createdAt);
      return date >= start && date <= end;
    });
  }, [sales, selectedPeriod]);

  const previousPeriodSales = useMemo(() => {
    const { prevStart, prevEnd } = getPeriodRange(selectedPeriod);
    return sales.filter((sale) => {
      if (!sale.createdAt) return false;
      const date = new Date(sale.createdAt);
      return date >= prevStart && date <= prevEnd;
    });
  }, [sales, selectedPeriod]);

  const revenueData = useMemo(() => {
    const today = new Date();
    const months = Array.from({ length: 10 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (9 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      return {
        key,
        month: date.toLocaleDateString('es-NI', { month: 'short' }),
        diriamba: 0,
        jinotepe: 0,
        total: 0,
      };
    });

    const map = new Map(months.map((entry) => [entry.key, entry]));
    sales.forEach((sale) => {
      if (!sale.createdAt) return;
      const date = new Date(sale.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const bucket = map.get(key);
      if (!bucket) return;
      bucket.total += sale.total;
      if (sale.branchId === 'BRANCH-DIR-001') bucket.diriamba += sale.total;
      if (sale.branchId === 'BRANCH-JIN-001') bucket.jinotepe += sale.total;
    });

    return months;
  }, [sales]);

  const totalRevenue = useMemo(
    () => periodSales.reduce((sum, sale) => sum + sale.total, 0),
    [periodSales]
  );

  const previousPeriodRevenue = useMemo(
    () => previousPeriodSales.reduce((sum, sale) => sum + sale.total, 0),
    [previousPeriodSales]
  );

  const revenueTrend = useMemo(() => {
    if (previousPeriodRevenue === 0) return totalRevenue > 0 ? 100 : 0;
    return ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
  }, [previousPeriodRevenue, totalRevenue]);

  const averageTicket = useMemo(() => {
    if (periodSales.length === 0) return 0;
    return Math.round(totalRevenue / periodSales.length);
  }, [periodSales, totalRevenue]);

  const categoryData = useMemo(() => {
    const productCategoryMap = new Map(products.map((product) => [product.id, product.category || 'Otros']));
    const totals = new Map<string, number>();

    periodSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const category = productCategoryMap.get(item.productId) || 'Otros';
        const itemTotal = item.subtotal ?? item.unitPrice * item.quantity;
        totals.set(category, (totals.get(category) || 0) + itemTotal);
      });
    });

    const overall = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
    if (!overall) {
      return [{ name: 'Sin datos', value: 100, color: 'hsl(var(--muted-foreground))' }];
    }

    const palette = [
      'hsl(var(--primary))',
      'hsl(var(--success))',
      'hsl(var(--warning))',
      'hsl(var(--info))',
      'hsl(var(--muted-foreground))',
    ];

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value: Math.round((value / overall) * 100),
        color: palette[index % palette.length],
      }));
  }, [products, periodSales]);

  const topProducts = useMemo(() => {
    const buildTotals = (salesList: typeof sales) => {
      const totals = new Map<string, { name: string; sales: number; revenue: number }>();
      salesList.forEach((sale) => {
        sale.items.forEach((item) => {
          const name = item.productName || item.productId;
          const current = totals.get(name) || { name, sales: 0, revenue: 0 };
          const itemTotal = item.subtotal ?? item.unitPrice * item.quantity;
          current.sales += item.quantity;
          current.revenue += itemTotal;
          totals.set(name, current);
        });
      });
      return totals;
    };

    const currentTotals = buildTotals(periodSales);
    const previousTotals = buildTotals(previousPeriodSales);

    return Array.from(currentTotals.values())
      .map((item) => {
        const prev = previousTotals.get(item.name);
        const prevRevenue = prev?.revenue ?? 0;
        const trend = prevRevenue === 0 ? (item.revenue > 0 ? 100 : 0) : ((item.revenue - prevRevenue) / prevRevenue) * 100;
        return { ...item, trend: Math.round(trend) };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodSales, previousPeriodSales]);

  const toDateInput = (date: Date) => date.toISOString().split('T')[0];

  const handleDownloadReport = async (reportId: string) => {
    const report = reportTypes.find((item) => item.id === reportId);
    if (!report) return;
    if (!user?.role || !report.roles.includes(user.role)) {
      toast.error('No tienes permisos para generar este reporte');
      return;
    }

    setDownloadingReportId(reportId);
    try {
      const params = report.needsRange ? (() => {
        const { start, end } = getPeriodRange(selectedPeriod);
        return { from: toDateInput(start), to: toDateInput(end) };
      })() : undefined;

      const response = await apiClient.get(report.endpoint, {
        responseType: 'blob',
        params,
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filenameDate = toDateInput(new Date());
      const safeName = report.name.replace(/\s+/g, '_');
      link.href = url;
      link.setAttribute('download', `${safeName}_${filenameDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Reporte descargado');
    } catch (error: unknown) {
      toast.error('Error al generar reporte');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const reportColorClasses = {
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    green: 'bg-success text-success-foreground hover:bg-success/90',
    orange: 'bg-warning text-warning-foreground hover:bg-warning/90',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
  } as const;

  const reportIconClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-success/10 text-success',
    orange: 'bg-warning/10 text-warning',
    purple: 'bg-purple-500/10 text-purple-600',
  } as const;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Reportes</h1>
          <p className="text-muted-foreground">
            Análisis y métricas de {currentBranchId === 'ALL' ? 'todas las sucursales' : currentBranch.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ingresos Totales</p>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {revenueTrend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-success" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
            <span className={cn(
              'text-sm font-medium',
              revenueTrend >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">vs período anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold">{periodSales.length.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">{revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">vs período anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ticket Promedio</p>
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(averageTicket)}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">{revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">vs período anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Clientes Activos</p>
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">{customers.length.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">{revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 kpi-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Tendencia de Ingresos</h3>
              <p className="text-sm text-muted-foreground">
                {isAllBranches ? 'Comparativa Diriamba vs Jinotepe' : `Sucursal: ${currentBranch.name}`}
              </p>
            </div>
            <Badge variant="secondary">{new Date().getFullYear()}</Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value: number) => formatCurrencyShort(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                {isAllBranches ? (
                  <>
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="diriamba" 
                      name="Diriamba"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="jinotepe" 
                      name="Jinotepe"
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))' }}
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="total"
                    name={currentBranch.shortName}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="kpi-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Ventas por Categoría</h3>
            <p className="text-sm text-muted-foreground">Distribución porcentual</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Quick Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Productos Más Vendidos</h3>
              <p className="text-sm text-muted-foreground">Top 5 del mes</p>
            </div>
            <Button variant="ghost" size="sm">Ver todos</Button>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas para mostrar.</p>
            ) : (
              topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales.toLocaleString()} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrencyShort(product.revenue)}</p>
                    <div className="flex items-center justify-end gap-1">
                      {product.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={cn(
                        'text-xs font-medium',
                        product.trend >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {product.trend >= 0 ? '+' : ''}{product.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Reports */}
        <div className="kpi-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Reportes Rápidos</h3>
            <p className="text-sm text-muted-foreground">Genera reportes predefinidos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isAllowed = !!user?.role && report.roles.includes(user.role);
              const isDownloading = downloadingReportId === report.id;
              return (
                <button
                  key={report.id}
                  className={cn(
                    'flex flex-col gap-3 p-4 rounded-xl border border-border transition-all text-left group',
                    isAllowed ? 'hover:border-primary hover:bg-primary/5' : 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => handleDownloadReport(report.id)}
                  disabled={!isAllowed || isDownloading}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center transition-colors', reportIconClasses[report.color])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                        isAllowed ? reportColorClasses[report.color] : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isDownloading ? 'Generando...' : 'Descargar Excel'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
