import { useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Tabs } from 'antd';
import { FlaskConical, TrendingDown, TrendingUp, Activity, Calendar } from 'lucide-react';
import { useAppStore } from '@/store';
import { generateDailyLoss, generateTrendData } from '@/mock';
import { calculateDaysBetween, formatDate, cn } from '@/utils';
import GaugeChart from '@/components/Charts/GaugeChart';
import LineChart from '@/components/Charts/LineChart';
import BarChart from '@/components/Charts/BarChart';
import DataValue from '@/components/Common/DataValue';
import type { Dayjs } from 'dayjs';

export default function Catalyst() {
  const { catalysts, catalystLosses, currentUnitId, regeneratorParams } = useAppStore();

  const catalyst = useMemo(() => 
    catalysts.find(c => c.unitId === currentUnitId),
    [catalysts, currentUnitId]
  );

  const unitLosses = useMemo(() => 
    catalystLosses.filter(cl => cl.catalystId === catalyst?.id),
    [catalystLosses, catalyst?.id]
  );

  const dailyLossData = useMemo(() => generateDailyLoss(), []);
  const inventoryTrendData = useMemo(() => generateTrendData('p5', 72), []);
  const lossTrendData = useMemo(() => 
    dailyLossData.map(d => ({ name: d.date, value: d.loss })),
    [dailyLossData]
  );

  const totalMonthlyLoss = useMemo(() => 
    unitLosses.slice(-30).reduce((sum, l) => sum + l.lossAmount, 0),
    [unitLosses]
  );

  const avgDailyLoss = totalMonthlyLoss / 30;
  const daysSinceReplaced = catalyst ? calculateDaysBetween(catalyst.lastReplaced, new Date().toISOString()) : 0;
  const remainingLife = catalyst ? catalyst.expectedLifetime - daysSinceReplaced : 0;

  const lossColumns = [
    {
      title: '日期',
      dataIndex: 'recordTime',
      key: 'recordTime',
      render: (time: string) => formatDate(time),
    },
    {
      title: '跑损量',
      dataIndex: 'lossAmount',
      key: 'lossAmount',
      render: (val: number) => (
        <span className="font-mono font-semibold">{val.toFixed(2)} 吨</span>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
  ];

  const lossByReason = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    unitLosses.forEach(l => {
      reasonMap[l.reason] = (reasonMap[l.reason] || 0) + l.lossAmount;
    });
    return Object.entries(reasonMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(1)),
      color: ['#F53F3F', '#FF7D00', '#165DFF'][Object.keys(reasonMap).indexOf(name) % 3],
    }));
  }, [unitLosses]);

  const tabItems = [
    {
      key: '1',
      label: '催化剂藏量',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary-500/20">
                    <FlaskConical size={20} className="text-primary-400" />
                  </div>
                  <DataValue 
                    label="当前藏量" 
                    value={catalyst?.inventory.toFixed(1) || '-'} 
                    unit={catalyst?.inventoryUnit || ''} 
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Activity size={20} className="text-green-400" />
                  </div>
                  <DataValue 
                    label="催化剂活性" 
                    value={catalyst?.currentActivity.toFixed(1) || '-'} 
                    unit="%" 
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Calendar size={20} className="text-orange-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="data-label">上次更换</span>
                    <span className="data-value">{catalyst?.lastReplaced || '-'}</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="industrial-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingDown size={20} className="text-purple-400" />
                  </div>
                  <DataValue 
                    label="剩余寿命" 
                    value={remainingLife.toString()} 
                    unit="天"
                    status={remainingLife < 30 ? 'warning' : remainingLife < 15 ? 'alarm' : 'normal'} 
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="催化剂藏量趋势" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <LineChart
                  data={inventoryTrendData}
                  unit="t/h"
                  color="#165DFF"
                  height={300}
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
                    value={regeneratorParams.cokeBurningRate}
                    min={0}
                    max={20}
                    title="烧焦强度"
                    unit="t/h"
                    warningThreshold={14}
                    dangerThreshold={16}
                    height={180}
                  />
                  <GaugeChart
                    value={regeneratorParams.oxygenContent}
                    min={0}
                    max={5}
                    title="烟气氧含量"
                    unit="%"
                    warningThreshold={4}
                    height={180}
                  />
                  <GaugeChart
                    value={catalyst?.currentActivity || 0}
                    min={70}
                    max={100}
                    title="催化剂活性"
                    unit="%"
                    warningThreshold={80}
                    dangerThreshold={75}
                    height={180}
                  />
                  <GaugeChart
                    value={catalyst?.inventory || 0}
                    min={100}
                    max={200}
                    title="催化剂藏量"
                    unit="吨"
                    warningThreshold={180}
                    height={180}
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
      label: '催化剂跑损统计',
      children: (
        <div className="space-y-4 pt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="data-label mb-1">本月累计跑损</div>
                    <div className="flex items-baseline gap-1">
                      <span className="data-value text-2xl text-red-400">
                        {totalMonthlyLoss.toFixed(1)}
                      </span>
                      <span className="text-sm text-industrial-subtext">吨</span>
                    </div>
                  </div>
                  <TrendingUp size={24} className="text-red-400" />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="data-label mb-1">日均跑损</div>
                    <div className="flex items-baseline gap-1">
                      <span className="data-value text-2xl text-orange-400">
                        {avgDailyLoss.toFixed(2)}
                      </span>
                      <span className="text-sm text-industrial-subtext">吨/天</span>
                    </div>
                  </div>
                  <Activity size={24} className="text-orange-400" />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="industrial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="data-label mb-1">跑损率</div>
                    <div className="flex items-baseline gap-1">
                      <span className="data-value text-2xl text-yellow-400">
                        {((avgDailyLoss / (catalyst?.inventory || 1)) * 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-industrial-subtext">%</span>
                    </div>
                  </div>
                  <TrendingDown size={24} className="text-green-400" />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="日跑损趋势" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <BarChart
                  data={lossTrendData}
                  unit="吨"
                  color="#F53F3F"
                  height={300}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="跑损原因分布" 
                className="bg-industrial-card border-industrial-border"
                styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
              >
                <BarChart
                  data={lossByReason}
                  unit="吨"
                  horizontal
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          <Card 
            title="跑损记录明细" 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Table
              dataSource={unitLosses.slice(0, 10)}
              columns={lossColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="data-table"
            />
          </Card>
        </div>
      ),
    },
    {
      key: '3',
      label: '催化剂台账',
      children: (
        <div className="pt-4">
          <Card 
            className="bg-industrial-card border-industrial-border"
            styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '16px' } }}
          >
            <Table
              dataSource={catalysts}
              rowKey="id"
              pagination={false}
              className="data-table"
              columns={[
                {
                  title: '催化剂名称',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '所属装置',
                  key: 'unit',
                  render: (_: any, record: any) => {
                    const unit = record.unitId === 'u1' ? '一套装置' : 
                                record.unitId === 'u2' ? '二套装置' : '三套装置';
                    return unit;
                  },
                },
                {
                  title: '当前藏量',
                  dataIndex: 'inventory',
                  key: 'inventory',
                  render: (val: number, record: any) => (
                    <span className="font-mono">{val.toFixed(1)} {record.inventoryUnit}</span>
                  ),
                },
                {
                  title: '当前活性',
                  dataIndex: 'currentActivity',
                  key: 'currentActivity',
                  render: (val: number) => (
                    <Tag color={val >= 90 ? 'green' : val >= 80 ? 'orange' : 'red'}>
                      {val.toFixed(1)}%
                    </Tag>
                  ),
                },
                {
                  title: '上次更换',
                  dataIndex: 'lastReplaced',
                  key: 'lastReplaced',
                },
                {
                  title: '预期寿命',
                  dataIndex: 'expectedLifetime',
                  key: 'expectedLifetime',
                  render: (val: number) => `${val} 天`,
                },
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
          <h2 className="text-xl font-bold text-white">催化剂管理</h2>
          <p className="text-sm text-industrial-subtext">
            {catalyst?.name || '-'} · 藏量监控与跑损统计
          </p>
        </div>
        {catalyst && (
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block w-2 h-2 rounded-full',
              catalyst.currentActivity >= 90 ? 'bg-green-500 shadow-glow-green' :
              catalyst.currentActivity >= 80 ? 'bg-orange-500 shadow-glow-orange' :
              'bg-red-500 shadow-glow-red'
            )} />
            <span className="text-sm text-industrial-subtext">
              活性状态: {catalyst.currentActivity >= 90 ? '良好' : 
                         catalyst.currentActivity >= 80 ? '正常' : '偏低'}
            </span>
          </div>
        )}
      </div>

      <Card 
        className="bg-industrial-card border-industrial-border"
        styles={{ header: { borderBottom: '1px solid #1E2A45' }, body: { padding: '0 16px 16px' } }}
      >
        <Tabs items={tabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
}
