import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditsApi, CreditAccount, CreditTicket } from '@/api/credits.api';
import { apiClient } from '@/api/client';
import { formatCurrency, formatDate, formatDateTime, toCents } from '@/utils/formatters';
import { useBranchStore } from '@/stores/branchStore';
import { Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function CuentasPorPagar() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO'>('all');
  const [selectedCredit, setSelectedCredit] = useState<CreditAccount | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CHECK'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const queryClient = useQueryClient();

  const statusFilterMap: Record<'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO', 'PENDING' | 'PARTIAL' | 'PAID'> = {
    PENDIENTE: 'PENDING',
    PAGADO_PARCIAL: 'PARTIAL',
    PAGADO: 'PAID',
  };

  const getStatusLabel = (status: CreditAccount['status']) => {
    const normalized = status === 'PENDING' ? 'PENDIENTE'
      : status === 'PARTIAL' ? 'PAGADO_PARCIAL'
      : status === 'PAID' ? 'PAGADO'
      : status;

    if (normalized === 'PAGADO') {
      return { label: 'Pagado', variant: 'secondary' as const };
    }
    if (normalized === 'PAGADO_PARCIAL') {
      return { label: 'Parcial', variant: 'default' as const };
    }
    return { label: 'Pendiente', variant: 'destructive' as const };
  };

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credits-cpp', branchId, statusFilter],
    queryFn: () => creditsApi.getAll({
      type: 'CPP',
      branchId,
      status: statusFilter === 'all' ? undefined : statusFilterMap[statusFilter],
    }),
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['credits-cpp-history', selectedCredit?.id],
    queryFn: () => (selectedCredit ? creditsApi.getPaymentHistory(selectedCredit.id) : Promise.resolve([])),
    enabled: !!selectedCredit && isHistoryOpen,
  });

  const { data: ticketData, isLoading: isTicketLoading } = useQuery<CreditTicket | null>({
    queryKey: ['credits-cpp-ticket', selectedCredit?.id],
    queryFn: () => (selectedCredit ? creditsApi.getTicket(selectedCredit.id) : Promise.resolve(null)),
    enabled: !!selectedCredit && isTicketOpen,
  });

  const registerPaymentMutation = useMutation({
    mutationFn: creditsApi.registerPayment,
    onSuccess: () => {
      toast.success('Abono registrado');
      setIsPaymentOpen(false);
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setPaymentReference('');
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['credits-cpp'] });
    },
    onError: (err) => {
      const error = err as any;
      if (error?.response?.status === 400) {
        toast.error('No se pudo registrar el abono: monto inválido o cuenta ya pagada');
        return;
      }
      toast.error('No se pudo registrar el abono');
    },
  });

  const filteredCredits = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return credits.filter((credit) => {
      const supplier = (credit.supplierName || credit.supplierId || '').toLowerCase();
      const invoice = credit.invoiceNumber?.toLowerCase() || '';
      return credit.id.toLowerCase().includes(term) || supplier.includes(term) || invoice.includes(term);
    });
  }, [credits, searchTerm]);

  const handleOpenPayment = (credit: CreditAccount) => {
    setSelectedCredit(credit);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
    setIsPaymentOpen(true);
  };

  const handleOpenHistory = (credit: CreditAccount) => {
    setSelectedCredit(credit);
    setIsHistoryOpen(true);
  };

  const handleOpenTicket = (credit: CreditAccount) => {
    setSelectedCredit(credit);
    setIsTicketOpen(true);
  };

  const handlePrintTicket = async (creditId: string) => {
    try {
      const response = await apiClient.get(`/api/credits/${creditId}/ticket/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error: any) {
      let message = 'No se pudo generar el PDF';
      if (error?.response) {
        message += ` (Error ${error.response.status}: ${error.response.statusText || error.message})`;
      } else if (error?.message) {
        message += ` (${error.message})`;
      }
      toast.error(message);
    }
  };

  const handleSubmitPayment = () => {
    if (!selectedCredit) return;
    const amountValue = Number(paymentAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Monto inválido');
      return;
    }
    registerPaymentMutation.mutate({
      creditAccountId: selectedCredit.id,
      amount: toCents(amountValue),
      paymentMethod,
      reference: paymentReference.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cuentas por Pagar</h1>
            <p className="text-muted-foreground">Cuentas por pagar a proveedores (CPP)</p>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por ID, proveedor o factura"
                className="pl-10"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="PAGADO_PARCIAL">Parcial</SelectItem>
                  <SelectItem value="PAGADO">Pagado</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">{filteredCredits.length} cuentas</div>
            </div>
          </div>

          {/* Vista responsive: tarjetas en móvil, tabla en desktop */}
          <div className="mt-4">
            {/* Mobile: Cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {isLoading ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">Cargando cuentas...</div>
              ) : filteredCredits.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">No hay cuentas por pagar</div>
              ) : (
                filteredCredits.map((credit) => (
                  <div key={credit.id} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-base text-foreground truncate">{credit.supplierName || credit.supplierId || 'Proveedor'}</span>
                        <span className="block text-xs text-muted-foreground truncate">ID: {credit.id}</span>
                      </div>
                      <Badge variant={getStatusLabel(credit.status).variant} className="shrink-0">
                        {getStatusLabel(credit.status).label}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs mt-1">
                      <span>Total: <span className="font-medium text-foreground">{formatCurrency(credit.totalAmount)}</span></span>
                      <span>Pagado: <span className="text-green-700">{formatCurrency(credit.paidAmount)}</span></span>
                      <span>Saldo: <span className="font-semibold text-foreground">{formatCurrency(credit.balanceAmount)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Vence: {formatDate(credit.dueDate)}</span>
                      <span className="ml-auto">Factura: {credit.invoiceNumber || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenTicket(credit)}
                      >
                        <FileText className="mr-2 h-4 w-4" />Estado
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenPayment(credit)}
                        disabled={credit.status === 'PAGADO' || credit.status === 'PAID'}
                      >
                        Abonar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop: Table */}
            <div className="hidden sm:block rounded-md border overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Cargando cuentas...
                      </TableCell>
                    </TableRow>
                  ) : filteredCredits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No hay cuentas por pagar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCredits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">
                          {credit.supplierName || credit.supplierId || 'Proveedor'}
                        </TableCell>
                        <TableCell>{formatCurrency(credit.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(credit.paidAmount)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(credit.balanceAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusLabel(credit.status).variant}>
                            {getStatusLabel(credit.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(credit.dueDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{credit.invoiceNumber || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenTicket(credit)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Estado
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenPayment(credit)}
                              disabled={credit.status === 'PAGADO' || credit.status === 'PAID'}
                            >
                              Abonar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
            <DialogDescription>Ingresa el monto y método de pago.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'CASH' | 'TRANSFER' | 'CHECK')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Referencia (opcional)</Label>
              <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitPayment} disabled={registerPaymentMutation.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Historial de Abonos</DialogTitle>
            <DialogDescription>Pagos realizados a la factura seleccionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {paymentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Método</th>
                      <th className="text-right px-3 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment: { id?: string; createdAt?: string; paymentMethod?: string; amount?: number }) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-3 py-2">{payment.createdAt ? formatDateTime(payment.createdAt) : '—'}</td>
                        <td className="px-3 py-2">{payment.paymentMethod || '—'}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(payment.amount ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Estado de Cuenta</DialogTitle>
            <DialogDescription>Detalle completo de la deuda.</DialogDescription>
          </DialogHeader>
          {isTicketLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : !ticketData ? (
            <p className="text-sm text-muted-foreground">No hay información disponible.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cuenta</p>
                  <p className="font-medium text-foreground">{ticketData.account.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proveedor</p>
                  <p className="font-medium text-foreground">{ticketData.account.supplierName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Factura</p>
                  <p className="font-medium text-foreground">{ticketData.account.invoiceNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vencimiento</p>
                  <p className="font-medium text-foreground">
                    {ticketData.account.dueDate ? formatDate(ticketData.account.dueDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-foreground">{formatCurrency(ticketData.account.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagado</p>
                  <p className="font-semibold text-foreground">{formatCurrency(ticketData.account.paid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="font-semibold text-foreground">{formatCurrency(ticketData.account.balance)}</p>
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
                    {ticketData.purchase.items.map((item, index) => (
                      <tr key={`${item.productName || 'item'}-${index}`} className="border-t">
                        <td className="px-3 py-2">{item.productName || '—'}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unitCost)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Método</th>
                      <th className="text-left px-3 py-2">Referencia</th>
                      <th className="text-right px-3 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketData.payments.length === 0 ? (
                      <tr className="border-t">
                        <td className="px-3 py-2" colSpan={4}>Sin pagos registrados.</td>
                      </tr>
                    ) : (
                      ticketData.payments.map((payment, index) => (
                        <tr key={`${payment.reference || 'payment'}-${index}`} className="border-t">
                          <td className="px-3 py-2">
                            {payment.date ? formatDateTime(payment.date) : '—'}
                          </td>
                          <td className="px-3 py-2">{payment.method || '—'}</td>
                          <td className="px-3 py-2">{payment.reference || '—'}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selectedCredit && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => handlePrintTicket(selectedCredit.id)}
              >
                Imprimir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
