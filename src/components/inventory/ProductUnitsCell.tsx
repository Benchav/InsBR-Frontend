import { useQuery } from '@tanstack/react-query';
import { unitConversionService } from '@/services/unit-conversion.service';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Product } from '@/api/products.api';

interface ProductUnitsCellProps {
    product: Product;
}

export function ProductUnitsCell({ product }: ProductUnitsCellProps) {
    const { data: units = [], isLoading } = useQuery({
        queryKey: ['product-units', product.id],
        queryFn: () => unitConversionService.getProductUnits(product.id),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    if (isLoading) {
        return <span className="text-muted-foreground text-xs">Cargando...</span>;
    }

    // If no units configured, just show the base price from product
    // OR if the list is empty, show default.
    // We want to combine the info. 
    // Typically, the "BASE" unit from the units list should match the product base price.
    // If the list is empty, we fallback to product fields.

    const activeUnits = units.filter(u => u.isActive);

    if (activeUnits.length === 0) {
        return (
            <div className="flex flex-col text-right">
                <span className="font-bold text-foreground">{formatCurrency(product.retailPrice)}</span>
                <span className="text-[10px] text-muted-foreground">x {product.unit}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 items-end">
            {activeUnits.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground text-[10px] uppercase">
                        {u.unitName} ({u.unitSymbol}):
                    </span>
                    <span className="font-medium">
                        {u.retailPrice ? formatCurrency(u.retailPrice) : '-'}
                    </span>
                </div>
            ))}
        </div>
    );
}
