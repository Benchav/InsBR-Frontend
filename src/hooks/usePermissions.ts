import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/config/permissions';

export const usePermissions = () => {
    const { hasPermission } = useAuth();

    const can = (permission: Permission) => {
        return hasPermission(permission);
    };

    return { can };
};
