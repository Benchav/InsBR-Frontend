import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Trash2, Percent, Receipt, DollarSign } from 'lucide-react';
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

const mockProducts = [
  { id: '1', name: 'Urea Granulada 46%', sku: 'FER-001-50KG', price: 850, stockDiriamba: 1250, stockJinotepe: 45, category: 'Fertilizantes' },
  { id: '2', name: 'Semilla Maíz Híbrido DK-4050', sku: 'SEM-MAZ-DKA', price: 3200, stockDiriamba: 300, stockJinotepe: 0, category: 'Semillas' },
  { id: '3', name: 'Fungicida Preventivo', sku: 'FUN-PREV-1L', price: 450, stockDiriamba: 5, stockJinotepe: 50, category: 'Fungicidas' },
  { id: '4', name: 'Herbicida Glifosato', sku: 'HER-GLI-5L', price: 1200, stockDiriamba: 180, stockJinotepe: 95, category: 'Herbicidas' },
];

const categories = ['Todos', 'Fertilizantes', 'Semillas', 'Herbicidas', 'Fungicidas'];

export default function Ventas() {
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku }];
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

  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  const [customerName, setCustomerName] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.15;
  const total = taxableAmount + tax;

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const handleCheckout = () => {
    if (currentBranchId === 'all') {
      toast.error('Selecciona una sucursal específica para realizar ventas');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleConfirmSale = () => {
    toast.success('Venta registrada exitosamente', {
      description: `Total: C$ ${total.toLocaleString()}`
    });
    clearCart();
    setIsCheckoutOpen(false);
    setCustomerName('');
  };

  const filteredProducts = mockProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockForBranch = (product: typeof mockProducts[0]) => {
    if (currentBranchId === 'diriamba') return product.stockDiriamba;
    if (currentBranchId === 'jinotepe') return product.stockJinotepe;
    return product.stockDiriamba + product.stockJinotepe;
  };

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
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="table-header text-left py-3 px-2">Producto</th>
                  <th className="table-header text-center py-3 px-2">
                    {currentBranchId === 'all' ? 'Stock Diriamba' : 'Stock'}
                  </th>
                  {currentBranchId === 'all' && (
                    <th className="table-header text-center py-3 px-2">Stock Jinotepe</th>
                  )}
                  <th className="table-header text-right py-3 px-2">Precio Unit.</th>
                  <th className="table-header text-center py-3 px-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  const stock = getStockForBranch(product);
                  const isLowStock = stock < 10;

                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
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
                          product.stockDiriamba < 10 ? 'text-destructive' : 'text-success'
                        )}>
                          {currentBranchId === 'all' ? product.stockDiriamba : stock}
                        </span>
                      </td>
                      {currentBranchId === 'all' && (
                        <td className="py-3 px-2 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-sm font-medium',
                            product.stockJinotepe < 10 ? 'text-destructive' : 'text-success'
                          )}>
                            {product.stockJinotepe}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-2 text-right font-medium">
                        C$ {product.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, -1)}
                            disabled={!cartItem}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {cartItem?.quantity || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x C$ {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-sm ml-2">
                      C$ {(item.quantity * item.price).toLocaleString()}
                    </p>
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
                <span>C$ {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Descuento ({discount}%)</span>
                  <span>- C$ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (15%)</span>
                <span>C$ {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className="text-primary">C$ {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <Button 
                className="w-full h-12" 
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <CreditCard className="mr-2 h-5 w-5" />
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
              Revisa los detalles y selecciona el método de pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sale Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>C$ {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Descuento ({discount}%)</span>
                  <span>- C$ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>IVA (15%)</span>
                <span>C$ {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total a Pagar</span>
                <span className="text-primary">C$ {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Nombre del cliente o búsqueda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de Pago</Label>
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
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  Se creará una cuenta por cobrar para este cliente.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSale}>
              Confirmar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
