import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { stockApi } from '@/api/stock.api';
import { useBranchStore } from '@/stores/branchStore';
import { Link } from 'react-router-dom';

export function StockHealth() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['stock-alerts', branchId],
    queryFn: () => stockApi.getLowStockAlerts({ branchId }),
  });

  // Calculate some stats from the alerts
  const criticalCount = alerts.filter(a => a.quantity === 0).length;
  const lowCount = alerts.filter(a => a.quantity > 0).length;

  return (
    <div className="kpi-card animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Alertas de Stock</h3>
        <Link to="/inventario" className="text-sm text-primary hover:underline">Ver todo</Link>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
            <span className="text-2xl">🎉</span>
          </div>
          <p className="text-sm font-medium text-foreground">¡Todo en orden!</p>
          <p className="text-xs text-muted-foreground">No hay productos con stock bajo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <span>Total Alertas: <span className="font-bold text-foreground">{alerts.length}</span></span>
            <span className={cn(criticalCount > 0 && "text-destructive font-bold")}>Críticos: {criticalCount}</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {alerts.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start justify-between p-2 rounded-lg border hover:bg-muted/40 transition-colors">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-sm font-medium truncate text-foreground">{item.product?.name || 'Producto desconocido'}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.product?.sku}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-sm font-bold",
                    item.quantity === 0 ? "text-destructive" : "text-amber-500"
                  )}>
                    {item.quantity} u
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    mín {item.minStock}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {alerts.length > 5 && (
            <p className="text-xs text-center text-muted-foreground pt-2 border-t">
              + {alerts.length - 5} productos más
            </p>
          )}
        </div>
      )}
    </div>
  );
}
