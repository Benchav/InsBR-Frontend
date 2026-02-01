import { useState, useEffect } from 'react';
import { UnitConversion } from '@/types/units.types';
import { unitConversionService } from '@/services/unit-conversion.service';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface UnitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    unit?: UnitConversion; // Si existe, es edición
    onSuccess: () => void;
}

export function UnitFormModal({
    isOpen,
    onClose,
    productId,
    unit,
    onSuccess
}: UnitFormModalProps) {
    const [formData, setFormData] = useState({
        unitName: '',
        unitSymbol: '',
        conversionFactor: '1', // String to handle decimals better in inputs
        unitType: 'SALE' as 'BASE' | 'PURCHASE' | 'SALE',
        salesType: 'BOTH' as 'RETAIL' | 'WHOLESALE' | 'BOTH',
        retailPrice: '',
        wholesalePrice: '',
        isActive: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (unit) {
            setFormData({
                unitName: unit.unitName,
                unitSymbol: unit.unitSymbol,
                conversionFactor: unit.conversionFactor.toString(),
                unitType: unit.unitType,
                salesType: unit.salesType,
                retailPrice: unit.retailPrice ? (unit.retailPrice / 100).toString() : '',
                wholesalePrice: unit.wholesalePrice ? (unit.wholesalePrice / 100).toString() : '',
                isActive: unit.isActive
            });
        } else {
            // Reset Logic somewhat handled by re-mounting logic if key changes or explicit reset
            setFormData({
                unitName: '',
                unitSymbol: '',
                conversionFactor: '1',
                unitType: 'SALE',
                salesType: 'BOTH',
                retailPrice: '',
                wholesalePrice: '',
                isActive: true
            });
        }
    }, [unit, isOpen]); // Reset when opening/closing or changing unit

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const conversionFactorNum = parseFloat(formData.conversionFactor);
        if (isNaN(conversionFactorNum) || conversionFactorNum <= 0) {
            setError("El factor de conversión debe ser numérico y mayor a 0");
            setLoading(false);
            return;
        }

        try {
            const data = {
                unitName: formData.unitName,
                unitSymbol: formData.unitSymbol,
                conversionFactor: conversionFactorNum,
                unitType: formData.unitType,
                salesType: formData.salesType,
                retailPrice: formData.retailPrice
                    ? Math.round(parseFloat(formData.retailPrice) * 100)
                    : undefined,
                wholesalePrice: formData.wholesalePrice
                    ? Math.round(parseFloat(formData.wholesalePrice) * 100)
                    : undefined,
                isActive: formData.isActive
            };

            if (unit) {
                await unitConversionService.updateUnit(unit.id, data);
            } else {
                await unitConversionService.createUnit(productId, data);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || err.message || 'Error al guardar la unidad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{unit ? 'Editar Unidad' : 'Nueva Unidad de Medida'}</DialogTitle>
                    <DialogDescription>
                        Define las características de conversión y precios para esta unidad.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Nombre y Símbolo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Unidad *</Label>
                            <Input
                                value={formData.unitName}
                                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                                placeholder="Ej: Quintal, Caja, Litro"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Símbolo (Abreviatura) *</Label>
                            <Input
                                value={formData.unitSymbol}
                                onChange={(e) => setFormData({ ...formData, unitSymbol: e.target.value })}
                                placeholder="Ej: qq, cja, L"
                                required
                            />
                        </div>
                    </div>

                    {/* Factor de Conversión */}
                    <div className="space-y-2">
                        <Label>Factor de Conversión *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.conversionFactor}
                            onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                            required
                            disabled={unit?.unitType === 'BASE'}
                            className="bg-background"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Cuántas unidades base equivalen a esta unidad. Ej: 1 Quintal = 100 Libras. (Si es BASE, es 1).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tipo de Unidad */}
                        <div className="space-y-2">
                            <Label>Tipo de Unidad *</Label>
                            <Select
                                value={formData.unitType}
                                onValueChange={(val: any) => setFormData({ ...formData, unitType: val })}
                                disabled={unit?.unitType === 'BASE'}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BASE">BASE (Inventario)</SelectItem>
                                    <SelectItem value="PURCHASE">COMPRA (Solo Entradas)</SelectItem>
                                    <SelectItem value="SALE">VENTA (Comercial)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tipo de Venta */}
                        <div className="space-y-2">
                            <Label>Disponible para *</Label>
                            <Select
                                value={formData.salesType}
                                onValueChange={(val: any) => setFormData({ ...formData, salesType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RETAIL">Solo Menudeo</SelectItem>
                                    <SelectItem value="WHOLESALE">Solo Mayoreo</SelectItem>
                                    <SelectItem value="BOTH">Menudeo y Mayoreo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-dashed">
                        <div className="space-y-2">
                            <Label>Precio Menudeo (C$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.retailPrice}
                                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Precio Mayoreo (C$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.wholesalePrice}
                                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">Unidad activa (disponible para uso)</Label>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {unit ? 'Actualizar Unidad' : 'Crear Unidad'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
