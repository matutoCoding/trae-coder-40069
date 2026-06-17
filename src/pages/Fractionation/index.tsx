import { useEffect, useMemo } from 'react';
import { Card, Row, Col, Tabs, Table } from 'antd';
import { Droplets, Thermometer, Gauge, ArrowRight, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateTrendData } from '@/mock';
import DataValue from '@/components/Common/DataValue';
import LineChart from '@/components/Charts/LineChart';
import GaugeChart from '@/components/Charts/GaugeChart';
import type { FractionatorParam, AbsorptionParam } from '@/types';

export default function Fractionation() {
  const { fractionatorParams, absorptionParams, updateParams } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const topTempTrend = useMemo(() => generateTrendData('p7', 12), []);
  const bottomTempTrend = useMemo(() => generateTrendData('p8', 12), []);
  const slurryFlowTrend = useMemo(() => generateTrendData('p9', 12), []);

  const fractionatorTabItems = [
    {
      key: '1',
      label: '分馏塔',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Thermometer size={20} className="text-blue-400" />
                  </div>
                  <DataValue 
                    label="塔顶温度" 
                    value={fractionatorParams.topTemperature.toFixed(1)} 
                    unit="°C"
                    status={fractionatorParams.topTemperature > 125 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Thermometer size={20} className="text-red-400" />
                  </div>
                  <DataValue 
                    label="塔底温度" 
                    value={fractionatorParams.bottomTemperature.toFixed(1)} 
                    unit="°C"
                    status={fractionatorParams.bottomTemperature > 360 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Gauge size={20} className="text-purple-400" />
                  </div>
                  <DataValue 
                    label="塔顶压力" 
                    value={fractionatorParams.topPressure.toFixed(3)} 
                    unit="MPa"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Droplets size={20} className="text-orange-400" />
                  </div>
                  <DataValue 
                    label="回炼比" 
                    value={fractionatorParams.refluxRatio.toFixed(2)} 
                    unit=""
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="分馏塔温度分布" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="space-y-4">
                  <LineChart
                    data={topTempTrend}
                    title="塔顶温度"
                    unit="°C"
                    color="#165DFF"
                    height={140}
                    upperLimit={130}
                    lowerLimit={110}
                  />
                  <LineChart
                    data={bottomTempTrend}
                    title="塔底温度"
                    unit="°C"
                    color="#F53F3F"
                    height={140}
                    upperLimit={370}
                    lowerLimit={340}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="分馏塔示意图" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="flex items-center justify-center gap-12 py-6">
                  <div className="relative w-40 h-96">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-green-500/20 to-orange-500/20 rounded-lg border-2 border-primary-500/30">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-xs text-industrial-subtext">汽油</div>
                        <div className="font-mono text-blue-400">{fractionatorParams.topTemperature}°C</div>
                      </div>
                      
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full text-center">
                        <div className="text-xs text-industrial-subtext">柴油抽出</div>
                        <div className="font-mono text-green-400">250°C</div>
                      </div>
                      
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full text-center">
                        <div className="text-xs text-industrial-subtext">回炼油抽出</div>
                        <div className="font-mono text-yellow-400">320°C</div>
                      </div>
                      
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full text-center">
                        <div className="text-xs text-industrial-subtext">油浆抽出</div>
                        <div className="font-mono text-orange-400">{fractionatorParams.bottomTemperature}°C</div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-xs text-industrial-subtext">反应油气</div>
                        <div className="font-mono text-red-400">495°C</div>
                      </div>
                    </div>

                    <div className="absolute -left-20 top-4 text-right">
                      <div className="text-xs text-industrial-subtext">顶回流</div>
                      <div className="font-mono text-xs">85 t/h</div>
                      <ArrowRight size={14} className="absolute right-0 top-1/2 translate-x-6 text-blue-400" />
                    </div>

                    <div className="absolute -left-20 top-1/3 text-right">
                      <div className="text-xs text-industrial-subtext">一中回流</div>
                      <div className="font-mono text-xs">120 t/h</div>
                      <ArrowRight size={14} className="absolute right-0 top-1/2 translate-x-6 text-green-400" />
                    </div>

                    <div className="absolute -left-20 top-1/2 text-right">
                      <div className="text-xs text-industrial-subtext">二中回流</div>
                      <div className="font-mono text-xs">95 t/h</div>
                      <ArrowRight size={14} className="absolute right-0 top-1/2 translate-x-6 text-yellow-400" />
                    </div>

                    <div className="absolute -right-20 bottom-16">
                      <div className="text-xs text-industrial-subtext">油浆外甩</div>
                      <div className="font-mono text-orange-400">{fractionatorParams.slurryFlow} t/h</div>
                      <ArrowRight size={14} className="absolute right-0 top-1/2 translate-x-6 text-orange-400 transform rotate-45" />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="油浆外甩流量" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <LineChart
                  data={slurryFlowTrend}
                  unit="t/h"
                  color="#FF7D00"
                  height={280}
                  upperLimit={60}
                  lowerLimit={30}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="分馏塔关键参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={fractionatorParams.topTemperature}
                    min={100}
                    max={140}
                    title="塔顶温度"
                    unit="°C"
                    warningThreshold={125}
                    dangerThreshold={130}
                    height={160}
                  />
                  <GaugeChart
                    value={fractionatorParams.bottomTemperature}
                    min={320}
                    max={380}
                    title="塔底温度"
                    unit="°C"
                    warningThreshold={360}
                    dangerThreshold={370}
                    height={160}
                  />
                  <GaugeChart
                    value={fractionatorParams.refluxRatio}
                    min={1}
                    max={4}
                    title="回炼比"
                    unit=""
                    warningThreshold={3.5}
                    height={160}
                  />
                  <GaugeChart
                    value={fractionatorParams.slurryFlow}
                    min={20}
                    max={70}
                    title="油浆外甩"
                    unit="t/h"
                    warningThreshold={55}
                    height={160}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: '2',
      label: '吸收稳定',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Thermometer size={20} className="text-cyan-400" />
                  </div>
                  <DataValue 
                    label="吸收塔温度" 
                    value={absorptionParams.absorberTemperature.toFixed(1)} 
                    unit="°C"
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
                    label="吸收塔压力" 
                    value={absorptionParams.absorberPressure.toFixed(2)} 
                    unit="MPa"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Thermometer size={20} className="text-orange-400" />
                  </div>
                  <DataValue 
                    label="稳定塔温度" 
                    value={absorptionParams.stabilizerTemperature.toFixed(1)} 
                    unit="°C"
                    status={absorptionParams.stabilizerTemperature > 170 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Gauge size={20} className="text-purple-400" />
                  </div>
                  <DataValue 
                    label="稳定塔压力" 
                    value={absorptionParams.stabilizerPressure.toFixed(2)} 
                    unit="MPa"
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="吸收稳定系统参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={absorptionParams.absorberTemperature}
                    min={30}
                    max={60}
                    title="吸收温度"
                    unit="°C"
                    warningThreshold={50}
                    height={160}
                  />
                  <GaugeChart
                    value={absorptionParams.absorberPressure}
                    min={1}
                    max={2}
                    title="吸收压力"
                    unit="MPa"
                    warningThreshold={1.6}
                    height={160}
                  />
                  <GaugeChart
                    value={absorptionParams.stabilizerTemperature}
                    min={140}
                    max={180}
                    title="稳定温度"
                    unit="°C"
                    warningThreshold={170}
                    dangerThreshold={175}
                    height={160}
                  />
                  <GaugeChart
                    value={absorptionParams.leanOilFlow}
                    min={100}
                    max={250}
                    title="贫油流量"
                    unit="t/h"
                    warningThreshold={220}
                    height={160}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="吸收稳定系统流程" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="flex flex-wrap items-center justify-center gap-4 py-8">
                  <div className="text-center">
                    <div className="w-24 h-32 bg-gradient-to-b from-cyan-500/30 to-blue-500/30 rounded-lg border-2 border-cyan-500/50 flex flex-col justify-center items-center p-2">
                      <div className="text-xs text-industrial-subtext">吸收塔</div>
                      <div className="text-lg font-bold text-cyan-400 font-mono mt-2">
                        {absorptionParams.absorberTemperature}°C
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">
                        {absorptionParams.absorberPressure} MPa
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={24} className="text-primary-400" />

                  <div className="text-center">
                    <div className="w-24 h-32 bg-gradient-to-b from-yellow-500/30 to-orange-500/30 rounded-lg border-2 border-yellow-500/50 flex flex-col justify-center items-center p-2">
                      <div className="text-xs text-industrial-subtext">解析塔</div>
                      <div className="text-lg font-bold text-yellow-400 font-mono mt-2">
                        110°C
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">
                        1.5 MPa
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={24} className="text-primary-400" />

                  <div className="text-center">
                    <div className="w-24 h-32 bg-gradient-to-b from-orange-500/30 to-red-500/30 rounded-lg border-2 border-orange-500/50 flex flex-col justify-center items-center p-2">
                      <div className="text-xs text-industrial-subtext">稳定塔</div>
                      <div className="text-lg font-bold text-orange-400 font-mono mt-2">
                        {absorptionParams.stabilizerTemperature}°C
                      </div>
                      <div className="text-xs text-industrial-subtext mt-1">
                        {absorptionParams.stabilizerPressure} MPa
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full">
                    <div className="text-xs text-industrial-subtext text-center">
                      贫油流量: <span className="font-mono text-green-400">{absorptionParams.leanOilFlow} t/h</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title="产品质量指标" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Table
              dataSource={[
                { product: '干气', density: '≤0.7', c3Content: '≤3%', yield: '4.5%' },
                { product: '液化气', density: '0.5-0.6', c3Content: '≥95%', yield: '18.5%' },
                { product: '稳定汽油', density: '0.72-0.75', c3Content: '≤0.5%', yield: '42.3%' },
                { product: '柴油', density: '0.85-0.88', c3Content: '-', yield: '25.8%' },
              ]}
              rowKey="product"
              pagination={false}
              className="data-table"
              columns={[
                { title: '产品', dataIndex: 'product', key: 'product' },
                { title: '密度 (g/cm³)', dataIndex: 'density', key: 'density' },
                { title: 'C3含量', dataIndex: 'c3Content', key: 'c3Content' },
                { title: '收率', dataIndex: 'yield', key: 'yield' },
              ]}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">分馏吸收系统</h2>
          <p className="text-sm text-industrial-subtext">
            分馏塔操作 · 吸收稳定系统 · 油浆外甩管理
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="status-dot status-normal" />
            <span className="text-sm text-industrial-subtext">分馏系统正常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot status-normal" />
            <span className="text-sm text-industrial-subtext">吸收系统正常</span>
          </div>
        </div>
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={fractionatorTabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
}
