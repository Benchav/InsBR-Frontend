import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';

const stockItems = [
  { name: 'Fertilizantes', status: 'healthy', label: 'Healthy' },
  { name: 'Semillas', status: 'low', label: 'Stock Bajo' },
  { name: 'Herbicidas', status: 'good', label: 'Good' },
  { name: 'Fungicidas', status: 'low', label: 'Stock Bajo' },
];

const alerts = [
  { id: 1, product: 'Urea Granulada 46%', sku: 'SKU-992', location: 'Jinotepe', units: 5 },
];

export function StockHealth() {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Estado del Stock</h3>
        <a href="/inventario" className="text-sm text-primary hover:underline">Ver todo</a>
      </div>
      
      <div className="space-y-3">
        {stockItems.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{item.name}</span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-md',
                item.status === 'healthy' && 'bg-success/10 text-success',
                item.status === 'good' && 'bg-primary/10 text-primary',
                item.status === 'low' && 'bg-destructive/10 text-destructive'
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Critical Alert */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Alertas Críticas</p>
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Reorden Requerido</p>
                <p className="text-xs text-muted-foreground">
                  {alert.product} ({alert.sku}) tiene solo {alert.units} unidades en {alert.location}.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
