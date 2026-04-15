import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, message, Switch, Radio, InputNumber, Tooltip, Badge, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { brandColors } from '../../theme';

interface Rule {
  id: string;
  channel: string;
  source: string;
  assignTo: string[];
  assignRole: string;
  mode: 'round_robin' | 'weighted';
  weights?: Record<string, number>;
  priority: number;
  enabled: boolean;
  description?: string;
}

const dccSpecialists = ['张伟', '李娜', '王强', '刘芳', '陈晨'];

const defaultRules: Rule[] = [
  { id: '1', channel: '线上', source: '官网留资', assignTo: ['张伟', '李娜'], assignRole: 'DCC专员', mode: 'round_robin', priority: 1, enabled: true, description: '官网留资线索均匀分配给DCC团队' },
  { id: '2', channel: '线上', source: '垂媒线索', assignTo: ['李娜', '陈晨'], assignRole: 'DCC专员', mode: 'weighted', weights: { '李娜': 60, '陈晨': 40 }, priority: 2, enabled: true, description: '垂媒线索按权重分配，李娜经验更丰富' },
  { id: '3', channel: '线上', source: '直播留资', assignTo: ['张伟'], assignRole: 'DCC专员', mode: 'round_robin', priority: 3, enabled: true, description: '直播线索指定张伟专项跟进' },
  { id: '4', channel: '线下', source: '400电话', assignTo: ['王强', '刘芳'], assignRole: 'DCC专员', mode: 'round_robin', priority: 4, enabled: true, description: '400电话来电轮询分配' },
  { id: '5', channel: '线下', source: '门店活动', assignTo: ['王强', '刘芳', '陈晨'], assignRole: '首席顾问师', mode: 'weighted', weights: { '王强': 40, '刘芳': 35, '陈晨': 25 }, priority: 5, enabled: true, description: '门店活动线索按接待能力加权分配' },
  { id: '6', channel: '线下', source: '老客转介绍', assignTo: ['陈晨'], assignRole: '首席顾问师', mode: 'round_robin', priority: 6, enabled: false, description: '转介绍线索暂停自动分配' },
];

const LeadAssignRules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [selectedMode, setSelectedMode] = useState<'round_robin' | 'weighted'>('round_robin');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(values => {
      const weights: Record<string, number> = {};
      if (values.mode === 'weighted' && values.assignTo) {
        values.assignTo.forEach((name: string, idx: number) => {
          weights[name] = values[`weight_${idx}`] || Math.floor(100 / values.assignTo.length);
        });
      }

      const newRule: Rule = {
        id: editingRule?.id || Date.now().toString(),
        channel: values.channel,
        source: values.source,
        assignTo: values.assignTo,
        assignRole: values.assignRole,
        mode: values.mode,
        weights: values.mode === 'weighted' ? weights : undefined,
        priority: editingRule?.priority || rules.length + 1,
        enabled: editingRule?.enabled ?? true,
        description: values.description,
      };

      if (editingRule) {
        setRules(rules.map(r => r.id === editingRule.id ? newRule : r));
        message.success('规则更新成功');
      } else {
        setRules([...rules, newRule]);
        message.success('规则创建成功');
      }
      setModalOpen(false);
      setEditingRule(null);
      form.resetFields();
      setSelectedMode('round_robin');
      setSelectedAssignees([]);
    });
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newRules = [...rules];
    [newRules[idx - 1], newRules[idx]] = [newRules[idx], newRules[idx - 1]];
    newRules.forEach((r, i) => r.priority = i + 1);
    setRules(newRules);
    message.success('优先级已调整');
  };

  const handleMoveDown = (idx: number) => {
    if (idx === rules.length - 1) return;
    const newRules = [...rules];
    [newRules[idx], newRules[idx + 1]] = [newRules[idx + 1], newRules[idx]];
    newRules.forEach((r, i) => r.priority = i + 1);
    setRules(newRules);
    message.success('优先级已调整');
  };

  const openEdit = (record: Rule) => {
    setEditingRule(record);
    setSelectedMode(record.mode);
    setSelectedAssignees(record.assignTo);
    form.setFieldsValue({
      ...record,
      assignTo: record.assignTo,
    });
    if (record.mode === 'weighted' && record.weights) {
      record.assignTo.forEach((name, idx) => {
        form.setFieldValue(`weight_${idx}`, record.weights?.[name] || 0);
      });
    }
    setModalOpen(true);
  };

  const columns = [
    {
      title: '优先级', dataIndex: 'priority', width: 80, align: 'center' as const,
      render: (v: number) => <Badge count={v} style={{ backgroundColor: v <= 2 ? brandColors.gold : '#999' }} />,
    },
    {
      title: '渠道类型', dataIndex: 'channel', width: 90,
      render: (v: string) => <Tag color={v === '线上' ? 'blue' : 'green'}>{v}</Tag>,
    },
    { title: '来源渠道', dataIndex: 'source', width: 110 },
    {
      title: '分配模式', dataIndex: 'mode', width: 100,
      render: (v: string) => (
        <Tag color={v === 'round_robin' ? 'cyan' : 'purple'} icon={<SwapOutlined />}>
          {v === 'round_robin' ? '轮询' : '权重'}
        </Tag>
      ),
    },
    {
      title: '分配对象', dataIndex: 'assignTo', width: 200,
      render: (assignees: string[], record: Rule) => (
        <Space wrap>
          {assignees.map(name => (
            <Tag key={name} color="default">
              {name}
              {record.mode === 'weighted' && record.weights?.[name] ? ` (${record.weights[name]}%)` : ''}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: '岗位', dataIndex: 'assignRole', width: 100 },
    { title: '说明', dataIndex: 'description', width: 200, ellipsis: true },
    {
      title: '状态', dataIndex: 'enabled', width: 80,
      render: (v: boolean, record: Rule) => (
        <Switch checked={v} onChange={checked => {
          setRules(rules.map(r => r.id === record.id ? { ...r, enabled: checked } : r));
          message.success(checked ? '规则已启用' : '规则已禁用');
        }} size="small" />
      ),
    },
    {
      title: '操作', width: 200,
      render: (_: any, record: Rule, idx: number) => (
        <Space size="small">
          <Tooltip title="上移优先级">
            <Button type="link" size="small" icon={<ArrowUpOutlined />} onClick={() => handleMoveUp(idx)} disabled={idx === 0} />
          </Tooltip>
          <Tooltip title="下移优先级">
            <Button type="link" size="small" icon={<ArrowDownOutlined />} onClick={() => handleMoveDown(idx)} disabled={idx === rules.length - 1} />
          </Tooltip>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除此规则？" onConfirm={() => {
            const newRules = rules.filter(r => r.id !== record.id);
            newRules.forEach((r, i) => r.priority = i + 1);
            setRules(newRules);
            message.success('已删除');
          }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: '线索分配规则' }}>
      <Card
        extra={
          <Space>
            <Tooltip title="规则按优先级从高到低匹配，第一条匹配的规则生效">
              <Button type="text" icon={<InfoCircleOutlined />}>规则说明</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingRule(null);
              setSelectedMode('round_robin');
              setSelectedAssignees([]);
              form.resetFields();
              setModalOpen(true);
            }}>
              新增规则
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f6f0e4', borderRadius: 6, borderLeft: `3px solid ${brandColors.gold}`, fontSize: 13, color: '#666' }}>
          规则匹配顺序：按优先级从高（1）到低依次匹配，第一条匹配的规则生效。支持轮询和权重两种分配模式。
        </div>
        <Table dataSource={rules} columns={columns} rowKey="id" pagination={false} size="middle" />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新增规则'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditingRule(null); form.resetFields(); setSelectedMode('round_robin'); setSelectedAssignees([]); }}
        okText="保存"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="channel" label="渠道类型" rules={[{ required: true }]}>
            <Select options={[{ value: '线上', label: '线上' }, { value: '线下', label: '线下' }]} />
          </Form.Item>
          <Form.Item name="source" label="来源渠道" rules={[{ required: true }]}>
            <Select options={['官网留资', '400电话', '垂媒线索', '直播留资', '门店活动', '老客转介绍'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="mode" label="分配模式" rules={[{ required: true }]} initialValue="round_robin">
            <Radio.Group onChange={e => setSelectedMode(e.target.value)}>
              <Radio.Button value="round_robin">
                <SwapOutlined /> 轮询分配
              </Radio.Button>
              <Radio.Button value="weighted">
                <SwapOutlined /> 权重分配
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="assignTo" label="分配对象（DCC专员）" rules={[{ required: true, message: '请选择至少一个分配对象' }]}>
            <Select
              mode="multiple"
              placeholder="请选择DCC专员"
              options={dccSpecialists.map(v => ({ value: v, label: v }))}
              onChange={(vals: string[]) => setSelectedAssignees(vals)}
            />
          </Form.Item>

          {selectedMode === 'weighted' && selectedAssignees.length > 0 && (
            <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>权重配置（总和应为100%）</div>
              {selectedAssignees.map((name, idx) => (
                <Form.Item key={name} name={`weight_${idx}`} label={name} style={{ marginBottom: 8 }} initialValue={Math.floor(100 / selectedAssignees.length)}>
                  <InputNumber min={0} max={100} addonAfter="%" style={{ width: 120 }} />
                </Form.Item>
              ))}
            </div>
          )}

          <Form.Item name="assignRole" label="岗位" rules={[{ required: true }]}>
            <Select options={[{ value: 'DCC专员', label: 'DCC专员' }, { value: '首席顾问师', label: '首席顾问师' }]} />
          </Form.Item>
          <Form.Item name="description" label="规则说明">
            <Input.TextArea rows={2} placeholder="填写规则说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default LeadAssignRules;
