import { Transfer } from '@/types/transfer';
import { transferService } from '@/services/transferService';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TransferActionsProps {
    transfer: Transfer;
    userBranchId: string;
    onAction: () => void;
}

export const TransferActions = ({ transfer, userBranchId, onAction }: TransferActionsProps) => {
    const [loading, setLoading] = useState<string | null>(null);

    // Helpers
    const isOrigin = transfer.fromBranchId === userBranchId;
    const isDest = transfer.toBranchId === userBranchId;

    const handleAction = async (actionFn: (id: string) => Promise<any>, actionName: string) => {
        setLoading(actionName);
        try {
            await actionFn(transfer.id);
            onAction();
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la acción. Intente nuevamente.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex gap-2 items-center">
            {/* Lógica de Aprobación (Solo para REQUEST) */}
            {transfer.status === 'REQUESTED' && isOrigin && (
                <Button
                    size="sm"
                    onClick={() => handleAction(transferService.accept, 'accept')}
                    disabled={!!loading}
                >
                    {loading === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ✅ Aceptar Solicitud
                </Button>
            )}

            {/* Lógica de Envío (Para SEND directo o después de aprobar REQUEST) */}
            {transfer.status === 'PENDING' && isOrigin && (
                <Button
                    size="sm"
                    onClick={() => handleAction(transferService.ship, 'ship')}
                    disabled={!!loading}
                >
                    {loading === 'ship' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    🚚 Despachar Mercadería
                </Button>
            )}

            {/* Lógica de Recepción */}
            {transfer.status === 'IN_TRANSIT' && isDest && (
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    onClick={() => handleAction(transferService.receive, 'receive')}
                    disabled={!!loading}
                >
                    {loading === 'receive' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    📥 Confirmar Recepción
                </Button>
            )}

            {/* Cancelación (Solo creador puede cancelar si no está completada/en camino, o lógica de negocio específica) */}
            {['REQUESTED', 'PENDING'].includes(transfer.status) && isOrigin && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(transferService.cancel, 'cancel')}
                    disabled={!!loading}
                >
                    {loading === 'cancel' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    🚫 Cancelar
                </Button>
            )}

            {/* Feedback Pasivo (Cuando no hay acción requerida pero se espera algo) */}
            {transfer.status === 'REQUESTED' && isDest && (
                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                    ⏳ Esperando aprobación
                </span>
            )}
            {transfer.status === 'PENDING' && isDest && (
                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                    📦 Esperando envío
                </span>
            )}
            {transfer.status === 'IN_TRANSIT' && isOrigin && (
                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                    🚚 En camino...
                </span>
            )}
        </div>
    );
};
