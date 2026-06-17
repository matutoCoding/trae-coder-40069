import { useEffect, useMemo } from 'react';
import { Card, Row, Col, Tabs } from 'antd';
import { Flame, Wind, Thermometer, Gauge, ArrowRightLeft, Droplets } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateTrendData } from '@/mock';
import DataValue from '@/components/Common/DataValue';
import LineChart from '@/components/Charts/LineChart';
import GaugeChart from '@/components/Charts/GaugeChart';
import ReactECharts from 'echarts-for-react';

export default function Reaction() {
  const { reactorParams, regeneratorParams, updateParams, currentUnitId } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const tempTrendData = useMemo(() => generateTrendData('p1', 12), []);
  const pressureTrendData = useMemo(() => generateTrendData('p3', 12), []);
  const circulationTrendData = useMemo(() => generateTrendData('p5', 12), []);
  const burningTrendData = useMemo(() => generateTrendData('p6', 12), []);

  const tempDistribution = reactorParams.temperatureDistribution;
  
  const heatMapOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(20, 26, 46, 0.95)',
      borderColor: '#1E2A45',
      textStyle: {
        color: '#E6E8EF',
      },
      formatter: (params: any) => {
        return `<div class="text-sm">
          <div>床层 ${params.data[1] + 1}</div>
          <div class="font-mono font-semibold">${params.data[0]} °C</div>
        </div>`;
      },
    },
    grid: {
      top: 30,
      right: 20,
      bottom: 30,
      left: 50,
    },
    xAxis: {
      type: 'value',
      min: 490,
      max: 515,
      axisLine: {
        lineStyle: {
          color: '#1E2A45',
        },
      },
      axisLabel: {
        color: '#8A94A6',
        fontSize: 10,
        formatter: '{value}°C',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(30, 42, 69, 0.5)',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: ['床层8', '床层7', '床层6', '床层5', '床层4', '床层3', '床层2', '床层1'],
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
    visualMap: {
      min: 490,
      max: 515,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F'],
      },
      textStyle: {
        color: '#8A94A6',
      },
    },
    series: [
      {
        type: 'heatmap',
        data: tempDistribution.map((temp, index) => [temp, 7 - index, index]),
        label: {
          show: true,
          formatter: (params: any) => `${params.data[0]}°C`,
          color: '#fff',
          fontSize: 10,
        },
        itemStyle: {
          borderRadius: 4,
          borderWidth: 2,
          borderColor: '#141A2E',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const reactorTabItems = [
    {
      key: '1',
      label: '反应器',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Thermometer size={20} className="text-red-400" />
                  </div>
                  <DataValue 
                    label="反应温度" 
                    value={reactorParams.temperature.toFixed(1)} 
                    unit="°C"
                    status={reactorParams.temperature > 515 ? 'alarm' : 
                            reactorParams.temperature > 510 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Gauge size={20} className="text-blue-400" />
                  </div>
                  <DataValue 
                    label="反应压力" 
                    value={reactorParams.pressure.toFixed(3)} 
                    unit="MPa"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <ArrowRightLeft size={20} className="text-purple-400" />
                  </div>
                  <DataValue 
                    label="催化剂循环量" 
                    value={reactorParams.catalystCirculation.toString()} 
                    unit="t/h"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Droplets size={20} className="text-cyan-400" />
                  </div>
                  <DataValue 
                    label="原料处理量" 
                    value={reactorParams.feedRate.toString()} 
                    unit="t/h"
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="反应器温度分布" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <ReactECharts option={heatMapOption} style={{ height: 350 }} opts={{ renderer: 'canvas' }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="关键参数趋势" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="space-y-4">
                  <LineChart
                    data={tempTrendData}
                    title="反应温度"
                    unit="°C"
                    color="#F53F3F"
                    height={140}
                    upperLimit={520}
                    lowerLimit={480}
                  />
                  <LineChart
                    data={pressureTrendData}
                    title="反应压力"
                    unit="MPa"
                    color="#165DFF"
                    height={140}
                    upperLimit={0.28}
                    lowerLimit={0.20}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="汽提蒸汽参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={reactorParams.strippingSteam}
                    min={0}
                    max={15}
                    title="汽提蒸汽量"
                    unit="t/h"
                    warningThreshold={12}
                    height={180}
                  />
                  <div className="flex flex-col justify-center gap-4">
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">汽提蒸汽温度</div>
                      <div className="data-value">450°C</div>
                    </div>
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">汽提蒸汽压力</div>
                      <div className="data-value">1.0 MPa</div>
                    </div>
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">汽提效率</div>
                      <div className="data-value text-green-400">98.5%</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="待生剂循环" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={reactorParams.catalystCirculation}
                    min={1000}
                    max={1800}
                    title="循环流量"
                    unit="t/h"
                    warningThreshold={1600}
                    height={180}
                  />
                  <div className="flex flex-col justify-center gap-4">
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">待生剂温度</div>
                      <div className="data-value">495°C</div>
                    </div>
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">待生剂定碳</div>
                      <div className="data-value">1.25%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-industrial-border/30">
                      <div className="data-label mb-1">滑阀开度</div>
                      <div className="data-value">65%</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: '2',
      label: '再生器',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Flame size={20} className="text-orange-400" />
                  </div>
                  <DataValue 
                    label="再生温度" 
                    value={regeneratorParams.temperature.toFixed(1)} 
                    unit="°C"
                    status={regeneratorParams.temperature > 710 ? 'alarm' : 
                            regeneratorParams.temperature > 700 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Gauge size={20} className="text-blue-400" />
                  </div>
                  <DataValue 
                    label="再生压力" 
                    value={regeneratorParams.pressure.toFixed(3)} 
                    unit="MPa"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Wind size={20} className="text-red-400" />
                  </div>
                  <DataValue 
                    label="烧焦强度" 
                    value={regeneratorParams.cokeBurningRate.toFixed(1)} 
                    unit="t/h"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Gauge size={20} className="text-green-400" />
                  </div>
                  <DataValue 
                    label="烟气氧含量" 
                    value={regeneratorParams.oxygenContent.toFixed(1)} 
                    unit="%"
                    status={regeneratorParams.oxygenContent > 4 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="再生器烧焦负荷" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <LineChart
                  data={burningTrendData}
                  unit="t/h"
                  color="#FF7D00"
                  height={300}
                  upperLimit={15}
                  lowerLimit={8}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="再生器参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={regeneratorParams.cokeBurningRate}
                    min={0}
                    max={20}
                    title="烧焦强度"
                    unit="t/h"
                    warningThreshold={14}
                    dangerThreshold={15}
                    height={180}
                  />
                  <GaugeChart
                    value={regeneratorParams.oxygenContent}
                    min={0}
                    max={5}
                    title="氧含量"
                    unit="%"
                    warningThreshold={4}
                    height={180}
                  />
                  <GaugeChart
                    value={regeneratorParams.flueGasFlow}
                    min={2000}
                    max={3500}
                    title="烟气流量"
                    unit="Nm³/h"
                    warningThreshold={3200}
                    height={180}
                  />
                  <GaugeChart
                    value={regeneratorParams.temperature}
                    min={650}
                    max={750}
                    title="再生温度"
                    unit="°C"
                    warningThreshold={710}
                    dangerThreshold={720}
                    height={180}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title="再生器示意图" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="flex flex-wrap items-center justify-center gap-8 py-8">
              <div className="text-center">
                <div className="w-32 h-48 bg-gradient-to-b from-orange-500/30 to-red-500/30 rounded-lg border-2 border-orange-500/50 relative flex flex-col justify-between p-4">
                  <div className="text-xs text-industrial-subtext">密相床</div>
                  <div className="text-2xl font-bold text-orange-400 font-mono">
                    {regeneratorParams.temperature}°C
                  </div>
                  <div className="text-xs text-industrial-subtext">
                    {regeneratorParams.cokeBurningRate} t/h
                  </div>
                </div>
                <div className="mt-2 text-sm text-white font-medium">再生器</div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-industrial-subtext">主风</div>
                <div className="text-lg font-mono text-blue-400">
                  {Math.round(regeneratorParams.flueGasFlow * 0.7)} Nm³/h
                </div>
                <div className="w-1 h-16 bg-gradient-to-t from-blue-500 to-transparent" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-1 h-20 bg-gradient-to-b from-orange-500 to-transparent" />
                <div className="text-xs text-industrial-subtext">烟气</div>
                <div className="text-sm font-mono text-orange-400">
                  {regeneratorParams.flueGasFlow} Nm³/h
                </div>
                <div className="text-xs text-industrial-subtext">
                  O₂: {regeneratorParams.oxygenContent}%
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-industrial-subtext">待生催化剂</div>
                <div className="w-1 h-16 bg-gradient-to-b from-yellow-500 to-transparent" />
                <div className="text-sm font-mono text-yellow-400">
                  {reactorParams.catalystCirculation} t/h
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-1 h-16 bg-gradient-to-t from-green-500 to-transparent" />
                <div className="text-xs text-industrial-subtext">再生催化剂</div>
                <div className="text-sm font-mono text-green-400">
                  {reactorParams.catalystCirculation} t/h
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">反应再生系统</h2>
          <p className="text-sm text-industrial-subtext">
            反应器温度监控 · 再生器烧焦管理 · 待生剂循环
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="status-dot status-normal" />
            <span className="text-sm text-industrial-subtext">反应系统正常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot status-normal" />
            <span className="text-sm text-industrial-subtext">再生系统正常</span>
          </div>
        </div>
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={reactorTabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
}
