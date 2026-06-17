import { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Tag, Tabs, Modal, Form, Input, InputNumber, Select, Button, Space, List, Progress, Statistic, Alert, Row, Col, message, Badge
} from 'antd';
import {
  AlertTriangle, CheckCircle, Clock, Wrench, Plus, Thermometer, Activity, Zap,
  Play, Square, FileText, Edit, ChevronDown, ChevronUp, ClipboardList
} from 'lucide-react';
import { useAppStore } from '@/store';
import { generateEquipmentStatusStats, getShiftText } from '@/mock';
import { formatDate, getStatusColor, cn } from '@/utils';
import GaugeChart from '@/components/Charts/GaugeChart';
import BarChart from '@/components/Charts/BarChart';
import type { InspectionTask, InspectionTaskItem, PendingIssue } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

const EQUIPMENT_TYPE_MAP: Record<string, string> = {
  pump: '机泵设备',
  compressor: '压缩机',
  'heat-exchanger': '换热器',
  valve: '关键阀门',
  other: '辅助设备',
};

const SHIFT_CONFIG: Array<{ key: 'morning' | 'afternoon' | 'night'; label: string; color: string }> = [
  { key: 'morning', label: '白班', color: '#165DFF' },
  { key: 'afternoon', label: '中班', color: '#0FC6C2' },
  { key: 'night', label: '夜班', color: '#722ED1' },
];

export default function EquipmentPage() {
  const {
    equipment, inspections, inspectionTasks, currentInspectionTask,
    updateParams, createInspectionTask, updateInspectionTaskItem,
    completeInspectionTask, setCurrentInspectionTask, currentUnitId,
    pendingIssues, addPendingIssue, resolvePendingIssue
  } = useAppStore();

  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [currentInspectItem, setCurrentInspectItem] = useState<InspectionTaskItem | null>(null);
  const [inspectForm] = Form.useForm();
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<PendingIssue | null>(null);
  const [resolveForm] = Form.useForm();

  const currentTaskFromStore = useMemo(() =>
    currentInspectionTask?.id
      ? inspectionTasks.find(t => t.id === currentInspectionTask.id)
      : null
  , [currentInspectionTask?.id, inspectionTasks]);

  const displayTask = currentTaskFromStore || currentInspectionTask;

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const equipmentStats = useMemo(() => generateEquipmentStatusStats(), []);

  const unitEquipment = useMemo(() =>
    equipment.filter(e => e.unitId === currentUnitId),
    [equipment, currentUnitId]
  );

  const pumpEquipment = useMemo(() =>
    unitEquipment.filter(e => e.type === 'pump'),
    [unitEquipment]
  );

  const runningHoursTrend = useMemo(() => {
    return pumpEquipment.map(e => ({
      name: e.name.split(' ')[0],
      value: e.runningHours,
      color: e.status === 'running' ? '#00B42A' : e.status === 'standby' ? '#165DFF' : '#F53F3F',
    }));
  }, [pumpEquipment]);

  const unitTasks = useMemo(() =>
    inspectionTasks.filter(t => t.unitId === currentUnitId),
    [inspectionTasks, currentUnitId]
  );

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return unitTasks.filter(t => t.shiftDate === today);
  }, [unitTasks]);

  const shiftSummary = useMemo(() => {
    return SHIFT_CONFIG.map(({ key, label, color }) => {
      const task = todayTasks.find(t => t.shift === key);
      if (!task) {
        return { key, label, color, completed: 0, total: 0, abnormal: 0, rate: 0, exists: false };
      }
      const completed = task.items.filter(i => i.status === 'completed').length;
      const total = task.items.length;
      const abnormal = task.items.filter(i => i.result === 'warning' || i.result === 'fault').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { key, label, color, completed, total, abnormal, rate, exists: true };
    });
  }, [todayTasks]);

  const taskStats = useMemo(() => {
    if (!displayTask) return null;
    const total = displayTask.items.length;
    const completed = displayTask.items.filter(i => i.status === 'completed').length;
    const abnormal = displayTask.items.filter(i => i.result === 'warning' || i.result === 'fault').length;
    return { total, completed, abnormal, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [displayTask]);

  const groupedTaskItems = useMemo(() => {
    if (!displayTask) return {};
    const groups: Record<string, InspectionTaskItem[]> = {};
    displayTask.items.forEach(item => {
      const type = item.equipmentType || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    });
    return groups;
  }, [displayTask]);

  const equipmentIssueCount = useMemo(() => {
    const map: Record<string, number> = {};
    pendingIssues.forEach(issue => {
      if (issue.status !== 'resolved') {
        map[issue.equipmentId] = (map[issue.equipmentId] || 0) + 1;
      }
    });
    return map;
  }, [pendingIssues]);

  const getLatestInspection = (equipmentId: string) => {
    const equipInspections = inspections.filter(i => i.equipmentId === equipmentId);
    if (equipInspections.length === 0) return null;
    return equipInspections.sort((a, b) =>
      new Date(b.inspectionTime).getTime() - new Date(a.inspectionTime).getTime()
    )[0];
  };

  const toggleTypeExpand = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleCreateTask = (shift: 'morning' | 'afternoon' | 'night') => {
    const today = new Date().toISOString().split('T')[0];
    const existing = todayTasks.find(t => t.shift === shift && t.shiftDate === today);
    if (existing) {
      Modal.confirm({
        title: '班次任务已存在',
        content: `${getShiftText(shift)}任务已创建，是否继续？`,
        okText: '继续',
        onOk: () => {
          setCurrentInspectionTask(existing);
        },
      });
      return;
    }
    createInspectionTask(currentUnitId, shift);
    message.success(`${getShiftText(shift)}巡检任务已创建`);
  };

  const handleStartInspect = (item: InspectionTaskItem) => {
    if (displayTask) {
      updateInspectionTaskItem(displayTask.id, item.id, { status: 'in-progress' });
      setCurrentInspectItem(item);
      inspectForm.setFieldsValue({
        vibration: item.vibration || 3.5,
        temperature: item.temperature || 45,
        pressure: item.pressure || 0.25,
        current: item.current || 65,
        result: 'normal',
        remark: '',
      });
      setInspectModalVisible(true);
    }
  };

  const handleSaveInspect = () => {
    inspectForm.validateFields().then((values) => {
      if (displayTask && currentInspectItem) {
        updateInspectionTaskItem(displayTask.id, currentInspectItem.id, {
          ...values,
          status: 'completed',
        });
        message.success('点检数据已保存');
        setInspectModalVisible(false);
        setCurrentInspectItem(null);
        inspectForm.resetFields();
      }
    });
  };

  const handleCompleteTask = () => {
    if (!displayTask) return;
    const pending = displayTask.items.filter(i => i.status === 'pending' || i.status === 'in-progress');
    if (pending.length > 0) {
      Modal.confirm({
        title: '存在未完成设备',
        content: `还有 ${pending.length} 台设备未完成点检，确定要结束任务吗？`,
        okText: '结束任务',
        okType: 'danger',
        onOk: () => {
          completeInspectionTask(displayTask.id);
          message.success('巡检任务已结束');
        },
      });
    } else {
      completeInspectionTask(displayTask.id);
      message.success('巡检任务已结束');
    }
  };

  const handleConvertToPending = () => {
    if (!displayTask) return;
    const abnormalItems = displayTask.items.filter(i => i.result === 'warning' || i.result === 'fault');
    if (abnormalItems.length === 0) return;
    let count = 0;
    abnormalItems.forEach(item => {
      addPendingIssue({
        source: 'inspection',
        sourceId: displayTask.id,
        equipmentId: item.equipmentId,
        equipmentName: item.equipmentName,
        description: item.result === 'fault' ? '设备故障' : '设备异常',
        status: 'pending',
        creator: useAppStore.getState().currentUser.name,
      });
      count++;
    });
    message.success(`已成功转换 ${count} 条待处理事项`);
  };

  const handleResolveIssue = (issue: PendingIssue) => {
    setResolvingIssue(issue);
    resolveForm.setFieldsValue({ resolver: '', remark: '' });
    setResolveModalVisible(true);
  };

  const handleResolveSubmit = () => {
    resolveForm.validateFields().then((values) => {
      if (resolvingIssue) {
        resolvePendingIssue(resolvingIssue.id, values.resolver, values.remark);
        message.success('待处理事项已处理');
        setResolveModalVisible(false);
        setResolvingIssue(null);
        resolveForm.resetFields();
      }
    });
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow-green animate-pulse" />;
      case 'standby':
        return <div className="w-2 h-2 rounded-full bg-blue-500 shadow-glow-blue" />;
      case 'fault':
        return <div className="w-2 h-2 rounded-full bg-red-500 shadow-glow-red animate-pulse" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-orange-500 shadow-glow-orange" />;
    }
  };

  const getEquipmentStatusText = (status: string) => {
    const map: Record<string, string> = {
      running: '运行',
      standby: '备用',
      stopped: '停止',
      fault: '故障',
      maintenance: '维护',
    };
    return map[status] || status;
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'in-progress':
        return <Play size={20} className="text-primary-400 animate-pulse" />;
      default:
        return <Clock size={20} className="text-industrial-subtext" />;
    }
  };

  const getResultTag = (result?: string) => {
    if (!result) return null;
    const colorMap: Record<string, string> = {
      normal: 'green',
      warning: 'orange',
      fault: 'red',
    };
    const textMap: Record<string, string> = {
      normal: '正常',
      warning: '异常',
      fault: '故障',
    };
    return <Tag color={colorMap[result]}>{textMap[result]}</Tag>;
  };

  const pumpColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div className="flex items-center gap-2">
          {getTaskStatusIcon(record.status)}
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => EQUIPMENT_TYPE_MAP[type] || type,
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'running' ? 'green' : status === 'standby' ? 'blue' : 'red';
        return <Tag color={color}>{getEquipmentStatusText(status)}</Tag>;
      },
    },
    {
      title: '运行时间',
      dataIndex: 'runningHours',
      key: 'runningHours',
      width: 120,
      render: (hours: number) => <span className="font-mono">{hours} h</span>,
    },
    {
      title: '最近巡检',
      key: 'lastInspection',
      width: 200,
      render: (_: any, record: any) => {
        const last = getLatestInspection(record.id);
        if (!last) return <span className="text-industrial-subtext">-</span>;
        return (
          <div className="text-xs">
            <div>{formatDate(last.inspectionTime)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Tag color={getStatusColor(last.status)} style={{ margin: 0 }}>
                {last.status === 'normal' ? '正常' : last.status === 'warning' ? '异常' : '故障'}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: '未处理事项',
      key: 'unprocessedCount',
      width: 110,
      render: (_: any, record: any) => {
        const count = equipmentIssueCount[record.id] || 0;
        if (count === 0) return <span className="text-industrial-subtext">0</span>;
        return <Badge count={count} style={{ backgroundColor: '#FF7D00' }} />;
      },
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      width: 110,
    },
    {
      title: '下次维护',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
      width: 110,
    },
  ];

  const inspectionColumns = [
    {
      title: '点检时间',
      dataIndex: 'inspectionTime',
      key: 'inspectionTime',
      width: 160,
      render: (time: string) => formatDate(time),
    },
    {
      title: '设备名称',
      key: 'equipmentName',
      render: (_: any, record: any) => {
        const equip = equipment.find(e => e.id === record.equipmentId);
        return equip?.name || '-';
      },
    },
    {
      title: '点检员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
    },
    {
      title: '振动 (mm/s)',
      dataIndex: 'vibration',
      key: 'vibration',
      width: 100,
      render: (val?: number) => val?.toFixed(2) || '-',
    },
    {
      title: '温度 (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 90,
      render: (val?: number) => val?.toFixed(1) || '-',
    },
    {
      title: '压力 (MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      width: 100,
      render: (val?: number) => val?.toFixed(2) || '-',
    },
    {
      title: '电流 (A)',
      dataIndex: 'current',
      key: 'current',
      width: 90,
      render: (val?: number) => val?.toFixed(1) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const color = getStatusColor(status as 'normal' | 'warning' | 'fault');
        const text = status === 'normal' ? '正常' : status === 'warning' ? '警告' : '故障';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val: string) => val || '-',
    },
  ];

  const taskColumns = [
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 180,
      render: (shift: string) => getShiftText(shift as any),
    },
    {
      title: '日期',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          'in-progress': 'processing',
          completed: 'success',
        };
        const textMap: Record<string, string> = {
          pending: '待开始',
          'in-progress': '进行中',
          completed: '已完成',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '进度',
      key: 'progress',
      width: 180,
      render: (_: any, record: InspectionTask) => {
        const completed = record.items.filter(i => i.status === 'completed').length;
        const total = record.items.length;
        return (
          <div className="flex items-center gap-2">
            <Progress
              percent={Math.round((completed / total) * 100)}
              size="small"
              className="w-24"
            />
            <span className="text-sm">{completed}/{total}</span>
          </div>
        );
      },
    },
    {
      title: '异常设备',
      key: 'abnormal',
      width: 100,
      render: (_: any, record: InspectionTask) => {
        const abnormal = record.items.filter(i => i.result === 'warning' || i.result === 'fault').length;
        return abnormal > 0 ? <span className="text-orange-400 font-semibold">{abnormal} 台</span> : '-';
      },
    },
    {
      title: '点检员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: InspectionTask) => (
        <Button
          type="link"
          size="small"
          onClick={() => setCurrentInspectionTask(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  const pendingIssueColumns = [
    {
      title: '设备名称',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 140,
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          processing: 'processing',
          resolved: 'success',
        };
        const textMap: Record<string, string> = {
          pending: '待处理',
          processing: '处理中',
          resolved: '已处理',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatDate(time),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
    },
    {
      title: '处理人',
      dataIndex: 'resolver',
      key: 'resolver',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '处理时间',
      dataIndex: 'resolveTime',
      key: 'resolveTime',
      width: 160,
      render: (val?: string) => val ? formatDate(val) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: PendingIssue) => (
        record.status !== 'resolved' ? (
          <Button type="link" size="small" onClick={() => handleResolveIssue(record)}>
            处理
          </Button>
        ) : '-'
      ),
    },
  ];

  const renderTaskDetail = () => {
    if (!displayTask) return null;

    const types = Object.keys(groupedTaskItems);

    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-medium text-white">
                {getShiftText(displayTask.shift)}巡检任务
              </h3>
              <p className="text-sm text-industrial-subtext">
                {displayTask.shiftDate} · {taskStats?.completed} / {taskStats?.total} 台已完成
              </p>
            </div>
          </div>
          <Space>
            <Button onClick={() => setCurrentInspectionTask(null)}>
              返回
            </Button>
            {displayTask.status !== 'completed' && (
              <Button type="primary" danger icon={<Square size={14} />} onClick={handleCompleteTask}>
                结束任务
              </Button>
            )}
          </Space>
        </div>

        {taskStats && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="industrial-card text-center">
                <Statistic
                  title="完成率"
                  value={taskStats.rate}
                  suffix="%"
                  className="text-white"
                />
                <Progress
                  percent={taskStats.rate}
                  status={taskStats.rate === 100 ? 'success' : 'active'}
                  strokeColor="#165DFF"
                  showInfo={false}
                  className="mt-2"
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card text-center">
                <Statistic
                  title="已完成"
                  value={taskStats.completed}
                  suffix="台"
                  valueStyle={{ color: '#00B42A' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card text-center">
                <Statistic
                  title="异常设备"
                  value={taskStats.abnormal}
                  suffix="台"
                  valueStyle={{ color: taskStats.abnormal > 0 ? '#FF7D00' : '#00B42A' }}
                />
              </div>
            </Col>
          </Row>
        )}

        {taskStats && taskStats.abnormal > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`发现 ${taskStats.abnormal} 台设备点检异常，请关注`}
            description={
              <div>
                <ul className="mt-2 space-y-1">
                  {displayTask.items
                    .filter(i => i.result === 'warning' || i.result === 'fault')
                    .map(item => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span>{item.equipmentName}</span>
                        <Tag color={item.result === 'fault' ? 'red' : 'orange'}>
                          {item.result === 'fault' ? '故障' : '异常'}
                        </Tag>
                      </li>
                    ))}
                </ul>
                <Button
                  type="primary"
                  danger
                  icon={<ClipboardList size={14} />}
                  className="mt-3"
                  onClick={handleConvertToPending}
                >
                  转为待处理事项
                </Button>
              </div>
            }
          />
        )}

        {types.map(type => {
          const isExpanded = expandedTypes[type] !== false;
          const items = groupedTaskItems[type];
          const typeCompleted = items.filter(i => i.status === 'completed').length;

          return (
            <Card
              key={type}
              title={
                <div
                  className="flex items-center justify-between cursor-pointer -mx-4 -my-2 px-4 py-2"
                  onClick={() => toggleTypeExpand(type)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span className="font-medium">{EQUIPMENT_TYPE_MAP[type] || type}</span>
                    <Tag color="default">{typeCompleted}/{items.length}</Tag>
                  </div>
                </div>
              }
              className="bg-industrial-card border-industrial-border"
              styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              size="small"
            >
              {isExpanded && (
                <List
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      className={cn(
                        'bg-industrial-border/30 rounded-lg mb-3 p-4',
                        item.status === 'completed' && 'opacity-70'
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        {getItemStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{item.equipmentName}</span>
                            {getResultTag(item.result)}
                            {item.status === 'completed' && (
                              <span className="text-xs text-industrial-subtext">
                                {item.completedTime}
                              </span>
                            )}
                          </div>
                          {item.status === 'completed' && (
                            <div className="flex gap-4 mt-2 text-xs text-industrial-subtext">
                              <span>振动: {item.vibration?.toFixed(2)} mm/s</span>
                              <span>温度: {item.temperature?.toFixed(1)} °C</span>
                              <span>压力: {item.pressure?.toFixed(2)} MPa</span>
                              <span>电流: {item.current?.toFixed(1)} A</span>
                              {item.remark && <span>备注: {item.remark}</span>}
                            </div>
                          )}
                        </div>
                        {item.status === 'pending' && displayTask.status !== 'completed' && (
                          <Button
                            type="primary"
                            icon={<Play size={14} />}
                            onClick={() => handleStartInspect(item)}
                          >
                            开始点检
                          </Button>
                        )}
                        {item.status === 'in-progress' && (
                          <Button
                            type="primary"
                            icon={<Edit size={14} />}
                            onClick={() => handleStartInspect(item)}
                          >
                            继续点检
                          </Button>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const inspectionTaskContent = !displayTask ? (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">今日巡检任务</h3>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        {shiftSummary.map(s => (
          <Col xs={24} sm={8} key={s.key}>
            <div className="industrial-card" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white text-base">{s.label}</span>
                {!s.exists && <Tag color="default">未创建</Tag>}
                {s.exists && s.total > 0 && s.rate === 100 && <Tag color="success">已完成</Tag>}
                {s.exists && s.total > 0 && s.rate < 100 && <Tag color="processing">进行中</Tag>}
              </div>
              {s.exists ? (
                <>
                  <Progress
                    percent={s.rate}
                    strokeColor={s.color}
                    size="small"
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-industrial-subtext">
                      已完成 <span className="text-green-400">{s.completed}</span>/{s.total}
                    </span>
                    <span className="text-industrial-subtext">
                      异常 <span className={s.abnormal > 0 ? 'text-orange-400 font-semibold' : ''}>{s.abnormal}</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-industrial-subtext text-sm py-2">暂无巡检任务</div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      <Card className="bg-industrial-card border-industrial-border">
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto mb-4 text-industrial-subtext opacity-50" />
          <p className="text-industrial-subtext mb-4">选择班次开始巡检</p>
          <div className="flex justify-center gap-4">
            <Button type="primary" size="large" icon={<Play size={16} />} onClick={() => handleCreateTask('morning')}>
              白班
            </Button>
            <Button type="primary" size="large" icon={<Play size={16} />} onClick={() => handleCreateTask('afternoon')}>
              中班
            </Button>
            <Button type="primary" size="large" icon={<Play size={16} />} onClick={() => handleCreateTask('night')}>
              夜班
            </Button>
          </div>
          <p className="text-xs text-industrial-subtext mt-4">
            覆盖机泵、压缩机、辅助设备等全部关键设备
          </p>
        </div>
      </Card>

      {todayTasks.length > 0 && (
        <Card
          title="今日任务"
          className="bg-industrial-card border-industrial-border"
          styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
        >
          <Table
            dataSource={todayTasks}
            columns={taskColumns}
            rowKey="id"
            pagination={false}
            className="data-table"
          />
        </Card>
      )}

      {unitTasks.length > 0 && (
        <Card
          title="历史巡检任务"
          className="bg-industrial-card border-industrial-border"
          styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
        >
          <Table
            dataSource={unitTasks.slice(0, 20)}
            columns={taskColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="data-table"
          />
        </Card>
      )}
    </div>
  ) : renderTaskDetail();

  const equipmentLedgerContent = (
    <div className="space-y-4 pt-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="设备状态统计"
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <BarChart
              data={equipmentStats}
              unit="台"
              height={250}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="设备运行时间统计"
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <BarChart
              data={runningHoursTrend}
              unit="h"
              horizontal
              height={250}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备概览"
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
      >
        <Row gutter={[16, 16]}>
          {pumpEquipment.slice(0, 4).map(pump => {
            const last = getLatestInspection(pump.id);
            return (
              <Col xs={24} lg={6} key={pump.id}>
                <div className="industrial-card h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTaskStatusIcon(pump.status)}
                      <span className="font-semibold text-white text-sm">{pump.name.split(' ')[0]}</span>
                    </div>
                    <Tag color={pump.status === 'running' ? 'green' : 'blue'}>
                      {getEquipmentStatusText(pump.status)}
                    </Tag>
                  </div>
                  {last && (
                    <div className="text-xs text-industrial-subtext mb-3">
                      最近巡检: {formatDate(last.inspectionTime)}
                      <Tag
                        color={getStatusColor(last.status)}
                        style={{ marginLeft: 8, marginBottom: 0 }}
                      >
                        {last.status === 'normal' ? '正常' : last.status === 'warning' ? '异常' : '故障'}
                      </Tag>
                    </div>
                  )}
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <GaugeChart
                        value={last?.vibration || 0}
                        min={0}
                        max={10}
                        title="振动"
                        unit="mm/s"
                        warningThreshold={6}
                        dangerThreshold={8}
                        height={120}
                      />
                    </Col>
                    <Col span={12}>
                      <GaugeChart
                        value={last?.temperature || 0}
                        min={0}
                        max={100}
                        title="温度"
                        unit="°C"
                        warningThreshold={70}
                        dangerThreshold={85}
                        height={120}
                      />
                    </Col>
                    <Col span={12}>
                      <GaugeChart
                        value={last?.current || 0}
                        min={0}
                        max={120}
                        title="电流"
                        unit="A"
                        warningThreshold={90}
                        dangerThreshold={100}
                        height={120}
                      />
                    </Col>
                    <Col span={12}>
                      <GaugeChart
                        value={last?.pressure || 0}
                        min={0}
                        max={0.5}
                        title="压力"
                        unit="MPa"
                        warningThreshold={0.35}
                        dangerThreshold={0.42}
                        height={120}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card
        title="所有设备"
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
      >
        <Table
          dataSource={unitEquipment}
          columns={pumpColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="data-table"
        />
      </Card>
    </div>
  );

  const inspectionRecordsContent = (
    <div className="pt-4">
      <Card
        title="点检历史记录"
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
        extra={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-orange-400" />
              <span className="text-sm text-industrial-subtext">温度</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              <span className="text-sm text-industrial-subtext">振动</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm text-industrial-subtext">电流</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-green-400" />
              <span className="text-sm text-industrial-subtext">压力</span>
            </div>
          </div>
        }
      >
        <Table
          dataSource={inspections.filter(i => {
            const equip = equipment.find(e => e.id === i.equipmentId);
            return equip && equip.unitId === currentUnitId;
          }).slice(0, 30)}
          columns={inspectionColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="data-table"
        />
      </Card>
    </div>
  );

  const pendingIssuesContent = (
    <div className="pt-4">
      <Card
        title="待处理事项"
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
        extra={
          <Space>
            <Tag color="warning">待处理 {pendingIssues.filter(i => i.status === 'pending').length}</Tag>
            <Tag color="processing">处理中 {pendingIssues.filter(i => i.status === 'processing').length}</Tag>
            <Tag color="success">已处理 {pendingIssues.filter(i => i.status === 'resolved').length}</Tag>
          </Space>
        }
      >
        <Table
          dataSource={pendingIssues}
          columns={pendingIssueColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="data-table"
        />
      </Card>
    </div>
  );

  const equipmentTabItems = [
    {
      key: '1',
      label: '巡检任务',
      children: inspectionTaskContent,
    },
    {
      key: '2',
      label: '设备台账',
      children: equipmentLedgerContent,
    },
    {
      key: '3',
      label: '点检记录',
      children: inspectionRecordsContent,
    },
    {
      key: '4',
      label: '待处理事项',
      children: pendingIssuesContent,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">设备点检</h2>
          <p className="text-sm text-industrial-subtext">
            机泵运行监控、设备台账管理与巡检任务
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {unitEquipment.filter(e => e.status === 'running').length} 台运行中
          </span>
        </div>
      </div>

      <Card
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={equipmentTabItems} defaultActiveKey="1" />
      </Card>

      <Modal
        title={`设备点检 - ${currentInspectItem?.equipmentName}`}
        open={inspectModalVisible}
        onOk={handleSaveInspect}
        onCancel={() => {
          setInspectModalVisible(false);
          setCurrentInspectItem(null);
          inspectForm.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={600}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        <Form form={inspectForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="vibration"
                label={
                  <span className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    振动 (mm/s)
                  </span>
                }
                rules={[{ required: true, message: '请输入振动值' }]}
              >
                <InputNumber min={0} max={20} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="temperature"
                label={
                  <span className="flex items-center gap-2">
                    <Thermometer size={14} className="text-orange-400" />
                    温度 (°C)
                  </span>
                }
                rules={[{ required: true, message: '请输入温度' }]}
              >
                <InputNumber min={0} max={150} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="pressure"
                label={
                  <span className="flex items-center gap-2">
                    <Wrench size={14} className="text-green-400" />
                    压力 (MPa)
                  </span>
                }
                rules={[{ required: true, message: '请输入压力' }]}
              >
                <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="current"
                label={
                  <span className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    电流 (A)
                  </span>
                }
                rules={[{ required: true, message: '请输入电流' }]}
              >
                <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="result"
                label="点检结果"
                rules={[{ required: true, message: '请选择结果' }]}
              >
                <Select>
                  <Option value="normal">正常</Option>
                  <Option value="warning">异常</Option>
                  <Option value="fault">故障</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={3} placeholder="请输入点检备注..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="处理待处理事项"
        open={resolveModalVisible}
        onOk={handleResolveSubmit}
        onCancel={() => {
          setResolveModalVisible(false);
          setResolvingIssue(null);
          resolveForm.resetFields();
        }}
        okText="确认处理"
        cancelText="取消"
        width={500}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        {resolvingIssue && (
          <div className="mb-4 p-3 bg-industrial-border/30 rounded-lg">
            <div className="text-sm text-industrial-subtext mb-1">设备: <span className="text-white">{resolvingIssue.equipmentName}</span></div>
            <div className="text-sm text-industrial-subtext">问题: <span className="text-white">{resolvingIssue.description}</span></div>
          </div>
        )}
        <Form form={resolveForm} layout="vertical">
          <Form.Item
            name="resolver"
            label="处理人"
            rules={[{ required: true, message: '请输入处理人' }]}
          >
            <Input placeholder="请输入处理人姓名" />
          </Form.Item>
          <Form.Item
            name="remark"
            label="处理备注"
            rules={[{ required: true, message: '请输入处理备注' }]}
          >
            <TextArea rows={3} placeholder="请输入处理备注..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
