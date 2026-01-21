import { ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="kpi-card animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
          onClick={() => navigate('/compras')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Nueva Compra</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
          onClick={() => navigate('/transferencias')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <ArrowLeftRight className="h-5 w-5 text-warning" />
          </div>
          <span className="text-sm font-medium">Transferir Stock</span>
        </Button>
      </div>
    </div>
  );
}
