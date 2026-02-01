import { productsApi } from "@/api/products.api";
import { stockApi } from "@/api/stock.api";
import { unitConversionService } from "@/services/unit-conversion.service";

export interface ExpandedProduct {
    id: string; // Unique ID (productId-unitId)
    productId: string;
    productName: string;
    displayName: string; // "Harina de Trigo - Quintal"
    sku: string;
    category: string;

    // Unit details
    unitId?: string;
    unitName?: string;
    unitSymbol?: string;
    conversionFactor: number;

    // Analyzed data
    stockInUnit: number;
    price: number; // Price in cents (or standard unit if system uses that, assuming API returns standard)

    // Metadata
    hasUnits: boolean;
    salesType: 'RETAIL' | 'WHOLESALE'; // Derived based on unit or fallback
}

export const productSearchService = {
    /**
     * Search and expand products by their units.
     * If query is empty, expands ALL products (use carefully).
     */
    async searchExpanded(
        query: string = '',
        branchId: string | undefined
    ): Promise<ExpandedProduct[]> {
        try {
            // 1. Fetch products
            // Note: backend filtering by 'search' might be supported or we filter client side.
            // `productsApi.getAll` supports simple filters.
            // We'll fetch all active for now and filter if needed, to support "Empty query = All".
            const allProducts = await productsApi.getAll({ isActive: true });

            const products = query
                ? allProducts.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    p.sku.toLowerCase().includes(query.toLowerCase()))
                : allProducts;

            // 2. Fetch Stocks (Bulk if possible, or we assume we fetch all stocks for branch)
            // optimization: fetch all stocks once
            const stocks = await stockApi.getMyBranchStock(branchId ? { branchId } : undefined);

            const expanded: ExpandedProduct[] = [];

            // 3. Expand
            // Parallelize unit fetching?
            // Caution: If 100 products, 100 requests. 
            // We can use Promise.all but might hit rate limits or slow down.
            // For now, we follow the plan. 

            await Promise.all(products.map(async (product) => {
                const stockItem = stocks.find(s => s.id === product.id);
                const baseStock = stockItem ? stockItem.quantity : 0;

                try {
                    const units = await unitConversionService.getProductUnits(product.id);

                    if (units.length === 0) {
                        // Base Product Only
                        expanded.push({
                            id: `${product.id}-base`,
                            productId: product.id,
                            productName: product.name,
                            displayName: product.name, // Just name if no units
                            sku: product.sku,
                            category: product.category,
                            unitId: undefined,
                            conversionFactor: 1,
                            stockInUnit: baseStock,
                            price: product.retailPrice, // Default to Retail?
                            hasUnits: false,
                            salesType: 'RETAIL'
                        });
                    } else {
                        // Expand Units
                        for (const unit of units) {
                            if (!unit.isActive) continue;

                            // 1. Retail Option
                            if (unit.salesType === 'RETAIL' || unit.salesType === 'BOTH') {
                                expanded.push({
                                    id: `${product.id}-${unit.id}-retail`,
                                    productId: product.id,
                                    productName: product.name,
                                    displayName: `${product.name} - ${unit.unitName}`,
                                    sku: product.sku,
                                    category: product.category,
                                    unitId: unit.id,
                                    unitName: unit.unitName,
                                    unitSymbol: unit.unitSymbol,
                                    conversionFactor: unit.conversionFactor,
                                    stockInUnit: baseStock / unit.conversionFactor,
                                    price: unit.retailPrice || product.retailPrice,
                                    hasUnits: true,
                                    salesType: 'RETAIL'
                                });
                            }

                            // 2. Wholesale Option
                            if (unit.salesType === 'WHOLESALE' || unit.salesType === 'BOTH') {
                                expanded.push({
                                    id: `${product.id}-${unit.id}-wholesale`,
                                    productId: product.id,
                                    productName: product.name,
                                    displayName: unit.salesType === 'BOTH'
                                        ? `${product.name} - ${unit.unitName} (Mayoreo)`
                                        : `${product.name} - ${unit.unitName}`,
                                    sku: product.sku,
                                    category: product.category,
                                    unitId: unit.id,
                                    unitName: unit.unitName,
                                    unitSymbol: unit.unitSymbol,
                                    conversionFactor: unit.conversionFactor,
                                    stockInUnit: baseStock / unit.conversionFactor,
                                    price: unit.wholesalePrice || 0,
                                    hasUnits: true,
                                    salesType: 'WHOLESALE'
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error expanding product ${product.name}`, e);
                    // Fallback to base
                    expanded.push({
                        id: `${product.id}-base`,
                        productId: product.id,
                        productName: product.name,
                        displayName: product.name,
                        sku: product.sku,
                        category: product.category,
                        conversionFactor: 1,
                        stockInUnit: baseStock,
                        price: product.retailPrice,
                        hasUnits: false,
                        salesType: 'RETAIL'
                    });
                }
            }));

            return expanded;

        } catch (error) {
            console.error('Error in searchExpanded', error);
            return [];
        }
    }
};
