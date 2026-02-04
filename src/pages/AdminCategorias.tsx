import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Category } from '@/types/category';
import { CategoryService } from '@/services/categoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { Search } from 'lucide-react';

export default function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (error: any) {
      let message = 'Error al cargar categorías';
      if (error?.response) {
        message += ` (Status ${error.response.status}: ${error.response.statusText || error.message})`;
        if (error.response.data && typeof error.response.data === 'object') {
          message += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error?.message) {
        message += ` (${error.message})`;
      }
      toast.error(message);
      // Log completo en consola para depuración
      // eslint-disable-next-line no-console
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openNew = () => {
    setEditCategory(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await CategoryService.delete(id);
      toast.success('Categoría eliminada');
      fetchCategories();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      if (editCategory) {
        await CategoryService.update(editCategory.id, { name: form.name, description: form.description });
        toast.success('Categoría actualizada');
      } else {
        await CategoryService.create({ name: form.name, description: form.description });
        toast.success('Categoría creada');
      }
      setModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(term) ||
      (cat.description?.toLowerCase().includes(term) ?? false)
    );
  }, [categories, searchTerm]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 px-2 sm:px-4 md:gap-6 md:px-0 w-full max-w-6xl mx-auto">
        {/* Header y botón */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4 w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Categorías</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gestión de categorías de productos</p>
          </div>
          <Button className="w-full md:w-auto" onClick={openNew}>Nueva Categoría</Button>
        </div>

        {/* Card con tabla y buscador */}
        <Card className="p-2 sm:p-4 w-full">
          <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-right mt-1 md:mt-0">{filteredCategories.length} categorías</div>
          </div>

          {/* Vista responsive: tarjetas en móvil, tabla en desktop */}
          <div className="mt-2 sm:mt-4">
            {/* Mobile: Cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-background">No hay categorías</div>
              ) : (
                filteredCategories.map(cat => (
                  <div key={cat.id} className="rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-base text-foreground truncate">{cat.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{cat.isActive ? 'Activo' : 'Inactivo'}</span>
                    </div>
                    {cat.description && (
                      <div className="text-xs text-muted-foreground truncate">{cat.description}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(cat)}>Editar</Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(cat.id)}>Eliminar</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop: Table */}
            <div className="hidden sm:block rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              <Table className="min-w-[600px] text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[180px]">Nombre</TableHead>
                    <TableHead className="whitespace-nowrap">Descripción</TableHead>
                    <TableHead className="whitespace-nowrap">Estado</TableHead>
                    <TableHead className="whitespace-nowrap">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No hay categorías</TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell className="min-w-[200px] whitespace-normal font-semibold">{cat.name}</TableCell>
                        <TableCell className="whitespace-normal">{cat.description || '—'}</TableCell>
                        <TableCell>{cat.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                        <TableCell className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openEdit(cat)}>Editar</Button>
                          <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleDelete(cat.id)}>Eliminar</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {/* Modal de formulario */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-xs sm:max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{editCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block mb-1 font-medium text-sm">Nombre *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="text-sm" />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Descripción</label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-sm" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
