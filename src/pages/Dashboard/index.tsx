import { useEffect, useMemo } from 'react';
import { Card, Row, Col, Tag, List } from 'antd';
import { TrendingUp, TrendingDown, Activity, Zap, FlaskConical, Flame } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateTrendData, generateEnergyTrend, generateProductDistribution, generateEquipmentStatusStats } from '@/mock';
import { getStatusText, getStatusBgColor, cn } from '@/utils';
import GaugeChart from '@/components/Charts/GaugeChart';
import LineChart from '@/components/Charts/LineChart';
import PieChart from '@/components/Charts/PieChart';
import BarChart from '@/components/Charts/BarChart';
import ParamCard from '@/components/Common/ParamCard';
import AlarmItem from '@/components/Common/AlarmItem';
import DataValue from '@/components/Common/DataValue';

export default function Dashboard() {
  const { 
    parameters, 
    alarms, 
    reactorParams, 
    regeneratorParams, 
    energyData,
    catalystLosses,
    equipment,
    updateParams,
    currentUnitId,
    units,
  } = useAppStore();

  const currentUnit = units.find(u => u.id === currentUnitId);

  useEffect(() => {
    const interval = setInterval(() => {
      updateParams();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateParams]);

  const tempTrendData = useMemo(() => generateTrendData('p1', 6), []);
  const energyTrendData = useMemo(() => generateEnergyTrend(), []);
  const productDistribution = useMemo(() => generateProductDistribution(), []);
  const equipmentStats = useMemo(() => generateEquipmentStatusStats(), []);
  
  const totalLoss = useMemo(() => {
    const unitLosses = catalystLosses.filter(cl => cl.catalystId === `c${currentUnitId.slice(1)}`);
    return unitLosses.slice(-7).reduce((sum, l) => sum + l.lossAmount, 0);
  }, [catalystLosses, currentUnitId]);

  const runningEquipment = equipment.filter(e => e.unitId === currentUnitId && e.status === 'running').length;
  const activeAlarms = alarms.filter(a => a.status === 'active');
  const keyParams = parameters.slice(0, 6);

  const productColors = ['#165DFF', '#00B42A', '#FF7D00', '#722ED1', '#F53F3F', '#86909C'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">运行总览</h2>
          <p className="text-sm text-industrial-subtext">
            {currentUnit?.name} · {getStatusText(currentUnit?.status || '')}
            <span className="ml-2">
              <span className={cn(
                'inline-block w-2 h-2 rounded-full mr-1',
                currentUnit?.status === 'running' ? 'bg-green-500 shadow-glow-green animate-pulse' : 'bg-yellow-500'
              )} />
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Tag color="green">在线设备: {runningEquipment}/{equipment.filter(e => e.unitId === currentUnitId).length}</Tag>
          <Tag color="red">活动报警: {activeAlarms.length}</Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="industrial-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Flame size={20} className="text-red-400" />
              </div>
              <DataValue label="反应器温度" value={reactorParams.temperature} unit="°C" />
            </div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingDown size={12} className="mr-1" />
              较上小时下降 2.3°C
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <div className="industrial-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Activity size={20} className="text-orange-400" />
              </div>
              <DataValue label="再生器温度" value={regeneratorParams.temperature} unit="°C" />
            </div>
            <div className="flex items-center text-xs text-red-400">
              <TrendingUp size={12} className="mr-1" />
              较上小时上升 1.8°C
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <div className="industrial-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Zap size={20} className="text-blue-400" />
              </div>
              <DataValue label="能量回收效率" value={energyData.recoveryEfficiency} unit="%" />
            </div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp size={12} className="mr-1" />
              较上小时提升 0.5%
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <div className="industrial-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FlaskConical size={20} className="text-purple-400" />
              </div>
              <DataValue label="本周催化剂跑损" value={totalLoss.toFixed(1)} unit="吨" />
            </div>
            <div className="flex items-center text-xs text-industrial-subtext">
              日均跑损 {(totalLoss / 7).toFixed(2)} 吨
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card 
            title="关键指标" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="grid grid-cols-2 gap-4">
              <GaugeChart
                value={reactorParams.temperature}
                min={450}
                max={550}
                title="反应器"
                unit="°C"
                warningThreshold={510}
                dangerThreshold={520}
                height={180}
              />
              <GaugeChart
                value={regeneratorParams.temperature}
                min={650}
                max={750}
                title="再生器"
                unit="°C"
                warningThreshold={710}
                dangerThreshold={720}
                height={180}
              />
              <GaugeChart
                value={energyData.recoveryEfficiency}
                min={70}
                max={100}
                title="回收效率"
                unit="%"
                warningThreshold={90}
                height={180}
              />
              <GaugeChart
                value={regeneratorParams.cokeBurningRate}
                min={5}
                max={20}
                title="烧焦强度"
                unit="t/h"
                warningThreshold={14}
                dangerThreshold={15}
                height={180}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="反应温度趋势" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <LineChart
              data={tempTrendData}
              unit="°C"
              color="#F53F3F"
              height={320}
              upperLimit={520}
              lowerLimit={480}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="产品分布" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <PieChart
              data={productDistribution.map((d, i) => ({ ...d, color: productColors[i] }))}
              title="收率分布"
              height={320}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="关键参数监控" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {keyParams.map(param => (
                <ParamCard key={param.id} param={param} />
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card 
            title="能量回收趋势" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <LineChart
              data={energyTrendData}
              unit="%"
              color="#00B42A"
              height={280}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card 
            title="设备状态统计" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <BarChart
              data={equipmentStats}
              unit="台"
              horizontal
              height={280}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={`报警信息 (${activeAlarms.length})`} 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <List
              dataSource={alarms.slice(0, 5)}
              renderItem={(alarm) => (
                <List.Item className="border-0 p-0 mb-3 last:mb-0">
                  <AlarmItem alarm={alarm} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="设备运行状态" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {equipment.filter(e => e.unitId === currentUnitId).map(eq => (
                <div key={eq.id} className="flex items-center gap-3 p-3 rounded-lg bg-industrial-border/30 hover:bg-industrial-border/50 transition-colors">
                  <span className={cn(
                    'status-dot',
                    eq.status === 'running' && 'status-normal',
                    eq.status === 'standby' && 'status-warning',
                    eq.status === 'fault' && 'status-alarm',
                    eq.status === 'stopped' && 'bg-gray-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{eq.name}</div>
                    <div className="text-xs text-industrial-subtext">{eq.specification}</div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs border',
                    getStatusBgColor(eq.status)
                  )}>
                    {getStatusText(eq.status)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
