import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Filter, Plus, ArrowRight, Package, Clock, CheckCircle2, XCircle, Truck, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi, Transfer, CreateTransferDto } from '@/api/transfers.api';
import { productsApi } from '@/api/products.api';
import { toast } from 'sonner';
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
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Create Transfer State
  const [newTransfer, setNewTransfer] = useState<Partial<CreateTransferDto>>({
    toBranchId: currentBranchId === 'BRANCH-DIR-001' ? 'BRANCH-DIR-002' : 'BRANCH-DIR-001', // Default opposite
    items: [],
    notes: ''
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Data Fetching
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers', branchId],
    queryFn: () => transfersApi.getAll(branchId ? { branchId } : undefined)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll()
  });

  // Mutations
  const createTransferMutation = useMutation({
    mutationFn: transfersApi.create,
    onSuccess: () => {
      toast.success('Solicitud de transferencia creada');
      setIsDialogOpen(false);
      setNewTransfer({ items: [], notes: '', toBranchId: currentBranchId === 'BRANCH-DIR-001' ? 'BRANCH-DIR-002' : 'BRANCH-DIR-001' });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: () => toast.error('Error al crear transferencia')
  });

  const approveTransferMutation = useMutation({
    mutationFn: transfersApi.approve,
    onSuccess: () => {
      toast.success('Transferencia aprobada (En Tránsito)');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: () => toast.error('Error al aprobar transferencia')
  });

  const completeTransferMutation = useMutation({
    mutationFn: transfersApi.complete,
    onSuccess: () => {
      toast.success('Transferencia completada y stock actualizado');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] }); // Stock changes
    },
    onError: () => toast.error('Error al completar transferencia')
  });

  const cancelTransferMutation = useMutation({
    mutationFn: transfersApi.cancel,
    onSuccess: () => {
      toast.success('Transferencia cancelada');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: () => toast.error('Error al cancelar transferencia')
  });

  // Helpers
  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setNewTransfer(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: product.id, quantity }]
    }));
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setNewTransfer(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromBranchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toBranchId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    // Also filter by current branch interaction (either source or dest, unless 'all')
    const matchesBranch = currentBranchId === 'ALL' ||
      t.fromBranchId === currentBranchId ||
      t.toBranchId === currentBranchId;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;

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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Transferencia</DialogTitle>
              <DialogDescription>
                Solicita una transferencia de productos entre sucursales.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sucursal Origen (Desde)</Label>
                  <Select
                    value={currentBranchId}
                    disabled={true}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRANCH-DIR-001">Diriamba</SelectItem>
                      <SelectItem value="BRANCH-DIR-002">Jinotepe</SelectItem>
                      <SelectItem value="ALL">Global</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentBranchId === 'ALL' && <p className="text-xs text-destructive">Seleccione una sucursal arriba para iniciar transferencia.</p>}
                </div>
                <div className="space-y-2">
                  <Label>Sucursal Destino (Hacia)</Label>
                  <Select
                    value={newTransfer.toBranchId}
                    onValueChange={(val) => setNewTransfer({ ...newTransfer, toBranchId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRANCH-DIR-001" disabled={currentBranchId === 'BRANCH-DIR-001'}>Diriamba</SelectItem>
                      <SelectItem value="BRANCH-DIR-002" disabled={currentBranchId === 'BRANCH-DIR-002'}>Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <h4 className="font-medium text-sm">Productos a Transferir</h4>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-7 space-y-1">
                    <Label className="text-xs">Producto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Buscar..." /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Cant.</Label>
                    <Input type="number" className="h-8 text-xs" min="1" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Button size="sm" className="h-8 w-full" variant="secondary" onClick={addItem}>Add</Button>
                  </div>
                </div>

                {newTransfer.items && newTransfer.items.length > 0 && (
                  <div className="mt-2 bg-background border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Producto</th>
                          <th className="p-2 text-right">Cant.</th>
                          <th className="p-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newTransfer.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{getProductName(item.productId)}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-center">
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeItem(idx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input placeholder="Agregar notas..." value={newTransfer.notes} onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => createTransferMutation.mutate(newTransfer as any)} disabled={createTransferMutation.isPending || !newTransfer.toBranchId || (newTransfer.items?.length || 0) === 0}>
                {createTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Transferencia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Pendientes de Aprobación"
          value={isLoading ? "..." : `${pendingCount} Solicitudes`}
          trendLabel="Requieren revisión"
          icon={<Clock className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
        <KPICard
          title="En Tránsito"
          value={isLoading ? "..." : `${inTransitCount} Transferencias`}
          trendLabel="En camino entre sucursales"
          icon={<Truck className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <KPICard
          title="Completadas (Mes)"
          value={isLoading ? "..." : `${completedCount} Transferencias`}
          trendLabel="Total histórico"
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
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                          <Badge variant="outline" className={cn("branch-badge", transfer.fromBranchId === 'BRANCH-DIR-001' ? 'branch-diriamba' : 'branch-jinotepe')}>
                            {transfer.fromBranchId}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className={cn("branch-badge", transfer.toBranchId === 'BRANCH-DIR-001' ? 'branch-diriamba' : 'branch-jinotepe')}>
                            {transfer.toBranchId}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {transfer.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span>{item.productName || getProductName(item.productId)}</span>
                              <Badge variant="secondary" className="text-xs">x{item.quantity}</Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{transfer.createdBy}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{new Date(transfer.createdAt).toLocaleDateString()}</td>
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
                          {/* Actions Logic */}
                          {transfer.status === 'PENDING' && (
                            <>
                              {/* Approve implies "Shipping it" - usually done by Sender */}
                              <Button
                                variant="ghost" size="sm" className="text-success hover:text-success/80 hover:bg-success/10"
                                onClick={() => approveTransferMutation.mutate(transfer.id)}
                                disabled={approveTransferMutation.isPending}
                              >
                                Aprobar
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                onClick={() => cancelTransferMutation.mutate(transfer.id)}
                                disabled={cancelTransferMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}

                          {transfer.status === 'IN_TRANSIT' && transfer.toBranchId === currentBranchId && (
                            <Button
                              variant="ghost" size="sm" className="text-success hover:text-success/80 hover:bg-success/10"
                              onClick={() => completeTransferMutation.mutate(transfer.id)}
                              disabled={completeTransferMutation.isPending}
                            >
                              Confirmar Recepción
                            </Button>
                          )}

                          {transfer.status === 'IN_TRANSIT' && transfer.toBranchId !== currentBranchId && (
                            <span className="text-xs text-muted-foreground">En tránsito</span>
                          )}

                          {(transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
