import { useState, useEffect, useMemo } from 'react';
import { 
  Card, Table, Tag, Button, Modal, Timeline, Progress, Space, Select, Form, Input, 
  List, message, Popconfirm, Tooltip 
} from 'antd';
import { 
  Plus, Eye, Play, CheckCircle, Clock, FileText, Save, GripVertical, 
  Trash2, Edit3, ArrowUp, ArrowDown, X 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getStartupTemplateSteps, getShutdownTemplateSteps } from '@/mock';
import { getStatusText, getStatusBgColor, getPlanTypeText, formatDate, cn } from '@/utils';
import type { ShutdownPlan, ShutdownPlanStep } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function StartupShutdown() {
  const { 
    shutdownPlans, currentUnitId, updateShutdownPlanStep, addShutdownPlan,
    currentUser, saveDraftPlan, clearDraftPlan, draftPlan, updateShutdownPlanSteps
  } = useAppStore();
  
  const [selectedPlan, setSelectedPlan] = useState<ShutdownPlan | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [form] = Form.useForm();
  const [editSteps, setEditSteps] = useState<ShutdownPlanStep[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepForm] = Form.useForm();

  useEffect(() => {
    const savedDraft = localStorage.getItem('fccu_draft_plan');
    if (savedDraft && !draftPlan) {
      try {
        const parsed = JSON.parse(savedDraft);
        saveDraftPlan(parsed);
      } catch (e) {
        console.error('Failed to parse draft plan');
      }
    }
  }, [draftPlan, saveDraftPlan]);

  useEffect(() => {
    if (draftPlan) {
      form.setFieldsValue({
        name: draftPlan.name,
        type: draftPlan.type,
        description: draftPlan.description || '',
        planStartTime: draftPlan.startTime,
      });
      if (draftPlan.steps) {
        setEditSteps(draftPlan.steps);
      }
    }
  }, [draftPlan, form]);

  const unitPlans = useMemo(() => 
    shutdownPlans.filter(p => p.unitId === currentUnitId),
    [shutdownPlans, currentUnitId]
  );

  const selectedPlanFromStore = useMemo(() => 
    selectedPlan ? shutdownPlans.find(p => p.id === selectedPlan.id) : null,
    [shutdownPlans, selectedPlan?.id]
  );

  const displayPlan = selectedPlanFromStore || selectedPlan;

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
      message.success(currentStatus === 'pending' ? '步骤已开始' : '步骤已完成');
    }
  };

  const handleTypeChange = (type: 'startup' | 'shutdown') => {
    const templateSteps = type === 'startup' 
      ? getStartupTemplateSteps() 
      : getShutdownTemplateSteps();
    
    const newSteps: ShutdownPlanStep[] = templateSteps.map((step, index) => ({
      ...step,
      id: `step_${Date.now()}_${index}`,
    }));
    
    setEditSteps(newSteps);
    handleSaveDraft();
  };

  const handleSaveDraft = () => {
    const formValues = form.getFieldsValue();
    const draft: Partial<ShutdownPlan> = {
      unitId: currentUnitId,
      name: formValues.name,
      type: formValues.type,
      description: formValues.description,
      startTime: formValues.planStartTime,
      status: 'draft',
      steps: editSteps,
      creator: currentUser.name,
    };
    saveDraftPlan(draft);
    message.success('草稿已保存');
  };

  const handleCreatePlan = () => {
    form.validateFields().then((values) => {
      if (editSteps.length === 0) {
        message.warning('请至少添加一个步骤');
        return;
      }

      const newPlan: Omit<ShutdownPlan, 'id' | 'createTime'> = {
        unitId: currentUnitId,
        name: values.name,
        type: values.type,
        description: values.description,
        startTime: values.planStartTime,
        status: 'approved',
        steps: editSteps.map((step, index) => ({
          ...step,
          order: index + 1,
        })),
        creator: currentUser.name,
      };

      addShutdownPlan(newPlan);
      clearDraftPlan();
      setCreateVisible(false);
      form.resetFields();
      setEditSteps([]);
      message.success('方案创建成功');
    });
  };

  const handleAddStep = () => {
    const newStep: ShutdownPlanStep = {
      id: `step_${Date.now()}`,
      name: `新步骤 ${editSteps.length + 1}`,
      description: '',
      status: 'pending',
      order: editSteps.length + 1,
    };
    setEditSteps([...editSteps, newStep]);
    handleSaveDraft();
  };

  const handleDeleteStep = (stepId: string) => {
    const newSteps = editSteps
      .filter(s => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setEditSteps(newSteps);
    handleSaveDraft();
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === editSteps.length - 1)) {
      return;
    }
    const newSteps = [...editSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    newSteps.forEach((s, i) => s.order = i + 1);
    setEditSteps(newSteps);
    handleSaveDraft();
  };

  const handleEditStep = (step: ShutdownPlanStep) => {
    setEditingStepId(step.id);
    editStepForm.setFieldsValue({
      name: step.name,
      description: step.description,
    });
  };

  const handleSaveStepEdit = () => {
    editStepForm.validateFields().then((values) => {
      const newSteps = editSteps.map(s => 
        s.id === editingStepId 
          ? { ...s, name: values.name, description: values.description }
          : s
      );
      setEditSteps(newSteps);
      setEditingStepId(null);
      editStepForm.resetFields();
      handleSaveDraft();
    });
  };

  const handleCloseCreateModal = () => {
    if (editSteps.length > 0 || form.getFieldsValue().name) {
      Modal.confirm({
        title: '保存草稿',
        content: '是否保存当前方案草稿？下次打开可继续编辑。',
        okText: '保存草稿',
        cancelText: '不保存',
        onOk: () => {
          handleSaveDraft();
          setCreateVisible(false);
        },
        onCancel: () => {
          clearDraftPlan();
          setCreateVisible(false);
          form.resetFields();
          setEditSteps([]);
        },
      });
    } else {
      setCreateVisible(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (draftPlan) {
      Modal.confirm({
        title: '存在未完成的草稿',
        content: '检测到未完成的方案草稿，是否继续编辑？',
        okText: '继续编辑',
        cancelText: '新建方案',
        onOk: () => {
          setCreateVisible(true);
        },
        onCancel: () => {
          clearDraftPlan();
          form.resetFields();
          setEditSteps([]);
          setCreateVisible(true);
        },
      });
    } else {
      form.resetFields();
      setEditSteps([]);
      setCreateVisible(true);
    }
  };

  const calculateProgress = (plan: ShutdownPlan) => {
    const completed = plan.steps.filter(s => s.status === 'completed').length;
    const total = plan.steps.length;
    return Math.round((completed / total) * 100);
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
          {record.status === 'draft' && <Tag color="default">草稿</Tag>}
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
        const percent = calculateProgress(record);
        return (
          <div className="flex items-center gap-2">
            <Progress 
              percent={percent} 
              size="small"
              strokeColor={percent === 100 ? '#00B42A' : '#165DFF'}
              showInfo={false}
              className="w-24"
            />
            <span className="text-sm text-industrial-subtext">
              {record.steps.filter(s => s.status === 'completed').length}/{record.steps.length}
            </span>
          </div>
        );
      },
    },
    {
      title: '计划时间',
      key: 'planTime',
      width: 160,
      render: (_: any, record: ShutdownPlan) => record.startTime || '-',
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
          onClick={handleOpenCreateModal}
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
        {displayPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-industrial-border/30">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{displayPlan.name}</h3>
                <div className="flex items-center gap-3 text-sm text-industrial-subtext">
                  <Tag color={displayPlan.type === 'startup' ? 'green' : 'orange'}>
                    {getPlanTypeText(displayPlan.type)}
                  </Tag>
                  <span>创建人: {displayPlan.creator}</span>
                  {displayPlan.approver && <span>审批人: {displayPlan.approver}</span>}
                  {displayPlan.startTime && <span>计划时间: {displayPlan.startTime}</span>}
                </div>
                {displayPlan.description && (
                  <p className="text-sm text-industrial-subtext mt-2">{displayPlan.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className={cn(
                  'px-3 py-1 rounded text-sm border inline-block',
                  getStatusBgColor(displayPlan.status)
                )}>
                  {getStatusText(displayPlan.status)}
                </span>
                <div className="mt-3">
                  <Progress 
                    percent={calculateProgress(displayPlan)} 
                    size="small"
                    strokeColor={calculateProgress(displayPlan) === 100 ? '#00B42A' : '#165DFF'}
                  />
                </div>
              </div>
            </div>

            {displayPlan.status === 'executing' || displayPlan.status === 'completed' ? (
              <div className="p-4 bg-industrial-border/20 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-4">执行汇总</h4>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-400 font-mono">
                        {displayPlan.steps.filter(s => s.status === 'completed').length}
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">已完成步骤</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 font-mono">
                        {[...new Set(displayPlan.steps.filter(s => s.operator).map(s => s.operator))].length}
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">执行人</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400 font-mono">
                        {(() => {
                          const completedSteps = displayPlan.steps.filter(s => s.startTime && s.endTime);
                          if (completedSteps.length === 0) return '-';
                          let totalMs = 0;
                          completedSteps.forEach(s => {
                            totalMs += new Date(s.endTime!).getTime() - new Date(s.startTime!).getTime();
                          });
                          const hours = Math.floor(totalMs / (1000 * 60 * 60));
                          const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        })()}
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">总耗时</div>
                    </div>
                  </Col>
                </Row>
                {displayPlan.endTime && (
                  <div className="text-center mt-3 pt-3 border-t border-industrial-border">
                    <span className="text-xs text-industrial-subtext">完成时间: </span>
                    <span className="text-sm text-white">{displayPlan.endTime}</span>
                  </div>
                )}
                {[...new Set(displayPlan.steps.filter(s => s.operator).map(s => s.operator))].length > 0 && (
                  <div className="mt-3 pt-3 border-t border-industrial-border">
                    <div className="text-xs text-industrial-subtext mb-2">执行人列表</div>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(displayPlan.steps.filter(s => s.operator).map(s => s.operator))].map((op, idx) => (
                        <Tag key={idx} color="blue">{op}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="p-4">
              <h4 className="text-sm font-medium text-white mb-4">执行步骤</h4>
              <Timeline
                mode="left"
                items={[...displayPlan.steps]
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => ({
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
                              步骤 {step.order}: {step.name}
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
                                {step.startTime && step.endTime && (() => {
                                  const diff = new Date(step.endTime!).getTime() - new Date(step.startTime!).getTime();
                                  const hours = Math.floor(diff / (1000 * 60 * 60));
                                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                  return ` · 耗时: ${hours}h${minutes}m`;
                                })()}
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
                            {displayPlan.status !== 'completed' && 
                             displayPlan.status !== 'cancelled' &&
                             displayPlan.status !== 'draft' &&
                             step.status !== 'completed' &&
                             step.status !== 'skipped' && (
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => handleStepAction(displayPlan.id, step.id, step.status)}
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
        title={draftPlan ? '编辑方案草稿' : '新建开停工方案'}
        open={createVisible}
        onCancel={handleCloseCreateModal}
        onOk={handleCreatePlan}
        width={700}
        styles={{ body: { backgroundColor: '#141A2E' } }}
        okText="提交方案"
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className="flex justify-between">
            <Button 
              icon={<Save size={14} />} 
              onClick={handleSaveDraft}
            >
              保存草稿
            </Button>
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        )}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="name"
                label="方案名称"
                rules={[{ required: true, message: '请输入方案名称' }]}
              >
                <Input placeholder="请输入方案名称" onChange={() => handleSaveDraft()} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="type"
                label="方案类型"
                rules={[{ required: true, message: '请选择方案类型' }]}
              >
                <Select 
                  placeholder="请选择方案类型"
                  onChange={(value) => handleTypeChange(value)}
                >
                  <Option value="startup">开工方案</Option>
                  <Option value="shutdown">停工方案</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="方案描述"
          >
            <TextArea rows={3} placeholder="请输入方案描述" onChange={() => handleSaveDraft()} />
          </Form.Item>
          <Form.Item
            name="planStartTime"
            label="计划开始时间"
            rules={[{ required: true, message: '请选择计划开始时间' }]}
          >
            <Input type="datetime-local" style={{ width: '100%' }} onChange={() => handleSaveDraft()} />
          </Form.Item>
        </Form>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">步骤管理</h4>
            <Button 
              type="primary" 
              size="small" 
              icon={<Plus size={14} />}
              onClick={handleAddStep}
            >
              添加步骤
            </Button>
          </div>
          
          {editSteps.length === 0 ? (
            <div className="text-center py-8 text-industrial-subtext border border-dashed border-industrial-border rounded-lg">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p>选择方案类型后自动带出常用步骤</p>
              <p className="text-xs mt-1">也可手动添加步骤</p>
            </div>
          ) : (
            <List
              dataSource={[...editSteps].sort((a, b) => a.order - b.order)}
              renderItem={(step, index) => (
                <List.Item
                  key={step.id}
                  className={cn(
                    'bg-industrial-border/30 rounded-lg mb-2 p-3',
                    editingStepId === step.id && 'ring-2 ring-primary-500'
                  )}
                >
                  {editingStepId === step.id ? (
                    <Form form={editStepForm} layout="vertical" className="w-full">
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="name"
                            label="步骤名称"
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="步骤名称" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="description"
                            label="步骤描述"
                          >
                            <Input placeholder="步骤描述" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <div className="flex justify-end gap-2">
                        <Button size="small" onClick={() => setEditingStepId(null)}>
                          取消
                        </Button>
                        <Button size="small" type="primary" onClick={handleSaveStepEdit}>
                          保存
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <GripVertical size={16} className="text-industrial-subtext cursor-move" />
                      <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                        {step.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{step.name}</div>
                        {step.description && (
                          <div className="text-xs text-industrial-subtext truncate">{step.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip title="上移">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<ArrowUp size={14} />}
                            disabled={index === 0}
                            onClick={() => handleMoveStep(index, 'up')}
                          />
                        </Tooltip>
                        <Tooltip title="下移">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<ArrowDown size={14} />}
                            disabled={index === editSteps.length - 1}
                            onClick={() => handleMoveStep(index, 'down')}
                          />
                        </Tooltip>
                        <Tooltip title="编辑">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<Edit3 size={14} />}
                            onClick={() => handleEditStep(step)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确认删除"
                          description="确定要删除这个步骤吗？"
                          onConfirm={() => handleDeleteStep(step.id)}
                        >
                          <Button 
                            type="text" 
                            size="small" 
                            danger
                            icon={<Trash2 size={14} />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  )}
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

function Row(props: any) {
  return <div className={cn('flex flex-wrap -mx-2', props.className)} style={{ ...props.style, margin: '0 -8px' }}>{props.children}</div>;
}

function Col(props: any) {
  const getColClass = () => {
    const classes: string[] = [];
    if (props.xs === 24) classes.push('w-full');
    if (props.sm === 16) classes.push('sm:w-2/3');
    if (props.sm === 12) classes.push('sm:w-1/2');
    if (props.sm === 8) classes.push('sm:w-1/3');
    if (props.lg === 12) classes.push('lg:w-1/2');
    return classes.join(' ');
  };
  return (
    <div 
      className={cn('px-2', getColClass(), props.className)} 
      style={{ padding: '0 8px', ...props.style }}
    >
      {props.children}
    </div>
  );
}
