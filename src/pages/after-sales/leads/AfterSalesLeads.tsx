import React, { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Drawer, Descriptions, Timeline, Form, Input, Select, message, Row, Col, Card, Statistic, Divider, Badge } from 'antd';
import { PhoneOutlined, WechatOutlined, PlusOutlined, ExportOutlined, RobotOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import { AfterSalesLead, FollowRecord } from '../../../types';
import { getData, updateItem, genId, setData } from '../../../utils/mockCrud';
import { defaultAfterSalesLeads } from '../../../mock/data';
import { brandColors } from '../../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  new: { text: '新线索', color: 'blue' },
  following: { text: '跟进中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  invalid: { text: '无效', color: 'default' },
};

const reminderColors: Record<string, string> = {
  '定期保养': 'blue', '续保提醒': 'orange', '年检提醒': 'red', '召回通知': 'volcano', '关怀回访': 'green',
};

const AfterSalesLeads: React.FC = () => {
  const [data, setDataState] = useState<AfterSalesLead[]>(() => getData('afterSalesLeads', defaultAfterSalesLeads));
  const [drawerOpen, setDrawerOpen] = useState<AfterSalesLead | null>(null);
  const [followForm] = Form.useForm();
  const [followFormOpen, setFollowFormOpen] = useState(false);

  const stats = {
    total: data.length,
    new: data.filter(d => d.status === 'new').length,
    following: data.filter(d => d.status === 'following').length,
    completed: data.filter(d => d.status === 'completed').length,
  };

  const handleFollow = () => {
    if (!drawerOpen) return;
    followForm.validateFields().then(values => {
      const record: FollowRecord = {
        id: genId(), time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: values.type, content: values.content, result: values.result, operator: drawerOpen.assignee,
      };
      const leads = getData<AfterSalesLead>('afterSalesLeads', defaultAfterSalesLeads);
      const idx = leads.findIndex(l => l.id === drawerOpen.id);
      if (idx !== -1) {
        leads[idx].followRecords = [record, ...leads[idx].followRecords];
        leads[idx].status = values.result === 'success' ? 'completed' : 'following';
        leads[idx].followResult = values.result;
        setData('afterSalesLeads', leads);
        setDataState([...leads]);
        setDrawerOpen({ ...leads[idx] });
      }
      setFollowFormOpen(false);
      followForm.resetFields();
      message.success('跟进记录已保存');
    });
  };

  const columns = [
    { title: '线索编号', dataIndex: 'id', width: 110 },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '车牌号', dataIndex: 'plateNo', width: 100 },
    { title: 'VIN码', dataIndex: 'vin', width: 160, ellipsis: true, search: false },
    { title: '车型', dataIndex: 'model', width: 110 },
    { title: '提醒类型', dataIndex: 'reminderType', width: 100, render: (v: string) => <Tag color={reminderColors[v]}>{v}</Tag>,
      valueEnum: { '定期保养': { text: '定期保养' }, '续保提醒': { text: '续保提醒' }, '年检提醒': { text: '年检提醒' }, '召回通知': { text: '召回通知' }, '关怀回访': { text: '关怀回访' } } },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: AfterSalesLead) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>,
      valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '跟进人', dataIndex: 'assignee', width: 80, valueEnum: { '马超': { text: '马超' }, '黄忠': { text: '黄忠' }, '赵云': { text: '赵云' } } },
    { title: '最近进店', dataIndex: 'lastService', width: 120, search: false },
    { title: '下次服务', dataIndex: 'nextService', width: 120, search: false },
    {
      title: '操作', width: 160, search: false, fixed: 'right' as const, render: (_: any, r: AfterSalesLead) => (
        <Space size={4}>
          <a onClick={() => setDrawerOpen(r)}>详情</a>
          {r.status !== 'completed' && <a onClick={() => { setDrawerOpen(r); setFollowFormOpen(true); }}>跟进</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '总线索', value: stats.total, color: brandColors.gold },
          { title: '新线索', value: stats.new, color: '#1890ff' },
          { title: '跟进中', value: stats.following, color: '#faad14' },
          { title: '已完成', value: stats.completed, color: '#52c41a' },
        ].map((s, i) => (
          <Col span={6} key={i}><Card size="small"><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 28 }} /></Card></Col>
        ))}
      </Row>

      <ProTable<AfterSalesLead>
        headerTitle="售后线索管理"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
        toolBarRender={() => [
          <Button key="export" icon={<ExportOutlined />} onClick={() => message.success('正在导出...')}>导出</Button>,
        ]}
      />

      <Drawer title={`售后线索详情 - ${drawerOpen?.customerName}`} open={!!drawerOpen} onClose={() => { setDrawerOpen(null); setFollowFormOpen(false); }} width={640}>
        {drawerOpen && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="线索编号">{drawerOpen.id}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{drawerOpen.customerName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{drawerOpen.phone}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{drawerOpen.plateNo}</Descriptions.Item>
              <Descriptions.Item label="VIN码">{drawerOpen.vin}</Descriptions.Item>
              <Descriptions.Item label="车型">{drawerOpen.model}</Descriptions.Item>
              <Descriptions.Item label="提醒类型"><Tag color={reminderColors[drawerOpen.reminderType]}>{drawerOpen.reminderType}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[drawerOpen.status]?.color}>{statusMap[drawerOpen.status]?.text}</Tag></Descriptions.Item>
            </Descriptions>

            {drawerOpen.vehicleProfile && (
              <Card size="small" title="🚗 车辆画像" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="行驶里程">{drawerOpen.vehicleProfile.mileage}</Descriptions.Item>
                  <Descriptions.Item label="购车日期">{drawerOpen.vehicleProfile.purchaseDate}</Descriptions.Item>
                  <Descriptions.Item label="保险到期">{drawerOpen.vehicleProfile.insuranceExpiry}</Descriptions.Item>
                  <Descriptions.Item label="上次保养">{drawerOpen.vehicleProfile.lastMaintenance}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {followFormOpen && (
              <Card size="small" title="新增跟进" style={{ marginBottom: 16, borderColor: brandColors.gold }}>
                <Form form={followForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="type" label="跟进方式" rules={[{ required: true }]} initialValue="phone">
                      <Select options={[
                        { value: 'phone', label: '📞 电话' }, { value: 'idcc', label: '📱 iDCC智慧外呼' },
                        { value: 'wechat', label: '💬 企微' }, { value: 'visit', label: '🏠 其他' },
                      ]} />
                    </Form.Item></Col>
                    <Col span={12}><Form.Item name="result" label="跟进结果" rules={[{ required: true }]}>
                      <Select options={[
                        { value: 'success', label: '✅ 成功（已创建预约）' },
                        { value: 'continue', label: '🔄 继续跟进' },
                        { value: 'failed', label: '❌ 失败' },
                      ]} />
                    </Form.Item></Col>
                  </Row>
                  <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="请输入跟进内容" /></Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleFollow}>保存跟进</Button>
                    <Button onClick={() => setFollowFormOpen(false)}>取消</Button>
                    <Button icon={<FileTextOutlined />} onClick={() => message.success('已为客户创建服务预约单')}>创建预约单</Button>
                  </Space>
                </Form>
              </Card>
            )}

            <Card size="small" title={`跟进记录 (${drawerOpen.followRecords.length})`}>
              {drawerOpen.followRecords.length > 0 ? (
                <Timeline items={drawerOpen.followRecords.map(r => ({
                  color: r.result === 'success' ? 'green' : r.result === 'failed' ? 'red' : 'blue',
                  children: (
                    <div>
                      <Space><Tag>{r.type === 'phone' ? '电话' : r.type === 'idcc' ? '智慧号' : r.type === 'wechat' ? '企微' : '其他'}</Tag>
                        <span style={{ fontWeight: 500 }}>{r.operator}</span>
                        {r.result && <Tag color={r.result === 'success' ? 'green' : r.result === 'failed' ? 'red' : 'orange'}>{r.result === 'success' ? '成功' : r.result === 'failed' ? '失败' : '继续'}</Tag>}
                        <span style={{ color: '#999', fontSize: 12 }}>{r.time}</span>
                      </Space>
                      <div style={{ color: '#333', marginTop: 4 }}>{r.content}</div>
                    </div>
                  ),
                }))} />
              ) : <div style={{ textAlign: 'center', color: '#ccc', padding: 20 }}>暂无跟进记录</div>}
            </Card>

            {!followFormOpen && drawerOpen.status !== 'completed' && (
              <div style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => setFollowFormOpen(true)}>新增跟进</Button>
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  );
};

export default AfterSalesLeads;
