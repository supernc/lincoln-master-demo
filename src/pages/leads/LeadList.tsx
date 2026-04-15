import React, { useState, useMemo, useRef } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Modal, Form, Input, Select, Badge, Card, Row, Col, Statistic, Segmented, Tooltip, Popconfirm, notification } from 'antd';
import { PlusOutlined, WechatOutlined, ExportOutlined, SwapOutlined, AppstoreOutlined, BarsOutlined, BellOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Lead } from '../../types';
import { getData, addItem, updateItem, genId, setData, addLeadTodo } from '../../utils/mockCrud';
import { defaultLeads } from '../../mock/data';
import { brandColors } from '../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  new: { text: '新线索', color: 'blue' },
  following: { text: '跟进中', color: 'orange' },
  converted: { text: '已建档', color: 'green' },
  invalid: { text: '无效', color: 'default' },
};

const levelColors: Record<string, string> = { H: 'red', A: 'orange', B: 'blue', C: 'default', O: 'default' };

const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setDataState] = useState<Lead[]>(() => getData('leads', defaultLeads));
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewMode, setViewMode] = useState<string>('list');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const actionRef = useRef<ActionType>();

  const stats = useMemo(() => ({
    total: data.length,
    new: data.filter(d => d.status === 'new').length,
    following: data.filter(d => d.status === 'following').length,
    converted: data.filter(d => d.status === 'converted').length,
    invalid: data.filter(d => d.status === 'invalid').length,
  }), [data]);

  const handleCreate = () => {
    form.validateFields().then(values => {
      const newLead: Lead = {
        id: `LD${genId()}`,
        ...values,
        status: 'new',
        assignee: '',
        assigneeRole: '',
        followUpCount: 0,
        lastFollowUp: '',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        wechatBound: false,
        followRecords: [],
        channel: values.source?.includes('电话') || values.source?.includes('门店') ? '线下' : '线上',
        intentionLevel: values.intentionLevel || 'C',
        gender: values.gender || '未知',
        approvalStatus: 'none',
        feedbackStatus: 'pending',
      };
      const updated = addItem('leads', newLead, defaultLeads);
      setDataState([...updated]);
      setCreateOpen(false);
      form.resetFields();
      message.success('线索创建成功！等待分配中...');
      actionRef.current?.reload();
      notification.info({ message: '新线索提醒', description: `新线索 ${newLead.customerName}(${newLead.intentionModel}) 已创建，正在根据规则自动分配...`, icon: <BellOutlined style={{ color: brandColors.gold }} />, duration: 3, placement: 'topRight' });
      setTimeout(() => {
        newLead.assignee = '张伟';
        newLead.assigneeRole = 'DCC专员';
        newLead.status = 'following';
        const list = getData<Lead>('leads', defaultLeads);
        const idx = list.findIndex(l => l.id === newLead.id);
        if (idx !== -1) list[idx] = newLead;
        setData('leads', list);
        setDataState([...list]);
        notification.success({ message: '线索已分配', description: `线索 ${newLead.customerName} 已根据分配规则自动分配给DCC专员-张伟`, icon: <UserSwitchOutlined style={{ color: '#52c41a' }} />, duration: 4, placement: 'topRight' });
        addLeadTodo(newLead.id, newLead.customerName, '张伟', newLead.intentionModel.replace('林肯', ''));
        actionRef.current?.reload();
      }, 1500);
    });
  };

  const handleBatchAssign = () => {
    assignForm.validateFields().then(values => {
      const list = getData<Lead>('leads', defaultLeads);
      selectedKeys.forEach(key => {
        const idx = list.findIndex(l => l.id === key);
        if (idx !== -1) {
          list[idx].assignee = values.assignee;
          list[idx].assigneeRole = values.role;
          list[idx].status = list[idx].status === 'new' ? 'following' : list[idx].status;
        }
      });
      setData('leads', list);
      setDataState([...list]);
      setAssignOpen(false);
      setSelectedKeys([]);
      assignForm.resetFields();
      message.success(`已将 ${selectedKeys.length} 条线索分配给 ${values.assignee}`);
      actionRef.current?.reload();
    });
  };

  const handleExport = () => {
    const headers = ['线索编号', '客户姓名', '性别', '手机号', '来源渠道', '渠道', '意向车型', '意向级别', '状态', '跟进人', '跟进次数', '创建时间'];
    const rows = data.map(d => [d.id, d.customerName, d.gender, d.phone, d.source, d.channel, d.intentionModel, d.intentionLevel, statusMap[d.status]?.text, d.assignee, d.followUpCount, d.createdAt]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `线索数据_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出完成！');
  };

  const columns = [
    { title: '线索编号', dataIndex: 'id', width: 120, render: (_: any, record: Lead) => <a onClick={() => navigate(`/leads/detail/${record.id}`)}>{record.id}</a> },
    { title: '客户姓名', dataIndex: 'customerName', width: 90 },
    { title: '性别', dataIndex: 'gender', width: 50, search: false },
    { title: '手机号', dataIndex: 'phone', width: 120 },
    { title: '来源渠道', dataIndex: 'source', width: 100, valueEnum: { '官网留资': { text: '官网留资' }, '400电话': { text: '400电话' }, '垂媒线索': { text: '垂媒线索' }, '直播留资': { text: '直播留资' }, '门店活动': { text: '门店活动' }, '老客转介绍': { text: '老客转介绍' } } },
    { title: '渠道', dataIndex: 'channel', width: 70, valueEnum: { '线上': { text: '线上' }, '线下': { text: '线下' } }, render: (v: string) => <Tag color={v === '线上' ? 'cyan' : 'purple'}>{v}</Tag> },
    { title: '意向车型', dataIndex: 'intentionModel', width: 110 },
    { title: '意向级别', dataIndex: 'intentionLevel', width: 80, render: (_: any, r: Lead) => r.intentionLevel ? <Tag color={levelColors[r.intentionLevel]}>{r.intentionLevel}级</Tag> : '-', valueEnum: { H: { text: 'H级' }, A: { text: 'A级' }, B: { text: 'B级' }, C: { text: 'C级' }, O: { text: 'O级' } } },
    { title: '状态', dataIndex: 'status', width: 80, render: (_: any, r: Lead) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text}</Tag>, valueEnum: { new: { text: '新线索' }, following: { text: '跟进中' }, converted: { text: '已建档' }, invalid: { text: '无效' } } },
    { title: '企微', dataIndex: 'wechatBound', width: 50, search: false, render: (_: any, r: Lead) => r.wechatBound ? <WechatOutlined style={{ color: '#52c41a' }} /> : <span style={{ color: '#ccc' }}>-</span> },
    { title: '跟进人', dataIndex: 'assignee', width: 80, valueEnum: Object.fromEntries(['张伟', '李娜', '王强', '刘芳', '陈晨'].map(n => [n, { text: n }])) },
    { title: '跟进次数', dataIndex: 'followUpCount', width: 70, sorter: (a: Lead, b: Lead) => a.followUpCount - b.followUpCount, search: false },
    { title: '回传', dataIndex: 'feedbackStatus', width: 60, search: false, render: (v: string) => v === 'synced' ? <Tag color="green">已同步</Tag> : <Tag>待同步</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 150, valueType: 'dateTime' as const, sorter: true, search: false },
    {
      title: '操作', width: 200, search: false, fixed: 'right' as const, render: (_: any, record: Lead) => (
        <Space size={4}>
          <a onClick={() => navigate(`/leads/detail/${record.id}`)}>查看</a>
          <a onClick={() => navigate(`/leads/detail/${record.id}`)}>跟进</a>
          {record.status !== 'converted' && record.status !== 'invalid' && <a onClick={() => navigate(`/customers/detail/new?leadId=${record.id}`)}>建档</a>}
          {record.status === 'following' && record.approvalStatus === 'none' && (
            <Popconfirm title="确定申请标记为无效线索？" onConfirm={() => {
              const list = getData<Lead>('leads', defaultLeads);
              const idx = list.findIndex(l => l.id === record.id);
              if (idx !== -1) { list[idx].approvalStatus = 'pending'; setData('leads', list); setDataState([...list]); }
              message.success('无效线索审批已提交');
              actionRef.current?.reload();
            }}><a style={{ color: '#ff4d4f' }}>无效</a></Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const KanbanView = () => {
    const groups = [
      { key: 'new', title: '新线索', color: '#1890ff' },
      { key: 'following', title: '跟进中', color: '#faad14' },
      { key: 'converted', title: '已建档', color: '#52c41a' },
      { key: 'invalid', title: '无效', color: '#d9d9d9' },
    ];
    return (
      <Row gutter={12}>
        {groups.map(g => {
          const items = data.filter(d => d.status === g.key);
          return (
            <Col span={6} key={g.key}>
              <Card title={<Space><Badge color={g.color} />{g.title} ({items.length})</Space>} size="small" style={{ height: '65vh', overflow: 'auto' }} styles={{ body: { padding: 8 } }}>
                {items.slice(0, 15).map(item => (
                  <Card key={item.id} size="small" hoverable style={{ marginBottom: 8, borderLeft: `3px solid ${g.color}` }}
                    onClick={() => navigate(`/leads/detail/${item.id}`)}>
                    <div style={{ fontWeight: 500 }}>{item.customerName} <span style={{ fontSize: 12, color: '#999' }}>{item.id}</span></div>
                    <div style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>{item.intentionModel} · {item.source}</div>
                    <Space size={4}>
                      <Tag color={levelColors[item.intentionLevel]} style={{ fontSize: 11 }}>{item.intentionLevel}级</Tag>
                      {item.wechatBound && <WechatOutlined style={{ color: '#52c41a', fontSize: 12 }} />}
                      {item.assignee && <span style={{ fontSize: 11, color: '#999' }}>{item.assignee}</span>}
                    </Space>
                  </Card>
                ))}
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '总线索', value: stats.total, color: brandColors.gold },
          { title: '新线索', value: stats.new, color: '#1890ff' },
          { title: '跟进中', value: stats.following, color: '#faad14' },
          { title: '已建档', value: stats.converted, color: '#52c41a' },
          { title: '无效', value: stats.invalid, color: '#d9d9d9' },
        ].map((s, i) => (
          <Col span={i === 0 ? 4 : 5} key={i}>
            <Card size="small"><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 28 }} /></Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 12 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>视图模式：</span>
          <Segmented value={viewMode} onChange={v => setViewMode(v as string)} options={[
            { value: 'list', label: <Space><BarsOutlined />列表</Space> },
            { value: 'kanban', label: <Space><AppstoreOutlined />看板</Space> },
          ]} />
        </Space>
      </Card>

      {viewMode === 'kanban' ? <KanbanView /> : (
        <ProTable<Lead>
          headerTitle="线索列表"
          columns={columns as any}
          actionRef={actionRef}
          request={async (params) => {
            let filtered = [...data];
            if (params.id) filtered = filtered.filter(d => d.id.includes(params.id));
            if (params.customerName) filtered = filtered.filter(d => d.customerName.includes(params.customerName));
            if (params.phone) filtered = filtered.filter(d => d.phone.includes(params.phone));
            if (params.source) filtered = filtered.filter(d => d.source === params.source);
            if (params.channel) filtered = filtered.filter(d => d.channel === params.channel);
            if (params.intentionModel) filtered = filtered.filter(d => d.intentionModel.includes(params.intentionModel));
            if (params.intentionLevel) filtered = filtered.filter(d => d.intentionLevel === params.intentionLevel);
            if (params.status) filtered = filtered.filter(d => d.status === params.status);
            if (params.assignee) filtered = filtered.filter(d => d.assignee === params.assignee);
            return { data: filtered, success: true, total: filtered.length };
          }}
          rowKey="id"
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1600 }}
          dateFormatter="string"
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: keys => setSelectedKeys(keys as string[]) }}
          tableAlertRender={({ selectedRowKeys }) => <Space>已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 条线索</Space>}
          tableAlertOptionRender={() => (
            <Space>
              <Button size="small" type="primary" icon={<UserSwitchOutlined />} onClick={() => setAssignOpen(true)}>批量分配</Button>
              <Button size="small" onClick={() => setSelectedKeys([])}>取消选择</Button>
            </Space>
          )}
          toolBarRender={() => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建线索</Button>,
            <Tooltip key="export" title="导出Excel"><Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button></Tooltip>,
          ]}
        />
      )}

      <Modal title="创建线索" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)} width={600} okText="创建">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input placeholder="请输入" /></Form.Item></Col>
            <Col span={12}><Form.Item name="gender" label="性别"><Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} placeholder="请选择" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input placeholder="请输入手机号" /></Form.Item></Col>
            <Col span={12}><Form.Item name="source" label="来源渠道" rules={[{ required: true }]}>
              <Select options={sources.map(v => ({ value: v, label: v }))} placeholder="请选择" />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="intentionModel" label="意向车型" rules={[{ required: true }]}>
              <Select options={['林肯冒险家', '林肯航海家', '林肯飞行家', '林肯领航员'].map(v => ({ value: v, label: v }))} placeholder="请选择" />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="intentionLevel" label="意向级别" initialValue="C">
              <Select options={[{ value: 'H', label: 'H级-高意向' }, { value: 'A', label: 'A级-较高' }, { value: 'B', label: 'B级-一般' }, { value: 'C', label: 'C级-较低' }, { value: 'O', label: 'O级-观望' }]} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="批量分配线索" open={assignOpen} onOk={handleBatchAssign} onCancel={() => setAssignOpen(false)} width={400} okText="确认分配">
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6f0e4', borderRadius: 6 }}>已选择 <strong>{selectedKeys.length}</strong> 条线索</div>
          <Form.Item name="assignee" label="分配给" rules={[{ required: true }]}>
            <Select options={['张伟', '李娜', '王强', '刘芳', '陈晨'].map(v => ({ value: v, label: v }))} placeholder="选择顾问" />
          </Form.Item>
          <Form.Item name="role" label="岗位" rules={[{ required: true }]}>
            <Select options={[{ value: 'DCC专员', label: 'DCC专员' }, { value: '首席顾问师', label: '首席顾问师' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const sources = ['官网留资', '400电话', '垂媒线索', '直播留资', '门店活动', '老客转介绍'];

export default LeadList;
