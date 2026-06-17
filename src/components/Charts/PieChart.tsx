import ReactECharts from 'echarts-for-react';

interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  showLabel?: boolean;
}

export default function PieChart({
  data,
  title,
  height = 250,
  showLabel = true,
}: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const option = {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      subtext: `总计: ${total.toFixed(1)}`,
      textStyle: {
        color: '#E6E8EF',
        fontSize: 14,
        fontWeight: 500,
      },
      subtextStyle: {
        color: '#8A94A6',
        fontSize: 12,
      },
      left: 'center',
      top: 10,
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(20, 26, 46, 0.95)',
      borderColor: '#1E2A45',
      textStyle: {
        color: '#E6E8EF',
      },
      formatter: (params: any) => {
        const percent = ((params.value / total) * 100).toFixed(1);
        return `<div class="text-sm">
          <div class="font-medium mb-1">${params.name}</div>
          <div class="text-industrial-subtext">
            <span class="font-mono font-semibold text-white">${params.value}</span>
            <span class="mx-1">·</span>
            <span class="font-mono">${percent}%</span>
          </div>
        </div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#8A94A6',
        fontSize: 11,
      },
      itemGap: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#141A2E',
          borderWidth: 2,
        },
        label: {
          show: showLabel,
          position: 'outside',
          formatter: '{d}%',
          color: '#E6E8EF',
          fontSize: 10,
        },
        labelLine: {
          show: showLabel,
          length: 5,
          length2: 10,
          lineStyle: {
            color: '#1E2A45',
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: data.map(d => ({
          value: d.value,
          name: d.name,
          itemStyle: {
            color: d.color,
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
