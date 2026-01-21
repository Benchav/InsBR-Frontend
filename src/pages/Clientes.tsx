import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit2, Trash2, Loader2, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer, CreateCustomerDto } from '@/api/customers.api';
import { toast } from 'sonner';

export default function Clientes() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<CreateCustomerDto>({
        name: '',
        email: '',
        phone: '',
        address: '',
        documentId: '',
        isActive: true,
    });

    // Queries
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customersApi.getAll(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: customersApi.create,
        onSuccess: () => {
            toast.success('Cliente creado exitosamente');
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: () => toast.error('Error al crear cliente'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerDto> }) =>
            customersApi.update(id, data),
        onSuccess: () => {
            toast.success('Cliente actualizado exitosamente');
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: () => toast.error('Error al actualizar cliente'),
    });

    const deleteMutation = useMutation({
        mutationFn: customersApi.delete,
        onSuccess: () => {
            toast.success('Cliente eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: () => toast.error('Error al eliminar cliente'),
    });

    // Handlers
    const handleOpenDialog = (customer?: Customer) => {
        if (customer) {
            setSelectedCustomer(customer);
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                documentId: customer.documentId || '',
                isActive: customer.isActive,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            documentId: '',
            isActive: true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    // Filter
    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.documentId?.includes(searchTerm) ||
            c.phone?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                        <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </div>

                <Card className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, cédula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Documento / ID</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron clientes
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    {customer.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{customer.documentId || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    {customer.email && <span>{customer.email}</span>}
                                                    {customer.phone && <span className="text-muted-foreground">{customer.phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{customer.address || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                                                    {customer.isActive ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(customer)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(customer.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                            <DialogDescription>
                                Ingresa los datos del cliente. Click en guardar para confirmar.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="documentId">Documento (ID / Cédula)</Label>
                                <Input
                                    id="documentId"
                                    value={formData.documentId}
                                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="rounded border-gray-300"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <Label htmlFor="isActive">Cliente Activo</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
