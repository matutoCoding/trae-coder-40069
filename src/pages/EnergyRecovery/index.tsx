import { useEffect, useMemo } from 'react';
import { Card, Row, Col, Table, Tabs } from 'antd';
import { Zap, Wind, Flame, TrendingUp, Gauge, Activity } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateTrendData, generateEnergyTrend } from '@/mock';
import DataValue from '@/components/Common/DataValue';
import LineChart from '@/components/Charts/LineChart';
import GaugeChart from '@/components/Charts/GaugeChart';
import BarChart from '@/components/Charts/BarChart';

export default function EnergyRecovery() {
  const { energyData, regeneratorParams, updateParams } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const efficiencyTrendData = useMemo(() => generateEnergyTrend(), []);
  const powerTrendData = useMemo(() => generateTrendData('p10', 12), []);

  const totalPower = energyData.flueGasTurbinePower + energyData.steamTurbinePower;
  const selfPowerRatio = ((totalPower / energyData.totalEnergyConsumption) * 100).toFixed(1);

  const hourlyEnergyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      generation: 45 + Math.sin(i / 4) * 8 + Math.random() * 3,
      consumption: 115 + Math.sin(i / 3) * 10 + Math.random() * 5,
    }));
  }, []);

  const energyTabItems = [
    {
      key: '1',
      label: '能量回收',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Zap size={20} className="text-yellow-400" />
                  </div>
                  <DataValue 
                    label="烟机功率" 
                    value={energyData.flueGasTurbinePower.toFixed(1)} 
                    unit="MW"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Wind size={20} className="text-blue-400" />
                  </div>
                  <DataValue 
                    label="汽轮机功率" 
                    value={energyData.steamTurbinePower.toFixed(1)} 
                    unit="MW"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Flame size={20} className="text-green-400" />
                  </div>
                  <DataValue 
                    label="产汽量" 
                    value={energyData.wasteHeatBoilerSteam.toFixed(1)} 
                    unit="t/h"
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingUp size={20} className="text-purple-400" />
                  </div>
                  <DataValue 
                    label="回收效率" 
                    value={energyData.recoveryEfficiency.toFixed(1)} 
                    unit="%"
                    status={energyData.recoveryEfficiency < 80 ? 'warning' : 'normal'}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="能量回收效率趋势" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <LineChart
                  data={efficiencyTrendData}
                  unit="%"
                  color="#00B42A"
                  height={300}
                  upperLimit={95}
                  lowerLimit={75}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="关键参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={energyData.recoveryEfficiency}
                    min={70}
                    max={100}
                    title="回收效率"
                    unit="%"
                    warningThreshold={90}
                    height={160}
                  />
                  <GaugeChart
                    value={energyData.flueGasTurbinePower}
                    min={20}
                    max={40}
                    title="烟机功率"
                    unit="MW"
                    warningThreshold={36}
                    height={160}
                  />
                  <GaugeChart
                    value={energyData.wasteHeatBoilerSteam}
                    min={60}
                    max={100}
                    title="产汽量"
                    unit="t/h"
                    warningThreshold={90}
                    height={160}
                  />
                  <GaugeChart
                    value={totalPower}
                    min={40}
                    max={60}
                    title="总发电"
                    unit="MW"
                    warningThreshold={55}
                    height={160}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="24小时发电功率趋势" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <LineChart
                  data={powerTrendData}
                  unit="MW"
                  color="#FFD700"
                  height={300}
                  upperLimit={38}
                  lowerLimit={25}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="能耗统计" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-industrial-border/30">
                    <div>
                      <div className="data-label">总发电量</div>
                      <div className="data-value text-yellow-400">{totalPower.toFixed(1)} MW</div>
                    </div>
                    <div className="text-right">
                      <div className="data-label">自给率</div>
                      <div className="data-value text-green-400">{selfPowerRatio}%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-industrial-border/30">
                    <div>
                      <div className="data-label">外供电量</div>
                      <div className="data-value text-blue-400">{(totalPower * 0.8).toFixed(1)} MW</div>
                    </div>
                    <div className="text-right">
                      <div className="data-label">自用电量</div>
                      <div className="data-value text-orange-400">{(totalPower * 0.2).toFixed(1)} MW</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-industrial-border/30">
                    <div>
                      <div className="data-label">装置总能耗</div>
                      <div className="data-value text-red-400">{energyData.totalEnergyConsumption.toFixed(1)} MW</div>
                    </div>
                    <div className="text-right">
                      <div className="data-label">单位能耗</div>
                      <div className="data-value text-industrial-text">62.5 kgEO/t</div>
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
      label: '烟气能量回收',
      children: (
        <div className="space-y-4 pt-4">
          <Card 
            title="烟气能量回收系统示意图" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="flex flex-wrap items-center justify-center gap-6 py-8">
              <div className="text-center">
                <div className="w-28 h-40 bg-gradient-to-b from-orange-500/30 to-red-500/30 rounded-lg border-2 border-orange-500/50 flex flex-col justify-between p-3">
                  <div className="text-xs text-industrial-subtext">再生器</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 font-mono">
                      {regeneratorParams.temperature}°C
                    </div>
                    <div className="text-xs text-industrial-subtext mt-1">
                      {regeneratorParams.flueGasFlow} Nm³/h
                    </div>
                  </div>
                  <div className="text-xs text-industrial-subtext">O₂: {regeneratorParams.oxygenContent}%</div>
                </div>
              </div>

              <div className="text-sm text-primary-400 font-mono">
                高温烟气 →
              </div>

              <div className="text-center">
                <div className="w-28 h-40 bg-gradient-to-b from-yellow-500/30 to-orange-500/30 rounded-lg border-2 border-yellow-500/50 flex flex-col justify-between p-3">
                  <div className="text-xs text-industrial-subtext">三旋分离器</div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400 font-mono">
                      效率 99.8%
                    </div>
                  </div>
                  <div className="text-xs text-industrial-subtext">压力降 0.02MPa</div>
                </div>
              </div>

              <div className="text-sm text-primary-400 font-mono">
                →
              </div>

              <div className="text-center">
                <div className="w-28 h-40 bg-gradient-to-b from-cyan-500/30 to-blue-500/30 rounded-lg border-2 border-cyan-500/50 flex flex-col justify-between p-3">
                  <div className="text-xs text-industrial-subtext">烟气轮机</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 font-mono">
                      {energyData.flueGasTurbinePower}
                    </div>
                    <div className="text-xs text-industrial-subtext">MW</div>
                  </div>
                  <div className="text-xs text-industrial-subtext">效率 88%</div>
                </div>
              </div>

              <div className="text-sm text-primary-400 font-mono">
                →
              </div>

              <div className="text-center">
                <div className="w-28 h-40 bg-gradient-to-b from-green-500/30 to-cyan-500/30 rounded-lg border-2 border-green-500/50 flex flex-col justify-between p-3">
                  <div className="text-xs text-industrial-subtext">余热锅炉</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 font-mono">
                      {energyData.wasteHeatBoilerSteam}
                    </div>
                    <div className="text-xs text-industrial-subtext">t/h</div>
                  </div>
                  <div className="text-xs text-industrial-subtext">排烟 160°C</div>
                </div>
              </div>

              <div className="text-sm text-primary-400 font-mono">
                → 烟囱排放
              </div>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="24小时能量平衡" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <BarChart
                  data={hourlyEnergyData.flatMap(d => [
                    { name: `${d.time} 发电`, value: d.generation, color: '#FFD700' },
                    { name: `${d.time} 消耗`, value: d.consumption, color: '#F53F3F' },
                  ])}
                  unit="MW"
                  height={350}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="烟气参数" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <Table
                  dataSource={[
                    { param: '烟气入口温度', value: `${regeneratorParams.temperature}°C`, status: 'normal' },
                    { param: '烟气出口温度', value: '160°C', status: 'normal' },
                    { param: '烟气流量', value: `${regeneratorParams.flueGasFlow} Nm³/h`, status: 'normal' },
                    { param: '烟气压力', value: '0.22 MPa', status: 'normal' },
                    { param: 'CO含量', value: '≤0.5%', status: 'normal' },
                    { param: 'SO₂含量', value: '≤100 mg/m³', status: 'normal' },
                    { param: 'NOx含量', value: '≤150 mg/m³', status: 'normal' },
                    { param: '粉尘含量', value: '≤30 mg/m³', status: 'normal' },
                  ]}
                  rowKey="param"
                  pagination={false}
                  className="data-table"
                  columns={[
                    { title: '参数', dataIndex: 'param', key: 'param' },
                    { title: '数值', dataIndex: 'value', key: 'value' },
                    { 
                      title: '状态', 
                      dataIndex: 'status', 
                      key: 'status',
                      render: (status: string) => (
                        <span className="text-green-400">● 正常</span>
                      )
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">能量回收系统</h2>
          <p className="text-sm text-industrial-subtext">
            烟气能量回收 · 余热利用 · 能耗统计
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-normal" />
          <span className="text-sm text-industrial-subtext">能量回收系统正常</span>
        </div>
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={energyTabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
}
