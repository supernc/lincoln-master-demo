import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Tag, Space, Button, Drawer, Descriptions, Card, Row, Col, Statistic, Tabs,
  Timeline, Typography, Divider, Modal, Form, Select, message, Badge, Tooltip,
} from 'antd';
import {
  UserOutlined, CarOutlined, HistoryOutlined, StarFilled, WechatOutlined,
  SwapOutlined, TeamOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { AfterSalesCustomer } from '../../../types';
import { getData, updateItem } from '../../../utils/mockCrud';
import { defaultAfterSalesCustomers } from '../../../mock/data';
import { brandColors } from '../../../theme';

const { Text } = Typography;

const loyaltyColors: Record<string, string> = {
  platinum: '#e5e4e2', gold: '#c9a96e', silver: '#c0c0c0', bronze: '#cd7f32',
};
const loyaltyLabels: Record<string, string> = {
  platinum: '白金会员', gold: '金卡会员', silver: '银卡会员', bronze: '铜卡会员',
};

const AfterSalesCustomers: React.FC = () => {
  const [data, setData] = useState<AfterSalesCustomer[]>(() => getData('afterSalesCustomers', defaultAfterSalesCustomers));
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<AfterSalesCustomer | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignForm] = Form.useForm();

  const openDetail = (r: AfterSalesCustomer) => { setCurrent(r); setDetailOpen(true); };

  const handleReassign = () => {
    if (!current) return;
    reassignForm.validateFields().then(values => {
      const updated = updateItem<AfterSalesCustomer>('afterSalesCustomers', current.id, { advisor: values.advisor }, defaultAfterSalesCustomers);
      setData([...updated]);
      setCurrent({ ...current, advisor: values.advisor });
      setReassignOpen(false);
      message.success(`客户已重新分配给${values.advisor}`);
    });
  };

  const columns: ProColumns<AfterSalesCustomer>[] = [
    { title: '客户编号', dataIndex: 'id', width: 120 },
    { title: '客户姓名', dataIndex: 'name', width: 100, render: (_, r) => (
      <Space>
        <span>{r.name}</span>
        {r.wechatBound && <Tooltip title="已绑定企微"><WechatOutlined style={{ color: '#07c160' }} /></Tooltip>}
      </Space>
    )},
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '性别', dataIndex: 'gender', width: 60, search: false },
    { title: '车牌号', dataIndex: ['vehicleInfo', 'plateNo'], width: 110 },
    { title: '车型', dataIndex: ['vehicleInfo', 'model'], width: 120, valueEnum: {
      '林肯冒险家': { text: '林肯冒险家' }, '林肯航海家': { text: '林肯航海家' },
      '林肯飞行家': { text: '林肯飞行家' }, '林肯领航员': { text: '林肯领航员' },
    }},
    { title: '会员等级', dataIndex: ['vehicleProfile', 'loyaltyLevel'], width: 100, search: false, render: (_, r) => (
      <Tag color={loyaltyColors[r.vehicleProfile.loyaltyLevel]}><StarFilled /> {loyaltyLabels[r.vehicleProfile.loyaltyLevel]}</Tag>
    )},
    { title: '里程(km)', width: 100, search: false, render: (_, r) => r.vehicleInfo.mileage?.toLocaleString() },
    { title: '累计消费', width: 100, search: false, render: (_, r) => <Text style={{ color: brandColors.gold }}>¥{r.vehicleProfile.totalSpent?.toLocaleString()}</Text> },
    { title: '保养次数', width: 80, search: false, render: (_, r) => r.vehicleProfile.totalMaintenance },
    { title: '服务顾问', dataIndex: 'advisor', width: 90, valueEnum: {
      '赵云': { text: '赵云' }, '马超': { text: '马超' }, '黄忠': { text: '黄忠' },
    }},
    { title: '操作', width: 150, search: false, fixed: 'right', render: (_, r) => (
      <Space>
        <a onClick={() => openDetail(r)}>详情</a>
        <a onClick={() => { setCurrent(r); reassignForm.setFieldsValue({ advisor: r.advisor }); setReassignOpen(true); }}
          style={{ color: brandColors.gold }}>重分配</a>
      </Space>
    )},
  ];

  return (
    <>
      <ProTable<AfterSalesCustomer>
        headerTitle="售后客户档案"
        columns={columns}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1400 }}
      />

      <Drawer title={<Space>客户档案详情 {current && <Tag color={loyaltyColors[current.vehicleProfile.loyaltyLevel]}>{loyaltyLabels[current.vehicleProfile.loyaltyLevel]}</Tag>}</Space>}
        width={720} open={detailOpen} onClose={() => setDetailOpen(false)}
        extra={current && (
          <Button icon={<SwapOutlined />} onClick={() => { reassignForm.setFieldsValue({ advisor: current.advisor }); setReassignOpen(true); }}
            style={{ borderColor: brandColors.gold, color: brandColors.gold }}>重分配</Button>
        )}
      >
        {current && (
          <Tabs items={[
            { key: 'info', label: <span><UserOutlined /> 基本信息</span>, children: (
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="客户编号">{current.id}</Descriptions.Item>
                <Descriptions.Item label="客户姓名">{current.name}</Descriptions.Item>
                <Descriptions.Item label="手机号">{current.phone}</Descriptions.Item>
                <Descriptions.Item label="性别">{current.gender}</Descriptions.Item>
                <Descriptions.Item label="服务顾问">{current.advisor}</Descriptions.Item>
                <Descriptions.Item label="企微绑定">{current.wechatBound ? <Tag color="green">已绑定</Tag> : <Tag>未绑定</Tag>}</Descriptions.Item>
                <Descriptions.Item label="建档日期" span={2}>{current.createdAt}</Descriptions.Item>
              </Descriptions>
            )},
            { key: 'vehicle', label: <span><CarOutlined /> 车辆信息</span>, children: (
              <>
                <Descriptions column={2} bordered size="small" title="车辆基本信息" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="车牌号">{current.vehicleInfo.plateNo}</Descriptions.Item>
                  <Descriptions.Item label="VIN码">{current.vehicleInfo.vin}</Descriptions.Item>
                  <Descriptions.Item label="车型">{current.vehicleInfo.model}</Descriptions.Item>
                  <Descriptions.Item label="颜色">{current.vehicleInfo.color}</Descriptions.Item>
                  <Descriptions.Item label="购车日期">{current.vehicleInfo.purchaseDate}</Descriptions.Item>
                  <Descriptions.Item label="当前里程">{current.vehicleInfo.mileage?.toLocaleString()} km</Descriptions.Item>
                  <Descriptions.Item label="保险到期">{current.vehicleInfo.insuranceExpiry}</Descriptions.Item>
                  <Descriptions.Item label="年检到期">{current.vehicleInfo.annualInspectionExpiry}</Descriptions.Item>
                  <Descriptions.Item label="发动机号">{current.vehicleInfo.engineNo}</Descriptions.Item>
                  <Descriptions.Item label="上次保养里程">{current.vehicleInfo.lastMaintenanceMileage?.toLocaleString()} km</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left">车辆画像</Divider>
                <Card size="small" style={{ background: '#fafaf8' }}>
                  <Row gutter={[16, 12]}>
                    <Col span={6}><Statistic title="保养次数" value={current.vehicleProfile.totalMaintenance} suffix="次" valueStyle={{ fontSize: 18 }} /></Col>
                    <Col span={6}><Statistic title="累计消费" value={current.vehicleProfile.totalSpent} prefix="¥" valueStyle={{ fontSize: 18, color: brandColors.gold }} /></Col>
                    <Col span={6}><Statistic title="进店间隔" value={current.vehicleProfile.avgVisitInterval} suffix="天" valueStyle={{ fontSize: 18 }} /></Col>
                    <Col span={6}>
                      <div style={{ marginBottom: 4, color: '#999', fontSize: 12 }}>会员等级</div>
                      <Tag color={loyaltyColors[current.vehicleProfile.loyaltyLevel]} style={{ fontSize: 14, padding: '2px 12px' }}>
                        <StarFilled /> {loyaltyLabels[current.vehicleProfile.loyaltyLevel]}
                      </Tag>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Row gutter={16}>
                    <Col span={12}><Text type="secondary">偏好工程师：</Text><Text strong>{current.vehicleProfile.preferredEngineer}</Text></Col>
                    <Col span={12}><Text type="secondary">常做项目：</Text>{current.vehicleProfile.commonServices.map(s => <Tag key={s}>{s}</Tag>)}</Col>
                  </Row>
                </Card>
              </>
            )},
            { key: 'history', label: <span><HistoryOutlined /> 维修记录</span>, children: (
              <>
                {current.serviceHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无维修记录</div>
                ) : (
                  <Timeline style={{ marginTop: 16 }}>
                    {current.serviceHistory.map(h => (
                      <Timeline.Item key={h.id} color="blue">
                        <Card size="small" style={{ marginBottom: 4 }}>
                          <Row justify="space-between" align="middle">
                            <Col><Text strong>{h.serviceType}</Text></Col>
                            <Col><Text type="secondary">{h.date}</Text></Col>
                          </Row>
                          <Row gutter={16} style={{ marginTop: 8 }}>
                            <Col span={8}><Text type="secondary">工程师：</Text>{h.engineer}</Col>
                            <Col span={8}><Text type="secondary">里程：</Text>{h.mileage?.toLocaleString()}km</Col>
                            <Col span={8}><Text type="secondary">费用：</Text><Text style={{ color: brandColors.gold }}>¥{h.cost?.toLocaleString()}</Text></Col>
                          </Row>
                          <div style={{ marginTop: 4 }}><Text type="secondary">项目：</Text>{Array.isArray(h.items) ? h.items.map(item => <Tag key={item}>{item}</Tag>) : <Tag>{h.items}</Tag>}</div>
                          {h.remark && <div style={{ marginTop: 4 }}><Text type="secondary">备注：{h.remark}</Text></div>}
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </>
            )},
            { key: 'visits', label: <span><EnvironmentOutlined /> 进店记录</span>, children: (
              <>
                {current.visitRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无进店记录</div>
                ) : (
                  <Timeline style={{ marginTop: 16 }}>
                    {current.visitRecords.map((v, idx) => (
                      <Timeline.Item key={idx} color={idx === 0 ? 'green' : 'blue'}>
                        <Row justify="space-between">
                          <Col><Tag>{v.type}</Tag> {v.remark}</Col>
                          <Col><Text type="secondary">{v.date}</Text></Col>
                        </Row>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </>
            )},
          ]} />
        )}
      </Drawer>

      <Modal title="客户重分配" open={reassignOpen} onOk={handleReassign} onCancel={() => setReassignOpen(false)} okText="确认分配"
        okButtonProps={{ style: { background: brandColors.gold, borderColor: brandColors.gold } }}>
        <Form form={reassignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="当前客户">{current?.name} ({current?.vehicleInfo.plateNo})</Form.Item>
          <Form.Item name="advisor" label="分配给" rules={[{ required: true }]}>
            <Select options={['赵云', '马超', '黄忠'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AfterSalesCustomers;
