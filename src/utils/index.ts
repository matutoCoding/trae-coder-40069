import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running':
    case 'completed':
    case 'normal':
    case 'active':
      return 'text-green-500';
    case 'warning':
    case 'in-progress':
    case 'standby':
      return 'text-orange-500';
    case 'alarm':
    case 'fault':
    case 'cancelled':
      return 'text-red-500';
    case 'pending':
    case 'draft':
    case 'stopped':
    case 'maintenance':
    case 'acknowledged':
      return 'text-yellow-500';
    case 'approved':
    case 'cleared':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'running':
    case 'completed':
    case 'normal':
      return 'bg-green-500/20 text-green-500 border-green-500/50';
    case 'warning':
    case 'in-progress':
    case 'standby':
    case 'executing':
      return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
    case 'alarm':
    case 'fault':
    case 'cancelled':
      return 'bg-red-500/20 text-red-500 border-red-500/50';
    case 'pending':
    case 'draft':
    case 'stopped':
    case 'maintenance':
    case 'acknowledged':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    case 'approved':
    case 'cleared':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    default:
      return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
  }
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    maintenance: '维护中',
    normal: '正常',
    warning: '警告',
    alarm: '报警',
    pending: '待执行',
    'in-progress': '进行中',
    completed: '已完成',
    skipped: '已跳过',
    draft: '草稿',
    approved: '已批准',
    executing: '执行中',
    cancelled: '已取消',
    standby: '备用',
    fault: '故障',
    active: '活动',
    acknowledged: '已确认',
    cleared: '已消除',
  };
  return statusMap[status] || status;
};

export const getRoleText = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    engineer: '工艺工程师',
    operator: '装置操作员',
    maintenance: '设备管理员',
  };
  return roleMap[role] || role;
};

export const getPlanTypeText = (type: string): string => {
  return type === 'startup' ? '开工方案' : '停工方案';
};

export const getEquipmentTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    pump: '机泵',
    compressor: '压缩机',
    'heat-exchanger': '换热器',
    valve: '阀门',
    other: '其他设备',
  };
  return typeMap[type] || type;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dateStr;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dateStr.split(' ')[0];
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dateStr.split(' ')[1] || dateStr;
};

export const calculateDaysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getAlarmLevelText = (level: string): string => {
  return level === 'alarm' ? '严重报警' : '一般警告';
};
