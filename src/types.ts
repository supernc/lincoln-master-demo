export interface FollowRecord {
  id: string;
  time: string;
  type: 'phone' | 'wechat' | 'visit' | 'sms' | 'idcc' | 'idcc_call';
  content: string;
  result?: 'success' | 'failed' | 'continue' | string;
  aiSummary?: string;
  operator: string;
  voiceText?: string;
  qualityScore?: number;
}

export interface Lead {
  id: string;
  customerName: string;
  gender: string;
  phone: string;
  source: string;
  channel: string;
  intentionModel: string;
  intentionLevel: 'H' | 'A' | 'B' | 'C' | 'O';
  status: 'new' | 'following' | 'converted' | 'invalid';
  assignee: string;
  assigneeRole: string;
  followUpCount: number;
  lastFollowUp: string;
  createdAt: string;
  remark: string;
  wechatBound: boolean;
  followRecords: FollowRecord[];
  invalidReason?: string;
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  feedbackStatus?: 'pending' | 'synced';
  returnStatus?: 'pending' | 'returned' | 'failed';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  gender: string;
  intentionModel: string;
  level: 'H' | 'A' | 'B' | 'C' | 'O';
  source: string;
  advisor: string;
  status: 'active' | 'defeated' | 'dormant' | 'delivered';
  createdAt: string;
  wechatBound: boolean;
  leadIds: string[];
  visitCount: number;
  testDriveCount: number;
  lastVisit: string;
  tags?: string[];
  digitalBadgeRecords?: { time: string; summary: string; tags: string[] }[];
  defeatReason?: string;
  dormantReason?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  type: 'visit' | 'test_drive' | 'delivery' | 'service';
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  advisor: string;
  remark: string;
  createdAt: string;
  reminderSetting?: string;
  cancelReason?: string;
  modifyReason?: string;
  modifyHistory?: AppointmentModifyRecord[];
  checkinTime?: string;
  wechatNotified?: boolean;
  wecomNotified?: boolean;
  wecomNotifyTime?: string;
}

export interface AppointmentModifyRecord {
  id: string;
  time: string;
  reason: string;
  operator: string;
  changes: string;
}

export interface TestDrive {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  model: string;
  route: string;
  routeDesc?: string;
  routeDescription?: string;
  licenseNo: string;
  licenseExpiry?: string;
  licenseType?: string;
  licensePhoto: string;
  agreementPhoto: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  advisor: string;
  createdAt: string;
  rating?: TestDriveRating;
  cancelReason?: string;
}

export interface TestDriveRating {
  driving: number;
  interior: number;
  power: number;
  comfort?: number;
  overall: number;
  comment?: string;
}

export interface TrafficRecord {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  batch: string;
  arrivalTime: string;
  leaveTime?: string;
  advisor: string;
  purpose: string;
  isValid: boolean;
  invalidReason?: string;
  source?: 'natural' | 'appointment' | 'digital_checkin';
  checkinCode?: string;
  linkedCustomer?: boolean;
  createdAt: string;
  remark?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  deadline: string;
  assignee: string;
  relatedId: string;
  relatedType: string;
  createdAt: string;
  overdueHours?: number;
  overdueRule?: number;
  description?: string;
  customerName?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  link?: string;
  urgency?: 'normal' | 'high' | 'critical';
  approved?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'advisor' | 'customer';
  content: string;
  time: string;
  type: 'text' | 'image' | 'card';
  cardData?: { title: string; subtitle: string; image?: string };
  imageUrl?: string;
}

export interface VehicleInfo {
  id?: string;
  plateNo: string;
  vin: string;
  model: string;
  color?: string;
  ownerName?: string;
  ownerPhone?: string;
  purchaseDate: string;
  mileage: number;
  insuranceExpiry: string;
  annualInspectionExpiry?: string;
  engineNo?: string;
  lastMaintenance?: string;
  lastMaintenanceDate?: string;
  lastMaintenanceMileage?: number;
}

export interface VehicleProfile {
  totalMaintenance: number;
  totalSpent: number;
  avgVisitInterval: number;
  preferredEngineer: string;
  commonServices: string[];
  loyaltyLevel: 'platinum' | 'gold' | 'silver' | 'bronze';
}

/** 简版车辆画像（售后线索用） */
export interface SimpleVehicleProfile {
  mileage: string;
  purchaseDate: string;
  insuranceExpiry: string;
  lastMaintenance: string;
}

export interface ServiceHistoryRecord {
  id?: string;
  date: string;
  serviceType?: string;
  type?: string;
  engineer?: string;
  mileage: number | string;
  cost: number;
  items: string | string[];
  remark?: string;
}

export interface AfterSalesLead {
  id: string;
  customerName: string;
  phone: string;
  plateNo: string;
  vin: string;
  model: string;
  reminderType: string;
  status: 'new' | 'following' | 'completed' | 'invalid';
  assignee: string;
  lastService: string;
  nextService: string;
  createdAt: string;
  followRecords: FollowRecord[];
  vehicleProfile?: SimpleVehicleProfile;
  followResult?: 'success' | 'failed' | 'continue' | string;
  vehicleInfo?: VehicleInfo;
  wechatBound?: boolean;
}

export interface ServiceAppointment {
  id: string;
  customerName: string;
  phone: string;
  plateNo: string;
  vin?: string;
  model: string;
  serviceType: string;
  appointmentTime: string;
  teaBreak: string;
  engineer: string;
  status: 'pending' | 'confirmed' | 'in_service' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  estimatedHours?: number;
  estimatedCost?: number;
  historyRecords?: { date: string; type: string; mileage: string; cost: number }[];
  dmsSync?: boolean | 'pending' | 'synced' | 'failed';
  remark?: string;
}

export interface AccidentFollowRecord {
  id: string;
  time: string;
  content: string;
  operator: string;
  stage?: string;
  type?: string;
}

export interface AccidentCase {
  id: string;
  customerName: string;
  phone: string;
  plateNo: string;
  vin?: string;
  model: string;
  accidentDate: string;
  insuranceCompany: string;
  insurancePolicyNo?: string;
  claimAmount: number;
  damageAmount?: number;
  status: 'reporting' | 'assessing' | 'repairing' | 'claiming' | 'closed';
  repairStatus?: 'pending' | 'in_progress' | 'completed';
  description: string;
  assignee: string;
  createdAt: string;
  photos?: string[];
  followRecords: FollowRecord[];
  accidentLocation?: string;
  thirdParty?: boolean;
}

export interface AfterSalesCustomer {
  id: string;
  name: string;
  phone: string;
  gender?: string;
  vehicleInfo: VehicleInfo;
  vehicleProfile: VehicleProfile;
  advisor: string;
  createdAt: string;
  lastVisit?: string;
  visitCount?: number;
  serviceHistory: ServiceHistoryRecord[];
  visitRecords: { date: string; type: string; remark: string }[];
  wechatBound: boolean;
}

export type UserRole = 'dcc_manager' | 'dcc_specialist' | 'sales_advisor' | 'sales_director' | 'after_sales_advisor' | 'service_engineer';

export interface UserInfo {
  name: string;
  role: UserRole;
  roleLabel: string;
  store: string;
  avatar: string;
}

export const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'dcc_manager', label: 'DCC经理' },
  { value: 'dcc_specialist', label: 'DCC专员' },
  { value: 'sales_advisor', label: '首席顾问师' },
  { value: 'sales_director', label: '销售总监' },
  { value: 'after_sales_advisor', label: '售后邀约专员' },
  { value: 'service_engineer', label: '服务工程师' },
];
