import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card, Descriptions, Tag, Button, Space, Timeline, Modal, Form, Input, Select, message,
  Row, Col, Steps, Divider, Popconfirm, Badge, Tooltip, Progress, Alert,
} from 'antd';
import {
  PhoneOutlined, WechatOutlined, RobotOutlined, UserOutlined, AudioOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, LinkOutlined, ReloadOutlined,
  ExclamationCircleOutlined, FileTextOutlined, LoadingOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { Lead, FollowRecord } from '../../types';
import { getData, setData, genId, addAutoMessage } from '../../utils/mockCrud';
import { defaultLeads, defaultChatMessages } from '../../mock/data';
import WechatChat from '../../components/WechatChat';
import AIAssistant from '../../components/AIAssistant';
import { brandColors } from '../../theme';

const statusMap: Record<string, { text: string; color: string }> = {
  new: { text: '新线索', color: 'blue' },
  following: { text: '跟进中', color: 'orange' },
  converted: { text: '已建档', color: 'green' },
  invalid: { text: '无效', color: 'default' },
};

const statusStepMap: Record<string, number> = { new: 0, following: 1, converted: 2, invalid: 2 };

const aiSummaryTemplates: Record<string, string> = {
  phone: '【电话跟进分析】\n客户沟通意愿较好，通话时长正常。关键信息：\n① 客户对{model}兴趣度较高，关注点集中在价格和配置方面\n② 客户计划{time}到店体验，建议提前安排试驾车辆\n③ 竞品对比情况：客户同时在看同级别竞品，需突出林肯品牌服务优势\n\n📊 成交预测：客户购买意向中等偏上，预计成交周期2-3周\n🎯 下一步建议：发送车型对比资料，强调林肯之道服务体验差异化',
  wechat: '【企微沟通分析】\n在线沟通频率正常，客户回复较为积极。关键信息：\n① 客户通过企微咨询了{model}的优惠政策和金融方案\n② 客户对内饰用料和科技配置较为关注\n③ 建议发送VR看车链接和门店实拍视频\n\n📊 跟进质量评分：88分（互动频率高，信息传递完整）\n🎯 下一步建议：预约到店试驾，准备个性化配置方案',
  visit: '【到店跟进分析】\n客户到店体验整体满意度较高。关键观察：\n① 客户对{model}的驾驶质感和静谧性表示认可\n② 在展厅停留约45分钟，对多个颜色表现出兴趣\n③ 客户携带家属到店，家属对后排空间和安全配置较为关注\n\n📊 成交预测：热度评估A级，预计1-2周可能做出决策\n🎯 下一步建议：①跟进金融方案报价 ②安排二次试驾 ③准备交车周期说明',
  idcc_call: '【iDCC智慧号外呼分析】\n系统自动外呼成功，通话质量良好。关键信息：\n① 客户接听态度积极，表示对{model}仍保持关注\n② 客户反馈上次获取的资料已阅读，对金融方案有疑问\n③ 系统智能识别：客户语音情绪积极，购买意向评估为B+级\n\n📊 外呼效率评估：首次接通成功，通话时长3分42秒\n🎯 下一步建议：安排DCC专员人工回访，详细解答金融方案细节',
  sms: '【短信跟进分析】\n短信已成功送达，等待客户回复。\n① 已发送{model}最新优惠信息和到店邀约\n② 建议配合企微消息推送，提高触达率\n\n🎯 下一步建议：若48小时内无回复，建议电话跟进确认',
};

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [followOpen, setFollowOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [invalidOpen, setInvalidOpen] = useState(false);
  const [dialingVisible, setDialingVisible] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [wechatBindOpen, setWechatBindOpen] = useState(false);
  const [qrcodeKey, setQrcodeKey] = useState(0);
  const [form] = Form.useForm();
  const [invalidForm] = Form.useForm();

  useEffect(() => {
    const leads = getData<Lead>('leads', defaultLeads);
    const found = leads.find(l => l.id === id);
    setLead(found || null);
  }, [id]);

  const handleFollow = () => {
    form.validateFields().then(values => {
      if (!lead) return;
      const record: FollowRecord = {
        id: genId(),
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: values.type,
        content: values.content,
        operator: '张伟',
        voiceText: values.voiceText,
        qualityScore: Math.floor(Math.random() * 15) + 80,
      };
      if (aiContent) {
        record.aiSummary = aiContent;
      }
      const leads = getData<Lead>('leads', defaultLeads);
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        leads[idx].followRecords = [record, ...(leads[idx].followRecords || [])];
        leads[idx].followUpCount += 1;
        leads[idx].lastFollowUp = record.time;
        leads[idx].status = 'following';
        setData('leads', leads);
        setLead({ ...leads[idx] });
      }
      setFollowOpen(false);
      form.resetFields();
      setAiResult('');
      setAiContent('');
      message.success('跟进记录已保存');
    });
  };

  const handleAiGenerate = () => {
    const content = form.getFieldValue('content');
    const type = form.getFieldValue('type') || 'phone';
    if (!content) {
      message.warning('请先填写跟进内容');
      return;
    }
    const template = aiSummaryTemplates[type] || aiSummaryTemplates.phone;
    const generated = template
      .replace('{model}', lead?.intentionModel || '林肯冒险家')
      .replace('{time}', '本周末');
    setAiContent(generated);
    setAiResult('__generating__');
  };

  const handleDialing = () => {
    setDialingVisible(true);
    setTimeout(() => {
      message.success('iDCC智慧号外呼已接通');
    }, 3000);
  };

  const handleVoiceInput = () => {
    setVoiceRecording(true);
    message.loading('正在识别语音...', 2);
    setTimeout(() => {
      setVoiceRecording(false);
      const mockVoiceText = `客户${lead?.customerName}表示对${lead?.intentionModel}非常感兴趣，已经在网上做了对比，希望周末能到店试驾。客户比较关心优惠力度和金融分期方案。`;
      form.setFieldsValue({ content: mockVoiceText });
      message.success('语音识别完成');
    }, 2000);
  };

  const handleInvalidApply = () => {
    invalidForm.validateFields().then(values => {
      if (!lead) return;
      const leads = getData<Lead>('leads', defaultLeads);
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        leads[idx].approvalStatus = 'pending';
        leads[idx].invalidReason = values.reason;
        setData('leads', leads);
        setLead({ ...leads[idx] });
      }
      // 添加审批消息和待办
      addAutoMessage(
        '无效线索审批申请',
        `${lead.assignee}提交了无效线索审批申请（${lead.customerName}-${values.reason}），请及时审核。`,
        'approval',
        lead.id,
        'lead',
      );
      // 添加审批待办
      const todoItem = {
        id: 'TODO_' + genId(),
        title: `无效线索审批-${lead.customerName}`,
        type: 'invalid_approval',
        priority: 'medium' as const,
        status: 'pending' as const,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
        assignee: '刘芳',  // DCC经理
        relatedId: lead.id,
        relatedType: 'lead',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        customerName: lead.customerName,
        description: `DCC专员${lead.assignee}申请标记为无效线索，原因：${values.reason}`,
      };
      const todos = getData('todos', []);
      todos.unshift(todoItem);
      setData('todos', todos);
      setInvalidOpen(false);
      invalidForm.resetFields();
      message.success('无效线索审批申请已提交，等待DCC经理审批');
    });
  };

  const handleBindWechat = () => {
    if (!lead) return;
    setQrcodeKey(k => k + 1);
    setWechatBindOpen(true);
  };

  const handleBindWechatConfirm = () => {
    if (!lead) return;
    const leads = getData<Lead>('leads', defaultLeads);
    const idx = leads.findIndex(l => l.id === lead.id);
    if (idx !== -1) {
      leads[idx].wechatBound = true;
      setData('leads', leads);
      setLead({ ...leads[idx] });
    }
    setWechatBindOpen(false);
    message.success('企微好友绑定成功！');
  };

  if (!lead) return <PageContainer><div>线索不存在</div></PageContainer>;

  const s = statusMap[lead.status];

  const returnStatusTag = () => {
    if (!lead.returnStatus) return null;
    const map: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
      pending: { text: '回传中', color: 'processing', icon: <SyncOutlined spin /> },
      returned: { text: '已回传', color: 'success', icon: <CheckCircleOutlined /> },
      failed: { text: '回传失败', color: 'error', icon: <CloseCircleOutlined /> },
    };
    const info = map[lead.returnStatus];
    return info ? <Tag color={info.color} icon={info.icon}>{info.text}</Tag> : null;
  };

  const approvalStatusTag = () => {
    if (!lead.approvalStatus || lead.approvalStatus === 'none') return null;
    const map: Record<string, { text: string; color: string }> = {
      pending: { text: '审批中', color: 'processing' },
      approved: { text: '审批通过', color: 'success' },
      rejected: { text: '审批驳回', color: 'error' },
    };
    const info = map[lead.approvalStatus];
    return info ? <Tag color={info.color}>{info.text}</Tag> : null;
  };

  return (
    <>
    <PageContainer
      header={{
        title: `线索详情 - ${lead.customerName}`,
        onBack: () => navigate(-1),
        tags: (
          <Space>
            <Tag color={s.color}>{s.text}</Tag>
            {lead.intentionLevel && <Tag color={lead.intentionLevel === 'H' ? 'red' : lead.intentionLevel === 'A' ? 'orange' : 'blue'}>{lead.intentionLevel}级</Tag>}
            {returnStatusTag()}
            {approvalStatusTag()}
          </Space>
        ),
        extra: [
          <Button key="follow" type="primary" onClick={() => setFollowOpen(true)}>新增跟进</Button>,
          <Button key="idcc" icon={<ThunderboltOutlined />} onClick={handleDialing} style={{ color: '#1890ff', borderColor: '#1890ff' }}>iDCC外呼</Button>,
          <Button key="wechat" icon={<WechatOutlined />} onClick={() => setChatOpen(true)} style={{ color: '#52c41a', borderColor: '#52c41a' }}>企微沟通</Button>,
          !lead.wechatBound && <Button key="bindwx" icon={<LinkOutlined />} onClick={handleBindWechat}>绑定企微</Button>,
          lead.status !== 'converted' && lead.status !== 'invalid' && (
            <Button key="archive" onClick={() => navigate(`/customers/detail/new?leadId=${lead.id}`)}>客户建档</Button>
          ),
          lead.status === 'following' && lead.approvalStatus !== 'pending' && (
            <Button key="invalid" icon={<ExclamationCircleOutlined />} onClick={() => setInvalidOpen(true)} danger>申请无效</Button>
          ),
        ].filter(Boolean),
      }}
    >
      {/* 状态流转进度条 */}
      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={statusStepMap[lead.status]}
          status={lead.status === 'invalid' ? 'error' : 'process'}
          items={[
            { title: '新线索', description: '线索接入', icon: lead.status === 'new' ? <LoadingOutlined /> : undefined },
            { title: '跟进中', description: `已跟进${lead.followUpCount}次`, icon: lead.status === 'following' ? <SyncOutlined spin /> : undefined },
            {
              title: lead.status === 'invalid' ? '无效' : '已建档',
              description: lead.status === 'invalid' ? (lead.invalidReason || '标记无效') : '转化建档',
              icon: lead.status === 'invalid' ? <CloseCircleOutlined /> : lead.status === 'converted' ? <CheckCircleOutlined /> : undefined,
            },
          ]}
          style={{ padding: '8px 0' }}
        />
      </Card>

      <Row gutter={16}>
        <Col span={chatOpen ? 14 : 24}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={3}>
              <Descriptions.Item label="线索编号">{lead.id}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{lead.customerName}</Descriptions.Item>
              <Descriptions.Item label="性别">{lead.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{lead.phone}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{lead.source}</Descriptions.Item>
              <Descriptions.Item label="渠道类型"><Tag color={lead.channel === '线上' ? 'blue' : 'green'}>{lead.channel}</Tag></Descriptions.Item>
              <Descriptions.Item label="意向车型">{lead.intentionModel}</Descriptions.Item>
              <Descriptions.Item label="意向级别"><Tag color={lead.intentionLevel === 'H' ? 'red' : lead.intentionLevel === 'A' ? 'orange' : 'blue'}>{lead.intentionLevel}级</Tag></Descriptions.Item>
              <Descriptions.Item label="跟进人">{lead.assignee || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="跟进次数">{lead.followUpCount}次</Descriptions.Item>
              <Descriptions.Item label="创建时间">{lead.createdAt}</Descriptions.Item>
              <Descriptions.Item label="最后跟进">{lead.lastFollowUp || '-'}</Descriptions.Item>
              <Descriptions.Item label="企微绑定">
                {lead.wechatBound ? <Tag color="green"><WechatOutlined /> 已绑定</Tag> : <Tag>未绑定</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="回传状态">{returnStatusTag() || <Tag>未回传</Tag>}</Descriptions.Item>
              <Descriptions.Item label="备注" span={3}>{lead.remark}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 审批流程展示 */}
          {lead.approvalStatus && lead.approvalStatus !== 'none' && (
            <Card title="无效审批流程" style={{ marginBottom: 16 }}>
              <Steps
                size="small"
                current={lead.approvalStatus === 'pending' ? 1 : 2}
                status={lead.approvalStatus === 'rejected' ? 'error' : 'process'}
                items={[
                  { title: '提交申请', description: `申请人：${lead.assignee}` },
                  { title: 'DCC经理审批', description: lead.approvalStatus === 'pending' ? '审批中...' : '' },
                  { title: lead.approvalStatus === 'approved' ? '审批通过' : lead.approvalStatus === 'rejected' ? '审批驳回' : '完成', description: lead.invalidReason || '' },
                ]}
              />
            </Card>
          )}

          <Card title="跟进记录" style={{ marginBottom: 16 }}>
            {(lead.followRecords?.length || 0) > 0 ? (
              <Timeline
                items={lead.followRecords.map(r => ({
                  color: r.type === 'wechat' ? 'green' : r.type === 'phone' ? 'blue' : r.type === 'idcc_call' ? 'purple' : 'gray',
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Space>
                          <Tag color={r.type === 'phone' ? 'blue' : r.type === 'wechat' ? 'green' : r.type === 'visit' ? 'orange' : r.type === 'idcc_call' ? 'purple' : 'default'}>
                            {r.type === 'phone' ? '📞 电话' : r.type === 'wechat' ? '💬 企微' : r.type === 'visit' ? '🏠 到店' : r.type === 'idcc_call' ? '🤖 iDCC外呼' : '📱 短信'}
                          </Tag>
                          <span style={{ fontWeight: 500 }}>{r.operator}</span>
                          {r.qualityScore && (
                            <Tooltip title={`跟进质量评分：${r.qualityScore}分`}>
                              <Tag color={r.qualityScore >= 90 ? 'green' : r.qualityScore >= 80 ? 'blue' : 'orange'}>
                                {r.qualityScore}分
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                        <span style={{ color: '#999', fontSize: 12 }}>{r.time}</span>
                      </div>
                      <div style={{ color: '#333', lineHeight: 1.6 }}>{r.content}</div>

                      {r.voiceText && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0f5ff', borderRadius: 6, borderLeft: '3px solid #1890ff' }}>
                          <Space style={{ marginBottom: 4 }}>
                            <AudioOutlined style={{ color: '#1890ff' }} />
                            <span style={{ color: '#1890ff', fontSize: 12, fontWeight: 500 }}>语音转文字</span>
                          </Space>
                          <div style={{ fontSize: 12, color: '#555' }}>{r.voiceText}</div>
                        </div>
                      )}

                      {r.aiSummary && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6f0e4', borderRadius: 6, borderLeft: `3px solid ${brandColors.gold}` }}>
                          <Space style={{ marginBottom: 4 }}>
                            <RobotOutlined style={{ color: brandColors.gold }} />
                            <span style={{ color: brandColors.gold, fontSize: 12, fontWeight: 500 }}>AI 跟进摘要</span>
                          </Space>
                          <div style={{ fontSize: 13, color: '#555', whiteSpace: 'pre-line' }}>{r.aiSummary}</div>
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#ccc', padding: 40 }}>暂无跟进记录</div>
            )}
          </Card>
        </Col>

        {chatOpen && (
          <Col span={10}>
            <WechatChat
              customerName={lead.customerName}
              messages={defaultChatMessages}
              onClose={() => setChatOpen(false)}
              leadId={lead.id}
              onQuickArchive={() => navigate(`/customers/detail/new?leadId=${lead.id}`)}
            />
          </Col>
        )}
      </Row>

      {/* 跟进记录弹窗 */}
      <Modal title="新增跟进记录" open={followOpen} onOk={handleFollow} onCancel={() => { setFollowOpen(false); setAiResult(''); setAiContent(''); }} width={620} okText="保存" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="跟进方式" rules={[{ required: true }]} initialValue="phone">
            <Select options={[
              { value: 'phone', label: '📞 电话' },
              { value: 'wechat', label: '💬 企微' },
              { value: 'visit', label: '🏠 到店' },
              { value: 'sms', label: '📱 短信' },
              { value: 'idcc_call', label: '🤖 iDCC智慧号外呼' },
            ]} />
          </Form.Item>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请输入跟进内容..." />
          </Form.Item>
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<AudioOutlined />} onClick={handleVoiceInput} loading={voiceRecording}
              style={{ color: voiceRecording ? '#ff4d4f' : '#1890ff', borderColor: voiceRecording ? '#ff4d4f' : '#1890ff' }}>
              {voiceRecording ? '录音中...' : '语音转文字'}
            </Button>
            <Button icon={<RobotOutlined />} onClick={handleAiGenerate} style={{ color: brandColors.gold, borderColor: brandColors.gold }}>
              AI 生成跟进摘要
            </Button>
          </Space>
          {aiResult && (
            <AIAssistant
              trigger={aiResult === '__generating__'}
              content={aiContent}
              onComplete={(text) => {
                setAiContent(text);
              }}
            />
          )}
        </Form>
      </Modal>

      {/* iDCC拨号动画弹窗 */}
      <Modal
        open={dialingVisible}
        footer={<Button onClick={() => setDialingVisible(false)}>结束通话</Button>}
        onCancel={() => setDialingVisible(false)}
        width={400}
        closable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${brandColors.gold}, ${brandColors.goldDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            animation: 'pulse 1.5s ease-in-out infinite',
            boxShadow: '0 0 0 0 rgba(201,169,110,0.4)',
          }}>
            <PhoneOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>iDCC 智慧号外呼</div>
          <div style={{ color: '#666', marginBottom: 8 }}>正在呼叫 {lead.customerName}</div>
          <div style={{ color: '#999', fontSize: 13 }}>{lead.phone}</div>
          <div style={{ marginTop: 16 }}>
            <Tag color="processing" icon={<SyncOutlined spin />}>通话中...</Tag>
          </div>
        </div>
      </Modal>

      {/* 无效审批弹窗 */}
      <Modal title="申请无效线索" open={invalidOpen} onOk={handleInvalidApply} onCancel={() => setInvalidOpen(false)} okText="提交审批" destroyOnClose>
        <Alert message="提交后将发送给DCC经理审批，审批通过后线索状态变为无效" type="warning" showIcon style={{ marginBottom: 16 }} />
        <Form form={invalidForm} layout="vertical">
          <Form.Item name="reason" label="无效原因" rules={[{ required: true, message: '请选择无效原因' }]}>
            <Select options={[
              { value: '号码错误', label: '号码错误/空号' },
              { value: '非本人', label: '非本人/他人号码' },
              { value: '无购车意向', label: '无购车意向' },
              { value: '已在他处购买', label: '已在他处购买' },
              { value: '重复线索', label: '重复线索' },
              { value: '其他', label: '其他原因' },
            ]} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="description" label="补充说明">
            <Input.TextArea rows={3} placeholder="请补充说明..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 绑定企微弹窗 */}
      <Modal title="绑定企微好友" open={wechatBindOpen} onOk={handleBindWechatConfirm} onCancel={() => setWechatBindOpen(false)} okText="客户已扫码添加" cancelText="稍后绑定" destroyOnClose>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {(() => {
            const size = 21, cell = 6;
            const qrRects: string[] = [];
            const drawFinder = (ox: number, oy: number) => {
              for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
                if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
                  qrRects.push(`<rect x="${(ox+c)*cell}" y="${(oy+r)*cell}" width="${cell}" height="${cell}" fill="#333"/>`);
              }
            };
            drawFinder(0, 0); drawFinder(14, 0); drawFinder(0, 14);
            const seed = qrcodeKey * 13 + (lead?.id?.charCodeAt(0) || 0);
            for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
              if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
              if (((r * 31 + c * 17 + seed) % 3) !== 0)
                qrRects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="#333"/>`);
            }
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${size*cell}" height="${size*cell}" viewBox="0 0 ${size*cell} ${size*cell}"><rect width="100%" height="100%" fill="#fff"/>${qrRects.join('')}</svg>`;
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
            return (
              <div key={qrcodeKey} style={{ width: 160, height: 160, background: '#fff', margin: '0 auto 16px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e0e0e0', padding: 8, position: 'relative' }}>
                <img src={dataUrl} alt="企微二维码" style={{ width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', background: '#fff', padding: 4, borderRadius: 4, boxShadow: '0 0 4px rgba(0,0,0,0.1)' }}>
                  <WechatOutlined style={{ fontSize: 22, color: '#52c41a' }} />
                </div>
              </div>
            );
          })()}
          <div style={{ color: '#666', fontSize: 13 }}>请客户扫描顾问企微二维码添加好友</div>
          <Button type="link" icon={<ReloadOutlined />} onClick={() => { setQrcodeKey(k => k + 1); message.success('二维码已刷新'); }} style={{ marginTop: 8 }}>刷新二维码</Button>
        </div>
      </Modal>
    </PageContainer>
    <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.4); } 70% { box-shadow: 0 0 0 20px rgba(201,169,110,0); } 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); } }`}</style>
    </>
  );
};

export default LeadDetail;
