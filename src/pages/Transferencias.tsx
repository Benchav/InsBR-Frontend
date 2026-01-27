import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Filter, Plus, ArrowRight, Package, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '@/services/transferService';
import { productsApi } from '@/api/products.api';
import { toast } from 'sonner';
import { CreateTransferDto, TransferStatus } from '@/types/transfer';
import { TransferActions } from '@/components/transfers/TransferActions';
import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
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

export default function Transferencias() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Create Transfer State
  const [newTransfer, setNewTransfer] = useState<Partial<CreateTransferDto>>({
    toBranchId: currentBranchId === 'BRANCH-DIR-001' ? 'BRANCH-JIN-001' : 'BRANCH-DIR-001',
    items: [],
    notes: ''
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Data Fetching
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers', branchId],
    queryFn: () => transferService.getAll({ branchId }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll()
  });

  // Mutations
  const createTransferMutation = useMutation({
    mutationFn: transferService.create,
    onSuccess: () => {
      toast.success('Transferencia creada exitosamente');
      setIsDialogOpen(false);
      setNewTransfer({ items: [], notes: '', toBranchId: currentBranchId === 'BRANCH-DIR-001' ? 'BRANCH-JIN-001' : 'BRANCH-DIR-001' });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: () => toast.error('Error al crear transferencia')
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

    return matchesSearch && matchesStatus;
  });

  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const requestedCount = transfers.filter(t => t.status === 'REQUESTED').length;
  const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;

  const handleRefresh = () => {
    // Invalidate all transfer queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transferencias de Inventario</h1>
          <p className="text-muted-foreground">Sistema de envíos y solicitudes entre sucursales</p>
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
              <DialogTitle>Nueva Transferencia / Solicitud</DialogTitle>
              <DialogDescription>
                Si el origen es tu sucursal, será un <strong>ENVÍO</strong>. Si es otra, será una <strong>SOLICITUD</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sucursal Origen (Desde)</Label>
                  <Select
                    value={currentBranchId === 'ALL' ? undefined : currentBranchId}
                    disabled={true}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRANCH-DIR-001">Diriamba</SelectItem>
                      <SelectItem value="BRANCH-JIN-001">Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentBranchId === 'ALL' && <p className="text-xs text-destructive">Seleccione una sucursal arriba para iniciar.</p>}
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
                      <SelectItem value="BRANCH-JIN-001" disabled={currentBranchId === 'BRANCH-JIN-001'}>Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                <h4 className="font-medium text-sm">Productos</h4>
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
                                <span className="sr-only">Delete</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
                {createTransferMutation.isPending && <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                Crear Transferencia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Solicitudes Nuevas"
          value={isLoading ? "..." : `${requestedCount} Solicitudes`}
          trendLabel="Requieren aprobación"
          icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
          iconBgClass="bg-yellow-100"
        />
        <KPICard
          title="Listas para Envío"
          value={isLoading ? "..." : `${pendingCount} Pendientes`}
          trendLabel="Despachar mercadería"
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          iconBgClass="bg-blue-100"
        />
        <KPICard
          title="En Tránsito"
          value={isLoading ? "..." : `${inTransitCount} En camino`}
          trendLabel="Esperando recepción"
          icon={<Truck className="h-6 w-6 text-purple-600" />}
          iconBgClass="bg-purple-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="REQUESTED">Solicitado</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Mobile View */}
        <div className="sm:hidden flex flex-col divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No hay transferencias encontradas.</div>
          ) : (
            filteredTransfers.map((t) => (
              <div key={t.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono font-medium text-sm">{t.id}</span>
                  <TransferStatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{t.fromBranchId}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline">{t.toBranchId}</Badge>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">{t.items.length} Productos:</p>
                  <ul className="list-disc list-inside text-muted-foreground pl-1">
                    {t.items.slice(0, 2).map((i, idx) => (
                      <li key={idx} className="truncate">{getProductName(i.productId)} (x{i.quantity})</li>
                    ))}
                    {t.items.length > 2 && <li>...</li>}
                  </ul>
                </div>
                <div className="pt-2 border-t mt-1">
                  <TransferActions transfer={t} userBranchId={currentBranchId || ''} onAction={handleRefresh} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3">ID / Fecha</th>
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center">Cargando...</td></tr>
              ) : filteredTransfers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay transferencias.</td></tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{t.fromBranchId}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">{t.toBranchId}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TransferStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate text-muted-foreground" title={t.items.map(i => `${getProductName(i.productId)} x${i.quantity}`).join(', ')}>
                        {t.items.length} items ({t.items.reduce((acc, i) => acc + i.quantity, 0)} unid.)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TransferActions transfer={t} userBranchId={currentBranchId || ''} onAction={handleRefresh} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
