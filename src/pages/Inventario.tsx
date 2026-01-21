import { DashboardLayout } from '@/components/layout';
import { useBranchStore } from '@/stores/branchStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const mockInventory = [
  { id: '1', name: 'Urea Granulada 46%', sku: 'FER-001-50KG', category: 'Fertilizantes', stockDiriamba: 1250, stockJinotepe: 45, minStock: 100, price: 850 },
  { id: '2', name: 'Semilla Maíz Híbrido DK-4050', sku: 'SEM-MAZ-DKA', category: 'Semillas', stockDiriamba: 300, stockJinotepe: 0, minStock: 50, price: 3200 },
  { id: '3', name: 'Fungicida Preventivo', sku: 'FUN-PREV-1L', category: 'Fungicidas', stockDiriamba: 5, stockJinotepe: 50, minStock: 20, price: 450 },
  { id: '4', name: 'Herbicida Glifosato 5L', sku: 'HER-GLI-5L', category: 'Herbicidas', stockDiriamba: 180, stockJinotepe: 95, minStock: 50, price: 1200 },
  { id: '5', name: 'Insecticida Cipermetrina', sku: 'INS-CIP-1L', category: 'Insecticidas', stockDiriamba: 420, stockJinotepe: 280, minStock: 100, price: 380 },
  { id: '6', name: 'Fertilizante NPK 15-15-15', sku: 'FER-NPK-25KG', category: 'Fertilizantes', stockDiriamba: 890, stockJinotepe: 12, minStock: 200, price: 650 },
];

export default function Inventario() {
  const { currentBranchId } = useBranchStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = mockInventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Sin Stock', class: 'stock-low' };
    if (stock < minStock) return { label: 'Stock Bajo', class: 'stock-low' };
    return { label: 'Normal', class: 'stock-good' };
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario Global</h1>
          <p className="text-muted-foreground">Gestión centralizada de productos y stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="kpi-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left py-4 px-4">Producto</th>
                <th className="table-header text-left py-4 px-4">SKU</th>
                <th className="table-header text-left py-4 px-4">Categoría</th>
                <th className="table-header text-center py-4 px-4">
                  <div className="flex flex-col items-center">
                    <span>Stock Diriamba</span>
                  </div>
                </th>
                <th className="table-header text-center py-4 px-4">
                  <div className="flex flex-col items-center">
                    <span>Stock Jinotepe</span>
                  </div>
                </th>
                <th className="table-header text-center py-4 px-4">Total</th>
                <th className="table-header text-center py-4 px-4">Estado</th>
                <th className="table-header text-right py-4 px-4">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const total = item.stockDiriamba + item.stockJinotepe;
                const diriambaStatus = getStockStatus(item.stockDiriamba, item.minStock);
                const jinotepeStatus = getStockStatus(item.stockJinotepe, item.minStock);
                const overallLow = item.stockDiriamba < item.minStock || item.stockJinotepe < item.minStock;

                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {overallLow && (
                          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                        )}
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground font-mono">{item.sku}</td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary">{item.category}</Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        'font-semibold',
                        item.stockDiriamba < item.minStock ? 'text-destructive' : 'text-foreground'
                      )}>
                        {item.stockDiriamba.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        'font-semibold',
                        item.stockJinotepe < item.minStock ? 'text-destructive' : 'text-foreground'
                      )}>
                        {item.stockJinotepe.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-foreground">
                      {total.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {overallLow ? (
                        <span className="stock-low">Stock Bajo</span>
                      ) : (
                        <span className="stock-good">Normal</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      C$ {item.price.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredInventory.length} de {mockInventory.length} productos</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span>Stock Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span>Stock Bajo</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
