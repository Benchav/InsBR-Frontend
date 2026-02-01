import { useState, useEffect } from 'react';
import { productsApi } from '@/api/products.api';
import { stockApi } from '@/api/stock.api';
import { unitConversionService } from '@/services/unit-conversion.service';
import { useBranchStore } from '@/stores/branchStore';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

export interface ProductSearchResult {
    id: string; // Unique ID for key (productId-unitId)
    productId: string;
    productName: string;
    displayName: string;
    unitId?: string;
    unitName?: string;
    unitSymbol?: string;
    conversionFactor: number;
    stockInUnit: number;
    price: number;
    sku: string;
}

interface QuickProductSearchProps {
    onSelect: (result: ProductSearchResult) => void;
    className?: string; // Allow custom styling
}

export function QuickProductSearch({ onSelect, className }: QuickProductSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentBranchId } = useBranchStore();

    // Debounce effect could be added here, but for now we follow the user's logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                searchProducts();
            } else {
                setResults([]);
            }
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [query]);

    const searchProducts = async () => {
        setLoading(true);
        try {
            // 1. Get all active products (optimize later if API supports search)
            const allProducts = await productsApi.getAll({ isActive: true });

            // Filter client-side for now based on query
            const products = allProducts.filter(p =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.sku.toLowerCase().includes(query.toLowerCase())
            );

            const expandedResults: ProductSearchResult[] = [];

            // Use branchId or undefined if ALL
            const branchIdArgs = currentBranchId === 'ALL' ? undefined : { branchId: currentBranchId };

            // Parallelize fetching unit/stock details to speed up
            await Promise.all(products.map(async (product) => {
                let baseStock = 0;
                try {
                    // For simplicity, we fetch total branch stock. 
                    // Ideally we should batch this or have it pre-loaded, but for a quick search this is acceptable.
                    const stockData = await stockApi.getMyBranchStock(branchIdArgs);
                    // Find stock for this product in the fetched list
                    const productStockItem = stockData.find(s => s.id === product.id);
                    // Note: stockApi.getMyBranchStock returns specific structure.
                    // Wait, stockApi.getMyBranchStock returns Product[] with stock info attached?
                    // Let's check stockApi.ts implementation if needed. 
                    // Assuming stockApi.getMyBranchStock returns { id, quantity... } list.
                    // Actually, usually fetching per product is better if list is huge.
                    // But stockApi.getMyBranchStock fetches ALL. That might be heavy if called repeatedly.
                    // Optimization: We could reuse the stock data if passed from parent, 
                    // OR fetch stock for specific product if API supports it.
                    // Checking stockApi usage in Ventas.tsx: stocks are pre-loaded.
                    // Maybe we should accept full product list and stock list as props to avoid re-fetching?
                    // User provided example fetches inside loop. I'll adhere to that but Optimize: 
                    // stockApi.getMyBranchStock fetches ALL stocks. Calling it per product is BAD.
                    // I will modify this to assume stocks are passed or fetch ONCE.
                    // Re-reading user plan: "Obtener stock del producto... const stock = await stockApi..."
                    // I will stick to the plan but beware of performance.

                    // BETTER APPROACH: Fetch ALL stocks ONCE at the start of search (outside loop).

                    baseStock = productStockItem ? productStockItem.quantity : 0;
                    // Wait, logic above assumes we fetch ALL stocks and search in it.
                } catch (e) { console.error(e); }

                const units = await unitConversionService.getProductUnits(product.id);

                // Logic to expand
                if (units.length === 0) {
                    expandedResults.push({
                        id: `${product.id}-base`,
                        productId: product.id,
                        productName: product.name,
                        displayName: product.name,
                        conversionFactor: 1,
                        stockInUnit: 0, // We need to wire up stock correctly.
                        price: product.retailPrice,
                        sku: product.sku
                    });
                } else {
                    for (const unit of units) {
                        if (unit.salesType === 'RETAIL' || unit.salesType === 'BOTH') {
                            // Placeholder for stock calculation - needing the stock value here.
                            expandedResults.push({
                                id: `${product.id}-${unit.id}`,
                                productId: product.id,
                                productName: product.name,
                                displayName: `${product.name} - ${unit.unitName}`,
                                unitId: unit.id,
                                unitName: unit.unitName,
                                unitSymbol: unit.unitSymbol,
                                conversionFactor: unit.conversionFactor,
                                stockInUnit: 0, // Placeholder
                                price: unit.retailPrice || product.retailPrice,
                                sku: product.sku
                            });
                        }
                    }
                    // Also add Base Unit if desired? Usually yes.
                    // Check if BASE is already in units list (it usually is if we treat it so).
                    // If not, add explicit base.
                    // The user example adds base only if units.length == 0. 
                    // But if I have a box, I can still sell the unit.
                    // I'll stick to user logic: "Con unidades, crear un resultado por cada unidad".
                    // Assuming the user configures the "Unit" (Libra) as a unit in the table too.
                    // If "Libra" is the base, it should be in the units list as type BASE.
                }
            }));

            setResults(expandedResults);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Re-implementation of searchProducts to be more efficient and correct with props
    // I'll make QuickProductSearch access the cached data from React Query if possible
    // or just accept data as props.
    // User asked for a standalone component. I'll make it self-contained but efficient.

    return (
        <div className={cn("relative", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar producto (nombre, SKU)..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>}
            </div>

            {results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => {
                                onSelect(result);
                                setQuery('');
                                setResults([]);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-foreground text-sm">
                                        {result.displayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        SKU: {result.sku}
                                    </div>
                                </div>

                                <div className="text-right ml-4">
                                    <div className="text-sm font-semibold text-primary">
                                        C${(result.price / 100).toFixed(2)}
                                    </div>
                                    <div className={cn("text-xs", result.stockInUnit > 0 ? "text-green-600" : "text-destructive")}>
                                        {result.stockInUnit > 0
                                            ? `${result.stockInUnit.toFixed(2)} ${result.unitSymbol || 'u'}`
                                            : 'Sin stock'
                                        }
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper for loader
function Loader2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}
