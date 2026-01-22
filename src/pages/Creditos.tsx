import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { customersApi } from '@/api/customers.api';
import { formatCurrency, formatDate, toCents } from '@/utils/formatters';
import { useBranchStore } from '@/stores/branchStore';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Creditos() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CHECK'>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credits-cxc', branchId],
    queryFn: () => creditsApi.getAll({ type: 'CXC', branchId }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-active', branchId],
    queryFn: () => customersApi.getAll({ isActive: true, branchId }),
  });

  const filteredCredits = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return credits.filter((credit) => {
      const customer = credit.customerId?.toLowerCase() || '';
      return credit.id.toLowerCase().includes(term) || customer.includes(term);
    });
  }, [credits, searchTerm]);

  const registerPaymentMutation = useMutation({
    mutationFn: creditsApi.registerPayment,
    onSuccess: () => {
      toast.success('Abono registrado');
      setSelectedAccount(null);
      setPaymentAmount('');
      setReference('');
      setNotes('');
      setPaymentMethod('CASH');
      queryClient.invalidateQueries({ queryKey: ['credits-cxc'] });
    },
    onError: () => toast.error('No se pudo registrar el abono'),
  });

  const createCreditMutation = useMutation({
    mutationFn: creditsApi.create,
    onSuccess: () => {
      toast.success('Crédito creado');
      setIsCreateOpen(false);
      setNewCustomerId('');
      setNewTotalAmount('');
      setNewDueDate('');
      setNewNotes('');
      queryClient.invalidateQueries({ queryKey: ['credits-cxc'] });
    },
    onError: () => toast.error('No se pudo crear el crédito'),
  });

  const handleOpenPayment = (account: CreditAccount) => {
    setSelectedAccount(account);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setReference('');
    setNotes('');
  };

  const handleSubmitPayment = () => {
    if (!selectedAccount) return;
    const amountValue = Number(paymentAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Monto inválido');
      return;
    }
    registerPaymentMutation.mutate({
      creditAccountId: selectedAccount.id,
      amount: toCents(amountValue),
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleCreateCredit = () => {
    const amountValue = Number(newTotalAmount);
    if (!newCustomerId) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Monto inválido');
      return;
    }
    if (!newDueDate) {
      toast.error('Selecciona una fecha de vencimiento');
      return;
    }
    createCreditMutation.mutate({
      customerId: newCustomerId,
      totalAmount: toCents(amountValue),
      dueDate: newDueDate,
      type: 'CXC',
      notes: newNotes.trim() || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Créditos</h1>
            <p className="text-muted-foreground">Cuentas por cobrar (CXC)</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Nuevo Crédito</Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por ID o cliente"
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">{filteredCredits.length} cuentas</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Cargando créditos...
                    </TableCell>
                  </TableRow>
                ) : filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No hay cuentas por cobrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="font-medium">
                        {credit.customerName || credit.customerId || 'Cliente'}
                      </TableCell>
                      <TableCell>{formatCurrency(credit.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(credit.paidAmount)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(credit.balanceAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            credit.status === 'PAGADO'
                              ? 'secondary'
                              : credit.status === 'PAGADO_PARCIAL'
                                ? 'default'
                                : 'destructive'
                          }
                        >
                          {credit.status === 'PAGADO'
                            ? 'Pagado'
                            : credit.status === 'PAGADO_PARCIAL'
                              ? 'Parcial'
                              : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(credit.dueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {credit.deliveryDate ? formatDate(credit.deliveryDate) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {credit.notes ? credit.notes : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayment(credit)}
                          disabled={credit.status === 'PAGADO'}
                        >
                          Abonar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
            <DialogDescription>
              Ingresa el monto y método de pago para la cuenta seleccionada.
            </DialogDescription>
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
              <Input value={reference} onChange={(event) => setReference(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedAccount(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitPayment} disabled={registerPaymentMutation.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Crédito</DialogTitle>
            <DialogDescription>Registra una nueva cuenta por cobrar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newTotalAmount}
                onChange={(event) => setNewTotalAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha de vencimiento</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCredit} disabled={createCreditMutation.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
