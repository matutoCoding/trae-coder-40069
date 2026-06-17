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
}

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getNow = () => new Date().toISOString().replace('T', ' ').substr(0, 19);

const mockInspectionTasks: InspectionTask[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  units: mockUnits,
  shutdownPlans: mockShutdownPlans,
  draftPlan: null,
  catalysts: mockCatalysts,
  catalystLosses: mockCatalystLosses,
  reactorParams: mockReactorParams,
  regeneratorParams: mockRegeneratorParams,
  fractionatorParams: mockFractionatorParams,
  absorptionParams: mockAbsorptionParams,
  energyData: mockEnergyData,
  equipment: mockEquipment,
  inspections: mockInspections,
  inspectionTasks: mockInspectionTasks,
  currentInspectionTask: null,
  parameters: mockParameters,
  alarms: mockAlarms,
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
    set((state) => ({
      alarms: state.alarms.map((a) =>
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
    }));
  },

  clearAlarm: (alarmId: string, handleRemark?: string) => {
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              status: 'cleared',
              clearTime: getNow(),
              handleRemark: handleRemark || a.handleRemark,
            }
          : a
      ),
    }));
  },

  setCurrentUnitId: (id: string) => {
    set({ currentUnitId: id });
  },

  updateShutdownPlanStep: (planId: string, stepId: string, status: string, operator?: string) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    set((state) => ({
      shutdownPlans: state.shutdownPlans.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          status: status === 'in-progress' ? 'executing' : plan.status,
          steps: plan.steps.map((step) => {
            if (step.id !== stepId) return step;
            const newStep = { ...step, status: status as any, operator };
            if (status === 'in-progress') {
              (newStep as any).startTime = now;
            } else if (status === 'completed') {
              (newStep as any).endTime = now;
            }
            return newStep;
          }),
        };
      }),
    }));
  },

  addInspection: (inspection: Omit<Inspection, 'id'>) => {
    const newInspection: Inspection = {
      ...inspection,
      id: `i${Date.now()}`,
    };
    set((state) => ({
      inspections: [newInspection, ...state.inspections],
    }));
  },

  addShutdownPlan: (plan: Omit<ShutdownPlan, 'id' | 'createTime'>) => {
    const newPlan: ShutdownPlan = {
      ...plan,
      id: generateId(),
      createTime: getNow(),
    };
    set((state) => ({
      shutdownPlans: [newPlan, ...state.shutdownPlans],
    }));
  },

  updateShutdownPlanSteps: (planId: string, steps: ShutdownPlanStep[]) => {
    set((state) => ({
      shutdownPlans: state.shutdownPlans.map((plan) =>
        plan.id === planId ? { ...plan, steps } : plan
      ),
    }));
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
    const unitEquipment = equipment.filter((e) => e.unitId === unitId && e.type === 'pump');
    
    const items: InspectionTaskItem[] = unitEquipment.map((eq, index) => ({
      id: generateId(),
      equipmentId: eq.id,
      equipmentName: eq.name,
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

    set((state) => ({
      inspectionTasks: [newTask, ...state.inspectionTasks],
      currentInspectionTask: newTask,
    }));
  },

  updateInspectionTaskItem: (taskId: string, itemId: string, data: Partial<InspectionTaskItem>) => {
    set((state) => ({
      inspectionTasks: state.inspectionTasks.map((task) => {
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
              const inspectionData: Omit<Inspection, 'id'> = {
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
              const newInspection: Inspection = {
                ...inspectionData,
                id: generateId(),
              };
              state.inspections = [newInspection, ...state.inspections];
            }
            return updatedItem;
          }),
        };
      }),
      currentInspectionTask: state.currentInspectionTask?.id === taskId
        ? state.inspectionTasks.find((t) => t.id === taskId) || null
        : state.currentInspectionTask,
    }));
  },

  completeInspectionTask: (taskId: string) => {
    set((state) => ({
      inspectionTasks: state.inspectionTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              endTime: getNow(),
              inspector: state.currentUser.name,
            }
          : task
      ),
      currentInspectionTask: null,
    }));
  },

  setCurrentInspectionTask: (task: InspectionTask | null) => {
    set({ currentInspectionTask: task });
  },
}));
