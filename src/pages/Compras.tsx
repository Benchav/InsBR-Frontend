import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { KPICard } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Plus, DollarSign, Package, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi, CreatePurchaseDto, Purchase } from '@/api/purchases.api';
import { productsApi } from '@/api/products.api';
import { formatCurrency, formatDateTime, toCents } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Compras() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const queryClient = useQueryClient();
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Create Purchase State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPurchase, setNewPurchase] = useState<Partial<CreatePurchaseDto>>({
    supplierId: '',
    items: [],
    type: 'CASH',
    paymentMethod: 'CASH',
    invoiceNumber: '',
    notes: ''
  });

  // Item adding state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState('');

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases', branchId, startDate, endDate, supplierFilter],
    queryFn: () => purchasesApi.getAll({
      branchId: branchId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      supplierId: supplierFilter || undefined,
    }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll()
  });

  const createPurchaseMutation = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      toast.success('Orden de compra registrada');
      setIsCreateDialogOpen(false);
      setNewPurchase({ supplierId: '', items: [], type: 'CASH', paymentMethod: 'CASH', invoiceNumber: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al registrar compra');
    }
  });

  const addItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    const unitCostValue = Number(unitCost);
    if (!product || quantity <= 0 || !Number.isFinite(unitCostValue) || unitCostValue < 0) return;

    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitCost: toCents(unitCostValue),
      subtotal: quantity * toCents(unitCostValue)
    };

    setNewPurchase(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));

    // Reset item inputs
    setSelectedProduct('');
    setQuantity(1);
    setUnitCost('');
  };

  const removeItem = (index: number) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleViewPurchase = (purchase: (typeof purchases)[number]) => {
    setViewPurchase(purchase);
    setIsViewOpen(true);
  };

  const calculateTotal = () => {
    return newPurchase.items?.reduce((acc, item) => acc + item.subtotal, 0) || 0;
  };

  const handleSubmit = () => {
    const total = calculateTotal();
    if (!newPurchase.supplierId || total <= 0) {
      toast.error('Complete los datos requeridos');
      return;
    }

    createPurchaseMutation.mutate({
      supplierId: newPurchase.supplierId!,
      items: newPurchase.items!,
      subtotal: total,
      tax: 0,
      discount: 0,
      total: total,
      type: newPurchase.type as 'CASH' | 'CREDIT',
      ...(newPurchase.type === 'CASH' ? { paymentMethod: newPurchase.paymentMethod as any } : {}),
      ...(newPurchase.invoiceNumber ? { invoiceNumber: newPurchase.invoiceNumber } : {}),
      notes: newPurchase.notes
    });
  };

  const filteredPurchases = purchases.filter((p) => {
    // Filter by branch
    if (currentBranchId !== 'ALL' && p.branchId !== currentBranchId) return false;

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const idMatch = p.id.toLowerCase().includes(searchLower);
    const supplierMatch = p.supplierId.toLowerCase().includes(searchLower);

    return idMatch || supplierMatch;
  });

  const currentMonthTotal = filteredPurchases.reduce((acc, curr) => {
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Compra</DialogTitle>
                <DialogDescription>Ingresa los detalles de la factura o recibo de compra.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proveedor (ID)</Label>
                    <Input
                      placeholder="ID Proveedor"
                      value={newPurchase.supplierId}
                      onChange={(e) => setNewPurchase({ ...newPurchase, supplierId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Factura</Label>
                    <Input
                      placeholder="F-00123"
                      value={newPurchase.invoiceNumber}
                      onChange={(e) => setNewPurchase({ ...newPurchase, invoiceNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Compra</Label>
                    <Select value={newPurchase.type} onValueChange={(val) => setNewPurchase({ ...newPurchase, type: val as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Contado</SelectItem>
                        <SelectItem value="CREDIT">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newPurchase.type === 'CASH' && (
                    <div className="space-y-2">
                      <Label>Método Pago</Label>
                      <Select value={newPurchase.paymentMethod} onValueChange={(val) => setNewPurchase({ ...newPurchase, paymentMethod: val as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Efectivo</SelectItem>
                          <SelectItem value="TRANSFER">Transferencia</SelectItem>
                          <SelectItem value="CHECK">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                  <h4 className="font-medium text-sm">Agregar Productos</h4>
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
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
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Cant.</Label>
                      <Input type="number" className="h-8 text-xs" min="1" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))} />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Costo Unit.</Label>
                      <Input type="number" className="h-8 text-xs" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Button size="sm" className="h-8 w-full" variant="secondary" onClick={addItem}>Agregar</Button>
                    </div>
                  </div>

                  {/* Items List */}
                  {newPurchase.items && newPurchase.items.length > 0 && (
                    <div className="mt-2 bg-background border rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Producto</th>
                            <th className="p-2 text-right">Cant.</th>
                            <th className="p-2 text-right">Costo</th>
                            <th className="p-2 text-right">Total</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {newPurchase.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2 truncate max-w-[120px]">{item.productName}</td>
                              <td className="p-2 text-right">{item.quantity}</td>
                              <td className="p-2 text-right">{formatCurrency(item.unitCost)}</td>
                              <td className="p-2 text-right">{formatCurrency(item.subtotal)}</td>
                              <td className="p-2 text-center">
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeItem(idx)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/50 font-medium">
                          <tr>
                            <td colSpan={3} className="p-2 text-right">TOTAL</td>
                            <td className="p-2 text-right">{formatCurrency(calculateTotal())}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Notas</Label>
                    <Textarea
                      placeholder="Observaciones de la compra"
                      value={newPurchase.notes}
                      onChange={(e) => setNewPurchase({ ...newPurchase, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={createPurchaseMutation.isPending || !newPurchase.supplierId || (newPurchase.items?.length || 0) === 0}>
                  {createPurchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Compra
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs and Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Gasto Mensual"
          value={isLoading ? "..." : formatCurrency(currentMonthTotal)}
          trend={0}
          trendLabel="Mes actual"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <KPICard
          title="Total Órdenes"
          value={isLoading ? "..." : filteredPurchases.length.toString()}
          trendLabel="En lista actual"
          icon={<Package className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />

        <div className="kpi-card bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Aprobaciones Requeridas</p>
            <a href="#" className="text-xs text-primary hover:underline">Ver todas</a>
          </div>
          <p className="text-xs text-muted-foreground mb-3">0 órdenes exceden el límite automático</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar orden o proveedor ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="relative max-w-[220px]">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Proveedor ID"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="pl-10"
          />
        </div>
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
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'branch-badge',
                        purchase.branchId === 'BRANCH-DIR-001' ? 'branch-diriamba' :
                          purchase.branchId === 'BRANCH-JIN-001' ? 'branch-jinotepe' : ''
                      )}>
                        {purchase.branchId}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleViewPurchase(purchase)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
            <DialogDescription>Resumen de la orden seleccionada.</DialogDescription>
          </DialogHeader>

          {viewPurchase ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Orden</p>
                  <p className="font-medium text-foreground">{viewPurchase.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium text-foreground">{formatDateTime(viewPurchase.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Proveedor</p>
                  <p className="font-medium text-foreground">{viewPurchase.supplierId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Sucursal</p>
                  <p className="font-medium text-foreground">{viewPurchase.branchId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium text-foreground">
                    {viewPurchase.type === 'CASH' ? 'Contado' : 'Crédito'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Método de Pago</p>
                  <p className="font-medium text-foreground">{viewPurchase.paymentMethod || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Factura</p>
                  <p className="font-medium text-foreground">{viewPurchase.invoiceNumber || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-foreground">{formatCurrency(viewPurchase.total)}</p>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-3 py-2">Producto</th>
                      <th className="text-right px-3 py-2">Cant.</th>
                      <th className="text-right px-3 py-2">Costo</th>
                      <th className="text-right px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewPurchase.items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-t">
                        <td className="px-3 py-2">{item.productName || item.productId}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unitCost)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewPurchase.notes && (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <p className="text-muted-foreground">Notas</p>
                  <p className="text-foreground">{viewPurchase.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay información disponible.</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
