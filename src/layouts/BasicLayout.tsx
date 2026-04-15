import React, { useState, useMemo, createContext, useContext } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Select, Badge, Avatar, Dropdown, Space, message } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, TeamOutlined, CarOutlined, ScheduleOutlined, CheckSquareOutlined, MessageOutlined, ToolOutlined, SettingOutlined, FileTextOutlined, AlertOutlined, PhoneOutlined, ReloadOutlined } from '@ant-design/icons';
import { UserInfo, UserRole, roleOptions, Message } from '../types';
import { brandColors } from '../theme';
import { getData, resetAllData } from '../utils/mockCrud';
import { defaultMessages } from '../mock/data';

const defaultUser: UserInfo = {
  name: '张伟',
  role: 'dcc_specialist',
  roleLabel: 'DCC专员',
  store: '林肯中心（上海浦东店）',
  avatar: '',
};

interface AppContextType {
  user: UserInfo;
  setUser: (u: UserInfo) => void;
}

export const AppContext = createContext<AppContextType>({
  user: defaultUser,
  setUser: () => {},
});

export const useAppContext = () => useContext(AppContext);

const menuRoute = {
  path: '/',
  routes: [
    {
      path: '/leads',
      name: '线索管理',
      icon: <PhoneOutlined />,
      routes: [
        { path: '/leads/list', name: '线索列表' },
        { path: '/leads/rules', name: '分配规则' },
      ],
    },
    {
      path: '/customers',
      name: '客户管理',
      icon: <TeamOutlined />,
      routes: [
        { path: '/customers/list', name: '客户列表' },
      ],
    },
    {
      path: '/appointments',
      name: '预约到店',
      icon: <ScheduleOutlined />,
    },
    {
      path: '/test-drive',
      name: '试乘试驾',
      icon: <CarOutlined />,
    },
    {
      path: '/traffic',
      name: '客流管理',
      icon: <SettingOutlined />,
    },
    {
      path: '/todo',
      name: '待办中心',
      icon: <CheckSquareOutlined />,
    },
    {
      path: '/messages',
      name: '消息中心',
      icon: <MessageOutlined />,
    },
    {
      name: '售后服务',
      icon: <ToolOutlined />,
      path: '/after-sales',
      routes: [
        { path: '/after-sales/leads', name: '售后线索', icon: <FileTextOutlined /> },
        { path: '/after-sales/appointments', name: '售后预约', icon: <ScheduleOutlined /> },
        { path: '/after-sales/accidents', name: '事故管理', icon: <AlertOutlined /> },
        { path: '/after-sales/customers', name: '售后客户', icon: <TeamOutlined /> },
      ],
    },
  ],
};

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInfo>(defaultUser);
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = useMemo(() => {
    const msgs = getData<Message>('messages', defaultMessages);
    return msgs.filter(m => !m.read).length;
  }, [location.pathname]);

  const handleRoleChange = (role: UserRole) => {
    const opt = roleOptions.find(r => r.value === role);
    const nameMap: Record<UserRole, string> = {
      dcc_manager: '刘芳',
      dcc_specialist: '张伟',
      sales_advisor: '王强',
      sales_director: '陈晨',
      after_sales_advisor: '马超',
      service_engineer: '赵云',
    };
    setUser({
      ...user,
      role,
      roleLabel: opt?.label || '',
      name: nameMap[role] || user.name,
    });
    message.success(`已切换为 ${opt?.label}（${nameMap[role]}）`);
  };

  return (
    <AppContext.Provider value={{ user, setUser }}>
      <ProLayout
        title="林肯大师"
        logo={false}
        layout="mix"
        splitMenus={false}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        fixSiderbar
        fixedHeader
        route={menuRoute}
        location={{ pathname: location.pathname }}
        token={{
          header: {
            colorBgHeader: brandColors.navy,
            colorHeaderTitle: brandColors.gold,
            colorTextMenu: '#ffffff',
            colorTextMenuSelected: brandColors.gold,
            colorBgMenuItemSelected: 'rgba(201,169,110,0.15)',
            colorTextMenuActive: brandColors.gold,
            colorTextRightActionsItem: '#ffffff',
          },
          sider: {
            colorMenuBackground: brandColors.navy,
            colorTextMenu: 'rgba(255,255,255,0.75)',
            colorTextMenuSelected: brandColors.gold,
            colorBgMenuItemSelected: 'rgba(201,169,110,0.15)',
            colorTextMenuActive: brandColors.gold,
            colorTextMenuItemHover: '#ffffff',
            colorBgMenuItemHover: 'rgba(255,255,255,0.08)',
          },
          pageContainer: {
            paddingBlockPageContainerContent: 16,
            paddingInlinePageContainerContent: 24,
          },
        }}
        menuItemRender={(item: any, dom: any) => (
          <span onClick={() => item.path && navigate(item.path)}>{dom}</span>
        )}
        actionsRender={() => [
          <Select
            key="role"
            value={user.role}
            onChange={handleRoleChange}
            options={roleOptions}
            style={{ width: 140 }}
            size="small"
            popupMatchSelectWidth={false}
          />,
          <Badge key="bell" count={unreadCount} size="small">
            <BellOutlined style={{ color: '#fff', fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/messages')} />
          </Badge>,
          <Dropdown key="user" menu={{
            items: [
              { key: 'info', label: `${user.name}（${user.roleLabel}）`, disabled: true },
              { key: 'store', label: user.store, disabled: true },
              { type: 'divider' as const },
              { key: 'reset', label: '重置数据', icon: <ReloadOutlined />, onClick: () => {
                if (window.confirm('确认重置所有演示数据？页面将自动刷新。')) {
                  resetAllData();
                  window.location.reload();
                }
              }},
              { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => navigate('/login') },
            ],
          }}>
            <Space style={{ cursor: 'pointer', color: '#fff' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: brandColors.gold }} />
              <span>{user.name}</span>
            </Space>
          </Dropdown>,
        ]}
        menuFooterRender={(props: any) => {
          if (props?.collapsed) return undefined;
          return (
            <div style={{ textAlign: 'center', paddingBlockEnd: 12 }}>
              <div
                onClick={() => {
                  if (window.confirm('确认重置所有演示数据？页面将自动刷新。')) {
                    resetAllData();
                    window.location.reload();
                  }
                }}
                style={{ cursor: 'pointer', padding: '6px 12px', margin: '0 12px 8px', borderRadius: 6, background: 'rgba(255,77,79,0.15)', color: '#ff4d4f', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}
              >
                <ReloadOutlined /> 重置演示数据
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Lincoln Master CRM Demo
              </div>
            </div>
          );
        }}
      >
        <Outlet />
      </ProLayout>
    </AppContext.Provider>
  );
};

export default BasicLayout;
