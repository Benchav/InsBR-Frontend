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
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const revenueData = [
  { month: 'Ene', diriamba: 45000, jinotepe: 38000 },
  { month: 'Feb', diriamba: 52000, jinotepe: 42000 },
  { month: 'Mar', diriamba: 48000, jinotepe: 45000 },
  { month: 'Abr', diriamba: 61000, jinotepe: 52000 },
  { month: 'May', diriamba: 55000, jinotepe: 48000 },
  { month: 'Jun', diriamba: 67000, jinotepe: 58000 },
  { month: 'Jul', diriamba: 72000, jinotepe: 63000 },
  { month: 'Ago', diriamba: 68000, jinotepe: 59000 },
  { month: 'Sep', diriamba: 74000, jinotepe: 65000 },
  { month: 'Oct', diriamba: 82000, jinotepe: 71000 },
];

const categoryData = [
  { name: 'Fertilizantes', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Semillas', value: 25, color: 'hsl(var(--success))' },
  { name: 'Herbicidas', value: 15, color: 'hsl(var(--warning))' },
  { name: 'Fungicidas', value: 10, color: 'hsl(var(--info))' },
  { name: 'Otros', value: 5, color: 'hsl(var(--muted-foreground))' },
];

const topProducts = [
  { name: 'Urea Granulada 46%', sales: 1250, revenue: 1062500, trend: 12 },
  { name: 'Fertilizante NPK 15-15-15', sales: 890, revenue: 578500, trend: 8 },
  { name: 'Semilla Maíz Híbrido DK-4050', sales: 450, revenue: 1440000, trend: -3 },
  { name: 'Herbicida Glifosato 5L', sales: 380, revenue: 456000, trend: 15 },
  { name: 'Insecticida Cipermetrina', sales: 320, revenue: 121600, trend: 5 },
];

const reportTypes = [
  { id: 'ventas', name: 'Reporte de Ventas', icon: ShoppingCart, description: 'Análisis detallado de ventas por período' },
  { id: 'inventario', name: 'Reporte de Inventario', icon: Package, description: 'Estado actual del stock y movimientos' },
  { id: 'financiero', name: 'Reporte Financiero', icon: DollarSign, description: 'Ingresos, gastos y utilidades' },
  { id: 'clientes', name: 'Reporte de Clientes', icon: Users, description: 'Análisis de cartera de clientes' },
];

export default function Reportes() {
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.diriamba + d.jinotepe, 0);
  const lastMonthRevenue = revenueData[revenueData.length - 1].diriamba + revenueData[revenueData.length - 1].jinotepe;
  const prevMonthRevenue = revenueData[revenueData.length - 2].diriamba + revenueData[revenueData.length - 2].jinotepe;
  const revenueTrend = ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Reportes</h1>
          <p className="text-muted-foreground">
            Análisis y métricas de {currentBranchId === 'all' ? 'todas las sucursales' : currentBranch.name}
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
          <p className="text-2xl font-bold">C$ {(totalRevenue / 1000).toFixed(0)}K</p>
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
            <span className="text-sm text-muted-foreground">vs mes anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold">2,847</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+8.2%</span>
            <span className="text-sm text-muted-foreground">vs mes anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ticket Promedio</p>
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold">C$ 1,850</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+3.5%</span>
            <span className="text-sm text-muted-foreground">vs mes anterior</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Clientes Activos</p>
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">156</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">+12</span>
            <span className="text-sm text-muted-foreground">nuevos este mes</span>
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
              <p className="text-sm text-muted-foreground">Comparativa Diriamba vs Jinotepe</p>
            </div>
            <Badge variant="secondary">2024</Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `C$ ${v/1000}K`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`C$ ${value.toLocaleString()}`, '']}
                />
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
            {topProducts.map((product, idx) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sales.toLocaleString()} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">C$ {(product.revenue / 1000).toFixed(0)}K</p>
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
            ))}
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
              return (
                <button
                  key={report.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
