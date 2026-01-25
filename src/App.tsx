import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/api.types";
import AppInstallPrompt from "@/components/AppInstallPrompt";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Ventas from "./pages/Ventas";
import VentasTodas from "./pages/VentasTodas";
import Compras from "./pages/Compras";
import Inventario from "./pages/Inventario";
import Transferencias from "./pages/Transferencias";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Reportes from "./pages/Reportes";
import Caja from "./pages/Caja";
import Creditos from "./pages/Creditos";
import CuentasPorPagar from "./pages/CuentasPorPagar";
import NotFound from "./pages/NotFound";
import AdminCategorias from "./pages/AdminCategorias";

const queryClient = new QueryClient();

const getDefaultRoute = (role?: UserRole) => {
  if (role === 'CAJERO') return '/ventas';
  if (role === 'GERENTE' || role === 'ADMIN') return '/';
  return '/login';
};

import { Permission } from '@/config/permissions';

const PermissionRoute = ({ permission, children }: { permission: Permission; children: JSX.Element }) => {
  const { user, isLoading, isAuthenticated, hasPermission } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppInstallPrompt />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={(
                <PermissionRoute permission={Permission.VIEW_DASHBOARD}>
                  <Dashboard />
                </PermissionRoute>
              )}
            />
            <Route
              path="/ventas"
              element={(
                <PermissionRoute permission={Permission.VIEW_POS}>
                  <Ventas />
                </PermissionRoute>
              )}
            />
            <Route
              path="/ventas-todas"
              element={(
                <PermissionRoute permission={Permission.VIEW_SALES_HISTORY}>
                  <VentasTodas />
                </PermissionRoute>
              )}
            />
            <Route
              path="/compras"
              element={(
                <PermissionRoute permission={Permission.MANAGE_PRODUCTS}>
                  <Compras />
                </PermissionRoute>
              )}
            />
            <Route
              path="/inventario"
              element={(
                <PermissionRoute permission={Permission.VIEW_INVENTORY}>
                  <Inventario />
                </PermissionRoute>
              )}
            />
            <Route
              path="/transferencias"
              element={(
                <PermissionRoute permission={Permission.VIEW_TRANSFERS}>
                  <Transferencias />
                </PermissionRoute>
              )}
            />
            <Route
              path="/usuarios"
              element={(
                <PermissionRoute permission={Permission.MANAGE_USERS}>
                  <Usuarios />
                </PermissionRoute>
              )}
            />
            <Route
              path="/clientes"
              element={(
                <PermissionRoute permission={Permission.VIEW_POS}>
                  <Clientes />
                </PermissionRoute>
              )}
            />
            <Route
              path="/proveedores"
              element={(
                <PermissionRoute permission={Permission.MANAGE_PRODUCTS}>
                  <Proveedores />
                </PermissionRoute>
              )}
            />
            <Route
              path="/reportes"
              element={(
                <PermissionRoute permission={Permission.VIEW_REPORTS}>
                  <Reportes />
                </PermissionRoute>
              )}
            />
            <Route
              path="/caja"
              element={(
                <PermissionRoute permission={Permission.MANAGE_CASH_OPENING}>
                  <Caja />
                </PermissionRoute>
              )}
            />
            <Route
              path="/creditos"
              element={(
                <PermissionRoute permission={Permission.VIEW_SALES_HISTORY}>
                  <Creditos />
                </PermissionRoute>
              )}
            />
            <Route
              path="/cuentas-por-pagar"
              element={(
                <PermissionRoute permission={Permission.VIEW_EXPENSES}>
                  <CuentasPorPagar />
                </PermissionRoute>
              )}
            />
            <Route
              path="/admin-categorias"
              element={(
                <PermissionRoute permission={Permission.MANAGE_PRODUCTS}>
                  <AdminCategorias />
                </PermissionRoute>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
