import { useState } from 'react';
import { Bell, Check, X, MessageSquare, Clock } from 'lucide-react';
import { Modal, Form, Input } from 'antd';
import { useAppStore } from '@/store';
import { getStatusBgColor, getAlarmLevelText, formatTime, cn } from '@/utils';
import type { Alarm } from '@/types';

const { TextArea } = Input;

interface AlarmItemProps {
  alarm: Alarm;
}

export default function AlarmItem({ alarm }: AlarmItemProps) {
  const { acknowledgeAlarm, clearAlarm, currentUser } = useAppStore();
  const [ackModalVisible, setAckModalVisible] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [ackForm] = Form.useForm();
  const [clearForm] = Form.useForm();

  const handleConfirmAcknowledge = () => {
    ackForm.validateFields().then((values) => {
      acknowledgeAlarm(alarm.id, currentUser.name, values.handleRemark);
      setAckModalVisible(false);
      ackForm.resetFields();
    });
  };

  const handleConfirmClear = () => {
    clearForm.validateFields().then((values) => {
      clearAlarm(alarm.id, values.clearRemark);
      setClearModalVisible(false);
      clearForm.resetFields();
    });
  };

  const borderClass = cn(
    alarm.level === 'alarm' && alarm.status === 'active'
      ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
      : alarm.level === 'alarm'
        ? 'border-red-500/60'
        : 'border-orange-500/60'
  );

  const timelineItems = [
    {
      key: 'trigger',
      icon: <Bell size={14} />,
      iconBg: 'bg-red-500/20',
      label: '触发报警',
      time: alarm.alarmTime,
      content: (
        <div className="text-xs text-industrial-subtext">
          <span>{getAlarmLevelText(alarm.level)}</span>
          <span className="mx-1">·</span>
          <span className="font-mono">{alarm.actualValue}</span>
          <span className="mx-1">/</span>
          <span className="font-mono">限值 {alarm.limitValue}</span>
        </div>
      ),
      active: true,
    },
    {
      key: 'acknowledge',
      icon: <Check size={14} />,
      iconBg: 'bg-yellow-500/20',
      label: '确认报警',
      time: alarm.acknowledgeTime,
      content: (alarm.acknowledgeTime || alarm.status === 'acknowledged' || alarm.status === 'cleared') ? (
        <div className="space-y-1">
          {alarm.operator && (
            <div className="text-xs text-industrial-subtext">
              操作人: {alarm.operator}
            </div>
          )}
          {alarm.handleRemark && (
            <div className="p-2 rounded bg-white/5 text-xs">
              <div className="flex items-center gap-1 mb-1 text-industrial-subtext">
                <MessageSquare size={10} />
                <span>处理意见</span>
              </div>
              <p className="text-white/80">{alarm.handleRemark}</p>
            </div>
          )}
        </div>
      ) : null,
      active: alarm.status === 'acknowledged' || alarm.status === 'cleared',
    },
    {
      key: 'clear',
      icon: <X size={14} />,
      iconBg: 'bg-blue-500/20',
      label: '消除报警',
      time: alarm.clearTime,
      content: alarm.status === 'cleared' ? (
        <div className="space-y-1">
          {alarm.clearRemark && (
            <div className="p-2 rounded bg-white/5 text-xs">
              <div className="flex items-center gap-1 mb-1 text-industrial-subtext">
                <MessageSquare size={10} />
                <span>消除备注</span>
              </div>
              <p className="text-white/80">{alarm.clearRemark}</p>
            </div>
          )}
        </div>
      ) : null,
      active: alarm.status === 'cleared',
    },
  ];

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all duration-300',
      getStatusBgColor(alarm.level),
      borderClass
    )}>
      <div className="flex items-start gap-2 mb-3">
        <div className={cn(
          'p-1.5 rounded shrink-0',
          alarm.level === 'alarm' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
        )}>
          <Bell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{alarm.parameterName}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs border',
              getStatusBgColor(alarm.status)
            )}>
              {alarm.status === 'active' ? '活动' : alarm.status === 'acknowledged' ? '已确认' : '已消除'}
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {alarm.status === 'active' && (
            <button
              onClick={() => setAckModalVisible(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 transition-colors"
            >
              <Check size={12} />
              确认报警
            </button>
          )}
          {alarm.status === 'acknowledged' && (
            <button
              onClick={() => setClearModalVisible(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 transition-colors"
            >
              <X size={12} />
              消除报警
            </button>
          )}
        </div>
      </div>

      <div className="ml-1">
        {timelineItems.map((item, index) => {
          const isLast = index === timelineItems.length - 1;
          const showItem = item.key === 'trigger' || item.active;

          if (!showItem) return null;

          return (
            <div key={item.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  item.iconBg,
                  item.active ? 'text-white' : 'text-industrial-subtext'
                )}>
                  {item.icon}
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-px flex-1 min-h-[20px]',
                    item.active ? 'bg-industrial-subtext/30' : 'bg-industrial-subtext/10'
                  )} />
                )}
              </div>
              <div className={cn('pb-3 flex-1 min-w-0', isLast && 'pb-0')}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    'text-xs font-medium',
                    item.active ? 'text-white' : 'text-industrial-subtext'
                  )}>
                    {item.label}
                  </span>
                  {item.time && (
                    <span className="flex items-center gap-1 text-xs text-industrial-subtext/70">
                      <Clock size={10} />
                      {formatTime(item.time)}
                    </span>
                  )}
                </div>
                {item.content}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title="确认报警"
        open={ackModalVisible}
        onOk={handleConfirmAcknowledge}
        onCancel={() => {
          setAckModalVisible(false);
          ackForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        width={500}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        <Form form={ackForm} layout="vertical">
          <Form.Item
            name="handleRemark"
            label="处理意见"
            rules={[{ required: true, message: '请输入处理意见' }]}
          >
            <TextArea rows={4} placeholder="请输入报警确认的处理意见..." />
          </Form.Item>
          <div className="text-xs text-industrial-subtext">
            确认人: {currentUser.name}
          </div>
        </Form>
      </Modal>

      <Modal
        title="消除报警"
        open={clearModalVisible}
        onOk={handleConfirmClear}
        onCancel={() => {
          setClearModalVisible(false);
          clearForm.resetFields();
        }}
        okText="消除"
        cancelText="取消"
        okType="danger"
        width={500}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        <Form form={clearForm} layout="vertical">
          <Form.Item
            name="clearRemark"
            label="消除备注"
            rules={[{ required: true, message: '请输入消除备注' }]}
          >
            <TextArea rows={4} placeholder="请输入报警消除的备注说明..." />
          </Form.Item>
          <div className="text-xs text-industrial-subtext">
            操作人: {currentUser.name}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
