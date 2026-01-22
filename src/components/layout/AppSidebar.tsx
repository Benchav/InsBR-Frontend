import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  FileBarChart,
  ArrowLeftRight,
  LogOut,
  Leaf,
  Wallet,
  Receipt,
  CreditCard,
  ClipboardList,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/api.types';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const navigationItems: Array<{ name: string; href: string; icon: typeof LayoutDashboard; roles: UserRole[] }> = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
  { name: 'Todas las Ventas', href: '/ventas-todas', icon: Receipt, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Compras', href: '/compras', icon: Package, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Inventario', href: '/inventario', icon: Boxes, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Caja', href: '/caja', icon: Wallet, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
  { name: 'Créditos', href: '/creditos', icon: CreditCard, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
  { name: 'Encargos', href: '/encargos', icon: ClipboardList, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
  { name: 'Cuentas por Pagar', href: '/cuentas-por-pagar', icon: FileText, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Transferencias', href: '/transferencias', icon: ArrowLeftRight, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Clientes', href: '/clientes', icon: Users, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
  { name: 'Proveedores', href: '/proveedores', icon: Truck, roles: ['ADMIN', 'GERENTE'] },
  { name: 'Usuarios', href: '/usuarios', icon: Users, roles: ['ADMIN'] },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart, roles: ['ADMIN', 'GERENTE'] },
];

const SidebarContent = ({
  visibleItems,
  user,
  locationPath,
  onLogout,
}: {
  visibleItems: typeof navigationItems;
  user: ReturnType<typeof useAuth>['user'];
  locationPath: string;
  onLogout: () => void;
}) => (
  <div className="flex h-full flex-col">
    {/* Logo */}
    <div className="flex h-16 items-center gap-3 border-b border-border px-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Leaf className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground">Insumos Barrera</h1>
        <p className="text-xs text-muted-foreground">ERP SYSTEM</p>
      </div>
    </div>

    {/* User Card */}
    {user && (
      <div className="mx-4 mt-4 rounded-xl bg-accent p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.username}</p>
          </div>
        </div>
      </div>
    )}

    {/* Navigation */}
    <nav className="flex-1 space-y-1 px-3 py-4">
      {visibleItems.map((item) => {
        const isActive = locationPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn('sidebar-item', isActive && 'sidebar-item-active')}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>

    {/* Logout */}
    <div className="border-t border-border p-3">
      <button onClick={onLogout} className="sidebar-item w-full text-left hover:text-destructive">
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </div>
);

export function AppSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role;
  const visibleItems = role ? navigationItems.filter((item) => item.roles.includes(role)) : navigationItems;

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar md:block">
        <SidebarContent
          visibleItems={visibleItems}
          user={user}
          locationPath={location.pathname}
          onLogout={logout}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SidebarContent
            visibleItems={visibleItems}
            user={user}
            locationPath={location.pathname}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
