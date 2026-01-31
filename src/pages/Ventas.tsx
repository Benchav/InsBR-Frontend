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
import { CategoryService } from '@/services/categoryService';
import { UnitConversion } from '@/types/units.types';
import { UnitSelector } from '@/components/units/UnitSelector';
import { ConversionCalculator } from '@/components/units/ConversionCalculator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  // Unit Fields
  unitId?: string;
  unitName?: string;
  unitSymbol?: string;
}

export default function Ventas() {
  const { currentBranchId, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const branchId = currentBranchId;
  const queryClient = useQueryClient();

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ isActive: true }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', branchId],
    queryFn: () => customersApi.getAll(branchId ? { branchId } : undefined),
  });

  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery({
    queryKey: ['stocks', branchId],
    queryFn: () => stockApi.getMyBranchStock(branchId ? { branchId } : undefined),
  });

  const { data: categoriesData = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: CategoryService.getAll,
  });

  const categories = ['Todos', ...categoriesData.filter(c => c.isActive).map(c => c.name)];

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [discount, setDiscount] = useState(0);


  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH');
  const [salesType, setSalesType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL'); // New State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [creditNotes, setCreditNotes] = useState('');

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart((prev) => {
      // Find exact match (same product AND same unit)
      // Since units are added *after* adding to cart in this flow, initially we look for product with no unit
      // BUT if we want to support multiple units of same product, checking only by ID is tricky if we don't have unit yet.
      // Strategy: Add as base product (no unit). User then selects unit.
      // If user adds same product again, we increment the one with "no unit" or just list it again?
      // Simplification: Check for existing item with SAME unitId (which acts as undefined initially)

      const existing = prev.find((item) => item.id === product.id && item.unitId === undefined);

      if (existing) {
        return prev.map((item) =>
          (item.id === product.id && item.unitId === undefined) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: salesType === 'RETAIL' ? product.retailPrice : product.wholesalePrice, // Initial price based on sales type
        quantity: 1,
        sku: product.sku,
        unitId: undefined
      }];
    });
  };

  const updateItemUnit = (index: number, unit: UnitConversion | null) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];

      if (unit) {
        // Determine price: Unit specific price OR calculated from conversion factor?
        // The API returns retailPrice/wholesalePrice directly on the unit object if set.
        const newPrice = salesType === 'RETAIL'
          ? (unit.retailPrice ?? item.price) // Fallback to current if missing (should not happen if configured right) or maybe we need a fetch
          : (unit.wholesalePrice ?? item.price);

        newCart[index] = {
          ...item,
          unitId: unit.id,
          unitName: unit.unitName,
          unitSymbol: unit.unitSymbol,
          price: newPrice
        };
      } else {
        // Revert to product base price
        const originalProduct = products.find(p => p.id === item.id);
        if (originalProduct) {
          newCart[index] = {
            ...item,
            unitId: undefined,
            unitName: undefined,
            unitSymbol: undefined,
            price: salesType === 'RETAIL' ? originalProduct.retailPrice : originalProduct.wholesalePrice
          };
        }
      }
      return newCart;
    });
  };

  const setQuantity = (index: number, quantity: number) => {
    const safeQuantity = Math.max(0, quantity); // Allow decimals
    setCart((prev) => {
      const newCart = [...prev];
      if (safeQuantity <= 0) {
        // Remove item
        return newCart.filter((_, i) => i !== index);
      }
      newCart[index] = { ...newCart[index], quantity: safeQuantity };
      return newCart;
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      const newQty = Math.max(0, newCart[index].quantity + delta);
      if (newQty === 0) return newCart.filter((_, i) => i !== index);
      newCart[index].quantity = newQty;
      return newCart;
    });
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

  const createSaleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      toast.success('Venta registrada exitosamente', {
        description: `Total: ${formatCurrency(total)} | Vuelto: ${formatCurrency(changeDue)}`
      });
      clearCart();
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
      const errorData = (error as any).response?.data;
      const errorMessage = errorData?.error || errorData?.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) || 'Error al procesar la venta';
      toast.error(`Error: ${errorMessage}`);
    }
  });

  const handleConfirmSale = () => {
    if (cart.length === 0) return;

    if (currentBranchId !== 'BRANCH-JIN-001' && currentBranchId !== 'BRANCH-DIR-001') {
      toast.error('Debe seleccionar una sucursal válida (Jinotepe o Diriamba) antes de registrar la venta');
      return;
    }
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
          unitPrice: discountedUnitPrice,
          unitId: item.unitId,
          unitName: item.unitName,
          unitSymbol: item.unitSymbol
        };
      }),
      type: paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomerId ? undefined : (customerName.trim() || undefined),
      deliveryDate: paymentMethod === 'CREDIT' && deliveryDate ? deliveryDate : undefined,
      notes: paymentMethod === 'CREDIT' && creditNotes.trim() ? creditNotes.trim() : undefined,
    });
  }

  // Combining Data
  const getProductStock = (productId: string, branchId: string) => {
    const productStocks = stocks.filter(s => s.productId === productId);
    const stockEntry = productStocks.find(s => s.branchId === branchId);
    return stockEntry ? stockEntry.quantity : 0;
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

    // Branch Filter logic
    let hasStock = true;
    if (currentBranchId === 'BRANCH-JIN-001' || currentBranchId === 'BRANCH-DIR-001') {
      const stock = getProductStock(p.id, currentBranchId);
      hasStock = stock > 0;
    }

    return matchesSearch && matchesCategory && hasStock;
  });

  const isLoading = isLoadingProducts || isLoadingStocks || isLoadingCategories;

  return (
    <DashboardLayout>

      <div className="flex flex-col gap-6 lg:flex-row lg:h-[calc(100vh-7rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Punto de Venta</h1>
              <p className="text-sm text-muted-foreground">
                Vendiendo desde: <span className="font-medium text-primary">{currentBranch.name}</span>
              </p>
            </div>
            {/* Sales Type Toggle */}
            <div className="flex rounded-md shadow-sm border border-input">
              <Button
                variant={salesType === 'RETAIL' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none h-8"
                onClick={() => setSalesType('RETAIL')}
              >
                Menudeo
              </Button>
              <div className="w-px bg-border"></div>
              <Button
                variant={salesType === 'WHOLESALE' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none h-8"
                onClick={() => setSalesType('WHOLESALE')}
              >
                Mayoreo
              </Button>
            </div>
          </div>

          {/* Search and Filters Responsive */}
          {/* Mobile: filtro apilado */}
          <div className="flex flex-col gap-2 sm:hidden mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          {/* Desktop: filtro en línea */}
          <div className="hidden sm:flex flex-col gap-3 mb-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto SKU o Nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 pb-2">
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

          {/* Product List Responsive */}
          <div className="flex-1 overflow-auto bg-card rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Search className="h-10 w-10 opacity-20" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
                {/* Modern Card Grid Layout instead of Table for better touch/visual */}
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  const stock = getProductStock(product.id, currentBranchId);
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer",
                        cartItem && "border-primary bg-primary/5"
                      )}
                      onClick={() => addToCart(product)}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="text-[10px] px-1 h-5">{product.category}</Badge>
                          <span className={cn("text-[10px] font-medium", stock < 10 ? 'text-destructive' : 'text-muted-foreground')}>
                            Stock: {stock}
                          </span>
                        </div>
                        <h3 className="font-medium leading-none text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div className="font-bold text-lg text-primary">
                          {salesType === 'RETAIL'
                            ? formatCurrency(product.retailPrice)
                            : formatCurrency(product.wholesalePrice)}
                        </div>
                        <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section (Sidebar) */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col rounded-xl shadow-xl border-0 ring-1 ring-muted/20 overflow-hidden h-[calc(100vh-7rem)]">
            {/* Cart Header */}
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orden Actual
                <Badge variant="secondary" className="ml-auto">
                  {cart.length} ítems
                </Badge>
              </h2>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-auto p-2 space-y-2 bg-muted/10">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 opacity-50">
                  <ShoppingCart className="h-16 w-16" />
                  <p className="text-sm">Carrito vacío</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="group flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm relative">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                      </div>
                      <p className="font-bold text-sm">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1">
                        <UnitSelector
                          productId={item.id}
                          salesType={salesType}
                          selectedUnitId={item.unitId}
                          onUnitChange={(unit) => updateItemUnit(index, unit)}
                        />
                      </div>
                      {item.unitId && (
                        <ConversionCalculator
                          productId={item.id}
                          fromUnitId={item.unitId}
                          quantity={item.quantity}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-r-none" onClick={() => updateQuantity(index, -1)}>-</Button>
                        <Input
                          className="h-7 w-12 border-0 text-center p-0 focus-visible:ring-0"
                          value={item.quantity}
                          onChange={(e) => setQuantity(index, Number(e.target.value))}
                          type="number"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-l-none" onClick={() => updateQuantity(index, 1)}>+</Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setQuantity(index, 0)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form & Totals (Fixed Bottom) */}
            <div className="border-t bg-card p-4 space-y-3 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
              {/* 1. Customer & Payment Mode Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Payment Method Toggle */}
                <div className="flex bg-muted rounded-md p-1">
                  <button
                    className={cn("flex-1 text-xs font-medium rounded-sm py-1 transition-all", paymentMethod === 'CASH' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground')}
                    onClick={() => setPaymentMethod('CASH')}
                  >
                    Contado
                  </button>
                  <button
                    className={cn("flex-1 text-xs font-medium rounded-sm py-1 transition-all", paymentMethod === 'CREDIT' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground')}
                    onClick={() => setPaymentMethod('CREDIT')}
                  >
                    Crédito
                  </button>
                </div>

                {/* Customer Select */}
                <div className="relative">
                  <Select
                    value={selectedCustomerId || "_general_"}
                    onValueChange={(value) => {
                      const finalValue = value === "_general_" ? "" : value;
                      setSelectedCustomerId(finalValue);
                      if (finalValue) setCustomerName('');
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <User className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_general_">-- General --</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 2. Dynamic Input (Cash vs Credit) */}
              {paymentMethod === 'CASH' ? (
                <div className="flex gap-2 items-center bg-muted/50 p-2 rounded-md">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Monto Recibido"
                    className="h-8 text-sm bg-background border-muted-foreground/20"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    type="number"
                  />
                  <div className="text-right min-w-[3rem]">
                    <p className="text-[10px] text-muted-foreground">Vuelto</p>
                    <p className={cn("text-sm font-bold", changeDue < 0 ? 'text-destructive' : 'text-success')}>
                      {formatCurrency(changeDue)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-muted/50 p-2 rounded-md">
                  <Input
                    placeholder="Nombre Cliente (si no registrado)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (e.target.value) setSelectedCustomerId('');
                    }}
                    className="h-8 text-xs bg-background mb-1"
                    disabled={!!selectedCustomerId}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      className="h-7 text-xs flex-1 bg-background"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                    <Input
                      placeholder="Notas..."
                      className="h-7 text-xs flex-1 bg-background"
                      value={creditNotes}
                      onChange={(e) => setCreditNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 3. Totals */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total a Pagar</span>
                  <div className="flex items-center gap-2">
                    {/* Discount Buttons */}
                    {[0, 5, 10].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDiscount(d)}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded border transition-colors", discount === d ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-muted")}
                      >
                        {d}%
                      </button>
                    ))}
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Main Action */}
              <Button
                className="w-full h-12 text-lg font-bold shadow-md active:scale-[0.99] transition-transform"
                size="lg"
                disabled={cart.length === 0 || createSaleMutation.isPending || (paymentMethod === 'CASH' && amountPaidCents < total && amountPaid !== '')}
                onClick={handleConfirmSale}
              >
                {createSaleMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Receipt className="mr-2 h-5 w-5" />}
                {paymentMethod === 'CASH' ? 'COBRAR' : 'REGISTRAR CRÉDITO'}
              </Button>

              <div className="flex justify-center">
                <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground text-xs" onClick={clearCart}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Cancelar venta
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
