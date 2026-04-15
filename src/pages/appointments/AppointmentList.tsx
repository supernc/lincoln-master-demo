import React, { useState, useRef } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message, Tabs, Calendar, Badge, Card, Row, Col, Statistic, Popconfirm, notification, Descriptions, Steps } from 'antd';
import { PlusOutlined, CalendarOutlined, BarsOutlined, WechatOutlined, CheckCircleOutlined, UserOutlined, QrcodeOutlined } from '@ant-design/icons';
import { Appointment } from '../../types';
import { getData, addItem, updateItem, genId, setData, addAppointmentTodo } from '../../utils/mockCrud';
import { defaultAppointments } from '../../mock/data';
import { brandColors } from '../../theme';

const typeMap: Record<string, { text: string; color: string }> = {
  visit: { text: '到店看车', color: 'blue' },
  test_drive: { text: '试乘试驾', color: 'orange' },
  delivery: { text: '交车预约', color: 'green' },
  service: { text: '售后服务', color: 'purple' },
};

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'default' },
  confirmed: { text: '已确认', color: 'blue' },
  arrived: { text: '已到店', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};
const statusFlow = ['pending', 'confirmed', 'arrived', 'completed'];

const AppointmentList: React.FC = () => {
  const [data, setDataState] = useState<Appointment[]>(() => getData('appointments', defaultAppointments));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [cancelOpen, setCancelOpen] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<string>('list');
  const [form] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const actionRef = useRef<ActionType>();

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'pending').length,
    confirmed: data.filter(d => d.status === 'confirmed').length,
    today: data.filter(d => d.appointmentTime?.startsWith(new Date().toISOString().slice(0, 10))).length,
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const time = values.appointmentTime?.format?.('YYYY-MM-DD HH:mm') || values.appointmentTime;
      if (editing) {
        const updated = updateItem<Appointment>('appointments', editing.id, { ...values, appointmentTime: time, modifyReason: values.modifyReason }, defaultAppointments);
        setDataState([...updated]);
        message.success('预约信息已更新');
      } else {
        const newItem: Appointment = {
          id: `AP${genId()}`, ...values, appointmentTime: time,
          status: 'pending', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          wechatNotified: true,
        };
        const updated = addItem('appointments', newItem, defaultAppointments);
        setDataState([...updated]);
        addAppointmentTodo(newItem.id, values.customerName, values.advisor, values.type);
        message.success('预约创建成功');
        setTimeout(() => {
          notification.success({ message: '企微提醒已发送', description: `已通过企微向 ${values.customerName} 发送预约确认消息`, icon: <WechatOutlined style={{ color: '#52c41a' }} />, duration: 5, placement: 'topRight' });
        }, 800);
      }
      setModalOpen(false); setEditing(null); form.resetFields();
      actionRef.current?.reload();
    });
  };

  const handleStatusChange = (record: Appointment, newStatus: string) => {
    const updates: Partial<Appointment> = { status: newStatus as Appointment['status'] };
    if (newStatus === 'confirmed') updates.wechatNotified = true;
    const updated = updateItem<Appointment>('appointments', record.id, updates, defaultAppointments);
    setDataState([...updated]);
    message.success(`预约状态已更新为：${statusMap[newStatus]?.text}`);
    actionRef.current?.reload();
    if (newStatus === 'confirmed') {
      setTimeout(() => {
        notification.info({ message: '企微提醒已发送', description: `已向 ${record.customerName} 发送到店指引和预约确认`, icon: <WechatOutlined style={{ color: '#52c41a' }} />, duration: 5, placement: 'topRight' });
      }, 800);
    }
  };

  const handleCancel = () => {
    if (!cancelOpen) return;
    cancelForm.validateFields().then(values => {
      const updated = updateItem<Appointment>('appointments', cancelOpen.id, { status: 'cancelled', cancelReason: values.reason }, defaultAppointments);
      setDataState([...updated]);
      setCancelOpen(null); cancelForm.resetFields();
      message.success('预约已取消');
      actionRef.current?.reload();
    });
  };

  const columns = [
    { title: '预约编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '预约类型', dataIndex: 'type', width: 100, render: (_: any, r: Appointment) => <Tag color={typeMap[r.type]?.color}>{typeMap[r.type]?.text}</Tag>, valueEnum: Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '预约时间', dataIndex: 'appointmentTime', width: 150, sorter: true },
    { title: '状态', dataIndex: 'status', width: 90, render: (_: any, r: Appointment) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>, valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '提醒', dataIndex: 'reminderSetting', width: 90, search: false },
    { title: '企微通知', dataIndex: 'wechatNotified', width: 80, search: false, render: (v: boolean) => v ? <Tag color="green">已通知</Tag> : <Tag>未通知</Tag> },
    { title: '顾问', dataIndex: 'advisor', width: 80 },
    { title: '备注', dataIndex: 'remark', width: 140, search: false, ellipsis: true },
    {
      title: '操作', width: 220, search: false, fixed: 'right' as const, render: (_: any, r: Appointment) => (
        <Space size={4}>
          <a onClick={() => setDetailOpen(r)}>详情</a>
          <a onClick={() => { setEditing(r); form.setFieldsValue({ ...r }); setModalOpen(true); }}>编辑</a>
          {r.status === 'pending' && <a style={{ color: '#1890ff' }} onClick={() => handleStatusChange(r, 'confirmed')}>确认</a>}
          {r.status === 'confirmed' && <a style={{ color: '#faad14' }} onClick={() => handleStatusChange(r, 'arrived')}>签到</a>}
          {r.status === 'arrived' && <a style={{ color: '#52c41a' }} onClick={() => handleStatusChange(r, 'completed')}>完成</a>}
          {!['cancelled', 'completed'].includes(r.status) && <a style={{ color: '#ff4d4f' }} onClick={() => { setCancelOpen(r); cancelForm.resetFields(); }}>取消</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '总预约', value: stats.total, color: brandColors.gold },
          { title: '待确认', value: stats.pending, color: '#faad14' },
          { title: '已确认', value: stats.confirmed, color: '#1890ff' },
          { title: '今日预约', value: stats.today, color: '#52c41a' },
        ].map((s, i) => (
          <Col span={6} key={i}><Card size="small"><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 28 }} /></Card></Col>
        ))}
      </Row>

      <ProTable<Appointment>
        headerTitle="预约到店管理"
        columns={columns as any}
        actionRef={actionRef}
        request={async (params) => {
          let filtered = [...data];
          if (params.id) filtered = filtered.filter(d => d.id.includes(params.id));
          if (params.customerName) filtered = filtered.filter(d => d.customerName.includes(params.customerName));
          if (params.phone) filtered = filtered.filter(d => d.phone.includes(params.phone));
          if (params.type) filtered = filtered.filter(d => d.type === params.type);
          if (params.status) filtered = filtered.filter(d => d.status === params.status);
          if (params.advisor) filtered = filtered.filter(d => d.advisor?.includes(params.advisor));
          return { data: filtered, success: true, total: filtered.length };
        }}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新建预约</Button>,
        ]}
      />

      <Modal title={editing ? '编辑预约' : '新建预约'} open={modalOpen} onOk={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} width={560} okText="保存">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input placeholder="请输入" /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input placeholder="请输入" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="type" label="预约类型" rules={[{ required: true }]}>
              <Select options={Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v.text }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="appointmentTime" label="预约时间" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="advisor" label="接待顾问" rules={[{ required: true }]}>
              <Select options={['张伟', '李娜', '王强', '刘芳', '陈晨'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="reminderSetting" label="提醒设置" initialValue="提前1天">
              <Select options={['提前1天', '当天', '提前2小时', '不提醒'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
          {editing && <Form.Item name="modifyReason" label="修改原因"><Input placeholder="请填写修改原因" /></Form.Item>}
        </Form>
      </Modal>

      <Modal title="取消预约" open={!!cancelOpen} onOk={handleCancel} onCancel={() => setCancelOpen(null)} okText="确认取消" okButtonProps={{ danger: true }}>
        <Form form={cancelForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>确定取消 <strong>{cancelOpen?.customerName}</strong> 的{typeMap[cancelOpen?.type || '']?.text}预约吗？</div>
          <Form.Item name="reason" label="取消原因" rules={[{ required: true }]}>
            <Select options={['客户临时有事', '客户取消购车计划', '天气原因', '顾问调班', '其他'].map(v => ({ value: v, label: v }))} placeholder="请选择" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="预约详情" open={!!detailOpen} onCancel={() => setDetailOpen(null)} footer={null} width={600}>
        {detailOpen && (
          <>
            <Steps current={statusFlow.indexOf(detailOpen.status)} status={detailOpen.status === 'cancelled' ? 'error' : undefined} style={{ marginBottom: 24 }}
              items={[{ title: '待确认' }, { title: '已确认' }, { title: '已到店' }, { title: '已完成' }]} />
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="预约编号">{detailOpen.id}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{detailOpen.customerName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detailOpen.phone}</Descriptions.Item>
              <Descriptions.Item label="预约类型"><Tag color={typeMap[detailOpen.type]?.color}>{typeMap[detailOpen.type]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="预约时间">{detailOpen.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label="接待顾问">{detailOpen.advisor}</Descriptions.Item>
              <Descriptions.Item label="提醒设置">{detailOpen.reminderSetting}</Descriptions.Item>
              <Descriptions.Item label="企微通知">{detailOpen.wechatNotified ? '已通知' : '未通知'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailOpen.remark}</Descriptions.Item>
              {detailOpen.cancelReason && <Descriptions.Item label="取消原因" span={2}><Tag color="red">{detailOpen.cancelReason}</Tag></Descriptions.Item>}
            </Descriptions>
          </>
        )}
      </Modal>
    </>
  );
};

export default AppointmentList;
