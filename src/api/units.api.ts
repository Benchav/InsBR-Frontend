import { apiClient } from './client';
import { UnitConversion, CalculatePricePayload, UnitConversionResult } from '@/types/units.types';

export const unitsApi = {
    getUnits: async (productId: string): Promise<UnitConversion[]> => {
        const { data } = await apiClient.get(`/api/products/${productId}/units`);
        return data;
    },

    calculatePrice: async (payload: CalculatePricePayload): Promise<{ price: number }> => {
        const { data } = await apiClient.post('/api/units/calculate-price', payload);
        return data;
    },

    convert: async (payload: { quantity: number; fromUnitId: string; toUnitId?: string; productId: string }): Promise<UnitConversionResult> => {
        const { data } = await apiClient.post('/api/units/convert', payload);
        return data;
    },

    create: async (productId: string, unit: Partial<UnitConversion>): Promise<UnitConversion> => {
        const { data } = await apiClient.post(`/api/products/${productId}/units`, unit);
        return data;
    },

    update: async (unitId: string, unit: Partial<UnitConversion>): Promise<UnitConversion> => {
        const { data } = await apiClient.patch(`/api/units/${unitId}`, unit);
        return data;
    },

    delete: async (unitId: string): Promise<void> => {
        await apiClient.delete(`/api/units/${unitId}`);
    }
};
