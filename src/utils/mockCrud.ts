const STORAGE_PREFIX = 'lincoln_demo_';

export function getData<T>(key: string, defaultData: T[]): T[] {
  const stored = localStorage.getItem(STORAGE_PREFIX + key);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultData));
  return defaultData;
}

export function setData<T>(key: string, data: T[]): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
}

export function addItem<T extends { id: string }>(key: string, item: T, defaultData: T[]): T[] {
  const list = getData<T>(key, defaultData);
  list.unshift(item);
  setData(key, list);
  return list;
}

export function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>, defaultData: T[]): T[] {
  const list = getData<T>(key, defaultData);
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
  }
  setData(key, list);
  return list;
}

export function deleteItem<T extends { id: string }>(key: string, id: string, defaultData: T[]): T[] {
  let list = getData<T>(key, defaultData);
  list = list.filter(item => item.id !== id);
  setData(key, list);
  return list;
}

let _counter = 0;
export function genId(): string {
  _counter++;
  return String(Date.now()).slice(-6) + String(_counter).padStart(3, '0');
}

export function resetAllData(): void {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// ===== 跨模块联动辅助函数 =====

const fmt = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');

/** 逾期时间规则（小时） */
export const overdueRules: Record<string, number> = {
  lead_follow: 4,
  appointment: 2,
  test_drive: 2,
  traffic_reception: 1,
  order_review: 8,
  defeat_approval: 24,
  delivery_appointment: 4,
  customer_follow: 8,
  invalid_lead_approval: 24,
  wecom_task: 4,
  approval: 8,
};

/** 逾期升级阈值（逾期超过多少小时自动通知上级） */
export const escalationThresholds: Record<string, number> = {
  lead_follow: 8,
  appointment: 4,
  test_drive: 4,
  traffic_reception: 2,
  order_review: 16,
  defeat_approval: 48,
  delivery_appointment: 8,
  customer_follow: 16,
  invalid_lead_approval: 48,
  wecom_task: 8,
  approval: 16,
};

/** 创建线索时自动添加一条"线索跟进"待办 */
export function addLeadTodo(leadId: string, customerName: string, assignee: string, model: string): void {
  const now = new Date();
  const deadline = new Date(now.getTime() + overdueRules.lead_follow * 60 * 60 * 1000);
  const todoItem = {
    id: 'TODO_' + genId(),
    title: `跟进线索-${customerName}(${model})`,
    type: 'lead_follow' as const,
    priority: 'high' as const,
    status: 'pending' as const,
    deadline: fmt(deadline),
    assignee,
    relatedId: leadId,
    relatedType: 'lead',
    createdAt: fmt(now),
    customerName,
    description: `新线索分配，请在${overdueRules.lead_follow}小时内完成首次跟进`,
  };
  const todos = getData('todos', []);
  todos.unshift(todoItem);
  setData('todos', todos);
  // 同时添加消息通知
  addAutoMessage(`新线索分配：${customerName}`, `您有一条新线索已分配：${customerName}-林肯${model}，请及时跟进。`, 'assignment', leadId, 'lead');
}

/** 创建预约时自动添加一条"预约确认"待办 */
export function addAppointmentTodo(appointmentId: string, customerName: string, assignee: string, type: string): void {
  const now = new Date();
  const deadline = new Date(now.getTime() + overdueRules.appointment * 60 * 60 * 1000);
  const typeLabel = type === 'test_drive' ? '试驾' : type === 'visit' ? '到店' : type === 'delivery' ? '交车' : '服务';
  const todoItem = {
    id: 'TODO_' + genId(),
    title: `预约${typeLabel}确认-${customerName}`,
    type: 'appointment' as const,
    priority: 'medium' as const,
    status: 'pending' as const,
    deadline: fmt(deadline),
    assignee,
    relatedId: appointmentId,
    relatedType: 'appointment',
    createdAt: fmt(now),
    customerName,
    description: `${customerName}的${typeLabel}预约需要确认`,
  };
  const todos = getData('todos', []);
  todos.unshift(todoItem);
  setData('todos', todos);
  addAutoMessage(`预约${typeLabel}提醒：${customerName}`, `${customerName}预约${typeLabel}，请及时确认安排。`, 'appointment_remind', appointmentId, 'appointment');
}

/** 创建试驾时自动添加一条"试驾安排"待办 */
export function addTestDriveTodo(testDriveId: string, customerName: string, assignee: string, model: string): void {
  const now = new Date();
  const deadline = new Date(now.getTime() + overdueRules.test_drive * 60 * 60 * 1000);
  const todoItem = {
    id: 'TODO_' + genId(),
    title: `试乘试驾准备-${customerName}(${model})`,
    type: 'test_drive' as const,
    priority: 'high' as const,
    status: 'pending' as const,
    deadline: fmt(deadline),
    assignee,
    relatedId: testDriveId,
    relatedType: 'test_drive',
    createdAt: fmt(now),
    customerName,
    description: `${customerName}的${model}试驾安排需准备`,
  };
  const todos = getData('todos', []);
  todos.unshift(todoItem);
  setData('todos', todos);
  addAutoMessage(`试驾安排通知：${customerName}`, `${customerName}预约试驾${model}，请做好试驾准备。`, 'test_drive', testDriveId, 'test_drive');
}

/** 待办逾期时自动在消息中心添加逾期提醒消息 */
export function addOverdueMessage(todoId: string, title: string, overdueHours: number): void {
  const urgency = overdueHours >= 12 ? 'critical' : overdueHours >= 4 ? 'high' : 'normal';
  addAutoMessage(
    `任务逾期提醒`,
    `您的待办任务"${title}"已逾期${overdueHours}小时，请尽快处理！`,
    'overdue',
    todoId,
    'todo',
    urgency as 'normal' | 'high' | 'critical',
  );
}

/** 通用自动消息添加 */
export function addAutoMessage(
  title: string,
  content: string,
  type: string,
  relatedId?: string,
  relatedType?: string,
  urgency: 'normal' | 'high' | 'critical' = 'normal',
): void {
  const msg = {
    id: 'MSG_' + genId(),
    title,
    content,
    type,
    read: false,
    createdAt: fmt(new Date()),
    relatedId,
    relatedType,
    urgency,
  };
  const messages = getData('messages', []);
  messages.unshift(msg);
  setData('messages', messages);
}
