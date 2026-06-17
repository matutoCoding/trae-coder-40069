export interface Unit {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'maintenance';
  type: string;
}

export interface ShutdownPlanStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  startTime?: string;
  endTime?: string;
  operator?: string;
}

export interface ShutdownPlan {
  id: string;
  unitId: string;
  name: string;
  type: 'startup' | 'shutdown';
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  steps: ShutdownPlanStep[];
  createTime: string;
  creator: string;
  approver?: string;
}

export interface Catalyst {
  id: string;
  unitId: string;
  name: string;
  inventory: number;
  inventoryUnit: string;
  lastReplaced: string;
  expectedLifetime: number;
  currentActivity: number;
}

export interface CatalystLoss {
  id: string;
  catalystId: string;
  lossAmount: number;
  recordTime: string;
  reason: string;
  location: string;
}

export interface ReactorParam {
  id: string;
  unitId: string;
  temperature: number;
  temperatureDistribution: number[];
  pressure: number;
  catalystCirculation: number;
  strippingSteam: number;
  feedRate: number;
  recordTime: string;
}

export interface RegeneratorParam {
  id: string;
  unitId: string;
  temperature: number;
  pressure: number;
  cokeBurningRate: number;
  oxygenContent: number;
  flueGasFlow: number;
  recordTime: string;
}

export interface FractionatorParam {
  id: string;
  unitId: string;
  topTemperature: number;
  topPressure: number;
  bottomTemperature: number;
  bottomPressure: number;
  refluxRatio: number;
  slurryFlow: number;
  recordTime: string;
}

export interface AbsorptionParam {
  id: string;
  unitId: string;
  absorberTemperature: number;
  absorberPressure: number;
  stabilizerTemperature: number;
  stabilizerPressure: number;
  leanOilFlow: number;
  recordTime: string;
}

export interface EnergyData {
  id: string;
  unitId: string;
  flueGasTurbinePower: number;
  steamTurbinePower: number;
  wasteHeatBoilerSteam: number;
  recoveryEfficiency: number;
  totalEnergyConsumption: number;
  recordTime: string;
}

export interface Equipment {
  id: string;
  unitId: string;
  name: string;
  type: 'pump' | 'compressor' | 'heat-exchanger' | 'valve' | 'other';
  status: 'running' | 'stopped' | 'standby' | 'fault';
  lastMaintenance: string;
  nextMaintenance: string;
  runningHours: number;
  specification: string;
}

export interface Inspection {
  id: string;
  equipmentId: string;
  inspector: string;
  inspectionTime: string;
  status: 'normal' | 'warning' | 'fault';
  vibration?: number;
  temperature?: number;
  pressure?: number;
  current?: number;
  remarks: string;
}

export interface Parameter {
  id: string;
  name: string;
  tag: string;
  upperLimit: number;
  lowerLimit: number;
  unit: string;
  currentValue: number;
  status: 'normal' | 'warning' | 'alarm';
  lastUpdate: string;
}

export interface Alarm {
  id: string;
  parameterId: string;
  parameterName: string;
  actualValue: number;
  limitValue: number;
  level: 'warning' | 'alarm';
  alarmTime: string;
  status: 'active' | 'acknowledged' | 'cleared';
  operator?: string;
  acknowledgeTime?: string;
}

export interface TrendDataPoint {
  time: string;
  value: number;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'engineer' | 'operator' | 'maintenance';
  avatar?: string;
}
