import { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Dropdown, Avatar } from 'antd';
import {
  LayoutDashboard,
  Power,
  FlaskConical,
  Flame,
  Droplets,
  Zap,
  Activity,
  Wrench,
  Bell,
  User,
  ChevronDown,
  Menu as MenuIcon,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import { getRoleText, getStatusText, cn } from '@/utils';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <LayoutDashboard size={18} />,
    label: '首页仪表盘',
  },
  {
    key: '/startup-shutdown',
    icon: <Power size={18} />,
    label: '装置开停工',
  },
  {
    key: '/catalyst',
    icon: <FlaskConical size={18} />,
    label: '催化剂管理',
  },
  {
    key: '/reaction-regeneration',
    icon: <Flame size={18} />,
    label: '反应再生',
  },
  {
    key: '/fractionation',
    icon: <Droplets size={18} />,
    label: '分馏吸收',
  },
  {
    key: '/energy-recovery',
    icon: <Zap size={18} />,
    label: '能量回收',
  },
  {
    key: '/monitoring',
    icon: <Activity size={18} />,
    label: '参数监控',
  },
  {
    key: '/equipment',
    icon: <Wrench size={18} />,
    label: '设备点检',
  },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, alarms, units, currentUnitId, setCurrentUnitId } = useAppStore();
  
  const activeAlarms = alarms.filter(a => a.status === 'active').length;

  const userMenuItems = [
    {
      key: '1',
      label: (
        <div className="flex flex-col">
          <span className="font-medium">{currentUser.name}</span>
          <span className="text-xs text-gray-400">{getRoleText(currentUser.role)}</span>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    { key: '2', label: '个人设置' },
    { key: '3', label: '退出登录' },
  ];

  const unitMenuItems = units.map(unit => ({
    key: unit.id,
    label: (
      <div className="flex items-center gap-2">
        <span className={cn(
          'w-2 h-2 rounded-full',
          unit.status === 'running' ? 'bg-green-500' : 
          unit.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
        )} />
        <span>{unit.name}</span>
        <span className="text-xs text-gray-400 ml-auto">{getStatusText(unit.status)}</span>
      </div>
    ),
  }));

  const currentUnit = units.find(u => u.id === currentUnitId);

  useEffect(() => {
    document.title = '催化裂化装置管理系统';
  }, []);

  return (
    <Layout className="min-h-screen bg-industrial-bg">
      <Header className="bg-industrial-card border-b border-industrial-border h-14 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-industrial-text hover:text-primary-400 transition-colors p-1"
          >
            <MenuIcon size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Flame size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">催化裂化装置管理系统</h1>
              <p className="text-xs text-industrial-subtext leading-tight">FCCU Management System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dropdown menu={{ items: unitMenuItems, onClick: ({ key }) => setCurrentUnitId(key) }} placement="bottomRight">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-industrial-border rounded hover:bg-industrial-border/80 transition-colors">
              <span className={cn(
                'w-2 h-2 rounded-full',
                currentUnit?.status === 'running' ? 'bg-green-500 shadow-glow-green' : 
                currentUnit?.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
              )} />
              <span className="text-sm">{currentUnit?.name}</span>
              <ChevronDown size={14} className="text-industrial-subtext" />
            </button>
          </Dropdown>

          <Badge count={activeAlarms} size="small" offset={[-2, 2]}>
            <button className="relative p-2 text-industrial-text hover:text-primary-400 transition-colors rounded hover:bg-industrial-border">
              <Bell size={18} />
            </button>
          </Badge>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-industrial-border transition-colors">
              <Avatar size={28} className="bg-primary-500">
                <User size={16} />
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                <p className="text-xs text-industrial-subtext leading-tight">{getRoleText(currentUser.role)}</p>
              </div>
            </button>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider
          width={200}
          collapsed={collapsed}
          collapsedWidth={64}
          theme="dark"
          className="bg-industrial-card border-r border-industrial-border sticky top-14 h-[calc(100vh-56px)]"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            theme="dark"
            className="bg-transparent border-0 mt-2"
            items={menuItems.map(item => ({
              ...item,
              className: 'my-0.5 mx-2 rounded',
            }))}
          />
        </Sider>

        <Content className="p-4 md:p-6 overflow-auto h-[calc(100vh-56px)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
