import React, { useState, useRef } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { Tag, Space, Badge, Button, Modal, Select, message, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { WechatOutlined, ExportOutlined, UserSwitchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Customer } from '../../types';
import { getData, setData } from '../../utils/mockCrud';
import { defaultCustomers } from '../../mock/data';

const levelColors: Record<string, string> = { H: 'red', A: 'orange', B: 'blue', C: 'default', O: 'default' };
const statusMap: Record<string, { text: string; status: string }> = {
  active: { text: '活跃', status: 'Success' },
  defeated: { text: '战败', status: 'Error' },
  dormant: { text: '休眠', status: 'Default' },
  delivered: { text: '已交付', status: 'Processing' },
};

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setDataState] = useState<Customer[]>(() => getData('customers', defaultCustomers));
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState('');
  const actionRef = useRef<ActionType>();
  const [activateOpen, setActivateOpen] = useState(false);

  const handleReassign = () => {
    if (!reassignTarget) { message.warning('请选择目标顾问'); return; }
    const customers = getData<Customer>('customers', defaultCustomers);
    selectedKeys.forEach(key => {
      const idx = customers.findIndex(c => c.id === key);
      if (idx !== -1) customers[idx].advisor = reassignTarget;
    });
    setData('customers', customers);
    setDataState([...customers]);
    setReassignOpen(false); setSelectedKeys([]); setReassignTarget('');
    message.success(`已将 ${selectedKeys.length} 位客户重新分配给 ${reassignTarget}`);
    actionRef.current?.reload();
  };

  const columns = [
    { title: '档案编号', dataIndex: 'id', width: 110, render: (_: any, r: Customer) => <a onClick={() => navigate(`/customers/detail/${r.id}`)}>{r.id}</a> },
    { title: '客户姓名', dataIndex: 'name', width: 90 },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '性别', dataIndex: 'gender', width: 50, search: false },
    { title: '意向车型', dataIndex: 'intentionModel', width: 110 },
    { title: '客户级别', dataIndex: 'level', width: 80, render: (v: string) => <Tag color={levelColors[v]}>{v}级</Tag>, valueEnum: { H: { text: 'H级' }, A: { text: 'A级' }, B: { text: 'B级' }, C: { text: 'C级' }, O: { text: 'O级' } } },
    { title: '来源', dataIndex: 'source', width: 100 },
    { title: '首席顾问', dataIndex: 'advisor', width: 90, valueEnum: Object.fromEntries(['张伟', '李娜', '王强', '刘芳', '陈晨'].map(n => [n, { text: n }])) },
    { title: '企微', dataIndex: 'wechatBound', width: 50, search: false, render: (v: boolean) => v ? <WechatOutlined style={{ color: '#52c41a' }} /> : '-' },
    { title: '标签', width: 140, search: false, render: (_: any, r: Customer) => <Space size={2}>{r.tags?.map(t => <Tag key={t} style={{ fontSize: 11 }}>{t}</Tag>)}</Space> },
    { title: '到店', dataIndex: 'visitCount', width: 50, sorter: (a: Customer, b: Customer) => a.visitCount - b.visitCount, search: false },
    { title: '试驾', dataIndex: 'testDriveCount', width: 50, sorter: (a: Customer, b: Customer) => a.testDriveCount - b.testDriveCount, search: false },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: Customer) => { const s = statusMap[r.status]; return <Badge status={s.status as any} text={s.text} />; },
      valueEnum: Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k, { text: v.text }])) },
    { title: '建档时间', dataIndex: 'createdAt', width: 140, valueType: 'dateTime' as const, sorter: true, search: false },
    { title: '操作', width: 100, search: false, fixed: 'right' as const, render: (_: any, r: Customer) => <a onClick={() => navigate(`/customers/detail/${r.id}`)}>查看档案</a> },
  ];

  return (
    <>
      <ProTable<Customer>
        headerTitle="客户档案列表"
        columns={columns as any}
        actionRef={actionRef}
        request={async (params) => {
          let filtered = [...data];
          if (params.id) filtered = filtered.filter(d => d.id.includes(params.id));
          if (params.name) filtered = filtered.filter(d => d.name.includes(params.name));
          if (params.phone) filtered = filtered.filter(d => d.phone.includes(params.phone));
          if (params.intentionModel) filtered = filtered.filter(d => d.intentionModel.includes(params.intentionModel));
          if (params.level) filtered = filtered.filter(d => d.level === params.level);
          if (params.source) filtered = filtered.filter(d => d.source === params.source);
          if (params.advisor) filtered = filtered.filter(d => d.advisor === params.advisor);
          if (params.status) filtered = filtered.filter(d => d.status === params.status);
          return { data: filtered, success: true, total: filtered.length };
        }}
        rowKey="id"
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1600 }}
        dateFormatter="string"
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: keys => setSelectedKeys(keys as string[]) }}
        tableAlertRender={({ selectedRowKeys }) => <Space>已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 位客户</Space>}
        tableAlertOptionRender={() => (
          <Space>
            <Button size="small" type="primary" icon={<UserSwitchOutlined />} onClick={() => setReassignOpen(true)}>批量重分配</Button>
            <Button size="small" onClick={() => setSelectedKeys([])}>取消选择</Button>
          </Space>
        )}
        toolBarRender={() => [
          <Tooltip key="export" title="导出Excel"><Button icon={<ExportOutlined />} onClick={() => { message.success('正在导出...'); setTimeout(() => message.success('导出完成'), 1500); }}>导出</Button></Tooltip>,
          <Button key="activate" icon={<ThunderboltOutlined />} onClick={() => setActivateOpen(true)}>存量激活</Button>,
        ]}
      />
      <Modal title="客户重分配" open={reassignOpen} onOk={handleReassign} onCancel={() => setReassignOpen(false)} okText="确认分配">
        <div style={{ marginBottom: 16 }}>将 <strong>{selectedKeys.length}</strong> 位客户重新分配给：</div>
        <Select value={reassignTarget} onChange={setReassignTarget} style={{ width: '100%' }}
          options={['张伟', '李娜', '王强', '刘芳', '陈晨'].map(v => ({ value: v, label: v }))} placeholder="选择目标顾问" />
      </Modal>
      <Modal title="存量客户激活" open={activateOpen} onOk={() => {
        const customers = getData<Customer>('customers', defaultCustomers);
        let count = 0;
        customers.forEach(c => {
          if (c.status === 'defeated' || c.status === 'dormant') {
            c.status = 'active';
            count++;
          }
        });
        setData('customers', customers);
        setDataState([...customers]);
        setActivateOpen(false);
        message.success(`已激活 ${count} 位战败/休眠客户`);
      }} onCancel={() => setActivateOpen(false)} okText="确认激活" okButtonProps={{ danger: false }}>
        <div style={{ padding: '16px 0' }}>
          <p>将所有 <strong>战败</strong> 和 <strong>休眠</strong> 状态的客户重新激活为活跃状态。</p>
          <p>当前战败客户：<strong>{data.filter(d => d.status === 'defeated').length}</strong> 位</p>
          <p>当前休眠客户：<strong>{data.filter(d => d.status === 'dormant').length}</strong> 位</p>
          <p style={{ color: '#faad14' }}>激活后客户将恢复为活跃状态，可继续跟进。</p>
        </div>
      </Modal>
    </>
  );
};

export default CustomerList;
