import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, Timeline, Progress, Space, Select, Form, Input } from 'antd';
import { Plus, Eye, Play, CheckCircle, Clock, FileText } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusText, getStatusBgColor, getPlanTypeText, formatDate, cn } from '@/utils';
import type { ShutdownPlan } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function StartupShutdown() {
  const { shutdownPlans, currentUnitId, updateShutdownPlanStep, currentUser } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<ShutdownPlan | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [form] = Form.useForm();

  const unitPlans = shutdownPlans.filter(p => p.unitId === currentUnitId);

  const handleViewDetail = (plan: ShutdownPlan) => {
    setSelectedPlan(plan);
    setDetailVisible(true);
  };

  const handleStepAction = (planId: string, stepId: string, currentStatus: string) => {
    let newStatus = '';
    if (currentStatus === 'pending') {
      newStatus = 'in-progress';
    } else if (currentStatus === 'in-progress') {
      newStatus = 'completed';
    }
    if (newStatus) {
      updateShutdownPlanStep(planId, stepId, newStatus, currentUser.name);
      const updatedPlan = shutdownPlans.find(p => p.id === planId);
      if (updatedPlan) {
        setSelectedPlan({ ...updatedPlan });
      }
    }
  };

  const handleCreatePlan = () => {
    form.validateFields().then(() => {
      setCreateVisible(false);
      form.resetFields();
    });
  };

  const columns = [
    {
      title: '方案名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ShutdownPlan) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-primary-400" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'startup' ? 'green' : 'orange'}>
          {getPlanTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <span className={cn(
          'px-2 py-1 rounded text-xs border',
          getStatusBgColor(status)
        )}>
          {getStatusText(status)}
        </span>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 180,
      render: (_: any, record: ShutdownPlan) => {
        const completed = record.steps.filter(s => s.status === 'completed').length;
        const total = record.steps.length;
        const percent = Math.round((completed / total) * 100);
        return (
          <div className="flex items-center gap-2">
            <Progress 
              percent={percent} 
              size="small"
              strokeColor={percent === 100 ? '#00B42A' : '#165DFF'}
              showInfo={false}
              className="w-24"
            />
            <span className="text-sm text-industrial-subtext">{completed}/{total}</span>
          </div>
        );
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
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ShutdownPlan) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">装置开停工管理</h2>
          <p className="text-sm text-industrial-subtext">开停工方案制定、执行与跟踪</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreateVisible(true)}
        >
          新建方案
        </Button>
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
      >
        <Table
          dataSource={unitPlans}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="data-table"
        />
      </Card>

      <Modal
        title="方案详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-industrial-border/30">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{selectedPlan.name}</h3>
                <div className="flex items-center gap-3 text-sm text-industrial-subtext">
                  <Tag color={selectedPlan.type === 'startup' ? 'green' : 'orange'}>
                    {getPlanTypeText(selectedPlan.type)}
                  </Tag>
                  <span>创建人: {selectedPlan.creator}</span>
                  {selectedPlan.approver && <span>审批人: {selectedPlan.approver}</span>}
                </div>
              </div>
              <span className={cn(
                'px-3 py-1 rounded text-sm border',
                getStatusBgColor(selectedPlan.status)
              )}>
                {getStatusText(selectedPlan.status)}
              </span>
            </div>

            <div className="p-4">
              <h4 className="text-sm font-medium text-white mb-4">执行步骤</h4>
              <Timeline
                mode="left"
                items={selectedPlan.steps.map((step, index) => ({
                  color: step.status === 'completed' ? '#00B42A' : 
                         step.status === 'in-progress' ? '#165DFF' : 
                         step.status === 'skipped' ? '#86909C' : '#1E2A45',
                  dot: step.status === 'completed' ? <CheckCircle size={16} /> :
                       step.status === 'in-progress' ? <Play size={16} className="animate-pulse" /> :
                       <Clock size={16} />,
                  children: (
                    <div className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-white">
                            步骤 {index + 1}: {step.name}
                          </div>
                          <div className="text-sm text-industrial-subtext mt-1">
                            {step.description}
                          </div>
                          {step.operator && (
                            <div className="text-xs text-industrial-subtext/70 mt-1">
                              操作人: {step.operator}
                            </div>
                          )}
                          {step.startTime && (
                            <div className="text-xs text-industrial-subtext/70">
                              开始时间: {step.startTime}
                              {step.endTime && ` · 完成时间: ${step.endTime}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs border',
                            getStatusBgColor(step.status)
                          )}>
                            {getStatusText(step.status)}
                          </span>
                          {selectedPlan.status !== 'completed' && 
                           selectedPlan.status !== 'cancelled' &&
                           selectedPlan.status !== 'draft' &&
                           step.status !== 'completed' &&
                           step.status !== 'skipped' && (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleStepAction(selectedPlan.id, step.id, step.status)}
                            >
                              {step.status === 'pending' ? '开始' : '完成'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="新建开停工方案"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreatePlan}
        width={600}
        styles={{ body: { backgroundColor: '#141A2E' } }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="方案名称"
            rules={[{ required: true, message: '请输入方案名称' }]}
          >
            <Input placeholder="请输入方案名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="方案类型"
            rules={[{ required: true, message: '请选择方案类型' }]}
          >
            <Select placeholder="请选择方案类型">
              <Option value="startup">开工方案</Option>
              <Option value="shutdown">停工方案</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="方案描述"
          >
            <TextArea rows={4} placeholder="请输入方案描述" />
          </Form.Item>
          <Form.Item
            name="planStartTime"
            label="计划开始时间"
            rules={[{ required: true, message: '请选择计划开始时间' }]}
          >
            <Input type="datetime-local" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
