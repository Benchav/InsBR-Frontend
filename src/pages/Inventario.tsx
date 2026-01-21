import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Plus, Loader2, Edit, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '@/api/products.api';
import { stockApi } from '@/api/stock.api';
import { toCurrency, toCents, formatCurrency } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Inventario() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Dialog Control
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  // Data States
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Forms
  const [adjustmentForm, setAdjustmentForm] = useState({
    newQuantity: 0,
    reason: '',
    productName: '',
    currentQuantity: 0
  });

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    costPrice: 0,
    retailPrice: 0,
    unit: 'UNIDAD',
    isActive: true
  });

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => stockApi.getMyBranchStock(),
  });

  // Mutations
  const adjustStockMutation = useMutation({
    mutationFn: stockApi.adjustStock,
    onSuccess: () => {
      toast.success('Stock ajustado correctamente');
      setIsAdjustDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al ajustar stock');
    }
  });

  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      toast.success('Producto creado correctamente');
      setIsCreateDialogOpen(false);
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al crear producto');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado correctamente');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al actualizar producto');
    }
  });

  // Helpers
  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      category: '',
      description: '',
      costPrice: 0,
      retailPrice: 0,
      unit: 'UNIDAD',
      isActive: true
    });
  };

  const getProductStockEntry = (productId: string, branchId: string) => {
    return stocks.find(s => s.productId === productId && s.branchId === branchId);
  };

  const getStockForBranch = (productId: string, branchId: string) => {
    const stock = getProductStockEntry(productId, branchId);
    return stock ? stock.quantity : 0;
  };

  const getProductStocks = (productId: string) => {
    return stocks.filter(s => s.productId === productId);
  };

  // Actions
  const openAdjustDialog = (productId: string, productName: string, branchId: string) => {
    let targetBranch = branchId;
    if (branchId === 'ALL') {
      targetBranch = 'BRANCH-DIR-001';
    }

    const stockEntry = getProductStockEntry(productId, targetBranch);

    if (!stockEntry) {
      toast.error(`No registro de stock (${targetBranch})`, {
        description: 'Este producto no tiene inicializado el inventario en esta sucursal.'
      });
      return;
    }

    setSelectedStockId(stockEntry.id);
    setAdjustmentForm({
      newQuantity: stockEntry.quantity,
      reason: '',
      productName,
      currentQuantity: stockEntry.quantity
    });
    setIsAdjustDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description || '',
      costPrice: toCurrency(product.costPrice),
      retailPrice: toCurrency(product.retailPrice),
      unit: product.unit,
      isActive: product.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = (isEdit: boolean) => {
    const payload = {
      ...productForm,
      costPrice: toCents(productForm.costPrice),
      retailPrice: toCents(productForm.retailPrice)
    };

    if (isEdit && editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createProductMutation.mutate(payload as any);
    }
  };

  const filteredInventory = products.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isLoadingProducts || isLoadingStocks;
  const showDiriamba = currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-001';
  const showJinotepe = currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-002';

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario Global</h1>
          <p className="text-muted-foreground">Gestión centralizada de productos y stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          <Button onClick={() => { resetProductForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Create/Edit Form Logic */}
      {/* Shared Dialog Content function could be better but inline is faster for now */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>Ingresa los detalles del producto para el catálogo global.</DialogDescription>
          </DialogHeader>
          <ProductFormContent form={productForm} setForm={setProductForm} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleSaveProduct(false)} disabled={createProductMutation.isPending || !productForm.name || !productForm.sku}>
              {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Producto: {editingProduct?.name}</DialogTitle>
            <DialogDescription>Modifica los detalles del producto.</DialogDescription>
          </DialogHeader>
          <ProductFormContent form={productForm} setForm={setProductForm} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleSaveProduct(true)} disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock: {adjustmentForm.productName}</DialogTitle>
            <DialogDescription>
              Actualiza la cantidad física disponible. Esta acción quedará registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Stock Actual</span>
              <span className="text-lg font-bold">{adjustmentForm.currentQuantity}</span>
            </div>
            <div className="space-y-2">
              <Label>Nueva Cantidad</Label>
              <Input
                type="number"
                min="0"
                value={adjustmentForm.newQuantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, newQuantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo del Ajuste</Label>
              <Textarea
                placeholder="Ej: Conteo físico, merma, entrada manual..."
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => adjustStockMutation.mutate({
              stockId: selectedStockId!,
              newQuantity: adjustmentForm.newQuantity,
              reason: adjustmentForm.reason
            })} disabled={adjustStockMutation.isPending || !adjustmentForm.reason}>
              {adjustStockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Ajuste
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
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
                  <th className="table-header text-left py-4 px-4">Producto</th>
                  <th className="table-header text-left py-4 px-4">SKU</th>
                  <th className="table-header text-left py-4 px-4">Categoría</th>
                  {showDiriamba && <th className="table-header text-center py-4 px-4">Stock Diriamba</th>}
                  {showJinotepe && <th className="table-header text-center py-4 px-4">Stock Jinotepe</th>}
                  <th className="table-header text-center py-4 px-4">Total</th>
                  <th className="table-header text-right py-4 px-4">Precio</th>
                  <th className="table-header text-center py-4 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockDiriamba = getStockForBranch(item.id, 'BRANCH-DIR-001');
                  const stockJinotepe = getStockForBranch(item.id, 'BRANCH-DIR-002');
                  const productStocks = getProductStocks(item.id);
                  const total = productStocks.reduce((sum, s) => sum + s.quantity, 0);

                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{item.name}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground font-mono">{item.sku}</td>
                      <td className="py-4 px-4"><Badge variant="secondary">{item.category}</Badge></td>

                      {showDiriamba && (
                        <td className="py-4 px-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openAdjustDialog(item.id, item.name, 'BRANCH-DIR-001')}
                          title="Clic para ajustar stock Diriamba"
                        >
                          <span className={cn('font-semibold', stockDiriamba < 10 ? 'text-destructive' : 'text-foreground')}>
                            {stockDiriamba}
                          </span>
                        </td>
                      )}

                      {showJinotepe && (
                        <td className="py-4 px-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openAdjustDialog(item.id, item.name, 'BRANCH-DIR-002')}
                          title="Clic para ajustar stock Jinotepe"
                        >
                          <span className={cn('font-semibold', stockJinotepe < 10 ? 'text-destructive' : 'text-foreground')}>
                            {stockJinotepe}
                          </span>
                        </td>
                      )}

                      <td className="py-4 px-4 text-center font-bold">{total}</td>
                      <td className="py-4 px-4 text-right font-medium">{formatCurrency(item.retailPrice)}</td>
                      <td className="py-4 px-4 text-center flex justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openAdjustDialog(item.id, item.name, currentBranchId === 'ALL' ? 'BRANCH-DIR-001' : currentBranchId)}>
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredInventory.length} de {products.length} productos</span>
      </div>
    </DashboardLayout>
  );
}

// Subcomponent for form fields to avoid duplication
function ProductFormContent({ form, setForm }: { form: any, setForm: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="space-y-2 col-span-2">
        <Label>Nombre del Producto</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Fertilizante Triple 15" />
      </div>
      <div className="space-y-2">
        <Label>SKU / Código</Label>
        <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="FERT-001" />
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FERTILIZANTES">Fertilizantes</SelectItem>
            <SelectItem value="HERBICIDAS">Herbicidas</SelectItem>
            <SelectItem value="FUNGICIDAS">Fungicidas</SelectItem>
            <SelectItem value="HERRAMIENTAS">Herramientas</SelectItem>
            <SelectItem value="VETERINARIA">Veterinaria</SelectItem>
            <SelectItem value="OTROS">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Precio Costo (C$)</Label>
        <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Precio Venta (C$)</Label>
        <Input type="number" step="0.01" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Descripción</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
  );
}
