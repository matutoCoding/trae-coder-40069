import { Bell, Check, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusBgColor, getAlarmLevelText, formatTime, cn } from '@/utils';
import type { Alarm } from '@/types';

interface AlarmItemProps {
  alarm: Alarm;
}

export default function AlarmItem({ alarm }: AlarmItemProps) {
  const { acknowledgeAlarm, clearAlarm, currentUser } = useAppStore();

  const handleAcknowledge = () => {
    acknowledgeAlarm(alarm.id, currentUser.name);
  };

  const handleClear = () => {
    clearAlarm(alarm.id);
  };

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all duration-300',
      getStatusBgColor(alarm.level),
      alarm.status === 'active' && alarm.level === 'alarm' && 'animate-pulse'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-1.5 rounded',
          alarm.level === 'alarm' ? 'bg-red-500/20' : 'bg-orange-500/20'
        )}>
          <Bell size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{alarm.parameterName}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs border',
              getStatusBgColor(alarm.status)
            )}>
              {alarm.status === 'active' ? '活动' : alarm.status === 'acknowledged' ? '已确认' : '已消除'}
            </span>
          </div>
          
          <div className="text-xs text-industrial-subtext mb-1">
            <span>{getAlarmLevelText(alarm.level)}</span>
            <span className="mx-1">·</span>
            <span className="font-mono">{alarm.actualValue}</span>
            <span className="mx-1">/</span>
            <span className="font-mono">限值 {alarm.limitValue}</span>
          </div>
          
          <div className="text-xs text-industrial-subtext/70">
            {formatTime(alarm.alarmTime)}
            {alarm.operator && (
              <span className="ml-2">· 处理人: {alarm.operator}</span>
            )}
          </div>
        </div>

        {alarm.status === 'active' && (
          <div className="flex gap-1">
            <button
              onClick={handleAcknowledge}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="确认报警"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="消除报警"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
