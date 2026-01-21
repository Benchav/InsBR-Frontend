import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, User, Trash2, Percent, Receipt, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '@/api/products.api';
import { salesApi } from '@/api/sales.api';
import { customersApi } from '@/api/customers.api';
import { stockApi, Stock } from '@/api/stock.api';
import { formatCurrency, toCents } from '@/utils/formatters';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

const categories = ['Todos', 'Fertilizantes', 'Semillas', 'Herbicidas', 'Fungicidas', 'Veterinaria', 'Otros'];

export default function Ventas() {
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const queryClient = useQueryClient();

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ isActive: true }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  });

  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: stockApi.getMyBranchStock,
  });

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [creditNotes, setCreditNotes] = useState('');

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.retailPrice,
        quantity: 1,
        sku: product.sku
      }];
    });
  };

  const setQuantity = (id: string, quantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (!existing && safeQuantity > 0) {
        return prev;
      }
      return prev
        .map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item))
        .filter((item) => item.quantity > 0);
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;
  const amountPaidValue = Number(amountPaid);
  const amountPaidCents = Number.isFinite(amountPaidValue) ? toCents(amountPaidValue) : 0;
  const changeDue = Math.max(amountPaidCents - total, 0);
  const isCashInsufficient = paymentMethod === 'CASH' && amountPaidCents < total;

  // Checkout Logic
  const handleCheckout = () => {
    if (currentBranchId === 'ALL') {
      toast.error('Selecciona una sucursal específica para realizar ventas');
      return;
    }
    setAmountPaid('');
    setIsCheckoutOpen(true);
  };

  const createSaleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      toast.success('Venta registrada exitosamente', {
        description: `Total: ${formatCurrency(total)}`
      });
      clearCart();
      setIsCheckoutOpen(false);
      setCustomerName('');
      setSelectedCustomerId('');
      setAmountPaid('');
      setPaymentMethod('CASH');
      setDeliveryDate('');
      setCreditNotes('');
      queryClient.invalidateQueries({ queryKey: ['stocks'] }); // Update stock
      queryClient.invalidateQueries({ queryKey: ['sales'] }); // Update dashboard if needed
    },
    onError: (error) => {
      console.error('Sale error:', error);
      toast.error('Error al procesar la venta');
    }
  });

  const handleConfirmSale = () => {
    if (currentBranchId === 'ALL') return;

    if (paymentMethod === 'CASH' && amountPaidCents < total) {
      toast.error('Monto recibido insuficiente', {
        description: 'El efectivo ingresado debe cubrir el total a pagar.'
      });
      return;
    }

    if (paymentMethod === 'CREDIT' && !selectedCustomerId && !customerName.trim()) {
      toast.error('Seleccione o ingrese un cliente para crédito');
      return;
    }

    const discountFactor = 1 - discount / 100;

    createSaleMutation.mutate({
      branchId: currentBranchId,
      items: cart.map(item => {
        const discountedUnitPrice = Math.round(item.price * discountFactor);
        return {
          productId: item.id,
          quantity: item.quantity,
          unitPrice: discountedUnitPrice
        };
      }),
      type: paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomerId ? undefined : (customerName.trim() || undefined),
      deliveryDate: paymentMethod === 'CREDIT' && deliveryDate ? deliveryDate : undefined,
      notes: paymentMethod === 'CREDIT' && creditNotes.trim() ? creditNotes.trim() : undefined,
    });
  };

  // Combining Data
  const getProductStock = (productId: string, branchId: string) => {
    const productStocks = stocks.filter(s => s.productId === productId);
    if (branchId === 'ALL') {
      // Sum all stocks if necessary, or just return 0 to force selection
      return productStocks.reduce((acc, curr) => acc + curr.quantity, 0);
    }
    const stockEntry = productStocks.find(s => s.branchId === branchId);
    return stockEntry ? stockEntry.quantity : 0;
  };

  const getSpecificBranchStock = (productId: string, specificBranchId: string) => {
    const stockEntry = stocks.find(s => s.productId === productId && s.branchId === specificBranchId);
    return stockEntry ? stockEntry.quantity : 0;
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

    // Branch Filter logic
    let hasStock = true;
    if (currentBranchId !== 'ALL') {
      const stock = getProductStock(p.id, currentBranchId);
      hasStock = stock > 0;
    }

    return matchesSearch && matchesCategory && hasStock;
  });

  const isLoading = isLoadingProducts || isLoadingStocks;

  // Assuming fixed branch IDs based on store mapping
  // but ideally should be dynamic. The store hardcodes them.

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-7rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Punto de Venta</h1>
              <p className="text-sm text-muted-foreground">
                Vendiendo desde: <span className="font-medium text-primary">{currentBranch.name}</span>
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border">
                    <th className="table-header text-left py-3 px-2">Producto</th>
                    <th className="table-header text-center py-3 px-2">
                      {currentBranchId === 'ALL' ? 'Stock Diriamba' : 'Stock'}
                    </th>
                    {currentBranchId === 'ALL' && (
                      <th className="table-header text-center py-3 px-2">Stock Jinotepe</th>
                    )}
                    <th className="table-header text-right py-3 px-2">Precio Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const cartItem = cart.find((item) => item.id === product.id);
                    const stock = getProductStock(product.id, currentBranchId);

                    // Specific stocks for columns
                    const stockDiriamba = getSpecificBranchStock(product.id, 'BRANCH-DIR-001');
                    const stockJinotepe = getSpecificBranchStock(product.id, 'BRANCH-DIR-002');

                    const displayStock = currentBranchId === 'ALL' ? stockDiriamba : stock;
                    const isLowStock = displayStock < 10;

                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'border-b border-border/50 cursor-pointer transition-colors',
                          'hover:bg-primary/5 hover:ring-1 hover:ring-primary/30',
                          cartItem && 'bg-primary/5'
                        )}
                        onClick={() => addToCart(product)}
                        aria-selected={!!cartItem}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-sm font-medium',
                            displayStock < 10 ? 'text-destructive' : 'text-success'
                          )}>
                            {displayStock}
                          </span>
                        </td>
                        {currentBranchId === 'ALL' && (
                          <td className="py-3 px-2 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-sm font-medium',
                              stockJinotepe < 10 ? 'text-destructive' : 'text-success'
                            )}>
                              {stockJinotepe}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(product.retailPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 flex flex-col">
          <Card className="flex-1 flex flex-col p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Resumen del Pedido
            </h2>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto space-y-3 mb-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Agrega productos para comenzar
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)} c/u
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <span className="text-sm">-</span>
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            if (!Number.isFinite(nextValue)) return;
                            setQuantity(item.id, nextValue);
                          }}
                          onFocus={(event) => event.target.select()}
                          className="h-7 w-16 text-center px-2"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <span className="text-sm">+</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setQuantity(item.id, 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2 mb-4">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Descuento:</span>
              <div className="flex gap-1">
                {[0, 5, 10, 15].map((d) => (
                  <Button
                    key={d}
                    variant={discount === d ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setDiscount(d)}
                  >
                    {d}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Descuento ({discount}%)</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <Button
                className="w-full h-12"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Finalizar Venta
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={cart.length === 0}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Cotizar
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={cart.length === 0}
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
            <DialogDescription>
              Revisa los detalles y confirma la venta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sale Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Descuento ({discount}%)</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total a Pagar</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Método de pago</span>
                <Badge variant="secondary">{paymentMethod === 'CASH' ? 'Efectivo' : 'Crédito'}</Badge>
              </div>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {/* Use a simple Select for now since Shadcn Select is available */}
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    if (value) setCustomerName('');
                  }}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Seleccionar Cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Nombre del cliente (si no está registrado)"
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  if (event.target.value) setSelectedCustomerId('');
                }}
                className="mt-2"
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Tipo de Venta</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Contado
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'CREDIT' ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => setPaymentMethod('CREDIT')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Crédito
                </Button>
              </div>
            </div>

            {paymentMethod === 'CREDIT' && (
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Fecha de entrega (opcional)</Label>
                  <Input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notas del encargo (opcional)</Label>
                  <Input value={creditNotes} onChange={(event) => setCreditNotes(event.target.value)} placeholder="Ej: Evento, pedido especial" />
                </div>
              </div>
            )}

            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <Label>Monto recibido</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vuelto</span>
                  <span className="font-semibold">{formatCurrency(changeDue)}</span>
                </div>
                {amountPaid.trim() !== '' && isCashInsufficient && (
                  <p className="text-xs text-destructive">El monto ingresado no cubre el total.</p>
                )}
              </div>
            )}

            {createSaleMutation.isError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">Hubo un error al procesar la venta. Intente de nuevo.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={createSaleMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSale} disabled={createSaleMutation.isPending || isCashInsufficient}>
              {createSaleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
