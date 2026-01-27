export type TransferStatus = 'REQUESTED' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type TransferType = 'SEND' | 'REQUEST';
export type TransferDirection = 'FROM' | 'TO'; // Para filtrado

export interface TransferItem {
    productId: string;
    productName: string;
    quantity: number;
}

export interface Transfer {
    id: string;

    // Sucursales
    fromBranchId: string;
    toBranchId: string;

    // Items
    items: TransferItem[];

    // Metadatos
    status: TransferStatus;
    type: TransferType;
    notes?: string;

    // Auditoría
    createdBy: string;
    approvedBy?: string;
    shippedBy?: string;
    completedBy?: string;

    // Fechas
    createdAt: string; // ISO date
    approvedAt?: string;
    shippedAt?: string;
    completedAt?: string;
}

export interface CreateTransferDto {
    toBranchId: string; // Destino siempre obligatorio
    fromBranchId?: string; // Opcional (solo ADMIN puede definirlo, sino se inferirá del usuario)
    items: { productId: string; quantity: number }[];
    notes?: string;
}
