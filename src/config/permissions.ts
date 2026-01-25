import { UserRole } from '../types/api.types';

export enum Permission {
    // CORE
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',
    SWITCH_BRANCH = 'SWITCH_BRANCH',

    // SALES
    VIEW_POS = 'VIEW_POS',
    VIEW_SALES_HISTORY = 'VIEW_SALES_HISTORY',
    VOID_SALES = 'VOID_SALES',

    // INVENTORY
    VIEW_INVENTORY = 'VIEW_INVENTORY',
    MANAGE_PRODUCTS = 'MANAGE_PRODUCTS', // Create/Edit/Delete
    ADJUST_STOCK = 'ADJUST_STOCK',       // Manual adjustments

    // CASH
    VIEW_CASH_CLOSING = 'VIEW_CASH_CLOSING',
    MANAGE_CASH_OPENING = 'MANAGE_CASH_OPENING',

    // FINANCE
    VIEW_EXPENSES = 'VIEW_EXPENSES',
    MANAGE_EXPENSES = 'MANAGE_EXPENSES',
    VIEW_TRANSFERS = 'VIEW_TRANSFERS',

    // REPORTS
    VIEW_REPORTS = 'VIEW_REPORTS',

    // ADMIN
    MANAGE_USERS = 'MANAGE_USERS',
    MANAGE_BRANCHES = 'MANAGE_BRANCHES',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    ADMIN: [
        Permission.VIEW_DASHBOARD,
        Permission.SWITCH_BRANCH,
        Permission.VIEW_POS,
        Permission.VIEW_SALES_HISTORY,
        Permission.VOID_SALES,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_PRODUCTS,
        Permission.ADJUST_STOCK,
        Permission.VIEW_CASH_CLOSING,
        Permission.MANAGE_CASH_OPENING,
        Permission.VIEW_EXPENSES,
        Permission.MANAGE_EXPENSES,
        Permission.VIEW_TRANSFERS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_BRANCHES,
    ],
    GERENTE: [
        Permission.VIEW_DASHBOARD,
        // No SWITCH_BRANCH - restricted to assigned branch
        Permission.VIEW_POS,
        Permission.VIEW_SALES_HISTORY,
        Permission.VOID_SALES,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_PRODUCTS,
        Permission.ADJUST_STOCK,
        Permission.VIEW_CASH_CLOSING,
        Permission.MANAGE_CASH_OPENING,
        Permission.VIEW_EXPENSES,
        Permission.MANAGE_EXPENSES,
        Permission.VIEW_TRANSFERS,
        Permission.VIEW_REPORTS,
        // No MANAGE_USERS
        // No MANAGE_BRANCHES
    ],
    CAJERO: [
        // No VIEW_DASHBOARD (usually simplified view or none)
        Permission.VIEW_POS,
        Permission.VIEW_SALES_HISTORY,
        // No VOID_SALES
        Permission.VIEW_INVENTORY,
        // No MANAGE_PRODUCTS
        // No ADJUST_STOCK
        Permission.VIEW_CASH_CLOSING, // Can see their own closing
        Permission.MANAGE_CASH_OPENING,
        // No FINANCE
        // No REPORTS
        // No ADMIN
    ],
};
