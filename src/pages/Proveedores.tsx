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
import { Search, Plus, Edit2, Trash2, Loader2, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, Supplier, CreateSupplierDto } from '@/api/suppliers.api';
import { toast } from 'sonner';

export default function Proveedores() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<CreateSupplierDto>({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
    });

    // Queries
    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: suppliersApi.getAll,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: suppliersApi.create,
        onSuccess: () => {
            toast.success('Proveedor creado exitosamente');
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: () => toast.error('Error al crear proveedor'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierDto> }) =>
            suppliersApi.update(id, data),
        onSuccess: () => {
            toast.success('Proveedor actualizado exitosamente');
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: () => toast.error('Error al actualizar proveedor'),
    });

    const deleteMutation = useMutation({
        mutationFn: suppliersApi.delete,
        onSuccess: () => {
            toast.success('Proveedor eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: () => toast.error('Error al eliminar proveedor'),
    });

    // Handlers
    const handleOpenDialog = (supplier?: Supplier) => {
        if (supplier) {
            setSelectedSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactName: supplier.contactName || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                isActive: supplier.isActive,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setSelectedSupplier(null);
        setFormData({
            name: '',
            contactName: '',
            email: '',
            phone: '',
            address: '',
            isActive: true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSupplier) {
            updateMutation.mutate({ id: selectedSupplier.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
            deleteMutation.mutate(id);
        }
    };

    // Filter
    const filteredSuppliers = suppliers.filter(
        (s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
                        <p className="text-muted-foreground">Gestiona tus proveedores</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proveedor
                    </Button>
                </div>

                <Card className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, contacto..."
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
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Email / Teléfono</TableHead>
                                    <TableHead>Dirección</TableHead>
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
                                ) : filteredSuppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron proveedores
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSuppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Truck className="h-4 w-4 text-primary" />
                                                    </div>
                                                    {supplier.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{supplier.contactName || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    {supplier.email && <span>{supplier.email}</span>}
                                                    {supplier.phone && <span className="text-muted-foreground">{supplier.phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{supplier.address || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                                                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(supplier)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(supplier.id)}
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
                            <DialogTitle>{selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                            <DialogDescription>
                                Ingresa los datos del proveedor.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Empresa / Nombre</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Nombre de Contacto</Label>
                                    <Input
                                        id="contactName"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    />
                                </div>
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
                                <Label htmlFor="isActive">Proveedor Activo</Label>
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
