import React, { useState, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, List, Tag, Badge, Tabs, Space, Button, message, Avatar, Tooltip, Row, Col, Statistic } from 'antd';
import { BellOutlined, ClockCircleOutlined, TeamOutlined, CheckCircleOutlined, ExclamationCircleFilled, WechatOutlined, CarOutlined, WarningFilled, ThunderboltFilled, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Message, Lead, Customer } from '../../types';
import { getData, setData } from '../../utils/mockCrud';
import { defaultMessages, defaultLeads } from '../../mock/data';
import { brandColors } from '../../theme';
import { useAppContext } from '../../layouts/BasicLayout';

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  system: { label: '系统通知', color: 'blue', icon: <BellOutlined /> },
  overdue: { label: '逾期提醒', color: 'red', icon: <ExclamationCircleFilled /> },
  assignment: { label: '任务分配', color: 'green', icon: <TeamOutlined /> },
  approval: { label: '审批通知', color: 'orange', icon: <CheckCircleOutlined /> },
  appointment_remind: { label: '预约提醒', color: 'cyan', icon: <ClockCircleOutlined /> },
  test_drive: { label: '试驾通知', color: 'geekblue', icon: <CarOutlined /> },
  wechat_reply: { label: '企微消息', color: 'green', icon: <WechatOutlined /> },
  defeat_approval: { label: '战败审批', color: 'volcano', icon: <WarningFilled /> },
};

const MessageCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [data, setDataState] = useState<Message[]>(() => getData('messages', defaultMessages));
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all' ? data : data.filter(m => m.type === activeTab);
  const unreadCount = data.filter(m => !m.read).length;
  const overdueUnread = data.filter(m => m.type === 'overdue' && !m.read).length;

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    data.forEach(m => { if (!m.read) typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });
    return typeCounts;
  }, [data]);

  const markRead = (id: string) => {
    const updated = data.map(m => m.id === id ? { ...m, read: true } : m);
    setDataState(updated);
    setData('messages', updated);
  };

  const markAllRead = () => {
    const updated = data.map(m => ({ ...m, read: true }));
    setDataState(updated);
    setData('messages', updated);
    message.success('已全部标记为已读');
  };

  const handleClick = (item: Message) => {
    markRead(item.id);
    if (item.link) navigate(item.link);
  };

  const handleApprove = (item: Message, approved: boolean) => {
    markRead(item.id);
    if (item.type === 'approval' && item.relatedType === 'lead' && item.relatedId) {
      // 无效线索审批
      const leads = getData<Lead>('leads', defaultLeads);
      const idx = leads.findIndex(l => l.id === item.relatedId);
      if (idx !== -1) {
        if (approved) {
          leads[idx].status = 'invalid';
          leads[idx].approvalStatus = 'approved';
        } else {
          leads[idx].approvalStatus = 'rejected';
        }
        setData('leads', leads);
      }
      // 更新待办
      const todos = getData<any>('todos', []);
      const tIdx = todos.findIndex((t: any) => t.relatedId === item.relatedId && t.type === 'invalid_approval');
      if (tIdx !== -1) {
        todos[tIdx].status = approved ? 'completed' : 'cancelled';
        setData('todos', todos);
      }
    } else if (item.type === 'defeat_approval' && item.relatedType === 'customer' && item.relatedId) {
      // 战败审批
      const customers = getData<Customer>('customers', []);
      const idx = customers.findIndex(c => c.id === item.relatedId);
      if (idx !== -1) {
        if (approved) {
          customers[idx].status = 'defeated';
        }
        setData('customers', customers);
      }
      const todos = getData<any>('todos', []);
      const tIdx = todos.findIndex((t: any) => t.relatedId === item.relatedId && t.type === 'defeat_approval');
      if (tIdx !== -1) {
        todos[tIdx].status = approved ? 'completed' : 'cancelled';
        setData('todos', todos);
      }
    }
    // 更新消息状态
    const updated = data.map(m => m.id === item.id ? { ...m, read: true, approved } : m);
    setDataState(updated);
    setData('messages', updated);
    message.success(approved ? '审批已通过' : '审批已驳回');
  };

  const getAvatarStyle = (type: string) => {
    if (type === 'overdue') return { background: '#ff4d4f' };
    if (type === 'assignment') return { background: '#52c41a' };
    if (type === 'approval' || type === 'defeat_approval') return { background: '#faad14' };
    if (type === 'wechat_reply') return { background: '#07c160' };
    if (type === 'appointment_remind') return { background: '#13c2c2' };
    if (type === 'test_drive') return { background: '#2f54eb' };
    return { background: brandColors.gold };
  };

  return (
    <PageContainer header={{ title: '消息中心' }}
      extra={[
        <Badge key="count" count={unreadCount} style={{ marginRight: 16 }}><span style={{ padding: '0 8px' }}>未读消息</span></Badge>,
        <Button key="read" onClick={markAllRead}>全部已读</Button>,
      ]}
    >
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="未读消息" value={unreadCount} valueStyle={{ color: brandColors.gold, fontSize: 28 }} prefix={<BellOutlined />} /></Card></Col>
        <Col span={6}>
          <Card size="small" style={{ borderLeft: overdueUnread > 0 ? '3px solid #ff4d4f' : undefined }}>
            <Statistic title="逾期提醒" value={overdueUnread} valueStyle={{ color: '#ff4d4f', fontSize: 28 }} prefix={<ExclamationCircleFilled />} />
          </Card>
        </Col>
        <Col span={6}><Card size="small"><Statistic title="任务分配" value={stats['assignment'] || 0} valueStyle={{ color: '#52c41a', fontSize: 28 }} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="企微消息" value={stats['wechat_reply'] || 0} valueStyle={{ color: '#07c160', fontSize: 28 }} prefix={<WechatOutlined />} /></Card></Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'all', label: <Badge count={unreadCount} size="small" offset={[8, 0]}><span>全部 ({data.length})</span></Badge> },
          { key: 'overdue', label: <span style={{ color: overdueUnread > 0 ? '#ff4d4f' : undefined, fontWeight: overdueUnread > 0 ? 600 : 400 }}>⚠️ 逾期提醒 ({data.filter(m => m.type === 'overdue').length})</span> },
          { key: 'assignment', label: `任务分配 (${data.filter(m => m.type === 'assignment').length})` },
          { key: 'approval', label: `审批通知 (${data.filter(m => m.type === 'approval' || m.type === 'defeat_approval').length})` },
          { key: 'appointment_remind', label: `预约提醒 (${data.filter(m => m.type === 'appointment_remind').length})` },
          { key: 'wechat_reply', label: `企微消息 (${data.filter(m => m.type === 'wechat_reply').length})` },
          { key: 'system', label: `系统通知 (${data.filter(m => m.type === 'system' || m.type === 'test_drive').length})` },
        ]} />
        <List
          dataSource={filtered}
          renderItem={item => {
            const config = typeConfig[item.type] || typeConfig.system;
            return (
              <List.Item
                style={{
                  background: !item.read ? (item.type === 'overdue' ? '#fff1f0' : '#f6ffed') : undefined,
                  padding: '12px 16px', cursor: 'pointer',
                  borderLeft: !item.read ? `3px solid ${item.type === 'overdue' ? '#ff4d4f' : brandColors.gold}` : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleClick(item)}
              >
                <List.Item.Meta
                  avatar={<Avatar style={getAvatarStyle(item.type)} icon={config.icon} />}
                  title={
                    <Space>
                      {!item.read && <Badge status="processing" />}
                      <Tag color={config.color}>{config.label}</Tag>
                      <span style={{ fontWeight: !item.read ? 600 : 400 }}>{item.title}</span>
                      {item.type === 'overdue' && !item.read && <ThunderboltFilled style={{ color: '#ff4d4f' }} />}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ color: '#555', marginBottom: 4, lineHeight: 1.6 }}>{item.content}</div>
                      <Space>
                        <span style={{ fontSize: 12, color: '#999' }}><ClockCircleOutlined /> {item.createdAt}</span>
                        {item.link && <Tag color="blue" style={{ fontSize: 11, cursor: 'pointer' }}>点击处理 →</Tag>}
                        {(item.type === 'approval' || item.type === 'defeat_approval') && item.approved === undefined && (() => {
                          const canApprove = item.type === 'approval'
                            ? user.role === 'dcc_manager'
                            : item.type === 'defeat_approval'
                              ? user.role === 'sales_director'
                              : false;
                          const requiredRole = item.type === 'approval' ? 'DCC经理' : '销售总监';
                          return canApprove ? (
                            <Space size={4}>
                              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleApprove(item, true); }} style={{ background: '#52c41a', borderColor: '#52c41a' }}>通过</Button>
                              <Button size="small" danger onClick={(e) => { e.stopPropagation(); handleApprove(item, false); }}>驳回</Button>
                            </Space>
                          ) : (
                            <Tooltip title={`需${requiredRole}权限审批`}>
                              <Tag icon={<LockOutlined />} color="default" style={{ fontSize: 11 }}>待{requiredRole}审批</Tag>
                            </Tooltip>
                          );
                        })()}
                        {item.approved === true && <Tag color="success">已通过</Tag>}
                        {item.approved === false && <Tag color="error">已驳回</Tag>}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default MessageCenter;
