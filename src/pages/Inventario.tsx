import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Plus, Loader2, Edit, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '@/api/products.api';
import { stockApi } from '@/api/stock.api';
import { toCurrency, toCents, formatCurrency } from '@/utils/formatters';
import { useCategories } from '@/hooks/useCategories';
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
  const { can } = usePermissions();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
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
    addQuantity: 0,
    reason: '',
    productName: '',
    currentQuantity: 0
  });
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    description: '',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    unit: 'UNIDAD',
    isActive: true
  });

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery({
    queryKey: ['stocks', branchId],
    queryFn: () => stockApi.getMyBranchStock(branchId ? { branchId } : undefined),
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
      const errorData = (error as any).response?.data;
      const errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData) || 'Error al crear producto';
      toast.error(`Error al crear producto: ${errorMessage}`);
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
      categoryId: '',
      description: '',
      costPrice: 0,
      retailPrice: 0,
      wholesalePrice: 0,
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
      addQuantity: 0,
      reason: '',
      productName,
      currentQuantity: stockEntry.quantity
    });
    setAdjustMode('add');
    setIsAdjustDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || '',
      description: product.description || '',
      costPrice: toCurrency(product.costPrice),
      retailPrice: toCurrency(product.retailPrice),
      wholesalePrice: toCurrency(product.wholesalePrice || 0),
      unit: product.unit,
      isActive: product.isActive
    });
    setIsEditDialogOpen(true);
  };

  const { data: categories = [] } = useCategories();

  const handleSaveProduct = (isEdit: boolean) => {
    if (productForm.wholesalePrice < productForm.costPrice) {
      toast.error('El precio mayorista no puede ser menor al precio de costo');
      return;
    }

    const selectedCategory = categories.find(c => c.id === productForm.categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';

    const payload = {
      ...productForm,
      category: categoryName,
      costPrice: toCents(productForm.costPrice),
      retailPrice: toCents(productForm.retailPrice),
      wholesalePrice: toCents(productForm.wholesalePrice)
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
  const showJinotepe = currentBranchId === 'ALL' || currentBranchId === 'BRANCH-JIN-001';

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

          {can(Permission.MANAGE_PRODUCTS) && (
            <Button onClick={() => { resetProductForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* Create/Edit Form Logic */}
      {/* Shared Dialog Content function could be better but inline is faster for now */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>Ingresa los detalles del insumo pastelero para el catálogo global.</DialogDescription>
          </DialogHeader>
          <ProductFormContent form={productForm} setForm={setProductForm} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleSaveProduct(false)} disabled={createProductMutation.isPending || !productForm.name || !productForm.sku || !productForm.categoryId}>
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
      {/* Mobile: filtros apilados */}
      <div className="flex flex-col gap-2 sm:hidden mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Button variant="outline" className="w-full">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>
      {/* Desktop: filtros en línea */}
      <div className="hidden sm:flex gap-3 mb-6">
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
            <DialogTitle>{adjustMode === 'add' ? 'Agregar Stock' : 'Editar Stock'}: {adjustmentForm.productName}</DialogTitle>
            <DialogDescription>
              {adjustMode === 'add'
                ? 'Suma inventario al stock actual. Esta acción quedará registrada.'
                : 'Define el stock correcto si hubo un error. Esta acción quedará registrada.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="inline-flex w-full rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setAdjustMode('add')}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  adjustMode === 'add'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setAdjustMode('set')}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  adjustMode === 'set'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Editar
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Stock Actual</span>
              <span className="text-lg font-bold">{adjustmentForm.currentQuantity}</span>
            </div>
            <div className="space-y-2">
              <Label>{adjustMode === 'add' ? 'Cantidad a Agregar' : 'Cantidad Correcta'}</Label>
              <Input
                type="number"
                min="0"
                value={adjustMode === 'add' ? adjustmentForm.addQuantity : adjustmentForm.newQuantity}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  if (adjustMode === 'add') {
                    setAdjustmentForm({
                      ...adjustmentForm,
                      addQuantity: value,
                      newQuantity: adjustmentForm.currentQuantity + value,
                    });
                  } else {
                    setAdjustmentForm({
                      ...adjustmentForm,
                      newQuantity: value,
                      addQuantity: Math.max(0, value - adjustmentForm.currentQuantity),
                    });
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">Stock Resultante</span>
              <span className="text-lg font-bold text-primary">{adjustmentForm.newQuantity}</span>
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
            })} disabled={
              adjustStockMutation.isPending ||
              !adjustmentForm.reason ||
              (adjustMode === 'add' ? adjustmentForm.addQuantity <= 0 : false)
            }>
              {adjustStockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {adjustMode === 'add' ? 'Confirmar Agregado' : 'Confirmar Edición'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Responsive Inventory List */}
      <div className="kpi-card overflow-hidden p-0">
        {/* Mobile: Cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">
              No hay productos registrados
            </div>
          ) : (
            filteredInventory.map((item) => {
              const stockDiriamba = getStockForBranch(item.id, 'BRANCH-DIR-001');
              const stockJinotepe = getStockForBranch(item.id, 'BRANCH-JIN-001');
              const productStocks = getProductStocks(item.id);
              const total = productStocks.reduce((sum, s) => sum + s.quantity, 0);
              return (
                <div key={item.id} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-semibold text-primary">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-base text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground truncate font-mono">{item.sku}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto">{item.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>Precio: <span className="font-medium text-foreground">{formatCurrency(item.retailPrice)}</span></span>
                    <span className="ml-auto">Total: <span className="font-bold text-foreground">{total}</span></span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {showDiriamba && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('flex-1', stockDiriamba < 10 ? 'border-destructive text-destructive' : '')}
                        onClick={() => can(Permission.ADJUST_STOCK) && openAdjustDialog(item.id, item.name, 'BRANCH-DIR-001')}
                        disabled={!can(Permission.ADJUST_STOCK)}
                        title="Ajustar stock Diriamba"
                      >
                        Diriamba: <span className="font-bold ml-1">{stockDiriamba}</span>
                      </Button>
                    )}
                    {showJinotepe && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('flex-1', stockJinotepe < 10 ? 'border-destructive text-destructive' : '')}
                        onClick={() => can(Permission.ADJUST_STOCK) && openAdjustDialog(item.id, item.name, 'BRANCH-JIN-001')}
                        disabled={!can(Permission.ADJUST_STOCK)}
                        title="Ajustar stock Jinotepe"
                      >
                        Jinotepe: <span className="font-bold ml-1">{stockJinotepe}</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {can(Permission.MANAGE_PRODUCTS) && (
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4 mr-1" />Editar
                      </Button>
                    )}
                    {can(Permission.ADJUST_STOCK) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openAdjustDialog(item.id, item.name, currentBranchId === 'ALL' ? 'BRANCH-DIR-001' : currentBranchId)}
                        title="Agregar stock manual"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />Stock
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
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
                  const stockJinotepe = getStockForBranch(item.id, 'BRANCH-JIN-001');
                  const productStocks = getProductStocks(item.id);
                  const total = productStocks.reduce((sum, s) => sum + s.quantity, 0);

                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{item.name}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground font-mono">{item.sku}</td>
                      <td className="py-4 px-4"><Badge variant="secondary">{item.category}</Badge></td>

                      {showDiriamba && (
                        <td className="py-4 px-4 text-center transition-colors"
                          onClick={() => can(Permission.ADJUST_STOCK) && openAdjustDialog(item.id, item.name, 'BRANCH-DIR-001')}
                          style={{ cursor: can(Permission.ADJUST_STOCK) ? 'pointer' : 'default' }}
                          title={can(Permission.ADJUST_STOCK) ? "Clic para ajustar stock Diriamba" : "Stock Diriamba"}
                        >
                          <span className={cn('font-semibold', stockDiriamba < 10 ? 'text-destructive' : 'text-foreground')}>
                            {stockDiriamba}
                          </span>
                        </td>
                      )}

                      {showJinotepe && (
                        <td className="py-4 px-4 text-center transition-colors"
                          onClick={() => can(Permission.ADJUST_STOCK) && openAdjustDialog(item.id, item.name, 'BRANCH-JIN-001')}
                          style={{ cursor: can(Permission.ADJUST_STOCK) ? 'pointer' : 'default' }}
                          title={can(Permission.ADJUST_STOCK) ? "Clic para ajustar stock Jinotepe" : "Stock Jinotepe"}
                        >
                          <span className={cn('font-semibold', stockJinotepe < 10 ? 'text-destructive' : 'text-foreground')}>
                            {stockJinotepe}
                          </span>
                        </td>
                      )}

                      <td className="py-4 px-4 text-center font-bold">{total}</td>
                      <td className="py-4 px-4 text-right font-medium">{formatCurrency(item.retailPrice)}</td>
                      <td className="py-4 px-4 text-center flex justify-center gap-1">
                        {can(Permission.MANAGE_PRODUCTS) && (
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {can(Permission.ADJUST_STOCK) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustDialog(item.id, item.name, currentBranchId === 'ALL' ? 'BRANCH-DIR-001' : currentBranchId)}
                            title="Agregar stock manual"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        )}
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
  const { data: categories = [], isLoading } = useCategories();
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="space-y-2 col-span-2">
        <Label>Nombre del Producto</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Harina de Trigo 0000" />
      </div>
      <div className="space-y-2">
        <Label>SKU / Código</Label>
        <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="HAR-001" />
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={form.categoryId} onValueChange={(val) => setForm({ ...form, categoryId: val })}>
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccionar...'} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Precio Costo (C$)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.costPrice || ''}
          onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>Precio Venta (C$)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.retailPrice || ''}
          onChange={(e) => setForm({ ...form, retailPrice: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>Precio Mayorista (C$)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.wholesalePrice || ''}
          onChange={(e) => setForm({ ...form, wholesalePrice: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Descripción</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej. Harina de trigo refinada especial para repostería. Saco de 50kg." />
      </div>
    </div>
  );
}
