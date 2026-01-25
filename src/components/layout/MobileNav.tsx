import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { navigationItems } from '@/config/navigation.config';
import { MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export function MobileNav() {
    const location = useLocation();
    const { hasPermission } = useAuth();

    // Filter items visible to user AND marked as priority for mobile
    const mobileItems = navigationItems.filter(
        (item) => hasPermission(item.permission) && item.priority
    ).slice(0, 4); // Show max 4 priority items + Menu

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <nav className="flex items-center justify-around h-16 px-2">
                {mobileItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {/* "More" Menu Trigger - Opens the existing Sidebar */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="text-[10px] font-medium">Menú</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <SheetHeader>
                            <SheetTitle className="sr-only">Menú Completo</SheetTitle>
                            <SheetDescription className="sr-only">Navegación completa de la aplicación</SheetDescription>
                        </SheetHeader>
                        <MobileMenuContent />
                    </SheetContent>
                </Sheet>
            </nav>
        </div>
    );
}

function MobileMenuContent() {
    const location = useLocation();
    const { user, logout, hasPermission } = useAuth();
    const visibleItems = navigationItems.filter((item) => hasPermission(item.permission));

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <div className="flex h-16 items-center gap-3 border-b border-border px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden">
                    <img src="/pwa-192x192.png" alt="Logo" className="h-full w-full object-cover" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-foreground">Insumos Barrera</h1>
                    <p className="text-xs text-muted-foreground">Menú Completo</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {visibleItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            'sidebar-item',
                            location.pathname === item.href && 'sidebar-item-active'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button onClick={logout} className="sidebar-item w-full text-left text-destructive hover:bg-destructive/10">
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}
