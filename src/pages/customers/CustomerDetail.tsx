import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Descriptions, Tag, Tabs, Timeline, Empty, Form, Input, Select, Button, message, Row, Col, Statistic, Space, Modal, Badge } from 'antd';
import { UserOutlined, PhoneOutlined, WechatOutlined, TagOutlined, AudioOutlined, ExclamationCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Customer, Lead } from '../../types';
import { getData, addItem, genId, setData, addAutoMessage } from '../../utils/mockCrud';
import { defaultCustomers, defaultLeads, defaultTestDrives, defaultAppointments, defaultTrafficRecords } from '../../mock/data';
import { brandColors } from '../../theme';

const levelColors: Record<string, string> = { H: 'red', A: 'orange', B: 'blue', C: 'default', O: 'default' };

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const leadId = searchParams.get('leadId');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [relatedLeads, setRelatedLeads] = useState<Lead[]>([]);
  const [defeatOpen, setDefeatOpen] = useState(false);
  const [dormantOpen, setDormantOpen] = useState(false);
  const [form] = Form.useForm();
  const [defeatForm] = Form.useForm();

  useEffect(() => {
    if (isNew && leadId) {
      const leads = getData<Lead>('leads', defaultLeads);
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        form.setFieldsValue({ name: lead.customerName, phone: lead.phone, intentionModel: lead.intentionModel, source: lead.source, gender: lead.gender });
      }
    } else if (!isNew) {
      const customers = getData<Customer>('customers', defaultCustomers);
      const found = customers.find(c => c.id === id);
      setCustomer(found || null);
      if (found) {
        const leads = getData<Lead>('leads', defaultLeads);
        setRelatedLeads(leads.filter(l => found.leadIds.includes(l.id)));
      }
    }
  }, [id, leadId, isNew]);

  const handleCreate = () => {
    form.validateFields().then(values => {
      const newCustomer: Customer = {
        id: `CU${genId()}`, ...values,
        gender: values.gender || '未知', level: values.level || 'C',
        advisor: '张伟', status: 'active',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        wechatBound: false, leadIds: leadId ? [leadId] : [],
        visitCount: 0, testDriveCount: 0, lastVisit: '',
        tags: values.tags || [], digitalBadgeRecords: [],
      };
      addItem('customers', newCustomer, defaultCustomers);
      if (leadId) {
        const leads = getData<Lead>('leads', defaultLeads);
        const idx = leads.findIndex(l => l.id === leadId);
        if (idx !== -1) { leads[idx].status = 'converted'; setData('leads', leads); }
      }
      message.success('客户建档成功！');
      navigate(`/customers/detail/${newCustomer.id}`);
    });
  };

  if (isNew) {
    return (
      <PageContainer header={{ title: '客户建档', onBack: () => navigate(-1) }}>
        <Card>
          {leadId && <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f6f0e4', borderRadius: 6, borderLeft: `3px solid ${brandColors.gold}`, color: '#666' }}>
            已自动从线索 {leadId} 获取客户信息，手机号和意向车型已自动填充
          </div>}
          <Form form={form} layout="vertical" style={{ maxWidth: 700 }}>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="name" label="客户姓名" rules={[{ required: true }]}><Input prefix={<UserOutlined />} /></Form.Item></Col>
              <Col span={8}><Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
              <Col span={8}><Form.Item name="gender" label="性别"><Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} placeholder="请选择" /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="level" label="潜客级别" initialValue="C"><Select options={['H', 'A', 'B', 'C', 'O'].map(v => ({ value: v, label: `${v}级` }))} /></Form.Item></Col>
              <Col span={8}><Form.Item name="intentionModel" label="意向车型" rules={[{ required: true }]}><Select options={['林肯冒险家', '林肯航海家', '林肯飞行家', '林肯领航员'].map(v => ({ value: v, label: v }))} /></Form.Item></Col>
              <Col span={8}><Form.Item name="source" label="来源渠道"><Input disabled /></Form.Item></Col>
            </Row>
            <Form.Item name="tags" label="客户标签"><Select mode="tags" placeholder="输入标签回车添加" options={['高净值', '首次购车', '价格敏感', '家庭用车', 'SUV偏好', '分期意向', '企业主', '二次购车'].map(v => ({ value: v, label: v }))} /></Form.Item>
            <Button type="primary" onClick={handleCreate} size="large" style={{ background: brandColors.gold, borderColor: brandColors.gold }}>确认建档</Button>
          </Form>
        </Card>
      </PageContainer>
    );
  }

  if (!customer) return <PageContainer><Empty description="客户不存在" /></PageContainer>;

  const relatedTestDrives = getData('testDrives', defaultTestDrives).filter((td: any) => td.customerId === customer.id);
  const relatedAppointments = getData('appointments', defaultAppointments).filter((ap: any) => ap.customerId === customer.id);
  const relatedTraffic = getData('trafficRecords', defaultTrafficRecords).filter((tf: any) => tf.customerId === customer.id);

  return (
    <PageContainer header={{ title: `客户档案 - ${customer.name}`, onBack: () => navigate(-1),
      tags: <><Tag color={levelColors[customer.level]}>{customer.level}级客户</Tag>{customer.status === 'defeated' && <Tag color="red">已战败</Tag>}{customer.status === 'dormant' && <Tag color="default">休眠中</Tag>}</>,
      extra: [
        customer.status === 'active' && <Button key="defeat" danger icon={<ExclamationCircleOutlined />} onClick={() => setDefeatOpen(true)}>战败申请</Button>,
        customer.status === 'active' && <Button key="dormant" icon={<PauseCircleOutlined />} onClick={() => setDormantOpen(true)}>休眠申请</Button>,
      ].filter(Boolean),
    }}>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '到店次数', value: customer.visitCount, suffix: '次', color: brandColors.gold },
          { title: '试驾次数', value: customer.testDriveCount, suffix: '次', color: '#1890ff' },
          { title: '关联线索', value: customer.leadIds.length, suffix: '条', color: '#52c41a' },
          { title: '建档天数', value: Math.max(1, Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / 86400000)), suffix: '天', color: '#faad14' },
        ].map((item, i) => (
          <Col span={6} key={i}><Card size="small"><Statistic title={item.title} value={item.value} suffix={item.suffix} valueStyle={{ color: item.color }} /></Card></Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="基本信息" column={3}>
          <Descriptions.Item label="档案编号">{customer.id}</Descriptions.Item>
          <Descriptions.Item label="姓名">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{customer.gender}</Descriptions.Item>
          <Descriptions.Item label="手机号"><a href={`tel:${customer.phone}`}>{customer.phone}</a></Descriptions.Item>
          <Descriptions.Item label="意向车型">{customer.intentionModel}</Descriptions.Item>
          <Descriptions.Item label="来源">{customer.source}</Descriptions.Item>
          <Descriptions.Item label="首席顾问">{customer.advisor}</Descriptions.Item>
          <Descriptions.Item label="企微绑定">{customer.wechatBound ? <Tag icon={<WechatOutlined />} color="success">已绑定</Tag> : <Tag>未绑定</Tag>}</Descriptions.Item>
          <Descriptions.Item label="建档时间">{customer.createdAt}</Descriptions.Item>
          <Descriptions.Item label="客户标签" span={3}>
            <Space>{customer.tags?.map(t => <Tag key={t} icon={<TagOutlined />} color="gold">{t}</Tag>)}</Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs items={[
          {
            key: 'leads', label: <Badge count={relatedLeads.length} size="small" offset={[8, 0]}><span>线索记录</span></Badge>,
            children: relatedLeads.length > 0 ? (
              <Timeline items={relatedLeads.map(l => ({
                color: l.status === 'converted' ? 'green' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{l.id} - {l.source} <Tag color={l.channel === '线上' ? 'cyan' : 'purple'}>{l.channel}</Tag></div>
                    <div style={{ color: '#999', fontSize: 12, margin: '4px 0' }}>{l.createdAt} | 意向：{l.intentionModel} | 跟进{l.followUpCount}次</div>
                    {l.followRecords?.map(r => (
                      <div key={r.id} style={{ marginTop: 4, paddingLeft: 12, borderLeft: '2px solid #f0f0f0', fontSize: 13, color: '#666' }}>
                        <span style={{ color: '#999' }}>{r.time}</span> [{r.type === 'phone' ? '电话' : r.type === 'wechat' ? '企微' : r.type === 'idcc' ? '智慧号' : '其他'}] {r.content}
                        {r.aiSummary && <div style={{ marginTop: 2, padding: '4px 8px', background: '#f6f0e4', borderRadius: 4, fontSize: 12, color: '#888' }}>🤖 {r.aiSummary}</div>}
                      </div>
                    ))}
                  </div>
                ),
              }))} />
            ) : <Empty description="暂无线索记录" />,
          },
          {
            key: 'visits', label: `到店记录 (${relatedTraffic.length})`,
            children: relatedTraffic.length > 0 ? (
              <Timeline items={relatedTraffic.map((tf: any) => ({
                color: tf.isValid ? 'green' : 'red',
                children: <div><strong>{tf.arrivalTime}</strong> {tf.purpose} | 接待：{tf.advisor} | {tf.isValid ? <Tag color="green">有效客流</Tag> : <Tag color="red">无效客流</Tag>}</div>,
              }))} />
            ) : <Empty description="暂无到店记录" />,
          },
          {
            key: 'testdrives', label: `试驾记录 (${relatedTestDrives.length})`,
            children: relatedTestDrives.length > 0 ? (
              <Timeline items={relatedTestDrives.map((td: any) => ({
                color: td.status === 'completed' ? 'green' : 'blue',
                children: <div><strong>{td.model}</strong> - {td.route}<br/><span style={{ fontSize: 12, color: '#999' }}>{td.startTime || td.createdAt} | {td.advisor}</span>{td.rating && <span> | 评分：{'⭐'.repeat(td.rating.overall)}</span>}</div>,
              }))} />
            ) : <Empty description="暂无试驾记录" />,
          },
          {
            key: 'badge', label: `数字工牌 (${customer.digitalBadgeRecords?.length || 0})`,
            children: customer.digitalBadgeRecords?.length ? (
              <Timeline items={customer.digitalBadgeRecords.map(r => ({
                color: 'gold',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}><AudioOutlined style={{ color: brandColors.gold }} /> 接待录音摘要</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{r.time}</div>
                    <div style={{ marginTop: 4 }}>{r.summary}</div>
                    <Space size={4} style={{ marginTop: 4 }}>{r.tags.map(t => <Tag key={t} color="gold" style={{ fontSize: 11 }}>{t}</Tag>)}</Space>
                  </div>
                ),
              }))} />
            ) : <Empty description="暂无数字工牌记录" />,
          },
          {
            key: 'timeline', label: '完整时间线',
            children: (
              <Timeline items={[
                { color: 'green', children: <div><strong>建档</strong><br/><span style={{ color: '#999', fontSize: 12 }}>{customer.createdAt}</span><br/>客户建档，来源：{customer.source}</div> },
                ...relatedLeads.flatMap(l => l.followRecords?.map(r => ({
                  color: r.type === 'wechat' ? 'green' : r.type === 'idcc' ? 'purple' : 'blue',
                  children: <div><strong>{r.type === 'phone' ? '电话跟进' : r.type === 'wechat' ? '企微沟通' : r.type === 'idcc' ? 'iDCC外呼' : '到店跟进'}</strong><br/><span style={{ color: '#999', fontSize: 12 }}>{r.time}</span><br/>{r.content}</div>,
                })) || []),
                ...relatedTestDrives.map((td: any) => ({
                  color: 'orange',
                  children: <div><strong>试驾</strong> - {td.model}<br/><span style={{ color: '#999', fontSize: 12 }}>{td.startTime || td.createdAt}</span></div>,
                })),
              ]} />
            ),
          },
        ]} />
      </Card>

      <Modal title="战败申请" open={defeatOpen} onOk={() => {
        defeatForm.validateFields().then(values => {
          setDefeatOpen(false); defeatForm.resetFields();
          message.loading('战败申请已提交，等待销售总监审批...', 2);
          addAutoMessage(
            '战败审批申请',
            `首席顾问师${customer.advisor}提交了战败申请（${customer.name}-${values.reason}），请审核。`,
            'defeat_approval',
            customer.id,
            'customer',
          );
          const todoItem = {
            id: 'TODO_' + genId(),
            title: `战败审批-${customer.name}`,
            type: 'defeat_approval',
            priority: 'medium',
            status: 'pending',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
            assignee: '陈晨',
            relatedId: customer.id,
            relatedType: 'customer',
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            customerName: customer.name,
            description: `首席顾问师${customer.advisor}申请战败，原因：${values.reason}`,
          };
          const todos = getData('todos', []);
          todos.unshift(todoItem);
          setData('todos', todos);
          setTimeout(() => {
            const customers = getData<Customer>('customers', defaultCustomers);
            const idx = customers.findIndex(c => c.id === customer.id);
            if (idx !== -1) { customers[idx].status = 'defeated'; customers[idx].defeatReason = values.reason; setData('customers', customers); setCustomer({ ...customers[idx] }); }
            message.success('销售总监已审批通过，客户已标记为战败');
          }, 2000);
        });
      }} onCancel={() => setDefeatOpen(false)} okText="提交">
        <Form form={defeatForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="reason" label="战败原因" rules={[{ required: true }]}>
            <Select options={['选择了竞品', '价格超出预算', '购车计划取消', '无法联系', '其他'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="detail" label="详细说明"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="休眠申请" open={dormantOpen} onOk={() => {
        const customers = getData<Customer>('customers', defaultCustomers);
        const idx = customers.findIndex(c => c.id === customer.id);
        if (idx !== -1) { customers[idx].status = 'dormant'; setData('customers', customers); setCustomer({ ...customers[idx] }); }
        setDormantOpen(false);
        message.success('休眠申请已提交');
      }} onCancel={() => setDormantOpen(false)} okText="提交">
        <p>确定将客户 <strong>{customer.name}</strong> 设为休眠状态吗？休眠后可通过存量激活功能重新激活。</p>
      </Modal>
    </PageContainer>
  );
};

export default CustomerDetail;
