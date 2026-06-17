import { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { TrendDataPoint, AlarmPoint } from '@/types';

interface LineChartProps {
  data: TrendDataPoint[];
  title?: string;
  unit?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  upperLimit?: number;
  lowerLimit?: number;
  alarmPoints?: AlarmPoint[];
  alarmPointClick?: (point: AlarmPoint) => void;
  focusTime?: string | null;
}

export default function LineChart({
  data,
  title,
  unit = '',
  color = '#165DFF',
  height = 300,
  showLegend = false,
  upperLimit,
  lowerLimit,
  alarmPoints = [],
  alarmPointClick,
  focusTime,
}: LineChartProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (focusTime && chartRef.current && data.length > 0) {
      const instance = chartRef.current.getEchartsInstance?.() || chartRef.current?.echarts;
      if (!instance) return;

      const timeStrings = data.map(d => d.time);
      const focusIdx = timeStrings.findIndex(t => t === focusTime || t.startsWith(focusTime.substring(0, 16)));

      if (focusIdx >= 0) {
        const totalPoints = data.length;
        const windowSize = Math.min(48, totalPoints);
        const halfWindow = Math.floor(windowSize / 2);
        const startIdx = Math.max(0, focusIdx - halfWindow);
        const endIdx = Math.min(totalPoints - 1, focusIdx + halfWindow);
        const startPercent = (startIdx / totalPoints) * 100;
        const endPercent = ((endIdx + 1) / totalPoints) * 100;

        instance.dispatchAction({
          type: 'dataZoom',
          start: startPercent,
          end: endPercent,
        });
      }
    }
  }, [focusTime, data]);

  const series: any[] = [
    {
      name: title || '数据',
      type: 'line',
      smooth: true,
      symbol: 'none',
      sampling: 'lttb',
      lineStyle: {
        width: 2,
        color,
        shadowColor: color,
        shadowBlur: 10,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' },
          ],
        },
      },
      data: data.map(d => [d.time, d.value]),
    },
  ];

  if (upperLimit !== undefined) {
    series.push({
      name: '上限',
      type: 'line',
      smooth: false,
      symbol: 'none',
      lineStyle: {
        width: 1,
        type: 'dashed',
        color: '#F53F3F',
      },
      data: data.map(d => [d.time, upperLimit]),
    });
  }

  if (lowerLimit !== undefined) {
    series.push({
      name: '下限',
      type: 'line',
      smooth: false,
      symbol: 'none',
      lineStyle: {
        width: 1,
        type: 'dashed',
        color: '#F53F3F',
      },
      data: data.map(d => [d.time, lowerLimit]),
    });
  }

  if (alarmPoints.length > 0) {
    series.push({
      name: '报警点',
      type: 'scatter',
      symbolSize: 14,
      data: alarmPoints.map(ap => ({
        value: [ap.time, ap.value],
        itemStyle: {
          color: ap.level === 'alarm' ? '#F53F3F' : '#FF7D00',
          shadowBlur: 12,
          shadowColor: ap.level === 'alarm' ? '#F53F3F' : '#FF7D00',
        },
        symbol: 'pin',
      })),
      tooltip: {
        formatter: (params: any) => {
          const point = alarmPoints.find(ap => ap.time === params.value[0]);
          if (!point) return '';

          const levelText = point.level === 'alarm' ? '报警' : '警告';
          const statusMap: Record<string, string> = {
            active: '活动',
            acknowledged: '已确认',
            cleared: '已消除',
          };
          const statusColorMap: Record<string, string> = {
            active: '#F53F3F',
            acknowledged: '#FF7D00',
            cleared: '#00B42A',
          };
          const statusText = point.status ? statusMap[point.status] : '';
          const statusColor = point.status ? statusColorMap[point.status] : '';

          let html = `<div style="min-width:200px">
            <div style="color:#8A94A6;font-size:12px;margin-bottom:6px">${point.time}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="background:${params.color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
              <span style="font-weight:500">${levelText}: ${point.value} ${unit}</span>
            </div>
            <div style="color:#8A94A6;font-size:12px;margin-bottom:2px">
              限值: <span style="font-family:monospace;color:#F53F3F">${point.limitValue}</span>
            </div>`;

          if (point.status) {
            html += `<div style="color:#8A94A6;font-size:12px;margin-bottom:2px">
              状态: <span style="color:${statusColor}">${statusText}</span>
            </div>`;
          }

          if (point.operator) {
            html += `<div style="color:#8A94A6;font-size:12px;margin-bottom:2px">
              处理人: ${point.operator}
            </div>`;
          }

          if (point.handleRemark) {
            html += `<div style="color:#8A94A6;font-size:12px;margin-top:6px;padding-top:6px;border-top:1px solid #1E2A45">
              确认意见: <span style="color:#E6E8EF">${point.handleRemark}</span>
            </div>`;
          }

          if (point.clearRemark) {
            html += `<div style="color:#8A94A6;font-size:12px;margin-top:4px;padding-top:4px;border-top:1px solid #1E2A45">
              消除意见: <span style="color:#E6E8EF">${point.clearRemark}</span>
            </div>`;
          }

          html += '</div>';
          return html;
        },
      },
    });
  }

  const dataZoomConfig = focusTime ? [
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'filter',
    },
    {
      type: 'slider',
      xAxisIndex: 0,
      filterMode: 'filter',
      height: 20,
      bottom: 5,
      borderColor: '#1E2A45',
      backgroundColor: '#141A2E',
      fillerColor: 'rgba(22, 93, 255, 0.2)',
      handleStyle: {
        color: '#165DFF',
        borderColor: '#165DFF',
      },
      textStyle: {
        color: '#8A94A6',
        fontSize: 10,
      },
      dataBackground: {
        lineStyle: { color: '#165DFF' },
        areaStyle: { color: 'rgba(22, 93, 255, 0.1)' },
      },
    },
  ] : [];

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
        type: 'cross',
        label: {
          backgroundColor: '#165DFF',
        },
      },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        let html = `<div class="text-xs text-industrial-subtext mb-1">${date}</div>`;
        params.forEach((param: any) => {
          html += `<div class="flex items-center gap-2 text-sm">
            <span style="background:${param.color}" class="w-2 h-2 rounded-full"></span>
            <span>${param.seriesName}:</span>
            <span class="font-mono font-semibold">${param.value[1]} ${unit}</span>
          </div>`;
        });
        return html;
      },
    },
    grid: {
      top: title ? 50 : 20,
      right: 20,
      bottom: focusTime ? 60 : 30,
      left: 50,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.time),
      axisLine: {
        lineStyle: {
          color: '#1E2A45',
        },
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 10,
        rotate: 45,
        interval: Math.floor(data.length / 8),
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
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
    legend: showLegend ? {
      show: true,
      top: 10,
      right: 10,
      textStyle: {
        color: '#8A94A6',
        fontSize: 11,
      },
    } : { show: false },
    dataZoom: dataZoomConfig.length > 0 ? dataZoomConfig : undefined,
    series,
  };

  return <ReactECharts
    ref={chartRef}
    option={option}
    style={{ height }}
    opts={{ renderer: 'canvas' }}
    onEvents={{
      click: (params: any) => {
        if (params.seriesName === '报警点' && alarmPointClick) {
          const point = alarmPoints.find(ap => ap.time === params.value[0] && ap.value === params.value[1]);
          if (point) alarmPointClick(point);
        }
      }
    }}
  />;
}
