import { UnitConversion } from '@/types/units.types';

interface UnitsTableProps {
    productId: string;
    units: UnitConversion[];
    onEdit: (unit: UnitConversion) => void;
    onDelete: (unitId: string) => void;
}

export function UnitsTable({ units, onEdit, onDelete }: UnitsTableProps) {
    if (units.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-muted/10 border rounded-md">
                <p className="font-medium">No hay unidades configuradas</p>
                <p className="text-sm mt-1 text-muted-foreground">
                    Agrega unidades para permitir compras y ventas en diferentes presentaciones.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Unidad</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Factor</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Menudeo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Mayoreo</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Estado</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                    {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{unit.unitName}</div>
                                        <div className="text-xs text-muted-foreground">{unit.unitSymbol}</div>
                                    </div>
                                    {unit.unitType === 'BASE' && (
                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                            BASE
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {unit.conversionFactor}x
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${unit.unitType === 'BASE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                                        unit.unitType === 'PURCHASE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' :
                                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                                    }`}>
                                    {unit.unitType === 'SALE' ? 'VENTA' : unit.unitType === 'PURCHASE' ? 'COMPRA' : 'BASE'}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                {unit.retailPrice
                                    ? `C$ ${(unit.retailPrice / 100).toFixed(2)}`
                                    : <span className="text-muted-foreground">-</span>
                                }
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                {unit.wholesalePrice
                                    ? `C$ ${(unit.wholesalePrice / 100).toFixed(2)}`
                                    : <span className="text-muted-foreground">-</span>
                                }
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${unit.isActive
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {unit.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    type="button"
                                    onClick={() => onEdit(unit)}
                                    className="text-primary hover:text-primary/80 mr-3 text-xs"
                                >
                                    Editar
                                </button>
                                {unit.unitType !== 'BASE' && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(unit.id)}
                                        className="text-destructive hover:text-destructive/80 text-xs"
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
