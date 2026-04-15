import React, { useState, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Space, Badge, Segmented, Button, message, Row, Col, Statistic, Drawer, Descriptions, Timeline, Tooltip, Progress } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined, RightOutlined, FireOutlined, BellOutlined, AppstoreOutlined, BarsOutlined, WarningOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TodoItem } from '../../types';
import { getData, updateItem, setData } from '../../utils/mockCrud';
import { defaultTodos } from '../../mock/data';
import { brandColors } from '../../theme';

const typeLabels: Record<string, string> = {
  lead_follow: '线索跟进', appointment: '预约确认', test_drive: '试驾安排',
  approval: '审批处理', customer_follow: '客户跟进', traffic: '客流接待',
  order_review: '订单审核', defeat_approval: '战败/休眠审批', delivery: '交车预约',
  wechat_task: '企微运营', invalid_approval: '无效线索审批',
};
const typeIcons: Record<string, string> = {
  lead_follow: '📞', appointment: '📅', test_drive: '🚗', approval: '📋',
  customer_follow: '👤', traffic: '🏪', order_review: '📝', defeat_approval: '⚠️',
  delivery: '🔑', wechat_task: '💬', invalid_approval: '❌',
};
const priorityColors: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' };
const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' };
const statusColors: Record<string, string> = { pending: 'default', in_progress: 'processing', completed: 'success', overdue: 'error' };
const statusLabels: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', overdue: '已逾期' };

const TodoCenter: React.FC = () => {
  const navigate = useNavigate();
  const [data, setDataState] = useState<TodoItem[]>(() => getData('todos', defaultTodos));
  const [view, setView] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState<TodoItem | null>(null);

  const stats = useMemo(() => ({
    total: data.filter(d => d.status !== 'completed').length,
    overdue: data.filter(d => d.status === 'overdue').length,
    pending: data.filter(d => d.status === 'pending').length,
    critical: data.filter(d => d.status === 'overdue' && (d.overdueHours || 0) >= 12).length,
  }), [data]);

  const filtered = view === 'all' ? data : view === 'overdue' ? data.filter(d => d.status === 'overdue') : data.filter(d => d.status === view);

  const handleComplete = (record: TodoItem) => {
    const updated = updateItem<TodoItem>('todos', record.id, { status: 'completed' }, defaultTodos);
    setDataState([...updated]);
    message.success('任务已完成');
  };

  const handleNavigate = (record: TodoItem) => {
    if (record.relatedType === 'lead') navigate(`/leads/detail/${record.relatedId}`);
    else if (record.relatedType === 'appointment') navigate('/appointments');
    else if (record.relatedType === 'test_drive') navigate('/test-drive');
    else if (record.relatedType === 'customer') navigate(`/customers/detail/${record.relatedId}`);
    else if (record.relatedType === 'traffic') navigate('/traffic');
  };

  const getOverdueLevel = (hours?: number) => {
    if (!hours) return null;
    if (hours >= 24) return { color: '#ff4d4f', bg: '#fff1f0', label: '严重逾期', icon: <ThunderboltOutlined /> };
    if (hours >= 8) return { color: '#ff7a45', bg: '#fff7e6', label: '较长逾期', icon: <FireOutlined /> };
    return { color: '#faad14', bg: '#fffbe6', label: '轻微逾期', icon: <WarningOutlined /> };
  };

  const columns = [
    {
      title: '任务', dataIndex: 'title', render: (text: string, record: TodoItem) => (
        <div>
          <Space>
            <span>{typeIcons[record.type]}</span>
            {record.status === 'overdue' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            <a onClick={() => setDetailOpen(record)} style={{ fontWeight: record.status === 'overdue' ? 600 : 400, color: record.status === 'overdue' ? '#ff4d4f' : undefined }}>{text}</a>
          </Space>
          {record.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.description}</div>}
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 110, render: (v: string) => <Tag>{typeLabels[v]}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 70, render: (v: string) => <Tag color={priorityColors[v]}>{priorityLabels[v]}</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 130, render: (v: string, record: TodoItem) => {
        const level = getOverdueLevel(record.overdueHours);
        return (
          <div>
            <Badge status={statusColors[v] as any} text={statusLabels[v]} />
            {record.overdueHours != null && record.overdueHours > 0 && level && (
              <div style={{ fontSize: 11, color: level.color, fontWeight: 600, marginTop: 2 }}>
                {level.icon} 逾期{record.overdueHours}小时
              </div>
            )}
            {v === 'pending' && record.overdueRule && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                <ClockCircleOutlined /> 限{record.overdueRule}h内处理
              </div>
            )}
          </div>
        );
      },
    },
    { title: '截止时间', dataIndex: 'deadline', width: 150 },
    { title: '负责人', dataIndex: 'assignee', width: 80 },
    {
      title: '操作', width: 140, render: (_: any, record: TodoItem) => (
        <Space size={4}>
          <a onClick={() => handleNavigate(record)}>处理 <RightOutlined /></a>
          {record.status !== 'completed' && <a onClick={() => handleComplete(record)} style={{ color: '#52c41a' }}>完成</a>}
          <a onClick={() => setDetailOpen(record)}>详情</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: '待办中心' }}>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="待处理" value={stats.total} valueStyle={{ color: brandColors.gold, fontSize: 28 }} prefix={<BellOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderLeft: stats.overdue > 0 ? '3px solid #ff4d4f' : undefined }}>
            <Statistic title="已逾期" value={stats.overdue} valueStyle={{ color: '#ff4d4f', fontSize: 28 }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#faad14', fontSize: 28 }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderLeft: stats.critical > 0 ? '3px solid #ff4d4f' : undefined }}>
            <Statistic title="严重逾期(>12h)" value={stats.critical} valueStyle={{ color: stats.critical > 0 ? '#ff4d4f' : '#52c41a', fontSize: 28 }} prefix={<FireOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Segmented value={view} onChange={v => setView(v as string)} options={[
          { value: 'all', label: `全部 (${data.length})` },
          { value: 'overdue', label: <span style={{ color: stats.overdue > 0 ? '#ff4d4f' : undefined, fontWeight: stats.overdue > 0 ? 600 : 400 }}>⚠️ 已逾期 ({stats.overdue})</span> },
          { value: 'pending', label: `待处理 (${stats.pending})` },
          { value: 'in_progress', label: `进行中 (${data.filter(d => d.status === 'in_progress').length})` },
          { value: 'completed', label: `已完成 (${data.filter(d => d.status === 'completed').length})` },
        ]} />
      </Card>

      <Card>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={false}
          rowClassName={record => {
            if (record.status === 'overdue' && (record.overdueHours || 0) >= 12) return 'critical-overdue-row';
            if (record.status === 'overdue') return 'overdue-row';
            return '';
          }}
        />
      </Card>

      <Drawer title="任务详情" open={!!detailOpen} onClose={() => setDetailOpen(null)} width={480}>
        {detailOpen && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="任务标题">{detailOpen.title}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag>{typeIcons[detailOpen.type]} {typeLabels[detailOpen.type]}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={priorityColors[detailOpen.priority]}>{priorityLabels[detailOpen.priority]}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={statusColors[detailOpen.status] as any} text={statusLabels[detailOpen.status]} /></Descriptions.Item>
              <Descriptions.Item label="截止时间">{detailOpen.deadline}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailOpen.assignee}</Descriptions.Item>
              <Descriptions.Item label="逾期规则">{detailOpen.overdueRule}小时内需处理</Descriptions.Item>
              {detailOpen.overdueHours && <Descriptions.Item label="逾期时长"><span style={{ color: '#ff4d4f', fontWeight: 600 }}>{detailOpen.overdueHours}小时</span></Descriptions.Item>}
              <Descriptions.Item label="描述">{detailOpen.description}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailOpen.createdAt}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button type="primary" onClick={() => { handleNavigate(detailOpen); setDetailOpen(null); }}>前往处理</Button>
                {detailOpen.status !== 'completed' && <Button onClick={() => { handleComplete(detailOpen); setDetailOpen(null); }}>标记完成</Button>}
              </Space>
            </div>
          </>
        )}
      </Drawer>

      <style>{`
        .overdue-row { background: #fff2f0 !important; }
        .overdue-row:hover > td { background: #ffece8 !important; }
        .critical-overdue-row { background: #fff1f0 !important; animation: criticalBlink 2s infinite; }
        .critical-overdue-row:hover > td { background: #ffece8 !important; }
        @keyframes criticalBlink { 0%, 70% { background: #fff1f0; } 80% { background: #ffa39e40; } 100% { background: #fff1f0; } }
      `}</style>
    </PageContainer>
  );
};

export default TodoCenter;
