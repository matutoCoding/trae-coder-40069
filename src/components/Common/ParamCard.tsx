import { getStatusColor, cn } from '@/utils';
import type { Parameter } from '@/types';

interface ParamCardProps {
  param: Parameter;
  onClick?: () => void;
}

export default function ParamCard({ param, onClick }: ParamCardProps) {
  const isWarning = param.status === 'warning';
  const isAlarm = param.status === 'alarm';

  return (
    <div
      onClick={onClick}
      className={cn(
        'industrial-card cursor-pointer group',
        isAlarm && 'border-red-500/50 hover:shadow-glow-red',
        isWarning && 'border-orange-500/50 hover:shadow-glow-orange'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="data-label">{param.name}</div>
          <div className="text-xs text-industrial-subtext/70 font-mono">{param.tag}</div>
        </div>
        <div className={cn(
          'status-dot',
          param.status === 'normal' && 'status-normal',
          param.status === 'warning' && 'status-warning',
          param.status === 'alarm' && 'status-alarm'
        )} />
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn(
          'data-value text-2xl',
          getStatusColor(param.status)
        )}>
          {param.currentValue}
        </span>
        <span className="text-sm text-industrial-subtext">{param.unit}</span>
      </div>

      <div className="text-xs text-industrial-subtext">
        <span>范围: </span>
        <span className="font-mono">{param.lowerLimit} ~ {param.upperLimit}</span>
        <span className="ml-1">{param.unit}</span>
      </div>

      <div className="mt-2 h-1 bg-industrial-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            param.status === 'normal' && 'bg-green-500',
            param.status === 'warning' && 'bg-orange-500',
            param.status === 'alarm' && 'bg-red-500'
          )}
          style={{
            width: `${Math.min(100, Math.max(0, ((param.currentValue - param.lowerLimit) / (param.upperLimit - param.lowerLimit)) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
