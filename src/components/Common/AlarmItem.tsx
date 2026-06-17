import { useState } from 'react';
import { Bell, Check, X, MessageSquare } from 'lucide-react';
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

  const handleAcknowledge = () => {
    setAckModalVisible(true);
  };

  const handleConfirmAcknowledge = () => {
    ackForm.validateFields().then((values) => {
      acknowledgeAlarm(alarm.id, currentUser.name, values.handleRemark);
      setAckModalVisible(false);
      ackForm.resetFields();
    });
  };

  const handleClear = () => {
    setClearModalVisible(true);
  };

  const handleConfirmClear = () => {
    clearForm.validateFields().then((values) => {
      clearAlarm(alarm.id, values.handleRemark);
      setClearModalVisible(false);
      clearForm.resetFields();
    });
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '活动',
      acknowledged: '已确认',
      cleared: '已消除',
    };
    return map[status] || status;
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
              {getStatusText(alarm.status)}
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

          {alarm.handleRemark && (
            <div className="mt-2 p-2 rounded bg-white/5 text-xs text-industrial-subtext">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare size={12} />
                <span>处理意见</span>
              </div>
              <p className="text-white/80">{alarm.handleRemark}</p>
            </div>
          )}

          {alarm.status === 'cleared' && alarm.clearTime && (
            <div className="text-xs text-industrial-subtext/70 mt-1">
              消除时间: {formatTime(alarm.clearTime)}
            </div>
          )}
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

        {alarm.status === 'acknowledged' && (
          <div className="flex gap-1">
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
            name="handleRemark"
            label="最终处理结果"
            rules={[{ required: true, message: '请输入最终处理结果' }]}
          >
            <TextArea rows={4} placeholder="请输入报警消除的最终处理结果..." />
          </Form.Item>
          <div className="text-xs text-industrial-subtext">
            操作人: {currentUser.name}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
