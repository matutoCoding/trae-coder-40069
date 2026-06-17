import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Tag, Tabs, Modal, Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { Cpu, AlertTriangle, CheckCircle, Clock, Wrench, Plus, Thermometer, Activity, Zap } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateEquipmentStatusStats } from '@/mock';
import { formatDate, getStatusColor } from '@/utils';
import GaugeChart from '@/components/Charts/GaugeChart';
import BarChart from '@/components/Charts/BarChart';
import type { Inspection, Equipment } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function EquipmentPage() {
  const { equipment, inspections, updateParams, addInspection, currentUser } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const equipmentStats = useMemo(() => generateEquipmentStatusStats(), []);
  
  const pumpEquipment = useMemo(() => 
    equipment.filter(e => e.type === 'pump'),
    [equipment]
  );

  const runningHoursTrend = useMemo(() => {
    return equipment.map(e => ({
      name: e.name.split(' ')[0],
      value: e.runningHours,
      color: e.status === 'running' ? '#00B42A' : e.status === 'standby' ? '#165DFF' : '#F53F3F',
    }));
  }, [equipment]);

  const latestInspections = useMemo(() => {
    const latest: Record<string, Inspection> = {};
    inspections.forEach(i => {
      if (!latest[i.equipmentId] || new Date(i.inspectionTime) > new Date(latest[i.equipmentId].inspectionTime)) {
        latest[i.equipmentId] = i;
      }
    });
    return latest;
  }, [inspections]);

  const handleAddInspection = (equip: Equipment) => {
    setSelectedEquipment(equip);
    form.setFieldsValue({
      equipmentId: equip.id,
      vibration: latestInspections[equip.id]?.vibration || 3.5,
      temperature: latestInspections[equip.id]?.temperature || 45,
      pressure: latestInspections[equip.id]?.pressure || 0.25,
      current: latestInspections[equip.id]?.current || 65,
      status: 'normal',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitInspection = () => {
    form.validateFields().then(values => {
      addInspection({
        ...values,
        equipmentId: selectedEquipment?.id || '',
        inspector: currentUser.name,
        inspectionTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      });
      message.success('点检记录提交成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const getEquipmentStatusIcon = (status: string) => {
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

  const pumpColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Equipment) => (
        <div className="flex items-center gap-2">
          {getEquipmentStatusIcon(record.status)}
          <span>{name}</span>
        </div>
      ),
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
      render: (status: string) => {
        const color = status === 'running' ? 'green' : status === 'standby' ? 'blue' : 'red';
        return <Tag color={color}>{getEquipmentStatusText(status)}</Tag>;
      },
    },
    {
      title: '运行时间',
      dataIndex: 'runningHours',
      key: 'runningHours',
      render: (hours: number) => <span className="font-mono">{hours} h</span>,
    },
    {
      title: '上次点检',
      key: 'lastInspection',
      render: (_: any, record: Equipment) => {
        const last = latestInspections[record.id];
        return last ? formatDate(last.inspectionTime) : '-';
      },
    },
    {
      title: '点检状态',
      key: 'inspectionStatus',
      render: (_: any, record: Equipment) => {
        const last = latestInspections[record.id];
        if (!last) return <Tag color="default">未点检</Tag>;
        const color = getStatusColor(last.status as 'normal' | 'warning' | 'fault');
        const text = last.status === 'normal' ? '正常' : last.status === 'warning' ? '异常' : '故障';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '下次维护',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Equipment) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<Plus size={14} />}
          onClick={() => handleAddInspection(record)}
        >
          点检
        </Button>
      ),
    },
  ];

  const equipmentColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Equipment) => (
        <div className="flex items-center gap-2">
          {getEquipmentStatusIcon(record.status)}
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map: Record<string, string> = {
          pump: '泵',
          compressor: '压缩机',
          'heat-exchanger': '换热器',
          valve: '阀门',
          other: '其他',
        };
        return map[type] || type;
      },
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
      render: (status: string) => {
        const color = status === 'running' ? 'green' : status === 'standby' ? 'blue' : status === 'fault' ? 'red' : 'orange';
        return <Tag color={color}>{getEquipmentStatusText(status)}</Tag>;
      },
    },
    {
      title: '运行时间',
      dataIndex: 'runningHours',
      key: 'runningHours',
      render: (hours: number) => <span className="font-mono">{hours} h</span>,
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
    },
    {
      title: '下次维护',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
    },
  ];

  const inspectionColumns = [
    {
      title: '点检时间',
      dataIndex: 'inspectionTime',
      key: 'inspectionTime',
      render: (time: string) => formatDate(time),
    },
    {
      title: '设备名称',
      key: 'equipmentName',
      render: (_: any, record: Inspection) => {
        const equip = equipment.find(e => e.id === record.equipmentId);
        return equip?.name || '-';
      },
    },
    {
      title: '点检员',
      dataIndex: 'inspector',
      key: 'inspector',
    },
    {
      title: '振动 (mm/s)',
      dataIndex: 'vibration',
      key: 'vibration',
      render: (val?: number) => val?.toFixed(2) || '-',
    },
    {
      title: '温度 (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (val?: number) => val?.toFixed(1) || '-',
    },
    {
      title: '压力 (MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      render: (val?: number) => val?.toFixed(2) || '-',
    },
    {
      title: '电流 (A)',
      dataIndex: 'current',
      key: 'current',
      render: (val?: number) => val?.toFixed(1) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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

  const equipmentTabItems = [
    {
      key: '1',
      label: '机泵运行点检',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">机泵总数</span>
                  <Cpu size={18} className="text-primary-400" />
                </div>
                <div className="text-3xl font-bold font-mono text-white">{pumpEquipment.length}</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">运行中</span>
                  <CheckCircle size={18} className="text-green-400" />
                </div>
                <div className="text-3xl font-bold font-mono text-green-400">
                  {pumpEquipment.filter(p => p.status === 'running').length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">备用</span>
                  <Clock size={18} className="text-blue-400" />
                </div>
                <div className="text-3xl font-bold font-mono text-blue-400">
                  {pumpEquipment.filter(p => p.status === 'standby').length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">故障</span>
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div className="text-3xl font-bold font-mono text-red-400">
                  {pumpEquipment.filter(p => p.status === 'fault').length}
                </div>
              </div>
            </Col>
          </Row>

          <Card 
            title="机泵运行参数" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Row gutter={[16, 16]}>
              {pumpEquipment.slice(0, 4).map(pump => {
                const last = latestInspections[pump.id];
                return (
                  <Col xs={24} lg={6} key={pump.id}>
                    <div className="industrial-card h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getEquipmentStatusIcon(pump.status)}
                          <span className="font-semibold text-white text-sm">{pump.name.split(' ')[0]}</span>
                        </div>
                        <Tag color={pump.status === 'running' ? 'green' : 'blue'}>
                          {getEquipmentStatusText(pump.status)}
                        </Tag>
                      </div>
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
                      <Button 
                        type="primary" 
                        size="small" 
                        block
                        icon={<Plus size={14} />}
                        className="mt-3"
                        onClick={() => handleAddInspection(pump)}
                      >
                        设备点检
                      </Button>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>

          <Card 
            title="机泵点检列表" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Table
              dataSource={pumpEquipment}
              columns={pumpColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="data-table"
            />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: '设备台账',
      children: (
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
            title="所有设备" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Table
              dataSource={equipment}
              columns={equipmentColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="data-table"
            />
          </Card>
        </div>
      ),
    },
    {
      key: '3',
      label: '点检记录',
      children: (
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
              dataSource={inspections.slice(0, 30)}
              columns={inspectionColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="data-table"
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">设备点检</h2>
          <p className="text-sm text-industrial-subtext">
            机泵运行监控、设备台账管理与点检记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {equipment.filter(e => e.status === 'running').length} 台运行中
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
        title={`设备点检 - ${selectedEquipment?.name}`}
        open={isModalOpen}
        onOk={handleSubmitInspection}
        onCancel={() => setIsModalOpen(false)}
        okText="提交"
        cancelText="取消"
        className="industrial-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="equipmentId" hidden>
            <Input />
          </Form.Item>
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
                name="status"
                label="点检状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="normal">正常</Option>
                  <Option value="warning">警告</Option>
                  <Option value="fault">故障</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入点检备注..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
