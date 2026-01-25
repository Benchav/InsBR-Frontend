import { useEffect, useState } from 'react';
import { BranchService } from '../services/branchService';
import { Branch } from '../types/api.types';

interface Props {
    value?: string;
    onChange: (branchId: string) => void;
}

export const BranchSelect = ({ value, onChange }: Props) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    useEffect(() => {
        BranchService.getAll().then(setBranches);
    }, []);
    return (
        <select 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="border p-2 rounded"
        >
            <option value="">Todas las Sucursales</option>
            {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                    {branch.name}
                </option>
            ))}
        </select>
    );
};
