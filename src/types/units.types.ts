export interface UnitConversion {
    id: string;
    productId: string;
    unitName: string;
    unitSymbol: string;
    conversionFactor: number;
    unitType: 'BASE' | 'PURCHASE' | 'SALE';
    retailPrice?: number;       // En centavos
    wholesalePrice?: number;    // En centavos
    salesType: 'RETAIL' | 'WHOLESALE' | 'BOTH';
    isActive: boolean;
    createdAt: string;
}

export interface UnitConversionResult {
    originalQuantity: number;
    baseQuantity: number;        // En unidad base
    convertedQuantity: number;   // En unidad destino
    fromUnitId: string;
    toUnitId?: string;
}

export interface CalculatePricePayload {
    basePricePerUnit: number;
    unitId: string;
    productId: string;
    priceType: 'retail' | 'wholesale';
}
