import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BranchId = 'diriamba' | 'jinotepe' | 'all';

export interface Branch {
  id: BranchId;
  name: string;
  shortName: string;
}

export const BRANCHES: Branch[] = [
  { id: 'all', name: 'Todas las Sucursales', shortName: 'Todas' },
  { id: 'diriamba', name: 'Sucursal Diriamba', shortName: 'Diriamba' },
  { id: 'jinotepe', name: 'Sucursal Jinotepe', shortName: 'Jinotepe' },
];

interface BranchState {
  currentBranchId: BranchId;
  setCurrentBranch: (branchId: BranchId) => void;
  getCurrentBranch: () => Branch;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      currentBranchId: 'all',
      setCurrentBranch: (branchId: BranchId) => set({ currentBranchId: branchId }),
      getCurrentBranch: () => {
        const { currentBranchId } = get();
        return BRANCHES.find((b) => b.id === currentBranchId) || BRANCHES[0];
      },
    }),
    {
      name: 'branch-storage',
    }
  )
);
