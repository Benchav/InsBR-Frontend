import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditsApi, CreditAccount } from '@/api/credits.api';
import { useBranchStore } from '@/stores/branchStore';
import { Search } from 'lucide-react';
import { EncargoCard } from '@/components/Encargos/EncargoCard';
import { EditDetailsModal } from '@/components/Encargos/EditDetailsModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CreditDetail } from '@/components/Credits/CreditDetail';

export default function Encargos() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');
  const [editTarget, setEditTarget] = useState<CreditAccount | null>(null);
  const [detailTarget, setDetailTarget] = useState<CreditAccount | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<CreditAccount | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CHECK'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'GERENTE';

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['encargos', branchId],
    queryFn: () => creditsApi.getAll({ type: 'CXC', branchId }),
  });

  const registerPaymentMutation = useMutation({
    mutationFn: creditsApi.registerPayment,
    onSuccess: () => {
      toast.success('Abono registrado');
      setPaymentTarget(null);
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setPaymentReference('');
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['encargos'] });
    },
    onError: () => toast.error('No se pudo registrar el abono'),
  });

  const filteredEncargos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return credits.filter((credit) => {
      const customer = credit.customerName?.toLowerCase() || credit.customerId?.toLowerCase() || '';
      return credit.id.toLowerCase().includes(term) || customer.includes(term);
    });
  }, [credits, searchTerm]);

  const handlePay = (encargo: CreditAccount) => {
    setPaymentTarget(encargo);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleSubmitPayment = () => {
    if (!paymentTarget) return;
    const value = Number(paymentAmount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Monto inválido');
      return;
    }
    registerPaymentMutation.mutate({
      creditAccountId: paymentTarget.id,
      amount: Math.round(value * 100),
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
            <h1 className="text-2xl font-bold text-foreground">Encargos</h1>
            <p className="text-muted-foreground">Cuentas por cobrar con entrega pendiente</p>
          </div>
        </div>

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
          <div className="text-sm text-muted-foreground">{filteredEncargos.length} encargos</div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando encargos...</p>
        ) : filteredEncargos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay encargos registrados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEncargos.map((encargo) => (
              <EncargoCard
                key={encargo.id}
                encargo={encargo}
                onPay={handlePay}
                onViewDetails={setDetailTarget}
                onEditDetails={canEdit ? setEditTarget : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {editTarget && (
        <EditDetailsModal
          open={!!editTarget}
          creditId={editTarget.id}
          currentDeliveryDate={editTarget.deliveryDate}
          currentNotes={editTarget.notes}
          onClose={() => setEditTarget(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['encargos'] })}
        />
      )}

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Detalle del Encargo</DialogTitle>
            <DialogDescription>Información de la cuenta por cobrar.</DialogDescription>
          </DialogHeader>
          {detailTarget && <CreditDetail credit={detailTarget} />}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
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
            <Button variant="outline" onClick={() => setPaymentTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitPayment} disabled={registerPaymentMutation.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
