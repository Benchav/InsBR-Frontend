import { useBranchStore, BranchId, BRANCHES } from '@/stores/branchStore';
import { cn } from '@/lib/utils';

export function BranchTabs() {
  const { currentBranchId, setCurrentBranch } = useBranchStore();

  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      {BRANCHES.map((branch) => (
        <button
          key={branch.id}
          onClick={() => setCurrentBranch(branch.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            currentBranchId === branch.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {branch.shortName}
        </button>
      ))}
    </div>
  );
}
