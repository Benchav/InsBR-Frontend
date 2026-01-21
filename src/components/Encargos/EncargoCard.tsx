import { CreditAccount } from '@/api/credits.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface EncargoCardProps {
  encargo: CreditAccount;
  onPay: (encargo: CreditAccount) => void;
  onEditDetails?: (encargo: CreditAccount) => void;
  onViewDetails?: (encargo: CreditAccount) => void;
}

const getStatusLabel = (status: CreditAccount['status']) => {
  switch (status) {
    case 'PAGADO':
      return { label: 'Pagado', variant: 'secondary' as const };
    case 'PAGADO_PARCIAL':
      return { label: 'Parcial', variant: 'default' as const };
    default:
      return { label: 'Pendiente', variant: 'destructive' as const };
  }
};

export function EncargoCard({ encargo, onPay, onEditDetails, onViewDetails }: EncargoCardProps) {
  const status = getStatusLabel(encargo.status);

  return (
    <div className="kpi-card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Encargo</p>
          <h3 className="text-base font-semibold text-foreground">#{encargo.id}</h3>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium text-foreground">{encargo.customerName || encargo.customerId || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Creado</span>
          <span className="text-foreground">{formatDate(encargo.createdAt)}</span>
        </div>
        {encargo.deliveryDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrega</span>
            <span className="text-foreground">{formatDate(encargo.deliveryDate)}</span>
          </div>
        )}
        {encargo.notes && (
          <div className="text-muted-foreground">
            <p className="text-xs uppercase tracking-wide">Notas</p>
            <p className="text-sm text-foreground">{encargo.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">{formatCurrency(encargo.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagado</span>
          <span>{formatCurrency(encargo.paidAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Saldo</span>
          <span className="font-semibold text-destructive">{formatCurrency(encargo.balanceAmount)}</span>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onPay(encargo)} disabled={encargo.status === 'PAGADO'}>
          Registrar Abono
        </Button>
        {onViewDetails && (
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(encargo)}>
            Ver Detalles
          </Button>
        )}
        {onEditDetails && (
          <Button size="sm" variant="ghost" onClick={() => onEditDetails(encargo)}>
            Editar Detalles
          </Button>
        )}
      </div>
    </div>
  );
}
