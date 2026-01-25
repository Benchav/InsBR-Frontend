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

const RoleRoute = ({ roles, children }: { roles: UserRole[]; children: JSX.Element }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
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
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Dashboard />
                </RoleRoute>
              )}
            />
            <Route
              path="/ventas"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE', 'CAJERO']}>
                  <Ventas />
                </RoleRoute>
              )}
            />
            <Route
              path="/ventas-todas"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <VentasTodas />
                </RoleRoute>
              )}
            />
            <Route
              path="/compras"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Compras />
                </RoleRoute>
              )}
            />
            <Route
              path="/inventario"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Inventario />
                </RoleRoute>
              )}
            />
            <Route
              path="/transferencias"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Transferencias />
                </RoleRoute>
              )}
            />
            <Route
              path="/usuarios"
              element={(
                <RoleRoute roles={['ADMIN']}>
                  <Usuarios />
                </RoleRoute>
              )}
            />
            <Route
              path="/clientes"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE', 'CAJERO']}>
                  <Clientes />
                </RoleRoute>
              )}
            />
            <Route
              path="/proveedores"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Proveedores />
                </RoleRoute>
              )}
            />
            <Route
              path="/reportes"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <Reportes />
                </RoleRoute>
              )}
            />
            <Route
              path="/caja"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE', 'CAJERO']}>
                  <Caja />
                </RoleRoute>
              )}
            />
            <Route
              path="/creditos"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE', 'CAJERO']}>
                  <Creditos />
                </RoleRoute>
              )}
            />
            <Route
              path="/cuentas-por-pagar"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <CuentasPorPagar />
                </RoleRoute>
              )}
            />
            <Route
              path="/admin-categorias"
              element={(
                <RoleRoute roles={['ADMIN', 'GERENTE']}>
                  <AdminCategorias />
                </RoleRoute>
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
