import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, Form, Input, Select, message, Row, Col, Card, Statistic, Badge } from 'antd';
import { PlusOutlined, QrcodeOutlined, CheckCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TrafficRecord } from '../../types';
import { getData, addItem, updateItem, genId } from '../../utils/mockCrud';
import { defaultTrafficRecords } from '../../mock/data';
import { brandColors } from '../../theme';

const TrafficList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setDataState] = useState<TrafficRecord[]>(() => getData('trafficRecords', defaultTrafficRecords));
  const [createOpen, setCreateOpen] = useState(false);
  const [qrcodeOpen, setQrcodeOpen] = useState(false);
  const [qrcodeKey, setQrcodeKey] = useState(0);
  const [form] = Form.useForm();

  const stats = {
    today: data.filter(d => d.arrivalTime?.startsWith(new Date().toISOString().slice(0, 10))).length,
    valid: data.filter(d => d.isValid).length,
    invalid: data.filter(d => !d.isValid).length,
    inStore: data.filter(d => d.arrivalTime && !d.leaveTime).length,
  };

  const handleCreate = () => {
    form.validateFields().then(values => {
      const item: TrafficRecord = {
        id: `TF${genId()}`, ...values,
        batch: `B${String(Math.floor(data.length / 3) + 1).padStart(3, '0')}`,
        isValid: true, leaveTime: '', source: 'natural',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        arrivalTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      const updated = addItem('trafficRecords', item, defaultTrafficRecords);
      setDataState([...updated]);
      setCreateOpen(false); form.resetFields();
      message.success('客流登记成功');
    });
  };

  const columns = [
    { title: '编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '批次', dataIndex: 'batch', width: 80, search: false },
    { title: '到店时间', dataIndex: 'arrivalTime', width: 150 },
    { title: '离店时间', dataIndex: 'leaveTime', width: 150, search: false, render: (v: string) => v || <Tag color="green">在店中</Tag> },
    { title: '接待顾问', dataIndex: 'advisor', width: 80 },
    { title: '来访目的', dataIndex: 'purpose', width: 100, search: false },
    { title: '来源', dataIndex: 'source', width: 90, render: (v: string) => <Tag color={v === 'natural' ? 'blue' : v === 'appointment' ? 'green' : 'purple'}>{v === 'natural' ? '自然到店' : v === 'appointment' ? '预约到店' : '数字签到'}</Tag>,
      valueEnum: { natural: { text: '自然到店' }, appointment: { text: '预约到店' }, digital_checkin: { text: '数字签到' } } },
    { title: '有效性', dataIndex: 'isValid', width: 80, render: (v: boolean) => v ? <Tag color="green">有效</Tag> : <Tag color="red">无效</Tag>,
      valueEnum: { true: { text: '有效' }, false: { text: '无效' } } },
    {
      title: '操作', width: 200, search: false, fixed: 'right' as const, render: (_: any, r: TrafficRecord) => (
        <Space size={4}>
          {!r.leaveTime && <a onClick={() => {
            const updated = updateItem<TrafficRecord>('trafficRecords', r.id, { leaveTime: new Date().toISOString().slice(0, 16).replace('T', ' ') }, defaultTrafficRecords);
            setDataState([...updated]); message.success('已登记离店时间');
          }}>登记离店</a>}
          {r.isValid && <a onClick={() => {
            const updated = updateItem<TrafficRecord>('trafficRecords', r.id, { isValid: false }, defaultTrafficRecords);
            setDataState([...updated]); message.success('已标记为无效客流');
          }} style={{ color: '#ff4d4f' }}>标记无效</a>}
          {!r.customerId && <a onClick={() => navigate(`/customers/detail/new`)} style={{ color: '#52c41a' }}>快速建档</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="今日到店" value={stats.today} valueStyle={{ color: brandColors.gold, fontSize: 28 }} suffix="组" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="在店中" value={stats.inStore} valueStyle={{ color: '#52c41a', fontSize: 28 }} suffix="组" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="有效客流" value={stats.valid} valueStyle={{ color: '#1890ff', fontSize: 28 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="无效客流" value={stats.invalid} valueStyle={{ color: '#ff4d4f', fontSize: 28 }} /></Card></Col>
      </Row>

      <ProTable<TrafficRecord>
        headerTitle="客流管理"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateOpen(true); }}>客流登记</Button>,
          <Button key="qrcode" icon={<QrcodeOutlined />} onClick={() => setQrcodeOpen(true)}>数字签到码</Button>,
        ]}
      />

      <Modal title="客流登记" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)} width={500} okText="登记">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="手机号"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="advisor" label="接待顾问" rules={[{ required: true }]}>
              <Select options={['张伟', '李娜', '王强', '刘芳', '陈晨'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="purpose" label="来访目的" rules={[{ required: true }]}>
              <Select options={['看车', '试驾', '谈价', '提车', '保养咨询', '随便看看'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="数字签到码" open={qrcodeOpen} onCancel={() => setQrcodeOpen(false)} footer={null} width={400}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {(() => {
            const sz = 21, cl = 8;
            const rects: string[] = [];
            const drawF = (ox: number, oy: number) => {
              for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
                if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
                  rects.push(`<rect x="${(ox+c)*cl}" y="${(oy+r)*cl}" width="${cl}" height="${cl}" fill="#333"/>`);
              }
            };
            drawF(0, 0); drawF(14, 0); drawF(0, 14);
            const seed = qrcodeKey * 7 + 42;
            for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) {
              if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
              if (((r * 31 + c * 17 + seed) % 3) !== 0)
                rects.push(`<rect x="${c*cl}" y="${r*cl}" width="${cl}" height="${cl}" fill="#333"/>`);
            }
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz*cl}" height="${sz*cl}" viewBox="0 0 ${sz*cl} ${sz*cl}"><rect width="100%" height="100%" fill="#fff"/>${rects.join('')}</svg>`;
            const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
            return (
              <div key={qrcodeKey} style={{ width: 200, height: 200, margin: '0 auto', background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #d9d9d9', padding: 8, position: 'relative' }}>
                <img src={url} alt="签到码" style={{ width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', background: '#fff', padding: 6, borderRadius: 4, boxShadow: '0 0 4px rgba(0,0,0,0.1)' }}>
                  <QrcodeOutlined style={{ fontSize: 28, color: brandColors.gold }} />
                </div>
              </div>
            );
          })()}
          <div style={{ marginTop: 16, color: '#666' }}>客户扫描此二维码即可完成数字签到</div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>签到后自动同步客流信息，无需手工录入</div>
          <Button type="primary" style={{ marginTop: 16, background: brandColors.gold, borderColor: brandColors.gold }} onClick={() => { setQrcodeKey(k => k + 1); message.success('签到码已刷新'); }}>刷新签到码</Button>
        </div>
      </Modal>
    </>
  );
};

export default TrafficList;
