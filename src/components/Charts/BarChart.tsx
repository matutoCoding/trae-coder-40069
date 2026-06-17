import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  unit?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  title,
  unit = '',
  color = '#165DFF',
  height = 300,
  horizontal = false,
}: BarChartProps) {
  const option = {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      textStyle: {
        color: '#E6E8EF',
        fontSize: 14,
        fontWeight: 500,
      },
      left: 10,
      top: 10,
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 26, 46, 0.95)',
      borderColor: '#1E2A45',
      textStyle: {
        color: '#E6E8EF',
      },
      axisPointer: {
        type: horizontal ? 'shadow' : 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0];
        return `<div class="text-sm">
          <div class="text-industrial-subtext mb-1">${param.name}</div>
          <div class="flex items-center gap-2">
            <span style="background:${param.color}" class="w-2 h-2 rounded-full"></span>
            <span class="font-mono font-semibold">${param.value} ${unit}</span>
          </div>
        </div>`;
      },
    },
    grid: {
      top: title ? 50 : 20,
      right: 20,
      bottom: 30,
      left: horizontal ? 80 : 50,
    },
    xAxis: horizontal ? {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 10,
        formatter: `{value} ${unit}`,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(30, 42, 69, 0.5)',
          type: 'dashed',
        },
      },
    } : {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: {
        lineStyle: {
          color: '#1E2A45',
        },
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 10,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: horizontal ? {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: {
        lineStyle: {
          color: '#1E2A45',
        },
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 11,
      },
      splitLine: {
        show: false,
      },
    } : {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 10,
        formatter: `{value} ${unit}`,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(30, 42, 69, 0.5)',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: horizontal ? '60%' : '50%',
        itemStyle: {
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          color: (params: any) => data[params.dataIndex]?.color || color,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: (params: any) => (data[params.dataIndex]?.color || color) + '80',
          },
        },
        data: data.map(d => d.value),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
