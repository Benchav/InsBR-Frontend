import { unitsApi } from "@/api/units.api";
import { UnitConversion } from "@/types/units.types";

export const unitConversionService = {
    getProductUnits: async (productId: string): Promise<UnitConversion[]> => {
        return await unitsApi.getUnits(productId);
    },

    createUnit: async (productId: string, data: Partial<UnitConversion>): Promise<UnitConversion> => {
        return await unitsApi.create(productId, data);
    },

    updateUnit: async (unitId: string, data: Partial<UnitConversion>): Promise<UnitConversion> => {
        return await unitsApi.update(unitId, data);
    },

    deleteUnit: async (unitId: string): Promise<void> => {
        return await unitsApi.delete(unitId);
    }
};
