import { useQuery } from '@tanstack/react-query';
import { unitConversionService } from '@/services/unit-conversion.service';
import { formatCurrency } from '@/utils/formatters';
import { Product } from '@/api/products.api';

interface ProductUnitsCellProps {
    product: Product;
}

export function ProductUnitsCell({ product }: ProductUnitsCellProps) {
    const { data: units = [], isLoading } = useQuery({
        queryKey: ['product-units', product.id],
        queryFn: () => unitConversionService.getProductUnits(product.id),
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return <span className="text-muted-foreground text-xs">...</span>;
    }

    // 1. Filter: Include PURCHASE units if active (since user wants to see "Caja" prices)
    const displayUnits = units
        .filter(u => u.isActive)
        .sort((a, b) => {
            // 2. Sort: BASE first, then by conversion factor
            if (a.unitType === 'BASE') return -1;
            if (b.unitType === 'BASE') return 1;
            return a.conversionFactor - b.conversionFactor;
        });

    if (displayUnits.length === 0) {
        return (
            <div className="flex flex-col text-right">
                <span className="font-bold text-foreground">{formatCurrency(product.retailPrice)}</span>
                {product.unit !== 'UNIDAD' && <span className="text-[10px] text-muted-foreground">x {product.unit}</span>}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5 items-end">
            {displayUnits.map((u) => {
                // Priority: Retail Price > Wholesale Price
                // Use wholesale if Retail is 0 or null
                const priceToShow = (u.retailPrice && u.retailPrice > 0)
                    ? u.retailPrice
                    : u.wholesalePrice;

                const hasPrice = priceToShow !== undefined && priceToShow !== null && priceToShow > 0;

                return (
                    <div
                        key={u.id}
                        className={`flex items-center gap-2 text-xs ${u.unitType === 'BASE' ? 'font-semibold' : ''}`}
                    >
                        <span className="text-muted-foreground text-[10px] uppercase">
                            {u.unitSymbol}:
                        </span>
                        <span className={u.unitType === 'BASE' ? 'text-primary' : ''}>
                            {hasPrice ? formatCurrency(priceToShow) : '-'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
