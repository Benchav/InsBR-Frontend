import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BranchId = 'ALL' | 'BRANCH-DIR-001' | 'BRANCH-JIN-001';

export interface Branch {
  id: BranchId;
  name: string;
  shortName: string;
}

export const BRANCHES: Branch[] = [
  { id: 'ALL', name: 'Todas las Sucursales', shortName: 'Todas' },
  { id: 'BRANCH-DIR-001', name: 'Sucursal Diriamba', shortName: 'Diriamba' },
  { id: 'BRANCH-JIN-001', name: 'Sucursal Jinotepe', shortName: 'Jinotepe' },
];

interface BranchState {
  currentBranchId: BranchId;
  setCurrentBranch: (branchId: BranchId) => void;
  getCurrentBranch: () => Branch;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      currentBranchId: 'ALL',
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
