import { useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashApi } from '@/api/cash.api';
import { formatCurrency, formatDateTime, toCents } from '@/utils/formatters';
import { ArrowDownLeft, ArrowUpRight, Calendar, RefreshCcw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
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
import { useAuth } from '@/contexts/AuthContext';
import { useBranchStore } from '@/stores/branchStore';

export default function Caja() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'CAJERO';
  const isAdmin = user?.role === 'ADMIN';
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [movementCategory, setMovementCategory] = useState<'EXPENSE' | 'ADJUSTMENT'>('ADJUSTMENT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementPaymentMethod, setMovementPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CHECK'>('CASH');
  const [movementNotes, setMovementNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: balance } = useQuery({
    queryKey: ['cash-balance', branchId],
    queryFn: () => cashApi.getBalance(isAdmin && branchId ? { branchId } : undefined),
  });

  const { data: dailyRevenue } = useQuery({
    queryKey: ['cash-daily-revenue', branchId],
    queryFn: () => cashApi.getDailyRevenue(isAdmin && branchId ? { branchId } : undefined),
  });

  const {
    data: movements = [],
    isLoading: isLoadingMovements,
  } = useQuery({
    queryKey: ['cash-movements', branchId, startDate, endDate],
    queryFn: () =>
      cashApi.getMovements({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: isAdmin ? branchId : undefined,
      }),
  });

  const createMovementMutation = useMutation({
    mutationFn: cashApi.createMovement,
    onSuccess: () => {
      toast.success('Movimiento registrado');
      setIsDialogOpen(false);
      setMovementAmount('');
      setMovementDescription('');
      setMovementType('INCOME');
      setMovementCategory('ADJUSTMENT');
      setMovementPaymentMethod('CASH');
      setMovementNotes('');
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['cash-balance'] });
      queryClient.invalidateQueries({ queryKey: ['cash-daily-revenue'] });
    },
    onError: () => toast.error('No se pudo registrar el movimiento'),
  });

  const handleCreateMovement = () => {
    const amountValue = Number(movementAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Monto inválido');
      return;
    }
    if (!movementDescription.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    createMovementMutation.mutate({
      type: movementType,
      amount: toCents(amountValue),
      description: movementDescription.trim(),
      category: movementCategory,
      paymentMethod: movementPaymentMethod,
      notes: movementNotes.trim() || undefined,
    });
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Caja</h1>
            <p className="text-muted-foreground">Movimientos y balance de caja</p>
            {isReadOnly && (
              <p className="mt-2 text-xs text-warning">Solo lectura</p>
            )}
          </div>
          {!isReadOnly && (
            <Button onClick={() => setIsDialogOpen(true)}>Registrar Movimiento</Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Actual</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(balance?.netBalance ?? 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowUpRight className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos del Día</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(dailyRevenue?.income ?? 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <ArrowDownLeft className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Movimientos</p>
                <p className="text-xl font-semibold text-foreground">{movements.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleClearDates}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">{movements.length} movimientos</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMovements ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.type === 'INCOME' ? 'default' : 'destructive'}>
                          {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{movement.description}</TableCell>
                      <TableCell className="text-muted-foreground">{movement.reference || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(movement.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {!isReadOnly && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>Agrega un ingreso o egreso manual de caja.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={movementType} onValueChange={(val) => setMovementType(val as 'INCOME' | 'EXPENSE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={movementCategory} onValueChange={(val) => setMovementCategory(val as 'EXPENSE' | 'ADJUSTMENT')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={movementAmount}
                onChange={(event) => setMovementAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={movementPaymentMethod} onValueChange={(val) => setMovementPaymentMethod(val as 'CASH' | 'TRANSFER' | 'CHECK')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Input
                value={movementDescription}
                onChange={(event) => setMovementDescription(event.target.value)}
                placeholder="Detalle del movimiento"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notas</Label>
              <Input
                value={movementNotes}
                onChange={(event) => setMovementNotes(event.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMovement} disabled={createMovementMutation.isPending}>
              Registrar
            </Button>
          </div>
        </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
