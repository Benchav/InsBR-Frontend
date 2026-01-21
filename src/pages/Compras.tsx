import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Plus, DollarSign, Package, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchasesApi } from '@/api/purchases.api';

export default function Compras() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: purchasesApi.getAll,
  });

  const filteredPurchases = purchases.filter((p) => {
    // Filter by branch
    if (currentBranchId !== 'all' && p.branchId !== currentBranchId) return false;

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const idMatch = p.id.toLowerCase().includes(searchLower);
    const supplierMatch = p.supplierId.toLowerCase().includes(searchLower);
    // const statusMatch = ? // Status not in interface

    return idMatch || supplierMatch;
  });

  // Calculate generic KPIs based on real data (optional enhancement)
  const currentMonthTotal = filteredPurchases.reduce((acc, curr) => {
    // Very basic check for current month (generic)
    const date = new Date(curr.createdAt);
    const isCurrentMonth = date.getMonth() === new Date().getMonth();
    return isCurrentMonth ? acc + curr.total : acc;
  }, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulo de Compras</h1>
          <p className="text-muted-foreground">Gestión centralizada de abastecimiento y requisiciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Orden
          </Button>
        </div>
      </div>

      {/* KPIs and Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Gasto Mensual"
          value={isLoading ? "..." : `C$ ${currentMonthTotal.toLocaleString()}`}
          trend={0}
          trendLabel="Mes actual"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        {/* Placeholder for pending/approvals as that logic requires more complex API/Status states not present in Purchase interface */}
        <KPICard
          title="Total Órdenes"
          value={isLoading ? "..." : filteredPurchases.length.toString()}
          trendLabel="En lista actual"
          icon={<Package className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />

        {/* Approvals Required Card - Static for now as auth/approval logic is not exposed in Purchase API instructions */}
        <div className="kpi-card bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Aprobaciones Requeridas</p>
            <a href="#" className="text-xs text-primary hover:underline">Ver todas</a>
          </div>
          <p className="text-xs text-muted-foreground mb-3">0 órdenes exceden el límite automático</p>
          {/* Cleared static list as it might be confusing if not real */}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar orden o proveedor ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Todas las Sucursales
        </Button>
      </div>

      {/* Purchases Table */}
      <div className="kpi-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left py-4 px-4">ID Orden</th>
                  <th className="table-header text-left py-4 px-4">Proveedor</th>
                  <th className="table-header text-left py-4 px-4">Sucursal</th>
                  <th className="table-header text-left py-4 px-4">Fecha Creación</th>
                  <th className="table-header text-right py-4 px-4">Total</th>
                  <th className="table-header text-center py-4 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-foreground">{purchase.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {purchase.supplierId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{purchase.supplierId}</p>
                          {/* Category not available in Purchase interface */}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'branch-badge',
                        purchase.branchId === 'diriamba' ? 'branch-diriamba' :
                          purchase.branchId === 'jinotepe' ? 'branch-jinotepe' : ''
                      )}>
                        {purchase.branchId}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      C$ {purchase.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button variant="ghost" size="sm">Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
