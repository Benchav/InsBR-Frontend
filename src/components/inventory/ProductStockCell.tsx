import { useQuery } from '@tanstack/react-query';
import { unitConversionService } from '@/services/unit-conversion.service';
import { cn } from '@/lib/utils';
import { Product } from '@/api/products.api';

interface ProductStockCellProps {
    product: Product;
    stock: number;
}

export function ProductStockCell({ product, stock }: ProductStockCellProps) {
    const { data: units = [], isLoading } = useQuery({
        queryKey: ['product-units', product.id],
        queryFn: () => unitConversionService.getProductUnits(product.id),
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return <span className="text-muted-foreground text-xs">...</span>;
    }

    // Filter active units to show conversions
    // We want to show the stock in terms of these units.
    // Example: 3500 stock, Unit "Quintal" factor 100 => 35.00 QQ

    // 1. Always show Base Unit first (Raw Stock)
    const baseUnitDisplay = (
        <div className={cn("text-xs font-semibold", stock < 10 ? "text-destructive" : "text-foreground")}>
            {stock} <span className="text-[10px] text-muted-foreground font-normal">{product.unit || 'UNID'}</span>
        </div>
    );

    // 2. Filter other units
    const otherUnits = units
        .filter(u => u.isActive && u.unitType !== 'BASE')
        .sort((a, b) => a.conversionFactor - b.conversionFactor);

    if (otherUnits.length === 0) {
        return baseUnitDisplay;
    }

    return (
        <div className="flex flex-col items-center gap-0.5">
            {baseUnitDisplay}
            {otherUnits.map(u => {
                const convertedStock = stock / u.conversionFactor;
                // Show up to 2 decimal places, strip trailing zeros if possible
                const formatted = Number(convertedStock.toFixed(2));

                return (
                    <div key={u.id} className="text-[11px] text-muted-foreground">
                        {formatted} {u.unitSymbol}
                    </div>
                );
            })}
        </div>
    );
}
