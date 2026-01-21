import { CreditAccount } from '@/api/credits.api';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface CreditDetailProps {
  credit: CreditAccount;
}

export function CreditDetail({ credit }: CreditDetailProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total</span>
        <span className="font-medium">{formatCurrency(credit.totalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Pagado</span>
        <span>{formatCurrency(credit.paidAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Saldo</span>
        <span className="font-semibold text-destructive">{formatCurrency(credit.balanceAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Vencimiento</span>
        <span>{formatDate(credit.dueDate)}</span>
      </div>
      {credit.deliveryDate && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fecha de Entrega</span>
          <span>{formatDate(credit.deliveryDate)}</span>
        </div>
      )}
      {credit.notes && (
        <div>
          <p className="text-muted-foreground">Notas</p>
          <p className="text-foreground">{credit.notes}</p>
        </div>
      )}
      {credit.invoiceNumber && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Número de Factura</span>
          <span>{credit.invoiceNumber}</span>
        </div>
      )}
    </div>
  );
}
