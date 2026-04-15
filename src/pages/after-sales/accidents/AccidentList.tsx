import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Drawer, Modal, Form, Input, Select, InputNumber, message, Descriptions, Timeline, Row, Col, Card, Statistic, Steps, Upload, Divider } from 'antd';
import { PlusOutlined, CameraOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { AccidentCase, FollowRecord } from '../../../types';
import { getData, addItem, updateItem, genId, setData } from '../../../utils/mockCrud';
import { defaultAccidents } from '../../../mock/data';
import { brandColors } from '../../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  reporting: { text: '报案中', color: 'red' },
  assessing: { text: '定损中', color: 'orange' },
  repairing: { text: '维修中', color: 'blue' },
  claiming: { text: '理赔中', color: 'purple' },
  closed: { text: '已结案', color: 'green' },
};
const statusFlow = ['reporting', 'assessing', 'repairing', 'claiming', 'closed'];

const AccidentList: React.FC = () => {
  const [data, setDataState] = useState<AccidentCase[]>(() => getData('accidents', defaultAccidents));
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<AccidentCase | null>(null);
  const [followOpen, setFollowOpen] = useState(false);
  const [form] = Form.useForm();
  const [followForm] = Form.useForm();

  const stats = {
    total: data.length,
    active: data.filter(d => d.status !== 'closed').length,
    closed: data.filter(d => d.status === 'closed').length,
    totalClaim: data.reduce((sum, d) => sum + d.claimAmount, 0),
  };

  const handleCreate = () => {
    form.validateFields().then(values => {
      const item: AccidentCase = {
        id: `AC${genId()}`, ...values, status: 'reporting',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        photos: [], followRecords: [],
      };
      const updated = addItem('accidents', item, defaultAccidents);
      setDataState([...updated]);
      setModalOpen(false); form.resetFields();
      message.success('出险单创建成功');
    });
  };

  const handleStatusAdvance = (record: AccidentCase) => {
    const idx = statusFlow.indexOf(record.status);
    if (idx < statusFlow.length - 1) {
      const nextStatus = statusFlow[idx + 1] as AccidentCase['status'];
      const updated = updateItem<AccidentCase>('accidents', record.id, { status: nextStatus }, defaultAccidents);
      setDataState([...updated]);
      setDrawerOpen({ ...record, status: nextStatus });
      message.success(`状态已更新为：${statusMap[nextStatus]?.text}`);
    }
  };

  const handleFollow = () => {
    if (!drawerOpen) return;
    followForm.validateFields().then(values => {
      const record: FollowRecord = {
        id: genId(), time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: 'phone', content: values.content, operator: drawerOpen.assignee,
      };
      const accidents = getData<AccidentCase>('accidents', defaultAccidents);
      const idx = accidents.findIndex(a => a.id === drawerOpen.id);
      if (idx !== -1) {
        if (!accidents[idx].followRecords) accidents[idx].followRecords = [];
        accidents[idx].followRecords = [record, ...accidents[idx].followRecords];
        setData('accidents', accidents);
        setDataState([...accidents]);
        setDrawerOpen({ ...accidents[idx] });
      }
      setFollowOpen(false); followForm.resetFields();
      message.success('跟进记录已保存');
    });
  };

  const columns = [
    { title: '出险编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '车牌号', dataIndex: 'plateNo', width: 100 },
    { title: '车型', dataIndex: 'model', width: 110 },
    { title: '事故日期', dataIndex: 'accidentDate', width: 110 },
    { title: '保险公司', dataIndex: 'insuranceCompany', width: 100 },
    { title: '理赔金额', dataIndex: 'claimAmount', width: 100, search: false, render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{v?.toLocaleString()}</span> },
    { title: '定损金额', dataIndex: 'damageAmount', width: 100, search: false, render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '事故描述', dataIndex: 'description', width: 140, ellipsis: true, search: false },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: AccidentCase) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>,
      valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '负责人', dataIndex: 'assignee', width: 80 },
    {
      title: '操作', width: 150, search: false, fixed: 'right' as const, render: (_: any, r: AccidentCase) => (
        <Space size={4}>
          <a onClick={() => setDrawerOpen(r)}>详情</a>
          {r.status !== 'closed' && <a onClick={() => { setDrawerOpen(r); setFollowOpen(true); }}>跟进</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="本月出险" value={stats.total} valueStyle={{ color: brandColors.gold, fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="处理中" value={stats.active} valueStyle={{ color: '#faad14', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已结案" value={stats.closed} valueStyle={{ color: '#52c41a', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总理赔金额" value={stats.totalClaim} valueStyle={{ color: '#ff4d4f', fontSize: 22 }} prefix="¥" /></Card></Col>
      </Row>

      <ProTable<AccidentCase>
        headerTitle="事故出险管理"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1600 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>新建出险单</Button>,
        ]}
      />

      <Modal title="新建出险单" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)} width={600} okText="创建">
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
            <Col span={12}><Form.Item name="accidentDate" label="事故日期" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="insuranceCompany" label="保险公司" rules={[{ required: true }]}>
              <Select options={['人保', '平安', '太平洋', '中国人寿'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="claimAmount" label="预估理赔金额"><InputNumber style={{ width: '100%' }} prefix="¥" /></Form.Item></Col>
            <Col span={12}><Form.Item name="damageAmount" label="定损金额"><InputNumber style={{ width: '100%' }} prefix="¥" /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="事故描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="assignee" label="负责人" rules={[{ required: true }]}>
            <Select options={['赵云', '马超', '黄忠'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={`出险单详情 - ${drawerOpen?.customerName}`} open={!!drawerOpen} onClose={() => { setDrawerOpen(null); setFollowOpen(false); }} width={640}>
        {drawerOpen && (
          <>
            <Steps current={statusFlow.indexOf(drawerOpen.status)} size="small" style={{ marginBottom: 24 }}
              items={[{ title: '报案' }, { title: '定损' }, { title: '维修' }, { title: '理赔' }, { title: '结案' }]} />

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="出险编号">{drawerOpen.id}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{drawerOpen.customerName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{drawerOpen.phone}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{drawerOpen.plateNo}</Descriptions.Item>
              <Descriptions.Item label="车型">{drawerOpen.model}</Descriptions.Item>
              <Descriptions.Item label="事故日期">{drawerOpen.accidentDate}</Descriptions.Item>
              <Descriptions.Item label="保险公司">{drawerOpen.insuranceCompany}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[drawerOpen.status]?.color}>{statusMap[drawerOpen.status]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="理赔金额"><span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{drawerOpen.claimAmount?.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="定损金额">{drawerOpen.damageAmount ? `¥${drawerOpen.damageAmount.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="事故描述" span={2}>{drawerOpen.description}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="📷 事故照片" style={{ marginBottom: 16 }}>
              <Upload listType="picture-card" maxCount={6} beforeUpload={() => false}
                onChange={() => message.success('照片上传成功')}>
                <div><CameraOutlined style={{ fontSize: 24 }} /><div style={{ marginTop: 8, fontSize: 12 }}>上传照片</div></div>
              </Upload>
            </Card>

            {followOpen && (
              <Card size="small" title="新增跟进" style={{ marginBottom: 16, borderColor: brandColors.gold }}>
                <Form form={followForm} layout="vertical">
                  <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="请输入跟进记录" /></Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleFollow}>保存</Button>
                    <Button onClick={() => setFollowOpen(false)}>取消</Button>
                    <Button onClick={() => message.success('已为客户创建服务预约单')}>创建预约单</Button>
                  </Space>
                </Form>
              </Card>
            )}

            <Card size="small" title={`跟进记录 (${(drawerOpen.followRecords || []).length})`} style={{ marginBottom: 16 }}>
              {(drawerOpen.followRecords || []).length > 0 ? (
                <Timeline items={(drawerOpen.followRecords || []).map(r => ({
                  children: <div><span style={{ color: '#999', fontSize: 12 }}>{r.time}</span> <span style={{ fontWeight: 500 }}>{r.operator}</span><div style={{ marginTop: 4 }}>{r.content}</div></div>,
                }))} />
              ) : <div style={{ textAlign: 'center', color: '#ccc', padding: 16 }}>暂无跟进记录</div>}
            </Card>

            <Space>
              {drawerOpen.status !== 'closed' && <Button type="primary" onClick={() => handleStatusAdvance(drawerOpen)}>推进到下一阶段</Button>}
              {!followOpen && drawerOpen.status !== 'closed' && <Button onClick={() => setFollowOpen(true)}>新增跟进</Button>}
            </Space>
          </>
        )}
      </Drawer>
    </>
  );
};

export default AccidentList;
