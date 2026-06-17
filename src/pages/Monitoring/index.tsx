import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Tag, Tabs, Select, Input, Space, Button, DatePicker, Form } from 'antd';
import { Activity, AlertTriangle, Bell, TrendingUp, RefreshCw, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateTrendData } from '@/mock';
import { formatDate, getStatusColor } from '@/utils';
import LineChart from '@/components/Charts/LineChart';
import GaugeChart from '@/components/Charts/GaugeChart';
import ParamCard from '@/components/Common/ParamCard';
import AlarmItem from '@/components/Common/AlarmItem';
import type { Parameter, AlarmPoint } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

export default function Monitoring() {
  const { parameters, alarms, updateParams } = useAppStore();
  const [selectedParam, setSelectedParam] = useState<string>('p1');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyFilterForm] = Form.useForm();
  const [historyLevelFilter, setHistoryLevelFilter] = useState<string>('all');
  const [historyParamFilter, setHistoryParamFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyOperatorFilter, setHistoryOperatorFilter] = useState<string>('all');
  const [historyDateRange, setHistoryDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedAlarmPoint, setSelectedAlarmPoint] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const trendData = useMemo(() => generateTrendData(selectedParam, 24), [selectedParam]);
  
  const selectedParameter = useMemo(() => 
    parameters.find(p => p.id === selectedParam),
    [parameters, selectedParam]
  );

  const alarmPoints = useMemo((): AlarmPoint[] => {
    const paramAlarms = alarms.filter(a => a.parameterId === selectedParam);
    return paramAlarms.map(alarm => ({
      time: alarm.alarmTime,
      value: alarm.actualValue,
      type: alarm.actualValue > alarm.limitValue ? 'upper' : 'lower',
      level: alarm.level,
      alarmId: alarm.id,
      parameterName: alarm.parameterName,
      limitValue: alarm.limitValue,
      status: alarm.status,
      operator: alarm.operator,
      handleRemark: alarm.handleRemark,
    }));
  }, [alarms, selectedParam]);

  const filteredParameters = useMemo(() => {
    return parameters.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         p.tag.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [parameters, searchText, statusFilter]);

  const activeAlarms = useMemo(() => 
    alarms.filter(a => a.status === 'active' || a.status === 'acknowledged'),
    [alarms]
  );

  const allOperators = useMemo(() => {
    const operators = new Set<string>();
    alarms.forEach(a => {
      if (a.operator) operators.add(a.operator);
    });
    return Array.from(operators);
  }, [alarms]);

  const filteredHistoryAlarms = useMemo(() => {
    return alarms.filter(alarm => {
      const matchLevel = historyLevelFilter === 'all' || alarm.level === historyLevelFilter;
      const matchParam = historyParamFilter === 'all' || alarm.parameterId === historyParamFilter;
      const matchStatus = historyStatusFilter === 'all' || 
        (historyStatusFilter === 'unclosed' && alarm.status !== 'cleared') ||
        alarm.status === historyStatusFilter;
      const matchOperator = historyOperatorFilter === 'all' || alarm.operator === historyOperatorFilter;
      
      let matchDate = true;
      if (historyDateRange && historyDateRange[0] && historyDateRange[1]) {
        const alarmDate = dayjs(alarm.alarmTime);
        matchDate = alarmDate.isAfter(historyDateRange[0]) && alarmDate.isBefore(historyDateRange[1]);
      }
      
      return matchLevel && matchParam && matchStatus && matchOperator && matchDate;
    });
  }, [alarms, historyLevelFilter, historyParamFilter, historyStatusFilter, historyOperatorFilter, historyDateRange]);

  const alarmStats = useMemo(() => ({
    total: alarms.length,
    active: alarms.filter(a => a.status === 'active').length,
    acknowledged: alarms.filter(a => a.status === 'acknowledged').length,
    warning: alarms.filter(a => a.level === 'warning' && a.status !== 'cleared').length,
    alarm: alarms.filter(a => a.level === 'alarm' && a.status !== 'cleared').length,
  }), [alarms]);

  const paramColumns = [
    {
      title: '位号',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: string) => <span className="font-mono text-primary-400">{tag}</span>,
    },
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (val: number, record: Parameter) => (
        <span className={cn(
          'font-mono font-semibold',
          record.status === 'normal' ? 'text-green-400' :
          record.status === 'warning' ? 'text-orange-400' : 'text-red-400'
        )}>
          {val.toFixed(1)} {record.unit}
        </span>
      ),
    },
    {
      title: '范围',
      key: 'range',
      render: (_: any, record: Parameter) => (
        <span className="font-mono text-industrial-subtext">
          {record.lowerLimit} ~ {record.upperLimit} {record.unit}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = getStatusColor(status as 'normal' | 'warning' | 'alarm');
        const text = status === 'normal' ? '正常' : status === 'warning' ? '警告' : '报警';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      render: (time: string) => <span className="text-sm">{formatDate(time)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Parameter) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => setSelectedParam(record.id)}
        >
          查看趋势
        </Button>
      ),
    },
  ];

  const keyParams = useMemo(() => {
    const ids = ['p1', 'p2', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    return parameters.filter(p => ids.includes(p.id));
  }, [parameters]);

  const paramTabItems = [
    {
      key: '1',
      label: '参数概览',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">总参数数</span>
                  <Activity size={18} className="text-primary-400" />
                </div>
                <div className="text-3xl font-bold font-mono text-white">{parameters.length}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">正常</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow-green" />
                </div>
                <div className="text-3xl font-bold font-mono text-green-400">
                  {parameters.filter(p => p.status === 'normal').length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">警告</span>
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-glow-orange animate-pulse" />
                </div>
                <div className="text-3xl font-bold font-mono text-orange-400">
                  {parameters.filter(p => p.status === 'warning').length}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">报警</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-glow-red animate-pulse" />
                </div>
                <div className="text-3xl font-bold font-mono text-red-400">
                  {parameters.filter(p => p.status === 'alarm').length}
                </div>
              </div>
            </Col>
          </Row>

          <Card 
            title="关键参数监控" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
            extra={
              <Button 
                type="primary" 
                size="small" 
                icon={<RefreshCw size={14} />}
                onClick={() => updateParams()}
              >
                刷新
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {keyParams.map(param => (
                <Col xs={24} sm={12} lg={6} key={param.id}>
                  <ParamCard param={param} />
                </Col>
              ))}
            </Row>
          </Card>

          <Card 
            title="关键参数趋势" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
            extra={
              <Select
                value={selectedParam}
                onChange={setSelectedParam}
                style={{ width: 200 }}
                size="small"
              >
                {parameters.map(p => (
                  <Option key={p.id} value={p.id}>{p.name} ({p.tag})</Option>
                ))}
              </Select>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <LineChart
                  data={trendData}
                  unit={selectedParameter?.unit || ''}
                  color="#165DFF"
                  height={350}
                  upperLimit={selectedParameter?.upperLimit}
                  lowerLimit={selectedParameter?.lowerLimit}
                  alarmPoints={alarmPoints}
                />
              </Col>
              <Col xs={24} lg={8}>
                <div className="grid grid-cols-1 gap-4">
                  <GaugeChart
                    value={selectedParameter?.currentValue || 0}
                    min={selectedParameter?.lowerLimit || 0}
                    max={selectedParameter?.upperLimit || 100}
                    title={selectedParameter?.name || '参数'}
                    unit={selectedParameter?.unit || ''}
                    warningThreshold={(selectedParameter?.upperLimit || 100) * 0.9}
                    dangerThreshold={selectedParameter?.upperLimit || 100}
                    height={200}
                  />
                  <div className="industrial-card">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="data-label">位号</span>
                        <span className="font-mono text-primary-400">{selectedParameter?.tag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="data-label">上限</span>
                        <span className="font-mono text-red-400">{selectedParameter?.upperLimit} {selectedParameter?.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="data-label">下限</span>
                        <span className="font-mono text-red-400">{selectedParameter?.lowerLimit} {selectedParameter?.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="data-label">更新时间</span>
                        <span className="text-sm">{formatDate(selectedParameter?.lastUpdate || '')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: '实时参数表',
      children: (
        <div className="pt-4">
          <Card 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
            title="所有参数"
            extra={
              <Space>
                <Input
                  placeholder="搜索参数名称或位号"
                  prefix={<Search size={16} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                  size="small"
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="all">全部</Option>
                  <Option value="normal">正常</Option>
                  <Option value="warning">警告</Option>
                  <Option value="alarm">报警</Option>
                </Select>
              </Space>
            }
          >
            <Table
              dataSource={filteredParameters}
              columns={paramColumns}
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
      label: '报警管理',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Bell size={20} className="text-red-400" />
                  </div>
                  <div>
                    <div className="data-label">活动报警</div>
                    <div className="text-2xl font-bold text-red-400">{alarmStats.active}</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <AlertTriangle size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="data-label">警告级别</div>
                    <div className="text-2xl font-bold text-orange-400">{alarmStats.warning}</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/20">
                    <TrendingUp size={20} className="text-primary-400" />
                  </div>
                  <div>
                    <div className="data-label">已确认</div>
                    <div className="text-2xl font-bold text-primary-400">{alarmStats.acknowledged}</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Card 
            title="实时报警列表" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="space-y-3">
              {activeAlarms.length === 0 ? (
                <div className="text-center py-8 text-industrial-subtext">
                  <Activity size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无活动报警</p>
                </div>
              ) : (
                activeAlarms.map(alarm => (
                  <AlarmItem
                    key={alarm.id}
                    alarm={alarm}
                  />
                ))
              )}
            </div>
          </Card>

          <Card 
            title="历史报警记录" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
            extra={
              <Space wrap>
                <DatePicker.RangePicker
                  value={historyDateRange}
                  onChange={(dates) => setHistoryDateRange(dates as any)}
                  placeholder={['开始时间', '结束时间']}
                  size="small"
                />
                <Select
                  value={historyLevelFilter}
                  onChange={setHistoryLevelFilter}
                  style={{ width: 100 }}
                  size="small"
                >
                  <Option value="all">全部级别</Option>
                  <Option value="warning">警告</Option>
                  <Option value="alarm">报警</Option>
                </Select>
                <Select
                  value={historyStatusFilter}
                  onChange={setHistoryStatusFilter}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="all">全部状态</Option>
                  <Option value="unclosed">未闭环</Option>
                  <Option value="active">活动</Option>
                  <Option value="acknowledged">已确认</Option>
                  <Option value="cleared">已消除</Option>
                </Select>
                <Select
                  value={historyParamFilter}
                  onChange={setHistoryParamFilter}
                  style={{ width: 150 }}
                  size="small"
                >
                  <Option value="all">全部参数</Option>
                  {parameters.map(p => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Select>
                <Select
                  value={historyOperatorFilter}
                  onChange={setHistoryOperatorFilter}
                  style={{ width: 120 }}
                  size="small"
                  placeholder="处理人"
                >
                  <Option value="all">全部处理人</Option>
                  {allOperators.map(op => (
                    <Option key={op} value={op}>{op}</Option>
                  ))}
                </Select>
                <Button 
                  size="small" 
                  icon={<Filter size={14} />}
                  onClick={() => {
                    setHistoryLevelFilter('all');
                    setHistoryStatusFilter('all');
                    setHistoryParamFilter('all');
                    setHistoryOperatorFilter('all');
                    setHistoryDateRange(null);
                  }}
                >
                  重置
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={filteredHistoryAlarms}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="data-table"
              columns={[
                {
                  title: '报警时间',
                  dataIndex: 'alarmTime',
                  key: 'alarmTime',
                  width: 160,
                  render: (time: string) => formatDate(time),
                },
                {
                  title: '参数名称',
                  dataIndex: 'parameterName',
                  key: 'parameterName',
                  width: 130,
                },
                {
                  title: '实际值',
                  dataIndex: 'actualValue',
                  key: 'actualValue',
                  width: 80,
                  render: (val: number) => <span className="font-mono">{val}</span>,
                },
                {
                  title: '限值',
                  dataIndex: 'limitValue',
                  key: 'limitValue',
                  width: 80,
                  render: (val: number) => <span className="font-mono text-red-400">{val}</span>,
                },
                {
                  title: '级别',
                  dataIndex: 'level',
                  key: 'level',
                  width: 80,
                  render: (level: string) => (
                    <Tag color={level === 'alarm' ? 'red' : 'orange'}>
                      {level === 'alarm' ? '报警' : '警告'}
                    </Tag>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 90,
                  render: (status: string) => {
                    const colorMap: Record<string, string> = {
                      active: 'red',
                      acknowledged: 'orange',
                      cleared: 'green',
                    };
                    const textMap: Record<string, string> = {
                      active: '活动',
                      acknowledged: '已确认',
                      cleared: '已消除',
                    };
                    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
                  },
                },
                {
                  title: '处理人',
                  dataIndex: 'operator',
                  key: 'operator',
                  width: 100,
                  render: (val?: string) => val || '-',
                },
                {
                  title: '处理意见',
                  dataIndex: 'handleRemark',
                  key: 'handleRemark',
                  ellipsis: true,
                  render: (val?: string) => val || '-',
                },
                {
                  title: '消除时间',
                  dataIndex: 'clearTime',
                  key: 'clearTime',
                  width: 160,
                  render: (time?: string) => time ? formatDate(time) : '-',
                },
              ]}
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
          <h2 className="text-xl font-bold text-white">参数监控</h2>
          <p className="text-sm text-industrial-subtext">
            实时监控装置运行参数，追踪关键指标趋势
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            实时更新中
          </span>
        </div>
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={paramTabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
