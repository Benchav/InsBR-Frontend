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
  Key
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

const mockUsers = [
  { 
    id: '1', 
    name: 'Carlos Méndez', 
    username: 'cmendez',
    email: 'carlos@insumosbarrera.com', 
    phone: '+505 8888-1234',
    role: 'ADMIN' as const, 
    branch: 'Diriamba',
    isActive: true,
    lastLogin: '25 Oct, 2024 - 09:30 AM',
    createdAt: '15 Ene, 2024'
  },
  { 
    id: '2', 
    name: 'María López', 
    username: 'mlopez',
    email: 'maria@insumosbarrera.com', 
    phone: '+505 8888-5678',
    role: 'SELLER' as const, 
    branch: 'Jinotepe',
    isActive: true,
    lastLogin: '25 Oct, 2024 - 08:15 AM',
    createdAt: '20 Feb, 2024'
  },
  { 
    id: '3', 
    name: 'Juan Pérez', 
    username: 'jperez',
    email: 'juan@insumosbarrera.com', 
    phone: '+505 8888-9012',
    role: 'SELLER' as const, 
    branch: 'Diriamba',
    isActive: true,
    lastLogin: '24 Oct, 2024 - 05:45 PM',
    createdAt: '10 Mar, 2024'
  },
  { 
    id: '4', 
    name: 'Ana García', 
    username: 'agarcia',
    email: 'ana@insumosbarrera.com', 
    phone: '+505 8888-3456',
    role: 'SELLER' as const, 
    branch: 'Jinotepe',
    isActive: false,
    lastLogin: '15 Oct, 2024 - 10:00 AM',
    createdAt: '05 Abr, 2024'
  },
];

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = mockUsers.filter(u => u.role === 'ADMIN').length;
  const sellerCount = mockUsers.filter(u => u.role === 'SELLER').length;
  const activeCount = mockUsers.filter(u => u.isActive).length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administración de personal y permisos del sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Input placeholder="Nombre del usuario" />
                </div>
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <Input placeholder="nombre.usuario" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input type="email" placeholder="correo@insumosbarrera.com" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="+505 8888-0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select defaultValue="SELLER">
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
                  <Label>Sucursal</Label>
                  <Select defaultValue="diriamba">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diriamba">Diriamba</SelectItem>
                      <SelectItem value="jinotepe">Jinotepe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contraseña Temporal</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Usuario Activo</p>
                  <p className="text-xs text-muted-foreground">El usuario podrá iniciar sesión inmediatamente</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsDialogOpen(false)}>Crear Usuario</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockUsers.length}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const roleConfig = getRoleConfig(user.role);
          const RoleIcon = roleConfig.icon;

          return (
            <div key={user.id} className="kpi-card relative">
              {/* Status indicator */}
              <div className={cn(
                'absolute top-4 right-4 h-3 w-3 rounded-full',
                user.isActive ? 'bg-success' : 'bg-muted-foreground'
              )} />

              {/* User Info */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('')}
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
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <Badge variant="outline" className={cn(
                    'branch-badge',
                    user.branch === 'Diriamba' ? 'branch-diriamba' : 'branch-jinotepe'
                  )}>
                    Sucursal {user.branch}
                  </Badge>
                </div>
              </div>

              {/* Meta Info */}
              <div className="text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                <p>Último acceso: {user.lastLogin}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-1" />
                    Contraseña
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                    <DropdownMenuItem>Cambiar Sucursal</DropdownMenuItem>
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

      {/* Summary Footer */}
      <div className="mt-6 text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {mockUsers.length} usuarios
      </div>
    </DashboardLayout>
  );
}
