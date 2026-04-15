import React, { useState, useMemo } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Drawer, Form, Input, Select, Upload, Rate, Card, Row, Col, Statistic, Descriptions, Steps, Divider, Timeline, InputNumber } from 'antd';
import { PlusOutlined, CameraOutlined, CarOutlined, UploadOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { TestDrive } from '../../types';
import { getData, addItem, updateItem, genId, setData, addTestDriveTodo } from '../../utils/mockCrud';
import { defaultTestDrives, testDriveModels } from '../../mock/data';
import { brandColors } from '../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待试驾', color: 'default' },
  in_progress: { text: '试驾中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const routeOptions = [
  { value: '城市道路体验', label: '🏙️ 城市道路体验', desc: '途经商圈、红绿灯路口，体验城市驾驶的舒适性和智能驾驶辅助功能' },
  { value: '高速巡航体验', label: '🛣️ 高速巡航体验', desc: '进入高速环线，体验高速巡航的动力储备和NVH静谧性' },
  { value: '综合路况体验', label: '🗺️ 综合路况体验', desc: '包含城市+高速+乡村道路，全面体验车辆各项性能' },
];

const TestDriveList: React.FC = () => {
  const [data, setDataState] = useState<TestDrive[]>(() => getData('testDrives', defaultTestDrives));
  const [drawerOpen, setDrawerOpen] = useState<TestDrive | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const stats = useMemo(() => ({
    total: data.length,
    today: data.filter(d => d.createdAt?.startsWith(new Date().toISOString().slice(0, 10))).length,
    inProgress: data.filter(d => d.status === 'in_progress').length,
    completed: data.filter(d => d.status === 'completed').length,
  }), [data]);

  const modelStats = useMemo(() => {
    const map: Record<string, number> = {};
    data.filter(d => d.status === 'completed').forEach(d => { map[d.model] = (map[d.model] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const handleCreate = () => {
    createForm.validateFields().then(values => {
      const routeInfo = routeOptions.find(r => r.value === values.route);
      const newItem: TestDrive = {
        id: `TD${genId()}`, ...values, routeDesc: routeInfo?.desc || '',
        licensePhoto: '', agreementPhoto: '', startTime: '', endTime: '',
        status: 'pending', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      const updated = addItem('testDrives', newItem, defaultTestDrives);
      setDataState([...updated]);
      addTestDriveTodo(newItem.id, values.customerName, values.advisor, values.model);
      setCreateOpen(false); createForm.resetFields();
      message.success('试驾预约创建成功');
    });
  };

  const handleStartDrive = (record: TestDrive) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated = updateItem<TestDrive>('testDrives', record.id, { status: 'in_progress', startTime: now }, defaultTestDrives);
    setDataState([...updated]);
    setDrawerOpen({ ...record, status: 'in_progress', startTime: now });
    message.success('试驾已开始，请注意安全！');
  };

  const handleEndDrive = (record: TestDrive) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    form.validateFields().then(values => {
      const updated = updateItem<TestDrive>('testDrives', record.id, {
        status: 'completed', endTime: now,
        licenseNo: values.licenseNo, licenseExpiry: values.licenseExpiry, licenseType: values.licenseType,
        licensePhoto: values.licensePhoto || '/mock/license.jpg',
        agreementPhoto: values.agreementPhoto || '/mock/agreement.jpg',
        rating: values.rating ? { driving: values.driving || 4, interior: values.interior || 4, power: values.power || 4, overall: values.overall || 4 } : undefined,
      }, defaultTestDrives);
      setDataState([...updated]);
      // 同步更新客户档案的试驾次数
      if (record.customerId) {
        const customers = getData<any>('customers', []);
        const cidx = customers.findIndex((c: any) => c.id === record.customerId);
        if (cidx !== -1) {
          customers[cidx].testDriveCount = (customers[cidx].testDriveCount || 0) + 1;
          setData('customers', customers);
        }
      }
      setDrawerOpen(null); form.resetFields();
      message.success('试驾记录已保存，已同步至客户档案');
    });
  };

  const columns = [
    { title: '试驾编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '试驾车型', dataIndex: 'model', width: 110, valueEnum: Object.fromEntries(testDriveModels.map(m => [m.model, { text: m.model }])) },
    { title: '试驾路线', dataIndex: 'route', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: TestDrive) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>, valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '顾问', dataIndex: 'advisor', width: 80 },
    { title: '驾照', dataIndex: 'licensePhoto', width: 60, search: false, render: (v: string) => v ? <Tag color="green">已上传</Tag> : <Tag>未上传</Tag> },
    { title: '协议', dataIndex: 'agreementPhoto', width: 60, search: false, render: (v: string) => v ? <Tag color="green">已上传</Tag> : <Tag>未上传</Tag> },
    { title: '试驾时间', width: 180, search: false, render: (_: any, r: TestDrive) => r.startTime ? <span>{r.startTime} {r.endTime ? `→ ${r.endTime}` : <Tag color="orange">进行中</Tag>}</span> : '-' },
    { title: '评分', width: 80, search: false, render: (_: any, r: TestDrive) => r.rating ? <Rate disabled defaultValue={r.rating.overall} style={{ fontSize: 12 }} /> : '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 150, sorter: true, search: false },
    {
      title: '操作', width: 180, search: false, fixed: 'right' as const, render: (_: any, r: TestDrive) => (
        <Space size={4}>
          <a onClick={() => { setDrawerOpen(r); form.setFieldsValue({ licenseNo: r.licenseNo, licenseExpiry: r.licenseExpiry, licenseType: r.licenseType }); }}>详情</a>
          {r.status === 'pending' && <a style={{ color: '#52c41a' }} onClick={() => handleStartDrive(r)}>开始</a>}
          {r.status === 'pending' && <a style={{ color: '#ff4d4f' }} onClick={() => {
            const updated = updateItem<TestDrive>('testDrives', r.id, { status: 'cancelled' }, defaultTestDrives);
            setDataState([...updated]); message.success('已取消');
          }}>取消</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="总试驾" value={stats.total} valueStyle={{ color: brandColors.gold, fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="今日试驾" value={stats.today} valueStyle={{ color: '#1890ff', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="进行中" value={stats.inProgress} valueStyle={{ color: '#faad14', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a', fontSize: 28 }} /></Card></Col>
      </Row>

      {modelStats.length > 0 && (
        <Card size="small" title="车型试驾排行" style={{ marginBottom: 16 }}>
          <Space size={16}>{modelStats.map(([model, count], i) => (
            <Tag key={model} color={i === 0 ? 'gold' : i === 1 ? 'default' : 'default'} style={{ padding: '4px 12px', fontSize: 13 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {model}: {count}次
            </Tag>
          ))}</Space>
        </Card>
      )}

      <ProTable<TestDrive>
        headerTitle="试乘试驾管理"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1600 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>新建试驾预约</Button>,
        ]}
      />

      <Drawer title={`试驾详情 - ${drawerOpen?.customerName}`} open={!!drawerOpen} onClose={() => { setDrawerOpen(null); form.resetFields(); }} width={600}>
        {drawerOpen && (
          <>
            <Steps current={['pending', 'in_progress', 'completed'].indexOf(drawerOpen.status)} style={{ marginBottom: 24 }}
              items={[{ title: '待试驾', icon: <ClockCircleOutlined /> }, { title: '试驾中', icon: <PlayCircleOutlined /> }, { title: '已完成', icon: <CheckCircleOutlined /> }]} />
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{drawerOpen.id}</Descriptions.Item>
              <Descriptions.Item label="客户">{drawerOpen.customerName}</Descriptions.Item>
              <Descriptions.Item label="试驾车型">{drawerOpen.model}</Descriptions.Item>
              <Descriptions.Item label="试驾路线">{drawerOpen.route}</Descriptions.Item>
              <Descriptions.Item label="路线说明" span={2}>{drawerOpen.routeDesc}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{drawerOpen.startTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{drawerOpen.endTime || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider>驾照信息 & 上传</Divider>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={8}><Form.Item name="licenseNo" label="驾照号码" rules={[{ required: drawerOpen.status !== 'pending' }]}><Input placeholder="请输入" /></Form.Item></Col>
                <Col span={8}><Form.Item name="licenseExpiry" label="有效期"><Input type="date" /></Form.Item></Col>
                <Col span={8}><Form.Item name="licenseType" label="准驾车型" initialValue="C1"><Select options={['C1', 'C2', 'B1', 'B2', 'A1', 'A2'].map(v => ({ value: v, label: v }))} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="licensePhoto" label="驾照照片">
                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}
                      onChange={() => message.success('驾照照片上传成功')}>
                      <div><CameraOutlined style={{ fontSize: 24 }} /><div style={{ marginTop: 8, fontSize: 12 }}>拍照上传</div></div>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="agreementPhoto" label="试驾协议照片">
                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}
                      onChange={() => message.success('试驾协议照片上传成功')}>
                      <div><CameraOutlined style={{ fontSize: 24 }} /><div style={{ marginTop: 8, fontSize: 12 }}>拍照上传</div></div>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {drawerOpen.status === 'in_progress' && (
                <>
                  <Divider>客户评价</Divider>
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="driving" label="驾驶体验"><Rate /></Form.Item></Col>
                    <Col span={12}><Form.Item name="interior" label="内饰感受"><Rate /></Form.Item></Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="power" label="动力表现"><Rate /></Form.Item></Col>
                    <Col span={12}><Form.Item name="overall" label="综合评分"><Rate /></Form.Item></Col>
                  </Row>
                </>
              )}

              {drawerOpen.rating && (
                <>
                  <Divider>试驾评价</Divider>
                  <Space size={24}>
                    <span>驾驶：<Rate disabled value={drawerOpen.rating.driving} style={{ fontSize: 14 }} /></span>
                    <span>内饰：<Rate disabled value={drawerOpen.rating.interior} style={{ fontSize: 14 }} /></span>
                    <span>动力：<Rate disabled value={drawerOpen.rating.power} style={{ fontSize: 14 }} /></span>
                    <span>综合：<Rate disabled value={drawerOpen.rating.overall} style={{ fontSize: 14 }} /></span>
                  </Space>
                </>
              )}
            </Form>

            <Divider />
            <Space>
              {drawerOpen.status === 'pending' && <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStartDrive(drawerOpen)}>开始试驾</Button>}
              {drawerOpen.status === 'in_progress' && <Button type="primary" icon={<PauseCircleOutlined />} onClick={() => handleEndDrive(drawerOpen)} style={{ background: '#52c41a', borderColor: '#52c41a' }}>结束试驾并保存</Button>}
            </Space>
          </>
        )}
      </Drawer>

      <Drawer title="新建试驾预约" open={createOpen} onClose={() => setCreateOpen(false)} width={500} footer={
        <Space style={{ float: 'right' }}><Button onClick={() => setCreateOpen(false)}>取消</Button><Button type="primary" onClick={handleCreate}>创建</Button></Space>
      }>
        <Form form={createForm} layout="vertical">
          <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="model" label="试驾车型" rules={[{ required: true }]}>
            <Select options={testDriveModels.map(m => ({ value: m.model, label: `${m.model} (${m.plateNo})` }))} />
          </Form.Item>
          <Form.Item name="route" label="试驾路线" rules={[{ required: true }]}>
            <Select options={routeOptions.map(r => ({ value: r.value, label: r.label }))} />
          </Form.Item>
          <Form.Item name="advisor" label="陪同顾问" rules={[{ required: true }]}>
            <Select options={['张伟', '李娜', '王强', '刘芳', '陈晨'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="customerId" label="关联客户档案"><Input placeholder="选填，输入客户档案编号" /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default TestDriveList;
