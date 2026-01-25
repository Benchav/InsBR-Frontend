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
  FileText
} from 'lucide-react';
import { Permission } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const navigationItems: Array<{ name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }> = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: Permission.VIEW_DASHBOARD },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart, permission: Permission.VIEW_POS },
  { name: 'Todas las Ventas', href: '/ventas-todas', icon: Receipt, permission: Permission.VIEW_SALES_HISTORY },
  { name: 'Compras', href: '/compras', icon: Package, permission: Permission.MANAGE_PRODUCTS },
  { name: 'Inventario', href: '/inventario', icon: Boxes, permission: Permission.VIEW_INVENTORY },
  { name: 'Caja', href: '/caja', icon: Wallet, permission: Permission.MANAGE_CASH_OPENING },
  { name: 'Créditos', href: '/creditos', icon: CreditCard, permission: Permission.VIEW_SALES_HISTORY },
  { name: 'Cuentas por Pagar', href: '/cuentas-por-pagar', icon: FileText, permission: Permission.VIEW_EXPENSES },
  { name: 'Transferencias', href: '/transferencias', icon: ArrowLeftRight, permission: Permission.VIEW_TRANSFERS },
  { name: 'Clientes', href: '/clientes', icon: Users, permission: Permission.VIEW_POS },
  { name: 'Proveedores', href: '/proveedores', icon: Truck, permission: Permission.MANAGE_PRODUCTS },
  { name: 'Usuarios', href: '/usuarios', icon: Users, permission: Permission.MANAGE_USERS },
  { name: 'Reportes', href: '/reportes', icon: FileBarChart, permission: Permission.VIEW_REPORTS },
  { name: 'Categorías', href: '/admin-categorias', icon: Package, permission: Permission.MANAGE_PRODUCTS },
];

const SidebarContent = ({
  visibleItems,
  user,
  locationPath,
  onLogout,
  onNavigate,
}: {
  visibleItems: typeof navigationItems;
  user: ReturnType<typeof useAuth>['user'];
  locationPath: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) => (
  <div className="flex h-full flex-col min-h-0">
    {/* Logo */}
    <div className="flex h-16 items-center gap-3 border-b border-border px-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden">
        <img src="/pwa-192x192.png" alt="Logo" className="h-full w-full object-cover" />
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
    <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3 py-4">
      {visibleItems.map((item) => {
        const isActive = locationPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn('sidebar-item', isActive && 'sidebar-item-active')}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>

    {/* Logout */}
    <div className="mt-auto border-t border-border p-3 bg-sidebar">
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
  const { user, logout, hasPermission } = useAuth();
  const visibleItems = navigationItems.filter((item) => hasPermission(item.permission));

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
        <SheetContent side="left" className="w-72 bg-sidebar p-0 h-full">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú principal</SheetTitle>
            <SheetDescription className="sr-only">Navegación principal de la aplicación</SheetDescription>
          </SheetHeader>
          <SidebarContent
            visibleItems={visibleItems}
            user={user}
            locationPath={location.pathname}
            onLogout={logout}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
