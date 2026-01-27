import { apiClient } from '@/api/client';
import { Transfer, CreateTransferDto, TransferStatus, TransferDirection } from '@/types/transfer';

export const transferService = {
    /**
     * Listar transferencias con filtros
     */
    getAll: async (params?: { status?: TransferStatus; direction?: TransferDirection; branchId?: string }) => {
        const { data } = await apiClient.get<Transfer[]>('/api/transfers', { params });
        return data;
    },

    /**
     * Obtener detalle de una transferencia
     */
    getById: async (id: string) => {
        const { data } = await apiClient.get<Transfer>(`/api/transfers/${id}`);
        return data;
    },

    /**
     * Crear nueva transferencia (SEND o REQUEST se determina automáticamente en backend)
     */
    create: async (payload: CreateTransferDto) => {
        const { data } = await apiClient.post<Transfer>('/api/transfers', payload);
        return data;
    },

    /**
     * Acciones de Transición de Estado
     */

    // Paso 2 (Solo REQUEST): Aceptar solicitud
    accept: async (id: string) => {
        const { data } = await apiClient.patch<Transfer>(`/api/transfers/${id}/accept`);
        return data;
    },

    // Paso 3: Despachar mercadería (Salida de inventario)
    ship: async (id: string) => {
        const { data } = await apiClient.patch<Transfer>(`/api/transfers/${id}/ship`);
        return data;
    },

    // Paso 4: Recibir mercadería (Entrada a inventario)
    receive: async (id: string) => {
        const { data } = await apiClient.patch<Transfer>(`/api/transfers/${id}/receive`);
        return data;
    },

    // Cancelar (Solo si no está completada)
    cancel: async (id: string) => {
        const { data } = await apiClient.delete<{ message: string; transfer: Transfer }>(`/api/transfers/${id}`);
        return data;
    },
};
