import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  iconBgClass?: string;
}

export function KPICard({ title, value, trend, trendLabel, icon, iconBgClass }: KPICardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label">{title}</p>
          <p className="kpi-value mt-1">{value}</p>
          {trend !== undefined && (
            <div className={cn('mt-2', isPositive ? 'kpi-trend-up' : 'kpi-trend-down')}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
              {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBgClass || 'bg-primary/10')}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
