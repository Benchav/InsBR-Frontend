import { Bell, Search, MapPin, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBranchStore, BRANCHES, BranchId } from '@/stores/branchStore';
import { useAuth } from '@/contexts/AuthContext';

export function TopBar() {
  const { currentBranchId, setCurrentBranch, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos, órdenes, transacciones..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Branch Selector */}
        {isAdmin ? (
          <Select
            value={currentBranchId}
            onValueChange={(value: BranchId) => setCurrentBranch(value)}
          >
            <SelectTrigger className="w-[200px] bg-primary/5 border-primary/20 text-foreground font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Seleccionar sucursal" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <span>{branch.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{currentBranch.name}</span>
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>

        {/* Date */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span>{new Date().toLocaleDateString('es-NI', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </header>
  );
}
