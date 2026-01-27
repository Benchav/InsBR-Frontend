import { Badge } from '@/components/ui/badge';
import { TransferStatus } from '@/types/transfer';
import { CheckCircle2, Clock, Truck, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransferStatusBadgeProps {
    status: TransferStatus;
    className?: string;
}

export const TransferStatusBadge = ({ status, className }: TransferStatusBadgeProps) => {
    const config = {
        REQUESTED: { label: 'Solicitado', icon: AlertCircle, class: 'bg-yellow-500/15 text-yellow-600 border-yellow-200' },
        PENDING: { label: 'Pendiente', icon: Clock, class: 'bg-blue-500/15 text-blue-600 border-blue-200' },
        IN_TRANSIT: { label: 'En Tránsito', icon: Truck, class: 'bg-purple-500/15 text-purple-600 border-purple-200' },
        COMPLETED: { label: 'Completado', icon: CheckCircle2, class: 'bg-green-500/15 text-green-600 border-green-200' },
        CANCELLED: { label: 'Cancelado', icon: XCircle, class: 'bg-red-500/15 text-red-600 border-red-200' },
    };

    const { label, icon: Icon, class: style } = config[status] || { label: status, icon: Clock, class: 'bg-gray-100 text-gray-600' };

    return (
        <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-0.5 font-medium border', style, className)}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Badge>
    );
};
