import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ username, password });
      toast.success('¡Bienvenido!', { description: 'Sesión iniciada correctamente.' });
      navigate('/');
    } catch (err: any) {
      toast.error('Error al iniciar sesión', {
        description: err.response?.data?.error || 'Credenciales incorrectas',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          {/* Brand Panel */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden">
                <img src="/pwa-192x192.png" alt="Insumos Barrera" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Insumos Barrera</h1>
                <p className="text-muted-foreground">Sistema ERP</p>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-8">
              <h2 className="text-2xl font-semibold text-foreground">Operaciones centralizadas</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Controla inventario, ventas, compras y proveedores desde un solo panel seguro.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Panel principal unificado
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Sucursal Diriamba
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Sucursal Jinotepe
                </div>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full">
            <div className="mx-auto w-full max-w-md lg:max-w-lg">
              <div className="flex flex-col items-center mb-8 lg:hidden">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden mb-4">
                  <img src="/pwa-192x192.png" alt="Insumos Barrera" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Insumos Barrera</h1>
                <p className="text-muted-foreground">Sistema ERP</p>
              </div>

              <div className="kpi-card">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Iniciar Sesión</h2>
                  <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Realizado por{' '}
                    <a
                      href="https://joshuachavl.vercel.app/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Joshua Chávez
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
