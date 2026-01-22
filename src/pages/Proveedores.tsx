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
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, Loader2, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, Supplier, CreateSupplierDto } from '@/api/suppliers.api';
import { toast } from 'sonner';

const defaultForm: CreateSupplierDto = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  taxId: '',
  creditDays: 0,
  creditLimit: 0,
  isActive: true,
};

export default function Proveedores() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplierDto>(defaultForm);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      toast.success('Proveedor creado correctamente');
      setIsDialogOpen(false);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Error al crear proveedor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierDto> }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      toast.success('Proveedor actualizado correctamente');
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setFormData(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Error al actualizar proveedor'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSupplierDto }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      toast.success('Proveedor eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Error al eliminar proveedor'),
  });

  const openCreate = () => {
    setEditingSupplier(null);
    setFormData(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      creditDays: supplier.creditDays || 0,
      creditLimit: supplier.creditLimit ?? 0,
      isActive: supplier.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm('¿Deseas eliminar este proveedor?')) {
      deleteMutation.mutate({
        id: supplier.id,
        data: {
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          taxId: supplier.taxId,
          creditDays: supplier.creditDays,
          creditLimit: supplier.creditLimit,
          isActive: false,
        },
      });
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const term = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(term) ||
      supplier.contactName?.toLowerCase().includes(term) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.taxId?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Proveedores</h1>
            <p className="text-muted-foreground">Administra condiciones de crédito y contacto</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por empresa o contacto"
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">{filteredSuppliers.length} proveedores</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Crédito</TableHead>
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
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay proveedores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span>{supplier.name}</span>
                            <span className="text-xs text-muted-foreground">{supplier.taxId || 'Sin RUC'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{supplier.contactName || 'Sin contacto'}</span>
                          <span className="text-xs text-muted-foreground">{supplier.email || 'Sin correo'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {supplier.creditDays ? `${supplier.creditDays} días` : 'Contado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? 'default' : 'outline'}>
                          {supplier.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(supplier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier)}>
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
            <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Actualiza los acuerdos comerciales del proveedor.'
                : 'Registra un nuevo proveedor con sus condiciones de crédito.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre Comercial</Label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Proveedor S.A."
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
                  placeholder="correo@proveedor.com"
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
                <Label>Días de Crédito</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.creditDays ?? 0}
                  onChange={(event) =>
                    setFormData({ ...formData, creditDays: Number(event.target.value) })
                  }
                  placeholder="0"
                />
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
                  placeholder="Dirección fiscal o de despacho"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Proveedor activo</p>
                <p className="text-xs text-muted-foreground">Habilita órdenes y compras.</p>
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
