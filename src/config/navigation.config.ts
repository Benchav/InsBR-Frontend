import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Boxes,
    Users,
    Truck,
    FileBarChart,
    ArrowLeftRight,
    Wallet,
    Receipt,
    CreditCard,
    FileText
} from 'lucide-react';
import { Permission } from './permissions';

export interface NavigationItem {
    name: string;
    href: string;
    icon: any; // LucideIcon type roughly
    permission: Permission;
    priority?: boolean; // For mobile bottom nav
}

export const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: Permission.VIEW_DASHBOARD, priority: true },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart, permission: Permission.VIEW_POS, priority: true },
    { name: 'Todas las Ventas', href: '/ventas-todas', icon: Receipt, permission: Permission.VIEW_SALES_HISTORY },
    { name: 'Compras', href: '/compras', icon: Package, permission: Permission.MANAGE_PRODUCTS },
    { name: 'Inventario', href: '/inventario', icon: Boxes, permission: Permission.VIEW_INVENTORY, priority: true },
    { name: 'Caja', href: '/caja', icon: Wallet, permission: Permission.MANAGE_CASH_OPENING, priority: true },
    { name: 'Créditos', href: '/creditos', icon: CreditCard, permission: Permission.VIEW_SALES_HISTORY },
    { name: 'Cuentas por Pagar', href: '/cuentas-por-pagar', icon: FileText, permission: Permission.VIEW_EXPENSES },
    { name: 'Transferencias', href: '/transferencias', icon: ArrowLeftRight, permission: Permission.VIEW_TRANSFERS },
    { name: 'Clientes', href: '/clientes', icon: Users, permission: Permission.VIEW_POS },
    { name: 'Proveedores', href: '/proveedores', icon: Truck, permission: Permission.MANAGE_PRODUCTS },
    { name: 'Usuarios', href: '/usuarios', icon: Users, permission: Permission.MANAGE_USERS },
    { name: 'Reportes', href: '/reportes', icon: FileBarChart, permission: Permission.VIEW_REPORTS, priority: true },
    { name: 'Categorías', href: '/admin-categorias', icon: Package, permission: Permission.MANAGE_PRODUCTS },
];
