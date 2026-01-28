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
    onError: (error) => {
      console.error(error);
      const errorData = (error as any).response?.data;
      const errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData) || 'Error al crear cliente';
      toast.error(`Error al crear cliente: ${errorMessage}`);
    },
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

    const cleanData: any = {
      ...formData,
      contactName: formData.contactName || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      taxId: formData.taxId || undefined,
      creditLimit: formData.creditLimit || 0
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
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

          {/* Vista responsive: tarjetas en móvil, tabla en desktop */}
          <div className="mt-4">
            {/* Mobile: Cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {isLoading ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">
                  No hay clientes registrados
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <UserCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-base text-foreground truncate">{customer.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{customer.taxId || 'Sin RUC'}</span>
                      </div>
                      <Badge variant={customer.isActive ? 'default' : 'outline'} className="shrink-0">
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 text-sm mt-1">
                      <span className="font-medium">{customer.contactName || 'Sin contacto'}</span>
                      <span className="text-xs text-muted-foreground truncate">{customer.email || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Tel: {customer.phone || '-'}</span>
                      <span className="ml-auto"><Badge variant="secondary">{customer.type === 'WHOLESALE' ? 'Mayorista' : 'Retail'}</Badge></span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(customer)}>
                        <Pencil className="h-4 w-4 mr-1" />Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(customer)}>
                        <Trash2 className="h-4 w-4 mr-1" />Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop: Table */}
            <div className="hidden sm:block rounded-md border overflow-x-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razón Social / Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">RUC / Cédula</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contacto Principal</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cliente</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'RETAIL' | 'WHOLESALE') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail (Consumidor Final)</SelectItem>
                    <SelectItem value="WHOLESALE">Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Límite de Crédito (C$)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.creditLimit === 0 ? '' : formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Ingrese el monto en Córdobas (C$)</p>
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Cliente Activo</Label>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCustomer ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
