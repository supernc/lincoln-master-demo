import { Lead, Customer, Appointment, TestDrive, TodoItem, Message, AfterSalesLead, ServiceAppointment, AccidentCase, ChatMessage, TrafficRecord, AfterSalesCustomer, VehicleInfo } from '../types';

const now = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return fmt(d); };
const hoursAgo = (n: number) => { const d = new Date(now); d.setHours(d.getHours() - n); return fmt(d); };
const minsAgo = (n: number) => { const d = new Date(now); d.setMinutes(d.getMinutes() - n); return fmt(d); };
const daysLater = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return fmt(d); };
const hoursLater = (n: number) => { const d = new Date(now); d.setHours(d.getHours() + n); return fmt(d); };

const advisors = ['张伟', '李娜', '王强', '刘芳', '陈晨'];
const models = ['林肯冒险家', '林肯航海家', '林肯飞行家', '林肯领航员'];
const sources = ['官网留资', '400电话', '垂媒线索', '直播留资', '门店活动', '老客转介绍'];
const colors = ['星辰黑', '白金色', '无烟煤灰', '至臻蓝', '黎明银'];

export const defaultLeads: Lead[] = Array.from({ length: 30 }, (_, i) => ({
  id: `LD${String(i + 1).padStart(5, '0')}`,
  customerName: ['赵先生', '钱女士', '孙先生', '李女士', '周先生', '吴女士', '郑先生', '王女士', '冯先生', '陈女士', '褚先生', '卫女士', '蒋先生', '沈女士', '韩先生', '杨女士', '朱先生', '秦女士', '尤先生', '许女士', '何先生', '吕女士', '施先生', '张女士', '孔先生', '曹女士', '严先生', '华女士', '金先生', '魏女士'][i],
  gender: i % 2 === 0 ? '男' : '女',
  phone: `138${String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8)}`,
  source: sources[i % sources.length],
  channel: ['线上', '线下'][i % 2],
  intentionModel: models[i % models.length],
  intentionLevel: (['H', 'A', 'B', 'C', 'O'] as const)[i % 5],
  status: (['new', 'following', 'converted', 'invalid'] as const)[i % 4],
  assignee: i < 10 ? advisors[i % 3] : advisors[(i % 5)],
  assigneeRole: i < 15 ? 'DCC专员' : '首席顾问师',
  followUpCount: Math.floor(Math.random() * 5),
  lastFollowUp: daysAgo(Math.floor(Math.random() * 10)),
  createdAt: daysAgo(Math.floor(Math.random() * 30) + 1),
  remark: ['客户对冒险家很感兴趣，预算35万', '价格敏感，需跟进优惠政策', '周末有时间看车，带家人一起', '已有宝马X3对比', '需要试驾体验，关注动力', '家庭用车需求，重点关注空间'][i % 6],
  wechatBound: i % 3 === 0,
  followRecords: i < 8 ? [
    { id: `FR${i}_1`, time: daysAgo(5), type: 'phone' as const, content: '首次电话联系，客户表示对' + models[i % 4] + '感兴趣，询问了价格区间和优惠政策', result: 'continue' as const, operator: advisors[i % 3] },
    { id: `FR${i}_2`, time: daysAgo(3), type: 'wechat' as const, content: '发送了车型配置表和最新优惠信息，客户已阅读', result: 'continue' as const, aiSummary: '客户对价格较关注，建议下次沟通重点介绍金融方案和当前促销活动。客户偏好周末看车，可尝试邀约本周六到店试驾。', operator: advisors[i % 3] },
    { id: `FR${i}_3`, time: daysAgo(1), type: 'phone' as const, content: '再次致电，客户表示正在对比竞品，对林肯的售后服务和保修政策感兴趣', result: 'continue' as const, operator: advisors[i % 3] },
  ] : i < 15 ? [
    { id: `FR${i}_1`, time: daysAgo(2), type: 'idcc' as const, content: '智慧号外呼，客户接听后表达了初步兴趣', result: 'continue' as const, operator: advisors[i % 3] },
  ] : [],
  invalidReason: i % 4 === 3 ? '号码空号无法联系' : undefined,
  approvalStatus: i % 4 === 3 ? (['pending', 'approved', 'rejected'] as const)[i % 3] : 'none' as const,
  feedbackStatus: i < 10 ? 'synced' as const : 'pending' as const,
}));

export const defaultCustomers: Customer[] = Array.from({ length: 20 }, (_, i) => ({
  id: `CU${String(i + 1).padStart(5, '0')}`,
  name: defaultLeads[i].customerName,
  phone: defaultLeads[i].phone,
  gender: i % 2 === 0 ? '男' : '女',
  intentionModel: models[i % models.length],
  level: (['H', 'A', 'B', 'C', 'O'] as const)[i % 5],
  source: sources[i % sources.length],
  advisor: advisors[i % advisors.length],
  status: (['active', 'defeated', 'dormant', 'delivered'] as const)[i % 4],
  createdAt: daysAgo(Math.floor(Math.random() * 60) + 1),
  wechatBound: i % 2 === 0,
  leadIds: [`LD${String(i + 1).padStart(5, '0')}`],
  visitCount: Math.floor(Math.random() * 5),
  testDriveCount: Math.floor(Math.random() * 3),
  lastVisit: daysAgo(Math.floor(Math.random() * 15)),
  tags: [['高净值', '二次购车'], ['首次购车', '价格敏感'], ['家庭用车', 'SUV偏好'], ['豪华品牌忠实', '企业主'], ['年轻白领', '分期意向']][i % 5],
  digitalBadgeRecords: i < 5 ? [
    { time: daysAgo(3), summary: '客户到店后对冒险家外观表示满意，重点询问了车机系统功能', tags: ['外观满意', '关注智能'] },
    { time: daysAgo(7), summary: '客户带家人二次到店，家属对后排空间和舒适性给出好评', tags: ['家庭决策', '空间满意'] },
  ] : [],
  defeatReason: i % 4 === 1 ? '选择了宝马X3' : undefined,
  dormantReason: i % 4 === 2 ? '暂时无购车计划' : undefined,
}));

export const defaultAppointments: Appointment[] = Array.from({ length: 15 }, (_, i) => ({
  id: `AP${String(i + 1).padStart(5, '0')}`,
  customerId: `CU${String(i + 1).padStart(5, '0')}`,
  customerName: defaultCustomers[i % 20].name,
  phone: defaultCustomers[i % 20].phone,
  type: (['visit', 'test_drive', 'delivery', 'service'] as const)[i % 4],
  appointmentTime: i < 5 ? daysLater(i + 1) : daysAgo(i - 4),
  status: (['pending', 'confirmed', 'arrived', 'completed', 'cancelled'] as const)[i % 5],
  advisor: advisors[i % advisors.length],
  remark: ['客户希望周末到店看冒险家', '需要安排试驾冒险家和航海家', '提车准备，需确认精品加装', '定期保养预约'][i % 4],
  createdAt: daysAgo(i + 2),
  cancelReason: i % 5 === 4 ? '客户临时有事' : undefined,
  reminderSetting: ['提前1天', '当天', '提前2小时'][i % 3],
  wechatNotified: i < 8,
}));

export const defaultTrafficRecords: TrafficRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `TF${String(i + 1).padStart(5, '0')}`,
  customerName: ['王先生', '李女士', '张先生', '刘女士', '陈先生', '杨女士', '赵先生', '黄女士', '周先生', '吴女士', '郑先生', '孙女士'][i],
  phone: `139${String(10000000 + i * 1111111).slice(0, 8)}`,
  batch: `B${String(Math.floor(i / 3) + 1).padStart(3, '0')}`,
  arrivalTime: i < 6 ? hoursAgo(Math.floor(Math.random() * 8) + 1) : daysAgo(Math.floor(Math.random() * 3) + 1),
  leaveTime: i < 3 ? '' : (i < 6 ? hoursAgo(Math.floor(Math.random() * 4)) : daysAgo(Math.floor(Math.random() * 3))),
  advisor: advisors[i % advisors.length],
  purpose: ['看车', '试驾', '谈价', '提车', '保养咨询', '随便看看'][i % 6],
  isValid: i % 5 !== 4,
  source: (['natural', 'appointment', 'digital_checkin'] as const)[i % 3],
  customerId: i < 6 ? `CU${String(i + 1).padStart(5, '0')}` : undefined,
  createdAt: i < 6 ? hoursAgo(Math.floor(Math.random() * 8) + 1) : daysAgo(Math.floor(Math.random() * 3) + 1),
}));

const routeDescs: Record<string, string> = {
  '城市道路体验': '途经商圈、红绿灯路口，体验城市驾驶的舒适性和智能驾驶辅助功能',
  '高速巡航体验': '进入高速环线，体验高速巡航的动力储备和NVH静谧性',
  '综合路况体验': '包含城市+高速+乡村道路，全面体验车辆各项性能',
};

export const defaultTestDrives: TestDrive[] = Array.from({ length: 10 }, (_, i) => {
  const route = ['城市道路体验', '高速巡航体验', '综合路况体验'][i % 3];
  return {
    id: `TD${String(i + 1).padStart(5, '0')}`,
    customerId: `CU${String(i + 1).padStart(5, '0')}`,
    customerName: defaultCustomers[i].name,
    phone: defaultCustomers[i].phone,
    model: models[i % models.length],
    route,
    routeDesc: routeDescs[route],
    licenseNo: `310${String(10000000 + i).slice(0, 8)}${String(1000 + i).slice(0, 4)}`,
    licenseExpiry: daysLater(365 + i * 30),
    licenseType: 'C1',
    licensePhoto: i < 5 ? '/mock/license.jpg' : '',
    agreementPhoto: i < 4 ? '/mock/agreement.jpg' : '',
    startTime: i < 3 ? '' : daysAgo(i),
    endTime: i < 3 ? '' : daysAgo(i).replace(/:../, ':45'),
    status: (['pending', 'in_progress', 'completed', 'completed'] as const)[i % 4],
    advisor: advisors[i % advisors.length],
    createdAt: daysAgo(i + 1),
    rating: i >= 3 ? { driving: 4 + (i % 2), interior: 4, power: 3 + (i % 3), overall: 4 } : undefined,
  };
});

export const defaultTodos: TodoItem[] = [
  { id: 'TODO001', title: '跟进线索-赵先生(冒险家)', type: 'lead_follow', priority: 'high', status: 'overdue', deadline: hoursAgo(5), assignee: '张伟', relatedId: 'LD00001', relatedType: 'lead', createdAt: daysAgo(2), overdueHours: 5, overdueRule: 4, description: '新线索首跟，规定4小时内完成' },
  { id: 'TODO002', title: '跟进线索-钱女士(航海家)', type: 'lead_follow', priority: 'high', status: 'pending', deadline: hoursLater(3), assignee: '李娜', relatedId: 'LD00002', relatedType: 'lead', createdAt: daysAgo(1), overdueRule: 4, description: '新线索等待首次跟进' },
  { id: 'TODO003', title: '预约到店确认-孙先生', type: 'appointment', priority: 'medium', status: 'overdue', deadline: hoursAgo(2), assignee: '王强', relatedId: 'AP00001', relatedType: 'appointment', createdAt: daysAgo(1), overdueHours: 2, overdueRule: 2, description: '客户预约明天到店，需电话确认' },
  { id: 'TODO004', title: '试驾准备-李女士(飞行家)', type: 'test_drive', priority: 'high', status: 'pending', deadline: daysLater(1), assignee: '张伟', relatedId: 'TD00001', relatedType: 'test_drive', createdAt: daysAgo(1), overdueRule: 24, description: '检查试驾车辆状态，准备试驾协议' },
  { id: 'TODO005', title: '无效线索审批-周先生', type: 'invalid_approval', priority: 'low', status: 'pending', deadline: daysLater(2), assignee: '刘芳', relatedId: 'LD00005', relatedType: 'lead', createdAt: hoursAgo(8), overdueRule: 24, description: 'DCC专员申请标记为无效线索，需DCC经理审批' },
  { id: 'TODO006', title: '客户跟进-吴女士(航海家)', type: 'customer_follow', priority: 'medium', status: 'overdue', deadline: hoursAgo(12), assignee: '李娜', relatedId: 'CU00006', relatedType: 'customer', createdAt: daysAgo(3), overdueHours: 12, overdueRule: 8, description: '客户近期未到店，需电话回访' },
  { id: 'TODO007', title: '预约试驾确认-郑先生', type: 'test_drive', priority: 'high', status: 'in_progress', deadline: daysLater(1), assignee: '王强', relatedId: 'TD00003', relatedType: 'test_drive', createdAt: daysAgo(1), overdueRule: 24, description: '确认试驾时间和路线安排' },
  { id: 'TODO008', title: '跟进线索-王女士(领航员)', type: 'lead_follow', priority: 'medium', status: 'pending', deadline: hoursLater(6), assignee: '陈晨', relatedId: 'LD00008', relatedType: 'lead', createdAt: hoursAgo(4), overdueRule: 4, description: '垂媒线索，需首次电话联系' },
  { id: 'TODO009', title: '战败审批-郑先生', type: 'defeat_approval', priority: 'low', status: 'pending', deadline: daysLater(1), assignee: '刘芳', relatedId: 'CU00007', relatedType: 'customer', createdAt: hoursAgo(6), overdueRule: 24, description: '首席顾问师申请战败，需销售总监审批' },
  { id: 'TODO010', title: '客流接待-今日到店客户', type: 'traffic', priority: 'medium', status: 'pending', deadline: hoursLater(2), assignee: '王强', relatedId: 'TF00001', relatedType: 'traffic', createdAt: hoursAgo(1), overdueRule: 2, description: '有新客户到店，请及时接待登记' },
  { id: 'TODO011', title: '跟进线索-冯先生(冒险家)', type: 'lead_follow', priority: 'high', status: 'overdue', deadline: hoursAgo(24), assignee: '张伟', relatedId: 'LD00009', relatedType: 'lead', createdAt: daysAgo(3), overdueHours: 24, overdueRule: 4, description: '严重逾期！线索长时间未跟进' },
  { id: 'TODO012', title: '企微运营任务-节日问候', type: 'wechat_task', priority: 'low', status: 'pending', deadline: daysLater(2), assignee: '李娜', relatedId: '', relatedType: 'wechat', createdAt: daysAgo(1), overdueRule: 48, description: '向VIP客户发送节日问候消息' },
  { id: 'TODO013', title: '预约到店确认-金先生', type: 'appointment', priority: 'high', status: 'overdue', deadline: hoursAgo(1), assignee: '陈晨', relatedId: 'AP00005', relatedType: 'appointment', createdAt: hoursAgo(4), overdueHours: 1, overdueRule: 2, description: '客户预约今天下午到店' },
];

export const defaultMessages: Message[] = [
  { id: 'MSG001', title: '线索分配通知', content: '您有一条新线索已分配：赵先生-林肯冒险家，来源：官网留资，请在4小时内完成首次跟进。', type: 'assignment', read: false, createdAt: hoursAgo(1), relatedId: 'LD00001', relatedType: 'lead', link: '/leads/detail/LD00001' },
  { id: 'MSG002', title: '任务逾期提醒', content: '您的待办任务"跟进线索-赵先生(冒险家)"已逾期5小时！请立即处理，逾期将通知您的上级。', type: 'overdue', read: false, createdAt: hoursAgo(1), relatedId: 'TODO001', relatedType: 'todo', link: '/todo' },
  { id: 'MSG003', title: '预约到店提醒', content: '孙先生预约明天14:00到店看车，请做好接待准备。已通过企微发送到店指引。', type: 'appointment_remind', read: true, createdAt: hoursAgo(6), relatedId: 'AP00003', relatedType: 'appointment', link: '/appointments' },
  { id: 'MSG004', title: '任务逾期提醒', content: '您的待办任务"预约到店确认-孙先生"已逾期2小时，请尽快确认。', type: 'overdue', read: false, createdAt: hoursAgo(2), relatedId: 'TODO003', relatedType: 'todo', link: '/todo' },
  { id: 'MSG005', title: '试驾安排通知', content: '李女士预约试驾林肯飞行家，时间：明天10:00，路线：城市道路体验。请提前检查试驾车辆状态。', type: 'test_drive', read: true, createdAt: daysAgo(1), link: '/test-drive' },
  { id: 'MSG006', title: '审批通知', content: '张伟提交了无效线索审批申请（周先生-号码空号），请及时审核处理。', type: 'approval', read: false, createdAt: hoursAgo(8), link: '/todo' },
  { id: 'MSG007', title: '任务逾期提醒', content: '您的待办任务"客户跟进-吴女士(航海家)"已逾期12小时！已自动通知销售总监。', type: 'overdue', read: false, createdAt: hoursAgo(1), relatedId: 'TODO006', relatedType: 'todo', link: '/todo' },
  { id: 'MSG008', title: '线索分配通知', content: '您有一条新线索已分配：王女士-林肯领航员，来源：垂媒线索。请在4小时内完成首次跟进。', type: 'assignment', read: true, createdAt: hoursAgo(4), link: '/leads/detail/LD00008' },
  { id: 'MSG009', title: '企微消息提醒', content: '客户赵先生通过企微发来新消息："好的，周六见"，请及时回复。', type: 'wechat_reply', read: false, createdAt: minsAgo(30), link: '/leads/detail/LD00001' },
  { id: 'MSG010', title: '战败审批通知', content: '首席顾问师王强提交了战败申请（郑先生-选择了竞品），请审核。', type: 'defeat_approval', read: false, createdAt: hoursAgo(6), link: '/todo' },
  { id: 'MSG011', title: '严重逾期警告', content: '⚠️ 线索"冯先生(冒险家)"已逾期24小时未跟进！系统已自动上报至销售总监。', type: 'overdue', read: false, createdAt: hoursAgo(1), relatedId: 'TODO011', relatedType: 'todo', link: '/todo' },
  { id: 'MSG012', title: '预约到店提醒', content: '金先生预约今天下午到店，目前尚未确认预约，请尽快联系客户确认。', type: 'appointment_remind', read: false, createdAt: hoursAgo(3), relatedId: 'AP00005', relatedType: 'appointment', link: '/appointments' },
];

export const defaultChatMessages: ChatMessage[] = [
  { id: 'CM001', sender: 'advisor', content: '赵先生您好，我是林肯中心的张伟，感谢您对林肯冒险家的关注！', time: daysAgo(3), type: 'text' },
  { id: 'CM002', sender: 'customer', content: '你好，我在网上看到冒险家的信息，想了解一下', time: daysAgo(3), type: 'text' },
  { id: 'CM003', sender: 'advisor', content: '', time: daysAgo(3), type: 'card', cardData: { title: '林肯冒险家 2025款', subtitle: '2.0T 尊雅版 | 指导价 24.58-35.58万\n综合优惠3万元 · 36期0利率', image: '/mock/corsair.jpg' } },
  { id: 'CM004', sender: 'customer', content: '这个配置看起来不错，优惠力度大吗？落地价大概多少？', time: daysAgo(2), type: 'text' },
  { id: 'CM005', sender: 'advisor', content: '目前冒险家有最高3万元的综合优惠，2.0T尊雅版落地大约在26万左右。具体要看您选择的配置和金融方案。我给您发一份详细的金融方案对比：', time: daysAgo(2), type: 'text' },
  { id: 'CM006', sender: 'advisor', content: '', time: daysAgo(2), type: 'image', imageUrl: '/mock/finance_plan.jpg' },
  { id: 'CM007', sender: 'customer', content: '还可以，我周末有空可以去店里看看，我的手机号是13812345678', time: daysAgo(1), type: 'text' },
  { id: 'CM008', sender: 'advisor', content: '太好了！我帮您预约这周六上午10点到店，届时可以安排试驾体验。我们林肯中心有专属的林肯之道接待服务，包括精品茶歇和一对一顾问服务。', time: daysAgo(1), type: 'text' },
  { id: 'CM009', sender: 'customer', content: '好的，周六见', time: daysAgo(1), type: 'text' },
  { id: 'CM010', sender: 'advisor', content: '', time: daysAgo(1), type: 'card', cardData: { title: '张伟 | 首席销售顾问', subtitle: '林肯中心（上海浦东店）\n📞 138-1234-5678' } },
];

export const defaultAfterSalesLeads: AfterSalesLead[] = Array.from({ length: 15 }, (_, i) => ({
  id: `ASL${String(i + 1).padStart(5, '0')}`,
  customerName: ['马先生', '黄女士', '罗先生', '梁女士', '宋先生', '唐女士', '贺先生', '龙女士', '邓先生', '田女士', '杜先生', '姚女士', '潘先生', '范女士', '雷先生'][i],
  phone: `139${String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8)}`,
  plateNo: `沪A${String(10000 + i * 111).slice(0, 5)}`,
  vin: `LF${String(1000000000 + i)}`.slice(0, 17),
  model: models[i % models.length],
  reminderType: ['定期保养', '续保提醒', '年检提醒', '召回通知', '关怀回访'][i % 5],
  status: (['new', 'following', 'completed', 'invalid'] as const)[i % 4],
  assignee: ['马超', '黄忠', '赵云'][i % 3],
  lastService: daysAgo(Math.floor(Math.random() * 90) + 30),
  nextService: daysLater(Math.floor(Math.random() * 30)),
  createdAt: daysAgo(Math.floor(Math.random() * 15)),
  followRecords: i < 5 ? [
    { id: `AFR${i}_1`, time: daysAgo(3), type: 'phone' as const, content: '致电提醒客户车辆保养到期，客户表示本周有空', result: 'success' as const, operator: ['马超', '黄忠', '赵云'][i % 3] },
  ] : [],
  vehicleProfile: { mileage: `${(15000 + i * 5000).toLocaleString()}km`, purchaseDate: daysAgo(365 + i * 60), insuranceExpiry: daysLater(30 + i * 20), lastMaintenance: daysAgo(60 + i * 15) },
  followResult: i < 5 ? (['success', 'failed', 'continue'] as const)[i % 3] : undefined,
}));

export const defaultServiceAppointments: ServiceAppointment[] = Array.from({ length: 8 }, (_, i) => ({
  id: `SA${String(i + 1).padStart(5, '0')}`,
  customerName: defaultAfterSalesLeads[i].customerName,
  phone: defaultAfterSalesLeads[i].phone,
  plateNo: defaultAfterSalesLeads[i].plateNo,
  model: defaultAfterSalesLeads[i].model,
  vin: defaultAfterSalesLeads[i].vin,
  serviceType: ['常规保养', '机油更换', '轮胎更换', '空调检修', '全车检查', '钣金喷漆', '事故维修'][i % 7],
  appointmentTime: i < 4 ? daysLater(i + 1) : daysAgo(i - 3),
  teaBreak: ['美式咖啡', '拿铁', '龙井茶', '矿泉水', '不需要'][i % 5],
  engineer: ['赵云', '马超', '黄忠'][i % 3],
  status: (['pending', 'confirmed', 'in_service', 'completed', 'cancelled'] as const)[i % 5],
  createdAt: daysAgo(i + 1),
  estimatedHours: [1.5, 2, 3, 1, 4, 6, 8][i % 7],
  estimatedCost: [800, 600, 3200, 500, 1500, 8000, 15000][i % 7],
  dmsSync: i < 5,
  historyRecords: i < 4 ? [
    { date: daysAgo(90), type: '常规保养', mileage: '10000km', cost: 800 },
    { date: daysAgo(180), type: '机油更换', mileage: '5000km', cost: 600 },
  ] : [],
}));

export const defaultAccidents: AccidentCase[] = Array.from({ length: 6 }, (_, i) => ({
  id: `AC${String(i + 1).padStart(5, '0')}`,
  customerName: defaultAfterSalesLeads[i].customerName,
  phone: defaultAfterSalesLeads[i].phone,
  plateNo: defaultAfterSalesLeads[i].plateNo,
  model: defaultAfterSalesLeads[i].model,
  accidentDate: daysAgo(Math.floor(Math.random() * 20) + 1),
  insuranceCompany: ['人保', '平安', '太平洋', '中国人寿'][i % 4],
  claimAmount: Math.floor(Math.random() * 50000) + 5000,
  damageAmount: Math.floor(Math.random() * 40000) + 3000,
  status: (['reporting', 'assessing', 'repairing', 'claiming', 'closed'] as const)[i % 5],
  repairStatus: i >= 2 ? (['pending', 'in_progress', 'completed'] as const)[i % 3] : undefined,
  description: ['追尾事故，后保险杠受损', '侧面碰撞，左前翼子板变形', '停车剐蹭，右后门划痕', '涉水故障，发动机检修', '前挡风玻璃碎裂', '自燃事故，线路问题'][i],
  assignee: ['赵云', '马超', '黄忠'][i % 3],
  createdAt: daysAgo(Math.floor(Math.random() * 15)),
  photos: i < 3 ? ['/mock/accident1.jpg', '/mock/accident2.jpg'] : [],
  followRecords: i < 3 ? [
    { id: `ACR${i}_1`, time: daysAgo(2), type: 'phone' as const, content: '已联系保险公司，定损员将于明天到店', operator: ['赵云', '马超', '黄忠'][i % 3] },
  ] : [],
}));

export const defaultAfterSalesCustomers: AfterSalesCustomer[] = Array.from({ length: 10 }, (_, i) => ({
  id: `ASC${String(i + 1).padStart(5, '0')}`,
  name: defaultAfterSalesLeads[i].customerName,
  phone: defaultAfterSalesLeads[i].phone,
  gender: i % 2 === 0 ? '男' : '女',
  vehicleInfo: {
    id: `V${String(i + 1).padStart(5, '0')}`,
    plateNo: defaultAfterSalesLeads[i].plateNo,
    vin: defaultAfterSalesLeads[i].vin,
    model: defaultAfterSalesLeads[i].model,
    ownerName: defaultAfterSalesLeads[i].customerName,
    ownerPhone: defaultAfterSalesLeads[i].phone,
    purchaseDate: daysAgo(365 + i * 90),
    mileage: 15000 + i * 5000,
    insuranceExpiry: daysLater(30 + i * 20),
    annualInspectionExpiry: daysLater(60 + i * 30),
    engineNo: `EA888${String(100000 + i)}`,
    lastMaintenance: daysAgo(60 + i * 15),
    lastMaintenanceMileage: 15000 + i * 5000 - 5000,
    color: colors[i % colors.length],
  },
  vehicleProfile: {
    totalMaintenance: 3 + i,
    totalSpent: 1600 + i * 800,
    avgVisitInterval: 45 + i * 5,
    preferredEngineer: ['赵云', '马超', '黄忠'][i % 3],
    commonServices: [['机油更换', '空调滤芯'], ['轮胎检查', '刹车片'], ['全车检查', '机油更换']][i % 3],
    loyaltyLevel: (['platinum', 'gold', 'silver', 'bronze'] as const)[i % 4],
  },
  advisor: ['赵云', '马超', '黄忠'][i % 3],
  wechatBound: i % 2 === 0,
  createdAt: daysAgo(365 + i * 30),
  lastVisit: daysAgo(Math.floor(Math.random() * 30) + 1),
  visitCount: Math.floor(Math.random() * 10) + 1,
  serviceHistory: [
    { id: `SH${i}_1`, date: daysAgo(60), serviceType: '常规保养', type: '常规保养', engineer: ['赵云', '马超', '黄忠'][i % 3], mileage: 15000 + i * 5000 - 5000, cost: 800, items: '机油、机滤、空调滤芯更换' },
    { id: `SH${i}_2`, date: daysAgo(180), serviceType: '机油更换', type: '机油更换', engineer: ['赵云', '马超', '黄忠'][i % 3], mileage: 15000 + i * 5000 - 10000, cost: 600, items: '机油、机滤更换' },
    { id: `SH${i}_3`, date: daysAgo(365), serviceType: '全车检查', type: '全车检查', engineer: ['赵云', '马超', '黄忠'][i % 3], mileage: 15000 + i * 5000 - 15000, cost: 200, items: '首保全车检查' },
  ],
  visitRecords: [
    { date: daysAgo(60), type: '保养', remark: '常规保养到店' },
    { date: daysAgo(180), type: '维修', remark: '机油更换' },
    { date: daysAgo(365), type: '首保', remark: '新车首保' },
  ],
}));

export const testDriveModels = [
  { model: '林肯冒险家', variants: ['2.0T 尊雅版', '2.0T 尊享版', '2.0T 总统版'], plateNo: '沪A TEST1' },
  { model: '林肯航海家', variants: ['2.0T 尊雅版', '2.7T 尊享版', '2.7T 总统版'], plateNo: '沪A TEST2' },
  { model: '林肯飞行家', variants: ['3.0T V6 尊雅版', '3.0T V6 总统版'], plateNo: '沪A TEST3' },
  { model: '林肯领航员', variants: ['3.5T V6 尊雅版', '3.5T V6 总统版'], plateNo: '沪A TEST4' },
];
