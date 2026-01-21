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
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Key,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
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
import { authApi, User } from '@/api/auth.api';
import { toast } from 'sonner';

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return { label: 'Administrador', icon: Shield, class: 'bg-primary/10 text-primary' };
    case 'SELLER':
      return { label: 'Vendedor', icon: ShoppingCart, class: 'bg-success/10 text-success' };
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

  // Form States for Edit
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'SELLER' as 'ADMIN' | 'SELLER',
    isActive: true,
    password: '',
    branchId: 'diriamba' // keeping default or from user
  });

  const queryClient = useQueryClient();

  // Fetch Users
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getAllUsers,
  });

  // Mutations
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
      toast.error('Error al actualizar usuario');
    }
  });

  // Handlers
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      isActive: user.isActive ?? true,
      password: '',
      branchId: user.branchId || 'diriamba'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.userId || editingUser.id, // Support both depending on API return
      data: editForm
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const sellerCount = users.filter(u => u.role === 'SELLER').length;
  const activeCount = users.filter(u => u.isActive).length;

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
            {/* Create form placehodler - Implementation would be similar to Edit but with Create logic */}
            <div className="grid gap-4 py-4">
              {/* Simplified for brevity as focus is Edit, but structure exists */}
              <p className="text-sm text-muted-foreground">Formulario de creación pendiente de implementación completa.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              {/* <Button onClick={handleCreateUser}>Crear Usuario</Button> */}
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
                  onValueChange={(val: 'ADMIN' | 'SELLER') => setEditForm({ ...editForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SELLER">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {/* Branch Selector if needed, mostly for SELLER */}
                <Label>Sucursal</Label>
                <Select
                  value={editForm.branchId}
                  onValueChange={(val) => setEditForm({ ...editForm, branchId: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diriamba">Diriamba</SelectItem>
                    <SelectItem value="jinotepe">Jinotepe</SelectItem>
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
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
            </div>
          </div>
        </div>

        {/* ... (Keeping other stats cards similar logic but with real counts calculated above) ... */}
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
              <ShoppingCart className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sellerCount}</p>
              <p className="text-sm text-muted-foreground">Vendedores</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
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
            <SelectItem value="SELLER">Vendedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : isError ? (
        <div className="p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20 mb-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error al cargar usuarios</h3>
          <p className="text-muted-foreground text-sm">No se pudo conectar con el servidor de usuarios. Verifique que el backend esté activo y el endpoint <code>/api/auth/users</code> sea correcto.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const roleConfig = getRoleConfig(user.role);
            const RoleIcon = roleConfig.icon;
            // Handle different ID field names if API varies
            const userId = user.userId || user.id;

            return (
              <div key={userId} className="kpi-card relative">
                {/* Status indicator */}
                <div className={cn(
                  'absolute top-4 right-4 h-3 w-3 rounded-full',
                  user.isActive ? 'bg-success' : 'bg-muted-foreground'
                )} />

                {/* User Info */}
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

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <Badge variant="outline" className={cn(
                      'branch-badge',
                      user.branchId === 'diriamba' ? 'branch-diriamba' :
                        user.branchId === 'jinotepe' ? 'branch-jinotepe' : ''
                    )}>
                      {user.branchId || 'Sin Sucursal'}
                    </Badge>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                  <p>Último acceso: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {/* Password reset usually separate or part of Edit logic, hiding standalone unless requested */}
                    {/* <Button variant="outline" size="sm">
                      <Key className="h-4 w-4 mr-1" />
                      Contraseña
                    </Button> */}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
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
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </div>
    </DashboardLayout>
  );
}
