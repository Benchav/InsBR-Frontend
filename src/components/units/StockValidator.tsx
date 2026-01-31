
import { useEffect, useState } from 'react';
import { unitsApi } from '@/api/units.api';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface StockValidatorProps {
    productId: string;
    unitId?: string;
    quantity: number;
    currentStock: number;
    className?: string;
}

export function StockValidator({ productId, unitId, quantity, currentStock, className }: StockValidatorProps) {
    const [requiredBase, setRequiredBase] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        const check = async () => {
            // If no specific unit is selected, the quantity IS the base quantity
            if (!unitId) {
                if (mounted) setRequiredBase(quantity);
                return;
            }

            if (quantity <= 0) {
                if (mounted) setRequiredBase(0);
                return;
            }

            setLoading(true);
            try {
                const res = await unitsApi.convert({
                    productId,
                    fromUnitId: unitId,
                    quantity
                });
                if (mounted) setRequiredBase(res.baseQuantity);
            } catch (err) {
                console.error("Stock validation error", err);
                // On error, assume 1:1 conversion to avoid blocking gracefully? 
                // Or keep 0 to show error? keeping 0 might mean "valid" if logic is >= 0
                // Let's set it to quantity as fallback
                if (mounted) setRequiredBase(quantity);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        check();
        return () => { mounted = false; };
    }, [productId, unitId, quantity]);

    if (loading) return <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}><Loader2 className="h-3 w-3 animate-spin" /> Verificando...</div>;

    const isValid = currentStock >= requiredBase;

    // Optional: Round visuals
    const displayReq = Number(requiredBase.toFixed(2));
    const displayStock = Number(currentStock.toFixed(2));

    return (
        <div className={cn("flex items-center gap-2 text-xs", className)}>
            {isValid ? (
                <span className="text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <CheckCircle className="h-3 w-3" /> Stock OK
                </span>
            ) : (
                <span className="text-destructive flex items-center gap-1 font-medium bg-destructive/5 px-2 py-0.5 rounded-full border border-destructive/10">
                    <AlertTriangle className="h-3 w-3" /> Falta Stock (Req: {displayReq})
                </span>
            )}
            {/* Debug info text if needed, or keep clean */}
        </div>
    );
}
