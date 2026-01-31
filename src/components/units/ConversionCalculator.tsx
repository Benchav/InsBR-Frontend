import { useEffect, useState } from 'react';
import { unitsApi } from '@/api/units.api';
import { ArrowLeftRight, Loader2 } from 'lucide-react';

interface ConversionCalculatorProps {
    productId: string;
    fromUnitId: string;
    quantity: number;
}

export function ConversionCalculator({ productId, fromUnitId, quantity }: ConversionCalculatorProps) {
    const [baseQuantity, setBaseQuantity] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const calculate = async () => {
            if (!fromUnitId || !productId || quantity <= 0) {
                setBaseQuantity(null);
                return;
            }

            try {
                setLoading(true);
                // Using toUnitId undefined implies conversion to base unit usually, 
                // but let's assume the API returns baseQuantity in the result regardless.
                const result = await unitsApi.convert({
                    quantity,
                    fromUnitId,
                    productId
                });

                if (mounted) {
                    setBaseQuantity(result.baseQuantity);
                }
            } catch (error) {
                console.error("Conversion error", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Debounce slightly to avoid aggressive API calls
        const timer = setTimeout(calculate, 300);
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [productId, fromUnitId, quantity]);

    if (loading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;

    if (baseQuantity === null) return null;

    return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <ArrowLeftRight className="h-3 w-3" />
            <span>= {baseQuantity % 1 === 0 ? baseQuantity : baseQuantity.toFixed(2)} ud. base</span>
        </div>
    );
}
