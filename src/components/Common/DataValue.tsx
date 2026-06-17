import { cn } from '@/utils';

interface DataValueProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'alarm';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export default function DataValue({
  label,
  value,
  unit,
  status = 'normal',
  trend,
  className,
}: DataValueProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="data-label">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'data-value',
          status === 'warning' && 'text-orange-500',
          status === 'alarm' && 'text-red-500',
          status === 'normal' && 'text-white'
        )}>
          {value}
        </span>
        {unit && <span className="text-sm text-industrial-subtext">{unit}</span>}
        {trend && (
          <span className={cn(
            'text-xs ml-1',
            trend === 'up' && 'text-red-400',
            trend === 'down' && 'text-green-400',
            trend === 'stable' && 'text-gray-400'
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'stable' && '→'}
          </span>
        )}
      </div>
    </div>
  );
}
