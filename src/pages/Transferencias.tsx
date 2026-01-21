import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Filter, Plus, ArrowRight, Package, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const mockTransfers = [
  { 
    id: 'TR-2024-045', 
    from: 'Diriamba', 
    to: 'Jinotepe', 
    items: [
      { name: 'Urea Granulada 46%', quantity: 200 },
      { name: 'Fertilizante NPK 15-15-15', quantity: 100 }
    ],
    date: '25 Oct, 2024',
    status: 'COMPLETED' as const,
    requestedBy: 'Carlos Méndez'
  },
  { 
    id: 'TR-2024-044', 
    from: 'Jinotepe', 
    to: 'Diriamba', 
    items: [
      { name: 'Fungicida Preventivo', quantity: 30 }
    ],
    date: '24 Oct, 2024',
    status: 'IN_TRANSIT' as const,
    requestedBy: 'María López'
  },
  { 
    id: 'TR-2024-043', 
    from: 'Diriamba', 
    to: 'Jinotepe', 
    items: [
      { name: 'Semilla Maíz Híbrido DK-4050', quantity: 50 },
      { name: 'Herbicida Glifosato 5L', quantity: 25 }
    ],
    date: '23 Oct, 2024',
    status: 'PENDING' as const,
    requestedBy: 'Juan Pérez'
  },
  { 
    id: 'TR-2024-042', 
    from: 'Jinotepe', 
    to: 'Diriamba', 
    items: [
      { name: 'Insecticida Cipermetrina', quantity: 100 }
    ],
    date: '20 Oct, 2024',
    status: 'CANCELLED' as const,
    requestedBy: 'Ana García'
  },
];

const mockProducts = [
  { id: '1', name: 'Urea Granulada 46%', sku: 'FER-001-50KG', stockDiriamba: 1250, stockJinotepe: 45 },
  { id: '2', name: 'Semilla Maíz Híbrido DK-4050', sku: 'SEM-MAZ-DKA', stockDiriamba: 300, stockJinotepe: 0 },
  { id: '3', name: 'Fungicida Preventivo', sku: 'FUN-PREV-1L', stockDiriamba: 5, stockJinotepe: 50 },
  { id: '4', name: 'Herbicida Glifosato 5L', sku: 'HER-GLI-5L', stockDiriamba: 180, stockJinotepe: 95 },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completado', icon: CheckCircle2, class: 'bg-success/10 text-success' };
    case 'IN_TRANSIT':
      return { label: 'En Tránsito', icon: Truck, class: 'bg-primary/10 text-primary' };
    case 'PENDING':
      return { label: 'Pendiente', icon: Clock, class: 'bg-warning/10 text-warning' };
    case 'CANCELLED':
      return { label: 'Cancelado', icon: XCircle, class: 'bg-destructive/10 text-destructive' };
    default:
      return { label: status, icon: Clock, class: 'bg-muted text-muted-foreground' };
  }
};

export default function Transferencias() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTransfers = mockTransfers.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = mockTransfers.filter(t => t.status === 'PENDING').length;
  const inTransitCount = mockTransfers.filter(t => t.status === 'IN_TRANSIT').length;
  const completedCount = mockTransfers.filter(t => t.status === 'COMPLETED').length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transferencias de Inventario</h1>
          <p className="text-muted-foreground">Gestión de movimientos entre sucursales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Transferencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Transferencia</DialogTitle>
              <DialogDescription>
                Solicita una transferencia de productos entre sucursales.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sucursal Origen</Label>
                  <Select defaultValue="diriamba">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diriamba">Diriamba</SelectItem>
                      <SelectItem value="jinotepe">Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal Destino</Label>
                  <Select defaultValue="jinotepe">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diriamba">Diriamba</SelectItem>
                      <SelectItem value="jinotepe">Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" placeholder="0" min="1" />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input placeholder="Agregar notas o comentarios..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsDialogOpen(false)}>Crear Transferencia</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Pendientes de Aprobación"
          value={`${pendingCount} Solicitudes`}
          trendLabel="Requieren revisión"
          icon={<Clock className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
        <KPICard
          title="En Tránsito"
          value={`${inTransitCount} Transferencias`}
          trendLabel="En camino entre sucursales"
          icon={<Truck className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <KPICard
          title="Completadas (Mes)"
          value={`${completedCount} Transferencias`}
          trend={15}
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
          iconBgClass="bg-success/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o sucursal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transfers Table */}
      <div className="kpi-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left py-4 px-4">ID Transferencia</th>
                <th className="table-header text-left py-4 px-4">Ruta</th>
                <th className="table-header text-left py-4 px-4">Productos</th>
                <th className="table-header text-left py-4 px-4">Solicitado por</th>
                <th className="table-header text-left py-4 px-4">Fecha</th>
                <th className="table-header text-center py-4 px-4">Estado</th>
                <th className="table-header text-center py-4 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((transfer) => {
                const statusConfig = getStatusConfig(transfer.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={transfer.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-foreground">{transfer.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="branch-badge branch-diriamba">
                          {transfer.from}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="branch-badge branch-jinotepe">
                          {transfer.to}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {transfer.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span>{item.name}</span>
                            <Badge variant="secondary" className="text-xs">x{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{transfer.requestedBy}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{transfer.date}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                        statusConfig.class
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm">Ver</Button>
                        {transfer.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-success">Aprobar</Button>
                            <Button variant="ghost" size="sm" className="text-destructive">Cancelar</Button>
                          </>
                        )}
                        {transfer.status === 'IN_TRANSIT' && (
                          <Button variant="ghost" size="sm" className="text-success">Completar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredTransfers.length} de {mockTransfers.length} transferencias</span>
      </div>
    </DashboardLayout>
  );
}
