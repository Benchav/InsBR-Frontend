import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { creditsApi } from '@/api/credits.api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useBranchStore } from '@/stores/branchStore';
import { Search } from 'lucide-react';

export default function CuentasPorPagar() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const [searchTerm, setSearchTerm] = useState('');

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credits-cpp', branchId],
    queryFn: () => creditsApi.getAll({ type: 'CPP', branchId }),
  });

  const filteredCredits = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return credits.filter((credit) => {
      const supplier = credit.supplierId?.toLowerCase() || '';
      const invoice = credit.invoiceNumber?.toLowerCase() || '';
      return credit.id.toLowerCase().includes(term) || supplier.includes(term) || invoice.includes(term);
    });
  }, [credits, searchTerm]);

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
            <div className="text-sm text-muted-foreground">{filteredCredits.length} cuentas</div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Cargando cuentas...
                    </TableCell>
                  </TableRow>
                ) : filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay cuentas por pagar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="font-medium">
                        {credit.supplierId || 'Proveedor'}
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
                      <TableCell className="text-muted-foreground">{credit.invoiceNumber || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
