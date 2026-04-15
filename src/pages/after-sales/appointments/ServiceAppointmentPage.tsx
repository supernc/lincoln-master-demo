import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, Drawer, Form, Input, Select, InputNumber, message, Descriptions, Row, Col, Card, Statistic, notification, Table, Timeline } from 'antd';
import { PlusOutlined, WechatOutlined, SyncOutlined, CalendarOutlined } from '@ant-design/icons';
import { ServiceAppointment } from '../../../types';
import { getData, addItem, updateItem, genId } from '../../../utils/mockCrud';
import { defaultServiceAppointments } from '../../../mock/data';
import { brandColors } from '../../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'default' },
  confirmed: { text: '已确认', color: 'blue' },
  in_service: { text: '服务中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const serviceTypes = ['常规保养', '机油更换', '轮胎更换', '空调检修', '全车检查', '钣金喷漆', '事故维修'];
const teaBreaks = ['美式咖啡', '拿铁', '龙井茶', '矿泉水', '不需要'];

const ServiceAppointmentPage: React.FC = () => {
  const [data, setDataState] = useState<ServiceAppointment[]>(() => getData('serviceAppointments', defaultServiceAppointments));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceAppointment | null>(null);
  const [detailOpen, setDetailOpen] = useState<ServiceAppointment | null>(null);
  const [form] = Form.useForm();

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'pending').length,
    confirmed: data.filter(d => d.status === 'confirmed').length,
    completed: data.filter(d => d.status === 'completed').length,
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const time = values.appointmentTime?.format?.('YYYY-MM-DD HH:mm') || values.appointmentTime;
      if (editing) {
        const updated = updateItem<ServiceAppointment>('serviceAppointments', editing.id, { ...values, appointmentTime: time }, defaultServiceAppointments);
        setDataState([...updated]);
        message.success('预约信息已更新');
      } else {
        const newItem: ServiceAppointment = {
          id: `SA${genId()}`, ...values, appointmentTime: time,
          status: 'pending', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          dmsSync: false, historyRecords: [],
        };
        const updated = addItem('serviceAppointments', newItem, defaultServiceAppointments);
        setDataState([...updated]);
        message.success('售后预约创建成功');
        setTimeout(() => {
          notification.success({ 
            message: 'DMS同步成功', 
            description: `预约 ${newItem.id} 信息已同步至DMS售后系统`, 
            icon: <SyncOutlined style={{ color: '#52c41a' }} />, 
            duration: 5,
            placement: 'topRight',
          });
        }, 1500);
      }
      setModalOpen(false); setEditing(null); form.resetFields();
    });
  };

  const columns = [
    { title: '预约编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '车牌号', dataIndex: 'plateNo', width: 100 },
    { title: '车型', dataIndex: 'model', width: 110 },
    { title: '服务类型', dataIndex: 'serviceType', width: 100, valueEnum: Object.fromEntries(serviceTypes.map(t => [t, { text: t }])) },
    { title: '预约时间', dataIndex: 'appointmentTime', width: 150, sorter: true },
    { title: '茶歇', dataIndex: 'teaBreak', width: 80, search: false, render: (v: string) => <Tag>{v}</Tag> },
    { title: '服务工程师', dataIndex: 'engineer', width: 100 },
    { title: '预估工时', dataIndex: 'estimatedHours', width: 80, search: false, render: (v: number) => v ? `${v}h` : '-' },
    { title: '预估费用', dataIndex: 'estimatedCost', width: 90, search: false, render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: 'DMS', dataIndex: 'dmsSync', width: 60, search: false, render: (v: boolean) => v ? <Tag color="green">已同步</Tag> : <Tag>未同步</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: ServiceAppointment) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>,
      valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    {
      title: '操作', width: 200, search: false, fixed: 'right' as const, render: (_: any, r: ServiceAppointment) => (
        <Space size={4}>
          <a onClick={() => setDetailOpen(r)}>详情</a>
          <a onClick={() => { setEditing(r); form.setFieldsValue({ ...r }); setModalOpen(true); }}>编辑</a>
          {r.status === 'pending' && <a onClick={() => { const u = updateItem<ServiceAppointment>('serviceAppointments', r.id, { status: 'confirmed' }, defaultServiceAppointments); setDataState([...u]); message.success('已确认'); }}>确认</a>}
          {r.status === 'confirmed' && <a onClick={() => { const u = updateItem<ServiceAppointment>('serviceAppointments', r.id, { status: 'in_service' }, defaultServiceAppointments); setDataState([...u]); message.success('开始服务'); }}>开始服务</a>}
          {r.status === 'in_service' && <a style={{ color: '#52c41a' }} onClick={() => { const u = updateItem<ServiceAppointment>('serviceAppointments', r.id, { status: 'completed' }, defaultServiceAppointments); setDataState([...u]); message.success('服务完成'); }}>完成</a>}
          {!['cancelled', 'completed'].includes(r.status) && <a style={{ color: '#ff4d4f' }} onClick={() => { const u = updateItem<ServiceAppointment>('serviceAppointments', r.id, { status: 'cancelled' }, defaultServiceAppointments); setDataState([...u]); message.success('已取消'); }}>取消</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="总预约" value={stats.total} valueStyle={{ color: brandColors.gold, fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待确认" value={stats.pending} valueStyle={{ color: '#faad14', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已确认" value={stats.confirmed} valueStyle={{ color: '#1890ff', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a', fontSize: 28 }} /></Card></Col>
      </Row>

      <ProTable<ServiceAppointment>
        headerTitle="售后预约管理"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1800 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新建预约</Button>,
        ]}
      />

      <Modal title={editing ? '编辑预约' : '新建售后预约'} open={modalOpen} onOk={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} width={600} okText="保存">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="plateNo" label="车牌号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="model" label="车型" rules={[{ required: true }]}>
              <Select options={['林肯冒险家', '林肯航海家', '林肯飞行家', '林肯领航员'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="serviceType" label="服务类型" rules={[{ required: true }]}>
              <Select options={serviceTypes.map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="appointmentTime" label="预约时间" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="teaBreak" label="茶歇偏好" initialValue="美式咖啡">
              <Select options={teaBreaks.map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
            <Col span={8}><Form.Item name="estimatedHours" label="预估工时(h)"><InputNumber style={{ width: '100%' }} min={0.5} step={0.5} /></Form.Item></Col>
            <Col span={8}><Form.Item name="estimatedCost" label="预估费用"><InputNumber style={{ width: '100%' }} prefix="¥" /></Form.Item></Col>
          </Row>
          <Form.Item name="engineer" label="服务工程师" rules={[{ required: true }]}>
            <Select options={['赵云', '马超', '黄忠'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={`预约详情 - ${detailOpen?.customerName}`} open={!!detailOpen} onClose={() => setDetailOpen(null)} width={560}>
        {detailOpen && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预约编号">{detailOpen.id}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{detailOpen.customerName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detailOpen.phone}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{detailOpen.plateNo}</Descriptions.Item>
              <Descriptions.Item label="车型">{detailOpen.model}</Descriptions.Item>
              <Descriptions.Item label="服务类型"><Tag>{detailOpen.serviceType}</Tag></Descriptions.Item>
              <Descriptions.Item label="预约时间">{detailOpen.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label="茶歇偏好">{detailOpen.teaBreak}</Descriptions.Item>
              <Descriptions.Item label="服务工程师">{detailOpen.engineer}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[detailOpen.status]?.color}>{statusMap[detailOpen.status]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="预估工时">{detailOpen.estimatedHours ? `${detailOpen.estimatedHours}小时` : '-'}</Descriptions.Item>
              <Descriptions.Item label="预估费用">{detailOpen.estimatedCost ? `¥${detailOpen.estimatedCost.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="DMS同步">{detailOpen.dmsSync ? <Tag color="green">已同步</Tag> : <Tag>未同步</Tag>}</Descriptions.Item>
            </Descriptions>

            {detailOpen.historyRecords && detailOpen.historyRecords.length > 0 && (
              <Card size="small" title="📋 历史维修记录" style={{ marginBottom: 16 }}>
                <Table size="small" dataSource={detailOpen.historyRecords} rowKey="date" pagination={false}
                  columns={[
                    { title: '日期', dataIndex: 'date', width: 120 },
                    { title: '类型', dataIndex: 'type', width: 100 },
                    { title: '里程', dataIndex: 'mileage', width: 100 },
                    { title: '费用', dataIndex: 'cost', width: 80, render: (v: number) => `¥${v}` },
                  ]} />
              </Card>
            )}
          </>
        )}
      </Drawer>
    </>
  );
};

export default ServiceAppointmentPage;
