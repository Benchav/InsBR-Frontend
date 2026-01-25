
import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { CategoryService } from '@/services/categoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

// Simulación de API de productos (reemplaza por tu servicio real)
const fakeProductApi = {
  getAll: async (): Promise<Product[]> => [],
  create: async (data: Partial<Product>) => {},
  update: async (id: string, data: Partial<Product>) => {},
  delete: async (id: string) => {},
};

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<{ name: string; categoryId: string }>({ name: '', categoryId: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fakeProductApi.getAll();
      setProducts(data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch {
      toast.error('Error al cargar categorías');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: '', categoryId: '' });
    setModalOpen(true);
  };

  const openEdit = (prod: Product) => {
    setEditProduct(prod);
    setForm({ name: prod.name, categoryId: prod.categoryId || '' });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await fakeProductApi.delete(id);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) {
      toast.error('Nombre y categoría requeridos');
      return;
    }
    try {
      if (editProduct) {
        await fakeProductApi.update(editProduct.id, { name: form.name, categoryId: form.categoryId });
        toast.success('Producto actualizado');
      } else {
        await fakeProductApi.create({ name: form.name, categoryId: form.categoryId });
        toast.success('Producto creado');
      }
      setModalOpen(false);
      fetchProducts();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter((prod) =>
      prod.name.toLowerCase().includes(term) ||
      (prod.category?.toLowerCase().includes(term) ?? false)
    );
  }, [products, searchTerm]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Productos</h1>
            <p className="text-muted-foreground">Gestión de productos</p>
          </div>
          <Button onClick={openNew}>Nuevo Producto</Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o categoría"
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">{filteredProducts.length} productos</div>
          </div>

          <div className="mt-4 rounded-md border overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(prod => (
                  <TableRow key={prod.id}>
                    <TableCell>{prod.name}</TableCell>
                    <TableCell>{prod.category || '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEdit(prod)}>Editar</Button>{' '}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(prod.id)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Nombre *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Categoría *</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
