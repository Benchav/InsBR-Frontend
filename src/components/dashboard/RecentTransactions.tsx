import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useBranchStore } from '@/stores/branchStore';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  date: string;
  branch: 'Diriamba' | 'Jinotepe';
  supplier: string;
  amount: string;
  status: 'Pendiente' | 'En Proceso' | 'Completado' | 'Recibido';
}

const transactions: Transaction[] = [
  { id: 'PO-2094', date: 'Oct 27', branch: 'Diriamba', supplier: 'Global Logistics Inc.', amount: 'C$ 4,500.00', status: 'Pendiente' },
  { id: 'PO-2093', date: 'Oct 26', branch: 'Jinotepe', supplier: 'Office Depot', amount: 'C$ 1,250.00', status: 'Completado' },
  { id: 'PO-2092', date: 'Oct 25', branch: 'Diriamba', supplier: 'Aceros de México', amount: 'C$ 12,450.00', status: 'En Proceso' },
  { id: 'PO-2091', date: 'Oct 24', branch: 'Jinotepe', supplier: 'Insumos Médicos SA', amount: 'C$ 3,200.00', status: 'Recibido' },
];

export function RecentTransactions() {
  const { currentBranchId } = useBranchStore();

  const filteredTransactions = transactions.filter((t) => {
    if (currentBranchId === 'all') return true;
    return t.branch.toLowerCase() === currentBranchId;
  });

  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Transacciones Recientes</h3>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left py-3 px-2">ID</th>
              <th className="table-header text-left py-3 px-2">Fecha</th>
              <th className="table-header text-left py-3 px-2">Sucursal</th>
              <th className="table-header text-left py-3 px-2">Proveedor</th>
              <th className="table-header text-right py-3 px-2">Monto</th>
              <th className="table-header text-center py-3 px-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm font-medium text-foreground">{transaction.id}</td>
                <td className="py-3 px-2 text-sm text-muted-foreground">{transaction.date}</td>
                <td className="py-3 px-2">
                  <span className={cn(
                    'branch-badge',
                    transaction.branch === 'Diriamba' ? 'branch-diriamba' : 'branch-jinotepe'
                  )}>
                    {transaction.branch}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm text-foreground">{transaction.supplier}</td>
                <td className="py-3 px-2 text-sm text-foreground text-right font-medium">{transaction.amount}</td>
                <td className="py-3 px-2 text-center">
                  <span
                    className={cn(
                      'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                      transaction.status === 'Pendiente' && 'bg-warning/10 text-warning',
                      transaction.status === 'En Proceso' && 'bg-primary/10 text-primary',
                      transaction.status === 'Completado' && 'bg-success/10 text-success',
                      transaction.status === 'Recibido' && 'bg-success/10 text-success'
                    )}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
