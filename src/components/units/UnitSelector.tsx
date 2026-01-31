import { useEffect, useState } from 'react';
import { UnitConversion } from '@/types/units.types';
import { unitsApi } from '@/api/units.api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';

interface UnitSelectorProps {
    productId: string;
    salesType?: 'RETAIL' | 'WHOLESALE';  // Optional now
    filterMode?: 'SALES' | 'ALL';        // New prop to control filtering
    selectedUnitId?: string;
    onUnitChange: (unit: UnitConversion | null) => void;
    disabled?: boolean;
}

export function UnitSelector({ productId, salesType, filterMode = 'SALES', selectedUnitId, onUnitChange, disabled }: UnitSelectorProps) {
    const [units, setUnits] = useState<UnitConversion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadUnits = async () => {
            if (!productId) {
                setUnits([]);
                return;
            }

            try {
                setLoading(true);
                const data = await unitsApi.getUnits(productId);

                if (mounted) {
                    let filtered = data;

                    if (filterMode === 'SALES' && salesType) {
                        filtered = data.filter(u =>
                            u.isActive && (u.salesType === 'BOTH' || u.salesType === salesType)
                        );
                    } else {
                        // Show all active units for Purchases or management
                        filtered = data.filter(u => u.isActive);
                    }

                    setUnits(filtered);

                    // Auto-select if nothing selected OR if current selection is invalid for new type
                    if (!selectedUnitId || !filtered.find(u => u.id === selectedUnitId)) {
                        // Prefer a "BASE" unit or the first available one
                        const defaultUnit = filtered.find(u => u.unitType === 'BASE') || filtered[0];
                        if (defaultUnit) {
                            onUnitChange(defaultUnit);
                        } else {
                            onUnitChange(null);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading units", error);
                if (mounted) setUnits([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadUnits();

        return () => { mounted = false; };
    }, [productId, salesType]);

    // Handlers
    const handleChange = (unitId: string) => {
        const unit = units.find(u => u.id === unitId) || null;
        onUnitChange(unit);
    };

    if (loading) return <div className="h-9 w-full bg-muted animate-pulse rounded-md" />;

    if (units.length === 0) return null; // No custom units, render nothing (fallback to product default)

    return (
        <Select
            value={selectedUnitId || ''}
            onValueChange={handleChange}
            disabled={disabled}
        >
            <SelectTrigger className="h-8 text-xs w-full min-w-[120px]">
                <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
                {units.map((unit) => {
                    let priceDisplay = '';
                    if (salesType === 'RETAIL' && unit.retailPrice) priceDisplay = ` - ${formatCurrency(unit.retailPrice)}`;
                    if (salesType === 'WHOLESALE' && unit.wholesalePrice) priceDisplay = ` - ${formatCurrency(unit.wholesalePrice)}`;

                    return (
                        <SelectItem key={unit.id} value={unit.id} className="text-xs">
                            {unit.unitName} ({unit.unitSymbol}){priceDisplay}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
