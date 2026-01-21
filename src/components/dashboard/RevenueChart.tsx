import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useBranchStore } from '@/stores/branchStore';

const revenueData = [
  { month: 'May', Diriamba: 42000, Jinotepe: 35000 },
  { month: 'Jun', Diriamba: 38000, Jinotepe: 42000 },
  { month: 'Jul', Diriamba: 45000, Jinotepe: 38000 },
  { month: 'Ago', Diriamba: 52000, Jinotepe: 48000 },
  { month: 'Sep', Diriamba: 48000, Jinotepe: 52000 },
  { month: 'Oct', Diriamba: 58000, Jinotepe: 45000 },
];

export function RevenueChart() {
  const { currentBranchId } = useBranchStore();

  const filteredData = revenueData.map((item) => {
    if (currentBranchId === 'ALL') return item;
    if (currentBranchId === 'BRANCH-DIR-001') return { month: item.month, Diriamba: item.Diriamba };
    return { month: item.month, Jinotepe: item.Jinotepe };
  });

  return (
    <div className="kpi-card animate-fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Análisis de Ingresos</h3>
        <p className="text-sm text-muted-foreground">Comparando rendimiento de sucursales (Últimos 6 meses)</p>
      </div>
      <div className="flex items-center gap-4 mb-4">
        {(currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-001') && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Diriamba</span>
          </div>
        )}
        {(currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-002') && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Jinotepe</span>
          </div>
        )}
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`C$ ${value.toLocaleString()}`, '']}
            />
            {(currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-001') && (
              <Bar
                dataKey="Diriamba"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            )}
            {(currentBranchId === 'ALL' || currentBranchId === 'BRANCH-DIR-002') && (
              <Bar
                dataKey="Jinotepe"
                fill="hsl(var(--warning))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
