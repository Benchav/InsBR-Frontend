
import { Bell, Search, MapPin, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { creditsApi } from '@/api/credits.api';
import { formatDate } from '@/utils/formatters';
import React, { useState, useEffect, useRef } from 'react';
import { useBranchStore, BRANCHES, BranchId } from '@/stores/branchStore';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Permission } from '@/config/permissions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';




export function TopBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { currentBranchId, setCurrentBranch, getCurrentBranch } = useBranchStore();
  const currentBranch = getCurrentBranch();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Notification dropdown state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate date range for upcoming due dates (next 7 days)
  const today = new Date();
  const in7days = new Date();
  in7days.setDate(today.getDate() + 7);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;

  // Fetch upcoming CXC (credits) and CPP (accounts payable)
  const { data: upcomingCXC = [] } = useQuery({
    queryKey: ['notif-cxc', branchId],
    queryFn: () => creditsApi.getAll({
      type: 'CXC',
      branchId,
    }),
  });
  const { data: upcomingCPP = [] } = useQuery({
    queryKey: ['notif-cpp', branchId],
    queryFn: () => creditsApi.getAll({
      type: 'CPP',
      branchId,
    }),
  });

  // Filter for due soon (within 7 days, not paid)
  function isDueSoon(item: any) {
    if (!item.dueDate) return false;
    const due = new Date(item.dueDate);
    return (
      due >= today &&
      due <= in7days &&
      item.status !== 'PAGADO' &&
      item.status !== 'PAID'
    );
  }
  const dueSoonCXC = upcomingCXC.filter(isDueSoon);
  const dueSoonCPP = upcomingCPP.filter(isDueSoon);
  const notifCount = dueSoonCXC.length + dueSoonCPP.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative flex-1 max-w-md hidden md:block">
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
        {/* Branch Selector */}
        <PermissionGuard
          permission={Permission.SWITCH_BRANCH}
          fallback={
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{currentBranch.name}</span>
            </div>
          }
        >
          <Select
            value={currentBranchId}
            onValueChange={(value: BranchId) => setCurrentBranch(value)}
          >
            <SelectTrigger className="w-[160px] md:w-[200px] bg-primary/5 border-primary/20 text-foreground font-medium">
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
        </PermissionGuard>


        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              // Si no hay notificaciones, toggle normal
              if (notifCount === 0) setNotifOpen((v) => !v);
              // Si hay notificaciones, solo abrir (el cierre será por click fuera)
              else if (!notifOpen) setNotifOpen(true);
            }}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {notifCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-xs bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-3 border-b font-semibold">Notificaciones</div>
              <div className="max-h-72 overflow-y-auto">
                {notifCount === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No hay notificaciones próximas.</div>
                )}
                {dueSoonCXC.length > 0 && (
                  <div className="p-2">
                    <div className="font-medium text-xs text-muted-foreground mb-1">Créditos por cobrar próximos</div>
                    {dueSoonCXC.map((c) => (
                      <div key={c.id} className="mb-2 p-2 rounded bg-muted/40">
                        <div className="font-semibold text-foreground text-sm">{c.customerName || c.customerId}</div>
                        <div className="text-xs">Vence: <span className="font-medium">{formatDate(c.dueDate)}</span></div>
                        <div className="text-xs">Saldo: <span className="font-semibold">C$ {(c.balanceAmount / 100).toFixed(2)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
                {dueSoonCPP.length > 0 && (
                  <div className="p-2">
                    <div className="font-medium text-xs text-muted-foreground mb-1">Cuentas por pagar próximas</div>
                    {dueSoonCPP.map((c) => (
                      <div key={c.id} className="mb-2 p-2 rounded bg-muted/40">
                        <div className="font-semibold text-foreground text-sm">{c.supplierName || c.supplierId}</div>
                        <div className="text-xs">Vence: <span className="font-medium">{formatDate(c.dueDate)}</span></div>
                        <div className="text-xs">Saldo: <span className="font-semibold">C$ {(c.balanceAmount / 100).toFixed(2)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span>{new Date().toLocaleDateString('es-NI', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </header>
  );
}
