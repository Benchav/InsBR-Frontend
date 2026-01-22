import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, Loader2, UserCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer, CreateCustomerDto } from '@/api/customers.api';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores/branchStore';

const defaultForm: CreateCustomerDto = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  taxId: '',
  creditLimit: 0,
  type: 'RETAIL',
  isActive: true,
};

export default function Clientes() {
  const { currentBranchId } = useBranchStore();
  const branchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerDto>(defaultForm);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', branchId],
    queryFn: () => customersApi.getAll(branchId ? { branchId } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      toast.success('Cliente creado correctamente');
      setIsDialogOpen(false);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Error al crear cliente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerDto> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      toast.success('Cliente actualizado correctamente');
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Error al actualizar cliente'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCustomerDto }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      toast.success('Cliente eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Error al eliminar cliente'),
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contactName: customer.contactName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
      creditLimit: customer.creditLimit ?? 0,
      type: customer.type,
      isActive: customer.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (customer: Customer) => {
    if (confirm('¿Deseas eliminar este cliente?')) {
      deleteMutation.mutate({
        id: customer.id,
        data: {
          name: customer.name,
          contactName: customer.contactName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          taxId: customer.taxId,
          creditLimit: customer.creditLimit,
          type: customer.type,
          isActive: false,
        },
      });
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      customer.contactName?.toLowerCase().includes(term) ||
      customer.phone?.includes(searchTerm) ||
      customer.taxId?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
            <p className="text-muted-foreground">Controla contactos, condiciones y estatus de clientes</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, contacto o RUC"
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">{filteredCustomers.length} clientes</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay clientes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <UserCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs text-muted-foreground">{customer.taxId || 'Sin RUC'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{customer.contactName || 'Sin contacto'}</span>
                          <span className="text-xs text-muted-foreground">{customer.email || 'Sin correo'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customer.type === 'WHOLESALE' ? 'Mayorista' : 'Retail'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? 'default' : 'outline'}>
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(customer)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Actualiza la información comercial del cliente.'
                : 'Registra un nuevo cliente con su información clave.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre Comercial</Label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Cliente S.A."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input
                  value={formData.contactName}
                  onChange={(event) => setFormData({ ...formData, contactName: event.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  placeholder="+505 0000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  placeholder="correo@cliente.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>RUC / Tax ID</Label>
                <Input
                  value={formData.taxId}
                  onChange={(event) => setFormData({ ...formData, taxId: event.target.value })}
                  placeholder="J0310000000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'RETAIL' | 'WHOLESALE') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Límite de Crédito</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.creditLimit ?? 0}
                  onChange={(event) =>
                    setFormData({ ...formData, creditLimit: Number(event.target.value) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  placeholder="Dirección fiscal o comercial"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Cliente activo</p>
                <p className="text-xs text-muted-foreground">Habilita operaciones comerciales.</p>
              </div>
              <Switch
                checked={!!formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
