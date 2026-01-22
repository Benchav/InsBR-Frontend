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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useBranchStore, BRANCHES } from '@/stores/branchStore';
import { Search, ShoppingCart, TrendingUp, FileText, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function VentasTodas() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales-all'],
    queryFn: () => salesApi.getAll(),
  });

  const cancelSaleMutation = useMutation({
    mutationFn: salesApi.cancel,
    onSuccess: (result) => {
      toast.success(result.message || 'Venta cancelada exitosamente');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ['sales-all'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'No se pudo cancelar la venta');
    }
  });

  const handleDownloadTicket = async (saleId: string) => {
    try {
      const blob = await salesApi.getTicket(saleId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('No se pudo descargar el ticket');
    }
  };

  const handleCancelSale = (saleId: string) => {
    cancelSaleMutation.mutate(saleId);
  };

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sales.filter((sale) => {
      const matchesBranch = currentBranchId === 'ALL' || sale.branchId === currentBranchId;
      const matchesSearch =
        sale.id.toLowerCase().includes(term) ||
        sale.createdBy?.toLowerCase().includes(term) ||
        sale.customerId?.toLowerCase().includes(term);
      return matchesBranch && matchesSearch;
    });
  }, [sales, searchTerm, currentBranchId]);

  const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const getBranchLabel = (branchId: string) => {
    return BRANCHES.find((b) => b.id === branchId)?.shortName || branchId;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Todas las Ventas</h1>
            <p className="text-muted-foreground">Resumen de ventas por sucursal y estado</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas</p>
                <p className="text-xl font-semibold text-foreground">{filteredSales.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cobrado</p>
                <p className="text-xl font-semibold text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <ShoppingCart className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Activas</p>
                <p className="text-xl font-semibold text-foreground">
                  {filteredSales.filter((sale) => (sale.status ?? 'ACTIVE') === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por ID, cliente o usuario"
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">{filteredSales.length} ventas</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ítems</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Cargando ventas...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium text-foreground">{sale.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'branch-badge',
                            sale.branchId === 'BRANCH-DIR-001'
                              ? 'branch-diriamba'
                              : sale.branchId === 'BRANCH-DIR-002'
                                ? 'branch-jinotepe'
                                : ''
                          )}
                        >
                          {getBranchLabel(sale.branchId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.type === 'CASH' ? 'default' : 'secondary'}>
                          {sale.type === 'CASH' ? 'Contado' : 'Crédito'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(sale.status ?? 'ACTIVE') === 'ACTIVE' ? 'default' : 'destructive'}>
                          {(sale.status ?? 'ACTIVE') === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sale.items.length}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadTicket(sale.id)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ticket
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelTarget(sale.id)}
                            disabled={(sale.status ?? 'ACTIVE') !== 'ACTIVE' || cancelSaleMutation.isPending}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancelar
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

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la venta seleccionada si cumple con las restricciones del día.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelTarget && handleCancelSale(cancelTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
