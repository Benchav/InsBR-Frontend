import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Permission } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { navigationItems } from '@/config/navigation.config';

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
  desktopVisible,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopVisible: boolean;
}) {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const visibleItems = navigationItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-sidebar',
          desktopVisible ? 'md:block w-64' : 'md:hidden'
        )}
      >
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
