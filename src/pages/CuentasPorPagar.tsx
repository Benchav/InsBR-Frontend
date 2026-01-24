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
import { creditsApi, CreditAccount } from '@/api/credits.api';
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

          <div className="mt-4 rounded-md border overflow-x-auto">
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
                            onClick={() => handleOpenHistory(credit)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Historial
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
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
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
    </DashboardLayout>
  );
}
