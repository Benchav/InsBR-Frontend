import { useEffect, useState } from 'react';
import { CategoryService } from '../services/categoryService';
import { Category } from '../types/api.types';

interface Props {
    value?: string;
    onChange: (catId: string) => void;
}

export const CategorySelect = ({ value, onChange }: Props) => {
    const [categories, setCategories] = useState<Category[]>([]);
    useEffect(() => {
        CategoryService.getAll().then(setCategories);
    }, []);
    return (
        <select 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="border p-2 rounded"
        >
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                    {cat.name}
                </option>
            ))}
        </select>
    );
};
