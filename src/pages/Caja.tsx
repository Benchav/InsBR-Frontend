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
import { useQuery } from '@tanstack/react-query';
import { cashApi } from '@/api/cash.api';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ArrowDownLeft, ArrowUpRight, Calendar, RefreshCcw, Wallet } from 'lucide-react';

export default function Caja() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: balance } = useQuery({
    queryKey: ['cash-balance'],
    queryFn: () => cashApi.getBalance(),
  });

  const { data: dailyRevenue } = useQuery({
    queryKey: ['cash-daily-revenue'],
    queryFn: () => cashApi.getDailyRevenue(),
  });

  const {
    data: movements = [],
    isLoading: isLoadingMovements,
  } = useQuery({
    queryKey: ['cash-movements', startDate, endDate],
    queryFn: () =>
      cashApi.getMovements({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

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
          </div>
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
                  {formatCurrency(balance?.balance ?? 0)}
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
                  {formatCurrency(dailyRevenue?.totalRevenue ?? 0)}
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

          <div className="mt-4 rounded-md border">
            <Table>
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
    </DashboardLayout>
  );
}
