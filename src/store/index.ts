import { create } from 'zustand';
import {
  mockUnits,
  mockShutdownPlans,
  mockCatalysts,
  mockCatalystLosses,
  mockReactorParams,
  mockRegeneratorParams,
  mockFractionatorParams,
  mockAbsorptionParams,
  mockEnergyData,
  mockEquipment,
  mockInspections,
  mockParameters,
  mockAlarms,
  mockCurrentUser,
  generateRealtimeParam,
} from '@/mock';
import type {
  Unit,
  ShutdownPlan,
  ShutdownPlanStep,
  PlanReview,
  PendingIssue,
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
  User,
  InspectionTask,
  InspectionTaskItem,
} from '@/types';

interface AppState {
  currentUser: User;
  units: Unit[];
  shutdownPlans: ShutdownPlan[];
  draftPlan: Partial<ShutdownPlan> | null;
  catalysts: Catalyst[];
  catalystLosses: CatalystLoss[];
  reactorParams: ReactorParam;
  regeneratorParams: RegeneratorParam;
  fractionatorParams: FractionatorParam;
  absorptionParams: AbsorptionParam;
  energyData: EnergyData;
  equipment: Equipment[];
  inspections: Inspection[];
  inspectionTasks: InspectionTask[];
  currentInspectionTask: InspectionTask | null;
  pendingIssues: PendingIssue[];
  parameters: Parameter[];
  alarms: Alarm[];
  currentUnitId: string;
  updateParams: () => void;
  acknowledgeAlarm: (alarmId: string, operator: string, handleRemark?: string) => void;
  clearAlarm: (alarmId: string, handleRemark?: string) => void;
  setCurrentUnitId: (id: string) => void;
  addShutdownPlan: (plan: Omit<ShutdownPlan, 'id' | 'createTime'>) => void;
  updateShutdownPlanStep: (planId: string, stepId: string, status: string, operator?: string) => void;
  updateShutdownPlanSteps: (planId: string, steps: ShutdownPlanStep[]) => void;
  saveDraftPlan: (plan: Partial<ShutdownPlan>) => void;
  clearDraftPlan: () => void;
  addInspection: (inspection: Omit<Inspection, 'id'>) => void;
  createInspectionTask: (unitId: string, shift: 'morning' | 'afternoon' | 'night') => void;
  updateInspectionTaskItem: (taskId: string, itemId: string, data: Partial<InspectionTaskItem>) => void;
  completeInspectionTask: (taskId: string) => void;
  setCurrentInspectionTask: (task: InspectionTask | null) => void;
  savePlanReview: (planId: string, review: PlanReview) => void;
  addPendingIssue: (issue: Omit<PendingIssue, 'id' | 'createTime'>) => void;
  resolvePendingIssue: (issueId: string, resolver: string, remark: string) => void;
}

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getNow = () => new Date().toISOString().replace('T', ' ').substr(0, 19);

const STORAGE_KEYS = {
  alarms: 'fccu_alarms',
  shutdownPlans: 'fccu_shutdown_plans',
  pendingIssues: 'fccu_pending_issues',
  inspectionTasks: 'fccu_inspection_tasks',
  inspections: 'fccu_inspections',
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`);
  }
  return fallback;
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`);
  }
};

const persistState = (state: Partial<AppState>) => {
  if (state.alarms !== undefined) saveToStorage(STORAGE_KEYS.alarms, state.alarms);
  if (state.shutdownPlans !== undefined) saveToStorage(STORAGE_KEYS.shutdownPlans, state.shutdownPlans);
  if (state.pendingIssues !== undefined) saveToStorage(STORAGE_KEYS.pendingIssues, state.pendingIssues);
  if (state.inspectionTasks !== undefined) saveToStorage(STORAGE_KEYS.inspectionTasks, state.inspectionTasks);
  if (state.inspections !== undefined) saveToStorage(STORAGE_KEYS.inspections, state.inspections);
};

const mockInspectionTasks: InspectionTask[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  units: mockUnits,
  shutdownPlans: loadFromStorage(STORAGE_KEYS.shutdownPlans, mockShutdownPlans),
  draftPlan: null,
  catalysts: mockCatalysts,
  catalystLosses: mockCatalystLosses,
  reactorParams: mockReactorParams,
  regeneratorParams: mockRegeneratorParams,
  fractionatorParams: mockFractionatorParams,
  absorptionParams: mockAbsorptionParams,
  energyData: mockEnergyData,
  equipment: mockEquipment,
  inspections: loadFromStorage(STORAGE_KEYS.inspections, mockInspections),
  inspectionTasks: loadFromStorage(STORAGE_KEYS.inspectionTasks, mockInspectionTasks),
  currentInspectionTask: null,
  pendingIssues: loadFromStorage(STORAGE_KEYS.pendingIssues, []),
  parameters: mockParameters,
  alarms: loadFromStorage(STORAGE_KEYS.alarms, mockAlarms),
  currentUnitId: 'u1',

  updateParams: () => {
    const newParams = generateRealtimeParam();
    const random = (min: number, max: number, decimals = 1) =>
      Number((Math.random() * (max - min) + min).toFixed(decimals));

    const newAlarms: Alarm[] = [...get().alarms];
    newParams.forEach((p) => {
      if (p.status === 'warning' || p.status === 'alarm') {
        const existingAlarm = newAlarms.find(
          (a) => a.parameterId === p.id && a.status === 'active'
        );
        if (!existingAlarm) {
          newAlarms.unshift({
            id: `a${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
            parameterId: p.id,
            parameterName: p.name,
            actualValue: p.currentValue,
            limitValue: p.currentValue > p.upperLimit ? p.upperLimit : p.lowerLimit,
            level: p.status === 'alarm' ? 'alarm' : 'warning',
            alarmTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
            status: 'active',
          });
        }
      }
    });

    if (newAlarms.length > 50) {
      newAlarms.length = 50;
    }

    set({
      parameters: newParams,
      alarms: newAlarms,
      reactorParams: {
        ...get().reactorParams,
        temperature: Number((get().reactorParams.temperature + random(-2, 2, 1)).toFixed(1)),
        pressure: Number((get().reactorParams.pressure + random(-0.005, 0.005, 3)).toFixed(3)),
        catalystCirculation: Number((get().reactorParams.catalystCirculation + random(-20, 20, 0)).toFixed(0)),
        recordTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      },
      regeneratorParams: {
        ...get().regeneratorParams,
        temperature: Number((get().regeneratorParams.temperature + random(-3, 3, 1)).toFixed(1)),
        pressure: Number((get().regeneratorParams.pressure + random(-0.005, 0.005, 3)).toFixed(3)),
        cokeBurningRate: Number((get().regeneratorParams.cokeBurningRate + random(-0.5, 0.5, 1)).toFixed(1)),
        recordTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      },
      fractionatorParams: {
        ...get().fractionatorParams,
        topTemperature: Number((get().fractionatorParams.topTemperature + random(-1, 1, 1)).toFixed(1)),
        bottomTemperature: Number((get().fractionatorParams.bottomTemperature + random(-2, 2, 1)).toFixed(1)),
        slurryFlow: Number((get().fractionatorParams.slurryFlow + random(-1, 1, 1)).toFixed(1)),
        recordTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      },
      absorptionParams: {
        ...get().absorptionParams,
        absorberTemperature: Number((get().absorptionParams.absorberTemperature + random(-0.5, 0.5, 1)).toFixed(1)),
        stabilizerPressure: Number((get().absorptionParams.stabilizerPressure + random(-0.01, 0.01, 2)).toFixed(2)),
        recordTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      },
      energyData: {
        ...get().energyData,
        flueGasTurbinePower: Number((get().energyData.flueGasTurbinePower + random(-0.5, 0.5, 1)).toFixed(1)),
        recoveryEfficiency: Number((get().energyData.recoveryEfficiency + random(-0.3, 0.3, 1)).toFixed(1)),
        recordTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      },
    });
  },

  acknowledgeAlarm: (alarmId: string, operator: string, handleRemark?: string) => {
    const newState: Partial<AppState> = {
      alarms: get().alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              status: 'acknowledged',
              operator,
              acknowledgeTime: getNow(),
              handleRemark,
            }
          : a
      ),
    };
    set(newState);
    persistState(newState);
  },

  clearAlarm: (alarmId: string, clearRemark?: string) => {
    const newState: Partial<AppState> = {
      alarms: get().alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              status: 'cleared',
              clearTime: getNow(),
              clearRemark,
            }
          : a
      ),
    };
    set(newState);
    persistState(newState);
  },

  setCurrentUnitId: (id: string) => {
    set({ currentUnitId: id });
  },

  updateShutdownPlanStep: (planId: string, stepId: string, status: string, operator?: string) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const newState: Partial<AppState> = {
      shutdownPlans: get().shutdownPlans.map((plan) => {
        if (plan.id !== planId) return plan;
        
        const newSteps = plan.steps.map((step) => {
          if (step.id !== stepId) return step;
          const newStep = { ...step, status: status as any, operator: operator || step.operator };
          if (status === 'in-progress' && !step.startTime) {
            (newStep as any).startTime = now;
          } else if (status === 'completed' && !step.endTime) {
            (newStep as any).endTime = now;
          }
          return newStep;
        });
        
        const allCompleted = newSteps.every(
          (s) => s.status === 'completed' || s.status === 'skipped'
        );
        const hasInProgress = newSteps.some((s) => s.status === 'in-progress');
        
        let planStatus = plan.status;
        let planEndTime = plan.endTime;
        
        if (hasInProgress && plan.status !== 'executing') {
          planStatus = 'executing';
        }
        
        if (allCompleted && newSteps.length > 0 && plan.status !== 'completed') {
          planStatus = 'completed';
          planEndTime = now;
        }
        
        return {
          ...plan,
          status: planStatus,
          endTime: planEndTime,
          steps: newSteps,
        };
      }),
    };
    set(newState);
    persistState(newState);
  },

  addInspection: (inspection: Omit<Inspection, 'id'>) => {
    const newInspection: Inspection = {
      ...inspection,
      id: `i${Date.now()}`,
    };
    const newState: Partial<AppState> = {
      inspections: [newInspection, ...get().inspections],
    };
    set(newState);
    persistState(newState);
  },

  addShutdownPlan: (plan: Omit<ShutdownPlan, 'id' | 'createTime'>) => {
    const newPlan: ShutdownPlan = {
      ...plan,
      id: generateId(),
      createTime: getNow(),
    };
    const newState: Partial<AppState> = {
      shutdownPlans: [newPlan, ...get().shutdownPlans],
    };
    set(newState);
    persistState(newState);
  },

  updateShutdownPlanSteps: (planId: string, steps: ShutdownPlanStep[]) => {
    const newState: Partial<AppState> = {
      shutdownPlans: get().shutdownPlans.map((plan) =>
        plan.id === planId ? { ...plan, steps } : plan
      ),
    };
    set(newState);
    persistState(newState);
  },

  saveDraftPlan: (plan: Partial<ShutdownPlan>) => {
    set({ draftPlan: plan });
    localStorage.setItem('fccu_draft_plan', JSON.stringify(plan));
  },

  clearDraftPlan: () => {
    set({ draftPlan: null });
    localStorage.removeItem('fccu_draft_plan');
  },

  createInspectionTask: (unitId: string, shift: 'morning' | 'afternoon' | 'night') => {
    const { equipment } = get();
    const unitEquipment = equipment.filter((e) => e.unitId === unitId);
    
    const items: InspectionTaskItem[] = unitEquipment
      .sort((a, b) => {
        const typeOrder = { pump: 1, compressor: 2, 'heat-exchanger': 3, valve: 4, other: 5 };
        return (typeOrder[a.type as keyof typeof typeOrder] || 99) - (typeOrder[b.type as keyof typeof typeOrder] || 99);
      })
      .map((eq) => ({
        id: generateId(),
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentType: eq.type,
        status: 'pending',
      }));

    const today = new Date().toISOString().split('T')[0];
    const newTask: InspectionTask = {
      id: generateId(),
      unitId,
      shift,
      shiftDate: today,
      status: 'pending',
      items,
      createTime: getNow(),
    };

    const newState: Partial<AppState> = {
      inspectionTasks: [newTask, ...get().inspectionTasks],
      currentInspectionTask: newTask,
    };
    set(newState);
    persistState(newState);
  },

  updateInspectionTaskItem: (taskId: string, itemId: string, data: Partial<InspectionTaskItem>) => {
    const state = get();
    let newInspections = [...state.inspections];
    
    const updatedTasks = state.inspectionTasks.map((task) => {
      if (task.id !== taskId) return task;
      const hasInProgress = task.items.some((i) => i.status === 'in-progress');
      return {
        ...task,
        status: hasInProgress || data.status === 'in-progress' ? 'in-progress' : task.status,
        startTime: task.startTime || getNow(),
        items: task.items.map((item) => {
          if (item.id !== itemId) return item;
          const updatedItem = { ...item, ...data };
          if (data.status === 'completed') {
            updatedItem.completedTime = getNow();
            const newInspection: Inspection = {
              id: generateId(),
              equipmentId: item.equipmentId,
              inspector: state.currentUser.name,
              inspectionTime: getNow(),
              status: data.result || 'normal',
              vibration: data.vibration,
              temperature: data.temperature,
              pressure: data.pressure,
              current: data.current,
              remarks: data.remark || '',
            };
            newInspections = [newInspection, ...newInspections];
          }
          return updatedItem;
        }),
      };
    });
    
    const newState: Partial<AppState> = {
      inspectionTasks: updatedTasks,
      inspections: newInspections,
      currentInspectionTask: state.currentInspectionTask?.id === taskId
        ? updatedTasks.find((t) => t.id === taskId) || null
        : state.currentInspectionTask,
    };
    set(newState);
    persistState(newState);
  },

  completeInspectionTask: (taskId: string) => {
    const newState: Partial<AppState> = {
      inspectionTasks: get().inspectionTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              endTime: getNow(),
              inspector: get().currentUser.name,
            }
          : task
      ),
      currentInspectionTask: null,
    };
    set(newState);
    persistState(newState);
  },

  setCurrentInspectionTask: (task: InspectionTask | null) => {
    set({ currentInspectionTask: task });
  },

  savePlanReview: (planId: string, review: PlanReview) => {
    const newState: Partial<AppState> = {
      shutdownPlans: get().shutdownPlans.map((plan) =>
        plan.id === planId ? { ...plan, review } : plan
      ),
    };
    set(newState);
    persistState(newState);
  },

  addPendingIssue: (issue: Omit<PendingIssue, 'id' | 'createTime'>) => {
    const newIssue: PendingIssue = {
      ...issue,
      id: generateId(),
      createTime: getNow(),
    };
    const newState: Partial<AppState> = {
      pendingIssues: [newIssue, ...get().pendingIssues],
    };
    set(newState);
    persistState(newState);
  },

  resolvePendingIssue: (issueId: string, resolver: string, remark: string) => {
    const newState: Partial<AppState> = {
      pendingIssues: get().pendingIssues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: 'resolved' as const,
              resolver,
              resolveTime: getNow(),
              resolveRemark: remark,
            }
          : issue
      ),
    };
    set(newState);
    persistState(newState);
  },
}));
