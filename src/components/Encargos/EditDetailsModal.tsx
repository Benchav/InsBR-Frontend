import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCreditDetails } from '@/services/creditService';
import { toast } from 'sonner';

interface EditDetailsModalProps {
  open: boolean;
  creditId: string;
  currentDeliveryDate?: string;
  currentNotes?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDetailsModal({
  open,
  creditId,
  currentDeliveryDate,
  currentNotes,
  onClose,
  onSuccess,
}: EditDetailsModalProps) {
  const [deliveryDate, setDeliveryDate] = useState(currentDeliveryDate?.split('T')[0] || '');
  const [notes, setNotes] = useState(currentNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCreditDetails(creditId, {
        deliveryDate: deliveryDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success('Detalles actualizados');
      onSuccess();
      onClose();
    } catch (error) {
      const message = (error as Error)?.message || 'Error al actualizar detalles';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar Detalles del Encargo</DialogTitle>
          <DialogDescription>Actualiza la fecha de entrega o notas del cliente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Fecha de Entrega</Label>
            <Input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Notas</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
