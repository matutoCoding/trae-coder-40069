import ReactECharts from 'echarts-for-react';

interface GaugeChartProps {
  value: number;
  max: number;
  min?: number;
  title: string;
  unit: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  height?: number;
}

export default function GaugeChart({
  value,
  max,
  min = 0,
  title,
  unit,
  warningThreshold,
  dangerThreshold,
  height = 200,
}: GaugeChartProps) {
  const getColor = () => {
    if (dangerThreshold && value >= dangerThreshold) return '#F53F3F';
    if (warningThreshold && value >= warningThreshold) return '#FF7D00';
    return '#00B42A';
  };

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min,
        max,
        splitNumber: 10,
        radius: '90%',
        center: ['50%', '60%'],
        itemStyle: {
          color: getColor(),
          shadowColor: getColor(),
          shadowBlur: 10,
        },
        progress: {
          show: true,
          width: 12,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(255,255,255,0.1)']],
          },
        },
        axisTick: {
          distance: -20,
          splitNumber: 5,
          lineStyle: {
            width: 1,
            color: 'rgba(255,255,255,0.3)',
          },
        },
        splitLine: {
          distance: -25,
          length: 10,
          lineStyle: {
            width: 2,
            color: 'rgba(255,255,255,0.5)',
          },
        },
        axisLabel: {
          distance: -35,
          color: '#8A94A6',
          fontSize: 10,
          formatter: (v: number) => v.toFixed(0),
        },
        anchor: {
          show: false,
        },
        title: {
          show: true,
          offsetCenter: [0, '35%'],
          color: '#8A94A6',
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '5%'],
          formatter: `{value} ${unit}`,
          color: getColor(),
          fontFamily: 'JetBrains Mono, monospace',
        },
        data: [
          {
            value: Number(value.toFixed(1)),
            name: title,
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
