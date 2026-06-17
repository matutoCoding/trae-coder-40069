import dayjs from 'dayjs';
import type {
  Unit,
  ShutdownPlan,
  ShutdownPlanStep,
  Catalyst,
  CatalystLoss,
  ReactorParam,
  RegeneratorParam,
  FractionatorParam,
  AbsorptionParam,
  EnergyData,
  Equipment,
  Inspection,
  Parameter,
  Alarm,
  TrendDataPoint,
  User,
} from '@/types';

const random = (min: number, max: number, decimals = 1) => {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

const generateTimePoints = (count: number, intervalMinutes: number = 5): string[] => {
  const now = dayjs();
  return Array.from({ length: count }, (_, i) =>
    now.subtract((count - 1 - i) * intervalMinutes, 'minute').format('YYYY-MM-DD HH:mm')
  );
};

export const mockUnits: Unit[] = [
  { id: 'u1', name: '催化裂化装置一套', status: 'running', type: 'FCCU' },
  { id: 'u2', name: '催化裂化装置二套', status: 'running', type: 'FCCU' },
  { id: 'u3', name: '催化裂化装置三套', status: 'maintenance', type: 'FCCU' },
];

export const mockShutdownPlans: ShutdownPlan[] = [
  {
    id: 'sp1',
    unitId: 'u1',
    name: '一套装置2026年6月停工检修方案',
    type: 'shutdown',
    status: 'draft',
    createTime: '2026-06-15 09:00:00',
    creator: '张工程师',
    steps: [
      { id: 's1', name: '降量准备', description: '逐步降低处理量至70%', status: 'pending', order: 1 },
      { id: 's2', name: '切断进料', description: '停止原料油进料', status: 'pending', order: 2 },
      { id: 's3', name: '催化剂循环', description: '保持催化剂循环降温', status: 'pending', order: 3 },
      { id: 's4', name: '汽提吹扫', description: '蒸汽吹扫设备及管线', status: 'pending', order: 4 },
      { id: 's5', name: '停工验收', description: '检查确认停工完成', status: 'pending', order: 5 },
    ],
  },
  {
    id: 'sp2',
    unitId: 'u1',
    name: '一套装置2026年6月开工方案',
    type: 'startup',
    status: 'approved',
    startTime: '2026-06-25 08:00:00',
    createTime: '2026-06-10 14:00:00',
    creator: '李工程师',
    approver: '王主任',
    steps: [
      { id: 's1', name: '系统气密', description: '进行系统气密性试验', status: 'completed', startTime: '2026-06-25 08:00:00', endTime: '2026-06-25 10:30:00', operator: '赵操作员', order: 1 },
      { id: 's2', name: '建立催化剂循环', description: '启动催化剂循环系统', status: 'completed', startTime: '2026-06-25 10:30:00', endTime: '2026-06-25 14:00:00', operator: '赵操作员', order: 2 },
      { id: 's3', name: '反应器升温', description: '反应器升温至400°C', status: 'in-progress', startTime: '2026-06-25 14:00:00', operator: '赵操作员', order: 3 },
      { id: 's4', name: '进料准备', description: '检查进料系统准备就绪', status: 'pending', order: 4 },
      { id: 's5', name: '引入进料', description: '逐步引入原料油', status: 'pending', order: 5 },
      { id: 's6', name: '调整操作', description: '调整至正常操作参数', status: 'pending', order: 6 },
    ],
  },
  {
    id: 'sp3',
    unitId: 'u3',
    name: '三套装置2026年6月开工方案',
    type: 'startup',
    status: 'completed',
    startTime: '2026-06-10 08:00:00',
    endTime: '2026-06-12 18:00:00',
    createTime: '2026-06-05 09:00:00',
    creator: '张工程师',
    approver: '王主任',
    steps: [
      { id: 's1', name: '系统气密', description: '进行系统气密性试验', status: 'completed', startTime: '2026-06-10 08:00:00', endTime: '2026-06-10 11:00:00', operator: '刘操作员', order: 1 },
      { id: 's2', name: '建立催化剂循环', description: '启动催化剂循环系统', status: 'completed', startTime: '2026-06-10 11:00:00', endTime: '2026-06-10 15:00:00', operator: '刘操作员', order: 2 },
      { id: 's3', name: '反应器升温', description: '反应器升温至400°C', status: 'completed', startTime: '2026-06-10 15:00:00', endTime: '2026-06-11 08:00:00', operator: '刘操作员', order: 3 },
      { id: 's4', name: '引入进料', description: '逐步引入原料油', status: 'completed', startTime: '2026-06-11 08:00:00', endTime: '2026-06-11 16:00:00', operator: '刘操作员', order: 4 },
      { id: 's5', name: '调整操作', description: '调整至正常操作参数', status: 'completed', startTime: '2026-06-11 16:00:00', endTime: '2026-06-12 18:00:00', operator: '刘操作员', order: 5 },
    ],
  },
];

export const mockCatalysts: Catalyst[] = [
  {
    id: 'c1',
    unitId: 'u1',
    name: '重油催化裂化催化剂 FCC-100',
    inventory: 168.5,
    inventoryUnit: '吨',
    lastReplaced: '2026-03-15',
    expectedLifetime: 180,
    currentActivity: 92.3,
  },
  {
    id: 'c2',
    unitId: 'u2',
    name: '重油催化裂化催化剂 FCC-200',
    inventory: 175.2,
    inventoryUnit: '吨',
    lastReplaced: '2026-04-20',
    expectedLifetime: 180,
    currentActivity: 88.7,
  },
  {
    id: 'c3',
    unitId: 'u3',
    name: '重油催化裂化催化剂 FCC-100',
    inventory: 158.0,
    inventoryUnit: '吨',
    lastReplaced: '2026-06-10',
    expectedLifetime: 180,
    currentActivity: 98.5,
  },
];

export const mockCatalystLosses: CatalystLoss[] = Array.from({ length: 30 }, (_, i) => ({
  id: `cl${i + 1}`,
  catalystId: i < 10 ? 'c1' : i < 20 ? 'c2' : 'c3',
  lossAmount: random(0.5, 2.5),
  recordTime: dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD'),
  reason: ['再生器跑损', '分馏塔夹带', '油浆系统损失'][random(0, 2, 0)],
  location: ['三旋分离器', '分馏塔顶', '油浆过滤器'][random(0, 2, 0)],
}));

export const mockReactorParams: ReactorParam = {
  id: 'rp1',
  unitId: 'u1',
  temperature: 505.2,
  temperatureDistribution: [498.5, 502.3, 505.2, 508.1, 510.5, 507.8, 504.2, 501.0],
  pressure: 0.24,
  catalystCirculation: 1450,
  strippingSteam: 8.5,
  feedRate: 320,
  recordTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export const mockRegeneratorParams: RegeneratorParam = {
  id: 'rg1',
  unitId: 'u1',
  temperature: 695.8,
  pressure: 0.22,
  cokeBurningRate: 12.5,
  oxygenContent: 2.1,
  flueGasFlow: 2850,
  recordTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export const mockFractionatorParams: FractionatorParam = {
  id: 'fp1',
  unitId: 'u1',
  topTemperature: 118.5,
  topPressure: 0.18,
  bottomTemperature: 355.2,
  bottomPressure: 0.22,
  refluxRatio: 2.8,
  slurryFlow: 45.8,
  recordTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export const mockAbsorptionParams: AbsorptionParam = {
  id: 'ap1',
  unitId: 'u1',
  absorberTemperature: 42.5,
  absorberPressure: 1.45,
  stabilizerTemperature: 165.8,
  stabilizerPressure: 1.62,
  leanOilFlow: 185,
  recordTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export const mockEnergyData: EnergyData = {
  id: 'ed1',
  unitId: 'u1',
  flueGasTurbinePower: 32.5,
  steamTurbinePower: 18.2,
  wasteHeatBoilerSteam: 85.6,
  recoveryEfficiency: 86.5,
  totalEnergyConsumption: 125.8,
  recordTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export const mockEquipment: Equipment[] = [
  { id: 'e1', unitId: 'u1', name: '原料油泵P-101A', type: 'pump', status: 'running', lastMaintenance: '2026-05-10', nextMaintenance: '2026-07-10', runningHours: 1250, specification: '离心泵 流量350m³/h' },
  { id: 'e2', unitId: 'u1', name: '原料油泵P-101B', type: 'pump', status: 'standby', lastMaintenance: '2026-05-10', nextMaintenance: '2026-07-10', runningHours: 450, specification: '离心泵 流量350m³/h' },
  { id: 'e3', unitId: 'u1', name: '回炼油泵P-102A', type: 'pump', status: 'running', lastMaintenance: '2026-04-20', nextMaintenance: '2026-06-20', runningHours: 1850, specification: '离心泵 流量200m³/h' },
  { id: 'e4', unitId: 'u1', name: '回炼油泵P-102B', type: 'pump', status: 'fault', lastMaintenance: '2026-04-20', nextMaintenance: '2026-06-18', runningHours: 2100, specification: '离心泵 流量200m³/h' },
  { id: 'e5', unitId: 'u1', name: '富气压缩机C-201', type: 'compressor', status: 'running', lastMaintenance: '2026-03-15', nextMaintenance: '2026-09-15', runningHours: 3200, specification: '离心式压缩机 功率4500kW' },
  { id: 'e6', unitId: 'u1', name: '主风机C-301', type: 'compressor', status: 'running', lastMaintenance: '2026-02-28', nextMaintenance: '2026-08-28', runningHours: 4100, specification: '轴流式压缩机 功率6000kW' },
  { id: 'e7', unitId: 'u1', name: '烟气轮机T-301', type: 'other', status: 'running', lastMaintenance: '2026-03-15', nextMaintenance: '2026-09-15', runningHours: 3200, specification: '功率32000kW' },
  { id: 'e8', unitId: 'u1', name: '余热锅炉B-401', type: 'other', status: 'running', lastMaintenance: '2026-01-20', nextMaintenance: '2026-07-20', runningHours: 5200, specification: '产汽量85t/h' },
];

export const mockInspections: Inspection[] = Array.from({ length: 50 }, (_, i) => ({
  id: `i${i + 1}`,
  equipmentId: `e${(i % 8) + 1}`,
  inspector: ['张操作员', '李操作员', '王操作员', '赵操作员'][random(0, 3, 0)],
  inspectionTime: dayjs().subtract(49 - i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  status: ['normal', 'normal', 'normal', 'warning'][random(0, 3, 0)] as 'normal' | 'warning' | 'fault',
  vibration: random(2.1, 8.5, 2),
  temperature: random(35, 85, 1),
  pressure: random(0.15, 0.35, 2),
  current: random(45, 95, 1),
  remarks: '',
}));

export const mockParameters: Parameter[] = [
  { id: 'p1', name: '反应器出口温度', tag: 'TI-1001', upperLimit: 520, lowerLimit: 480, unit: '°C', currentValue: 505.2, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p2', name: '再生器密相温度', tag: 'TI-2001', upperLimit: 720, lowerLimit: 660, unit: '°C', currentValue: 695.8, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p3', name: '反应压力', tag: 'PI-1001', upperLimit: 0.28, lowerLimit: 0.20, unit: 'MPa', currentValue: 0.24, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p4', name: '再生压力', tag: 'PI-2001', upperLimit: 0.26, lowerLimit: 0.18, unit: 'MPa', currentValue: 0.22, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p5', name: '催化剂循环量', tag: 'FI-1001', upperLimit: 1600, lowerLimit: 1200, unit: 't/h', currentValue: 1450, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p6', name: '烧焦强度', tag: 'QI-2001', upperLimit: 15.0, lowerLimit: 8.0, unit: 't/h', currentValue: 12.5, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p7', name: '分馏塔顶温度', tag: 'TI-3001', upperLimit: 130, lowerLimit: 110, unit: '°C', currentValue: 118.5, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p8', name: '分馏塔底温度', tag: 'TI-3002', upperLimit: 370, lowerLimit: 340, unit: '°C', currentValue: 355.2, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p9', name: '油浆外甩量', tag: 'FI-3001', upperLimit: 60, lowerLimit: 30, unit: 't/h', currentValue: 45.8, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p10', name: '烟气轮机功率', tag: 'PI-4001', upperLimit: 38, lowerLimit: 25, unit: 'MW', currentValue: 32.5, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p11', name: '能量回收效率', tag: 'EI-4001', upperLimit: 95, lowerLimit: 75, unit: '%', currentValue: 86.5, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p12', name: '主风机电流', tag: 'II-5001', upperLimit: 420, lowerLimit: 300, unit: 'A', currentValue: 385, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p13', name: '富气压缩机电流', tag: 'II-5002', upperLimit: 380, lowerLimit: 250, unit: 'A', currentValue: 312, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p14', name: '稳定塔压力', tag: 'PI-6001', upperLimit: 1.75, lowerLimit: 1.45, unit: 'MPa', currentValue: 1.62, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
  { id: 'p15', name: '吸收塔温度', tag: 'TI-6001', upperLimit: 50, lowerLimit: 35, unit: '°C', currentValue: 42.5, status: 'normal', lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss') },
];

export const mockAlarms: Alarm[] = [
  { id: 'a1', parameterId: 'p8', parameterName: '分馏塔底温度', actualValue: 372.5, limitValue: 370, level: 'warning', alarmTime: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'), status: 'active' },
  { id: 'a2', parameterId: 'p4', parameterName: '再生压力', actualValue: 0.27, limitValue: 0.26, level: 'alarm', alarmTime: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'), status: 'acknowledged', operator: '张操作员', acknowledgeTime: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  { id: 'a3', parameterId: 'p12', parameterName: '主风机电流', actualValue: 435, limitValue: 420, level: 'warning', alarmTime: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), status: 'cleared', operator: '李操作员', acknowledgeTime: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss') },
];

export const generateTrendData = (paramId: string, hours: number = 24): TrendDataPoint[] => {
  const param = mockParameters.find(p => p.id === paramId);
  if (!param) return [];
  
  const timePoints = generateTimePoints(hours * 12, 5);
  const midValue = (param.upperLimit + param.lowerLimit) / 2;
  const range = (param.upperLimit - param.lowerLimit) * 0.3;
  
  return timePoints.map((time, i) => {
    const baseValue = midValue + Math.sin(i / 10) * range;
    const noise = random(-range * 0.3, range * 0.3);
    return {
      time,
      value: Number((baseValue + noise).toFixed(1)),
    };
  });
};

export const mockUsers: User[] = [
  { id: 'user1', name: '张工程师', role: 'engineer', avatar: '' },
  { id: 'user2', name: '李操作员', role: 'operator', avatar: '' },
  { id: 'user3', name: '王管理员', role: 'admin', avatar: '' },
  { id: 'user4', name: '赵维护', role: 'maintenance', avatar: '' },
];

export const mockCurrentUser: User = mockUsers[0];

export const generateRealtimeParam = (): Parameter[] => {
  return mockParameters.map(p => {
    const fluctuation = (p.upperLimit - p.lowerLimit) * 0.02;
    const newValue = Number((p.currentValue + random(-fluctuation, fluctuation, 2)).toFixed(1));
    let status: 'normal' | 'warning' | 'alarm' = 'normal';
    if (newValue >= p.upperLimit * 0.95 || newValue <= p.lowerLimit * 1.05) {
      status = 'warning';
    }
    if (newValue >= p.upperLimit || newValue <= p.lowerLimit) {
      status = 'alarm';
    }
    return {
      ...p,
      currentValue: newValue,
      status,
      lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
  });
};

export const generateEnergyTrend = (): TrendDataPoint[] => {
  const timePoints = generateTimePoints(24, 60);
  return timePoints.map(time => ({
    time: time.split(' ')[1],
    value: random(82, 89, 1),
  }));
};

export const generateDailyLoss = (): { date: string; loss: number }[] => {
  return Array.from({ length: 14 }, (_, i) => ({
    date: dayjs().subtract(13 - i, 'day').format('MM-DD'),
    loss: random(1.2, 3.5, 1),
  }));
};

export const generateEquipmentStatusStats = () => {
  return [
    { name: '运行', value: 5, color: '#00B42A' },
    { name: '备用', value: 1, color: '#165DFF' },
    { name: '故障', value: 1, color: '#F53F3F' },
    { name: '维护', value: 1, color: '#FF7D00' },
  ];
};

export const generateProductDistribution = () => {
  return [
    { name: '液化气', value: 18.5 },
    { name: '汽油', value: 42.3 },
    { name: '柴油', value: 25.8 },
    { name: '油浆', value: 6.2 },
    { name: '干气', value: 4.5 },
    { name: '焦炭', value: 2.7 },
  ];
};

export const getStartupTemplateSteps = (): Omit<ShutdownPlanStep, 'id'>[] => [
  { name: '系统检查', description: '检查所有设备、仪表、阀门状态', status: 'pending', order: 1 },
  { name: '系统气密试验', description: '进行系统气密性试验，确认无泄漏', status: 'pending', order: 2 },
  { name: '建立催化剂循环', description: '启动催化剂循环系统，建立正常循环', status: 'pending', order: 3 },
  { name: '反应器升温', description: '反应器升温至400°C，恒温脱水', status: 'pending', order: 4 },
  { name: '再生器升温', description: '再生器升温至650°C，准备烧焦', status: 'pending', order: 5 },
  { name: '进料准备', description: '检查进料系统，确认原料罐、管线畅通', status: 'pending', order: 6 },
  { name: '引入原料油', description: '逐步引入原料油，控制进料量', status: 'pending', order: 7 },
  { name: '调整反应深度', description: '调整反应温度、压力、催化剂循环量', status: 'pending', order: 8 },
  { name: '建立分馏塔循环', description: '建立分馏塔各回流，调整温度分布', status: 'pending', order: 9 },
  { name: '启动吸收稳定系统', description: '启动吸收塔、稳定塔，建立正常操作', status: 'pending', order: 10 },
  { name: '调整产品质量', description: '调整操作参数，确保产品质量合格', status: 'pending', order: 11 },
  { name: '投入能量回收系统', description: '启动烟气轮机、余热锅炉，回收能量', status: 'pending', order: 12 },
  { name: '全面检查', description: '全面检查各系统运行状态，确认正常', status: 'pending', order: 13 },
];

export const getShutdownTemplateSteps = (): Omit<ShutdownPlanStep, 'id'>[] => [
  { name: '降量准备', description: '逐步降低处理量至70%，调整操作参数', status: 'pending', order: 1 },
  { name: '切断进料', description: '停止原料油进料，关闭进料阀门', status: 'pending', order: 2 },
  { name: '催化剂循环降温', description: '保持催化剂循环，逐步降低温度', status: 'pending', order: 3 },
  { name: '停止能量回收', description: '停运烟气轮机、余热锅炉', status: 'pending', order: 4 },
  { name: '切断吸收稳定', description: '停止吸收稳定系统操作', status: 'pending', order: 5 },
  { name: '分馏塔退油', description: '分馏塔各产品转次品，退净存油', status: 'pending', order: 6 },
  { name: '蒸汽吹扫', description: '对设备及管线进行蒸汽吹扫', status: 'pending', order: 7 },
  { name: '催化剂卸料', description: '将催化剂卸至催化剂储罐', status: 'pending', order: 8 },
  { name: '氮气置换', description: '系统氮气置换，分析可燃气体含量', status: 'pending', order: 9 },
  { name: '通风降温', description: '自然通风或强制通风，降温至常温', status: 'pending', order: 10 },
  { name: '开人孔', description: '打开设备人孔，准备进入检查', status: 'pending', order: 11 },
  { name: '停工验收', description: '检查确认停工完成，办理停工验收手续', status: 'pending', order: 12 },
];

export const getShiftText = (shift: 'morning' | 'afternoon' | 'night') => {
  const map = {
    morning: '白班 (08:00-16:00)',
    afternoon: '中班 (16:00-24:00)',
    night: '夜班 (00:00-08:00)',
  };
  return map[shift];
};
