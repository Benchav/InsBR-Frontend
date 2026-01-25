import { useState, useEffect } from 'react';
import { StockService } from '../services/stockService';
import { CategorySelect } from '../components/CategorySelect';

import { BranchSelect } from '../components/BranchSelect';
import { Stock } from '../types/api.types';

export const InventoryPage = () => {
    const [stock, setStock] = useState<Stock[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [branchId, setBranchId] = useState('');

    useEffect(() => {
        loadStock();
    }, [selectedCategory, branchId]);

    const loadStock = async () => {
        try {
            const data = await StockService.getByBranch(branchId, selectedCategory);
            setStock(data);
        } catch (error) {
            console.error("Error cargando inventario", error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Inventario</h1>
            <div className="flex gap-4 mb-6">
                <div className="w-64">
                    <label className="block text-sm font-medium">Filtrar por Categoría</label>
                    <CategorySelect 
                        value={selectedCategory} 
                        onChange={setSelectedCategory} 
                    />
                </div>
                <div className="w-64">
                    <label className="block text-sm font-medium">Filtrar por Sucursal</label>
                    <BranchSelect
                        value={branchId}
                        onChange={setBranchId}
                    />
                </div>
            </div>
            <table className="min-w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 text-left">Producto</th>
                        <th className="p-2 text-left">Categoría</th>
                        <th className="p-2 text-right">Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    {stock.map((item) => (
                        <tr key={item.id} className="border-t">
                            <td className="p-2">{item.product.name}</td>
                            <td className="p-2 text-gray-500">{item.product.category}</td>
                            <td className="p-2 text-right font-bold">{item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
