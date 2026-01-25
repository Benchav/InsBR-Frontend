import { DashboardLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  UserCog,
  Shield,
  ShoppingCart,
  MoreHorizontal,
  MapPin,
  Edit,
  Trash2,
  Key,
  Loader2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, User, UserRole } from '@/api/auth.api';
import { branchesApi } from '@/api/branches.api';
import { BRANCHES } from '@/stores/branchStore';
import { toast } from 'sonner';

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return { label: 'Administrador', icon: Shield, class: 'bg-primary/10 text-primary' };
    case 'GERENTE':
      return { label: 'Gerente', icon: UserCog, class: 'bg-success/10 text-success' };
    case 'CAJERO':
      return { label: 'Cajero', icon: ShoppingCart, class: 'bg-warning/10 text-warning' };
    default:
      return { label: role, icon: UserCog, class: 'bg-muted text-muted-foreground' };
  }
};

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    role: 'CAJERO' as UserRole,
    branchId: 'BRANCH-DIR-001',
    password: '',
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    role: 'CAJERO' as UserRole,
    isActive: true,
    password: '',
    branchId: 'BRANCH-DIR-001'
  });

  const queryClient = useQueryClient();

  // Fetch Users
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getAllUsers,
  });

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      authApi.updateUser(id, { isActive }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(getApiErrorMessage(error));
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(getApiErrorMessage(error));
    }
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.getAll,
  });

  const branchOptions = useMemo(() => {
    const base = branches.length
      ? branches
      : BRANCHES.filter((branch) => branch.id !== 'ALL').map((branch) => ({
        id: branch.id,
        name: branch.name,
        code: branch.shortName,
      }));

    const map = new Map<string, { id: string; name: string; code?: string }>();
    base.forEach((branch) => map.set(branch.id, branch));

    // Ensure edited user branch exists in options even if backend returns unexpected IDs
    if (editingUser?.branchId && !map.has(editingUser.branchId)) {
      map.set(editingUser.branchId, {
        id: editingUser.branchId,
        name: editingUser.branchId,
      });
    }

    return Array.from(map.values());
  }, [branches, editingUser]);

  useEffect(() => {
    if (!branchOptions.length) return;
    if (!createForm.branchId) {
      setCreateForm((prev) => ({ ...prev, branchId: branchOptions[0].id }));
    }
  }, [branchOptions, createForm.branchId]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '',
        username: '',
        role: 'CAJERO',
        branchId: 'BRANCH-DIR-001',
        password: '',
        isActive: true
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(getApiErrorMessage(error));
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => authApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(getApiErrorMessage(error));
    }
  });

  // Handlers
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      username: user.username,
      role: user.role,
      isActive: user.isActive ?? true,
      password: '',
      branchId: user.branchId || 'BRANCH-DIR-001'
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    if (!createForm.username.trim()) {
      toast.error('El nombre de usuario es obligatorio');
      return;
    }
    if (createForm.password.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    if (!editForm.username.trim()) {
      toast.error('El nombre de usuario es obligatorio');
      return;
    }
    if (editForm.password && editForm.password.trim().length > 0 && editForm.password.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    updateUserMutation.mutate({
      id: editingUser.userId || editingUser.id,
      data: editForm
    });
  };

  const handleDeactivate = (user: User) => {
    if (!confirm(`¿Desactivar usuario ${user.username}?`)) return;
    const id = user.userId || user.id;
    toggleActiveMutation.mutate({ id, isActive: false });
  };

  const handleReactivate = (user: User) => {
    const id = user.userId || user.id;
    toggleActiveMutation.mutate({ id, isActive: true });
  };

  const handleDelete = (user: User) => {
    if (!confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE a ${user.username}?

Esta acción NO se puede deshacer.`)) return;
    const second = prompt('Escribe "ELIMINAR" para confirmar');
    if (second !== 'ELIMINAR') return;
    const id = user.userId || user.id;
    deleteUserMutation.mutate(id);
  };

  function getApiErrorMessage(error: unknown) {
    const response = (error as { response?: { status?: number; data?: { error?: string; message?: string } } })?.response;
    const status = response?.status;
    const message = response?.data?.message || response?.data?.error;

    if (status === 401) return 'Sesión expirada. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return 'Usuario no encontrado.';
    if (status === 409) return 'El nombre de usuario ya existe.';
    if (status === 422) return 'Datos inválidos. Verifica los campos.';
    return message || 'Ocurrió un error inesperado.';
  }

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = safeUsers.filter(u => u.role === 'ADMIN').length;
  const managerCount = safeUsers.filter(u => u.role === 'GERENTE').length;
  const cashierCount = safeUsers.filter(u => u.role === 'CAJERO').length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administración de personal y permisos del sistema</p>
        </div>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Agrega un nuevo miembro al equipo con sus permisos correspondientes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre de Usuario</Label>
                  <Input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="usuario.sistema" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} type="password" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={createForm.role} onValueChange={(val: UserRole) => setCreateForm({ ...createForm, role: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="GERENTE">Gerente</SelectItem>
                      <SelectItem value="CAJERO">Cajero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal</Label>
                  <Select value={createForm.branchId} onValueChange={(val) => setCreateForm({ ...createForm, branchId: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}{branch.code ? ` (${branch.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending || !createForm.name || !createForm.username || !createForm.password}>
                {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
            <DialogDescription>
              Modifica los datos y permisos del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de Usuario</Label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(val: UserRole) => setEditForm({ ...editForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                    <SelectItem value="CAJERO">Cajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select
                  value={editForm.branchId}
                  onValueChange={(val) => setEditForm({ ...editForm, branchId: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}{branch.code ? ` (${branch.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contraseña (Opcional)</Label>
              <Input
                type="password"
                placeholder="Dejar en blanco para no cambiar"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Usuario Activo</p>
                <p className="text-xs text-muted-foreground">Permitir acceso al sistema</p>
              </div>
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateUserMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{safeUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-sm text-muted-foreground">Administradores</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{managerCount}</p>
              <p className="text-sm text-muted-foreground">Gerentes</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cashierCount}</p>
              <p className="text-sm text-muted-foreground">Cajeros</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Filters Responsive */}
      {/* Mobile: filtros apilados */}
      <div className="flex flex-col gap-2 sm:hidden mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Roles</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="GERENTE">Gerente</SelectItem>
            <SelectItem value="CAJERO">Cajero</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Desktop: filtros en línea */}
      <div className="hidden sm:flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Roles</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="GERENTE">Gerente</SelectItem>
            <SelectItem value="CAJERO">Cajero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : isError ? (
        <div className="p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20 mb-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error al cargar usuarios</h3>
          <p className="text-muted-foreground text-sm">No se pudo conectar con el servidor de usuarios. Verifique que el backend esté activo y el endpoint <code>/api/auth/users</code> sea correcto.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      ) : (
        <>
          {/* Mobile: Cards apiladas */}
          <div className="flex flex-col gap-4 sm:hidden">
            {filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              const RoleIcon = roleConfig.icon;
              const userId = user.userId || user.id;
              return (
                <div key={userId} className="kpi-card relative">
                  <div className={cn(
                    'absolute top-4 right-4 h-3 w-3 rounded-full',
                    user.isActive ? 'bg-success' : 'bg-muted-foreground'
                  )} />
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <span className={cn(
                        'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        roleConfig.class
                      )}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <Badge variant="outline" className={cn(
                        'branch-badge',
                        user.branchId === 'BRANCH-DIR-001' ? 'branch-diriamba' :
                          user.branchId === 'BRANCH-JIN-001' ? 'branch-jinotepe' : ''
                      )}>
                        {user.branchId || 'Sin Sucursal'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                    <p>Último acceso: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.isActive ? (
                          <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Desactivar usuario
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleReactivate(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reactivar usuario
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar Usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              const RoleIcon = roleConfig.icon;
              const userId = user.userId || user.id;
              return (
                <div key={userId} className="kpi-card relative">
                  <div className={cn(
                    'absolute top-4 right-4 h-3 w-3 rounded-full',
                    user.isActive ? 'bg-success' : 'bg-muted-foreground'
                  )} />
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <span className={cn(
                        'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        roleConfig.class
                      )}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <Badge variant="outline" className={cn(
                        'branch-badge',
                        user.branchId === 'BRANCH-DIR-001' ? 'branch-diriamba' :
                          user.branchId === 'BRANCH-JIN-001' ? 'branch-jinotepe' : ''
                      )}>
                        {user.branchId || 'Sin Sucursal'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                    <p>Último acceso: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.isActive ? (
                          <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Desactivar usuario
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleReactivate(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reactivar usuario
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar Usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {safeUsers.length} usuarios
      </div>
    </DashboardLayout>
  );
}
