import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Plus, DollarSign, Package, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const mockPurchases = [
  { id: 'PO-2024-089', supplier: 'Aceros de México', category: 'Materiales', branch: 'Diriamba' as const, date: '25 Oct, 2023', total: 12450, status: 'En Proceso' as const },
  { id: 'PO-2024-088', supplier: 'Insumos Médicos SA', category: 'Salud e Higiene', branch: 'Jinotepe' as const, date: '22 Oct, 2023', total: 3200, status: 'Recibido' as const },
  { id: 'PO-2024-087', supplier: 'Papelería Corporativa', category: 'Oficina', branch: 'Jinotepe' as const, date: '20 Oct, 2023', total: 850, status: 'Borrador' as const },
  { id: 'PO-2024-086', supplier: 'Distribuidora Nacional', category: 'Insumos', branch: 'Diriamba' as const, date: '18 Oct, 2023', total: 8900, status: 'Recibido' as const },
];

const pendingApprovals = [
  { id: 'P2', supplier: 'Maquinaria Pesada SA', code: 'PO-2400', amount: 12500 },
  { id: 'TC', supplier: 'Tecnología Central', code: 'PO-2402', amount: 4200 },
];

export default function Compras() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = mockPurchases.filter((p) => {
    if (currentBranchId !== 'all' && p.branch.toLowerCase() !== currentBranchId) return false;
    return p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          title="Gasto Mensual (Oct)"
          value="C$ 45,230"
          trend={12}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <KPICard
          title="Entregas Pendientes"
          value="12 Órdenes"
          trendLabel="2 urgentes para esta semana"
          icon={<Package className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />

        {/* Approvals Required Card */}
        <div className="kpi-card bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Aprobaciones Requeridas</p>
            <a href="#" className="text-xs text-primary hover:underline">Ver todas</a>
          </div>
          <p className="text-xs text-muted-foreground mb-3">3 órdenes exceden el límite automático</p>
          <div className="space-y-2">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {item.id}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.supplier}</p>
                    <p className="text-xs text-muted-foreground">{item.code} • C$ {item.amount.toLocaleString()}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-success">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar orden, SKU o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Todas las Sucursales
        </Button>
        <Button variant="outline">
          Cualquier Estado
        </Button>
      </div>

      {/* Purchases Table */}
      <div className="kpi-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left py-4 px-4">ID Orden</th>
                <th className="table-header text-left py-4 px-4">Proveedor</th>
                <th className="table-header text-left py-4 px-4">Sucursal</th>
                <th className="table-header text-left py-4 px-4">Fecha Entrega</th>
                <th className="table-header text-right py-4 px-4">Total</th>
                <th className="table-header text-center py-4 px-4">Estado</th>
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
                        {purchase.supplier.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{purchase.supplier}</p>
                        <p className="text-xs text-muted-foreground">{purchase.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      'branch-badge',
                      purchase.branch === 'Diriamba' ? 'branch-diriamba' : 'branch-jinotepe'
                    )}>
                      Sucursal {purchase.branch}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{purchase.date}</td>
                  <td className="py-4 px-4 text-right font-semibold">
                    C$ {purchase.total.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      'inline-flex px-3 py-1 rounded-full text-xs font-medium',
                      purchase.status === 'Recibido' && 'bg-success/10 text-success',
                      purchase.status === 'En Proceso' && 'bg-primary/10 text-primary',
                      purchase.status === 'Borrador' && 'bg-muted text-muted-foreground'
                    )}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button variant="ghost" size="sm">Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
