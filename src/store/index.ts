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
} from '@/types';

interface AppState {
  currentUser: User;
  units: Unit[];
  shutdownPlans: ShutdownPlan[];
  catalysts: Catalyst[];
  catalystLosses: CatalystLoss[];
  reactorParams: ReactorParam;
  regeneratorParams: RegeneratorParam;
  fractionatorParams: FractionatorParam;
  absorptionParams: AbsorptionParam;
  energyData: EnergyData;
  equipment: Equipment[];
  inspections: Inspection[];
  parameters: Parameter[];
  alarms: Alarm[];
  currentUnitId: string;
  updateParams: () => void;
  acknowledgeAlarm: (alarmId: string, operator: string) => void;
  clearAlarm: (alarmId: string) => void;
  setCurrentUnitId: (id: string) => void;
  updateShutdownPlanStep: (planId: string, stepId: string, status: string, operator?: string) => void;
  addInspection: (inspection: Omit<Inspection, 'id'>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  units: mockUnits,
  shutdownPlans: mockShutdownPlans,
  catalysts: mockCatalysts,
  catalystLosses: mockCatalystLosses,
  reactorParams: mockReactorParams,
  regeneratorParams: mockRegeneratorParams,
  fractionatorParams: mockFractionatorParams,
  absorptionParams: mockAbsorptionParams,
  energyData: mockEnergyData,
  equipment: mockEquipment,
  inspections: mockInspections,
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

  acknowledgeAlarm: (alarmId: string, operator: string) => {
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              status: 'acknowledged',
              operator,
              acknowledgeTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
            }
          : a
      ),
    }));
  },

  clearAlarm: (alarmId: string) => {
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId ? { ...a, status: 'cleared' } : a
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
}));
