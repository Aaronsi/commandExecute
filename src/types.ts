export type OrgLevel = 'branch' | 'brigade' | 'squadron'; // 支队 | 大队 | 中队

export type PlateType = 
  | '大型汽车' 
  | '小型汽车' 
  | '新能源大车' 
  | '新能源小车' 
  | '挂车' 
  | '教练车' 
  | '警用汽车' 
  | '普通摩托车';

export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  level: OrgLevel;
  parentId?: string;
  leader: string;
  phone: string;
}

export type CompletionRule = 'ANY_COMPLETE' | 'ALL_COMPLETE'; // 任一完成 | 全部完成

export type NodeStatus = 
  | 'PENDING_DISPATCH' // 待下发
  | 'PENDING_SIGN'     // 待签收
  | 'SIGNED'           // 已签收(处理中)
  | 'DISPATCHED_DOWN'  // 已下发下级(大队转派中队)
  | 'FEEDBACK_SUBMITTED' // 已提交反馈(待审)
  | 'REJECTED'         // 已驳回(待再次反馈)
  | 'AUDITED_PASS'     // 审核通过(已完结)
  | 'OVERALL_COMPLETED'// 整体已完结
  | 'RETURN_PENDING'   // 申请退回修改中
  | 'CANCELLED';       // 已作废/撤销

export interface ThirdPartyDisposalRecord {
  recordId: string;
  plateNo: string;
  plateType: PlateType;
  disposalTime: string; // 处置时间 (YYYY-MM-DD HH:mm:ss)
  policeName: string;
  policeId: string;
  location: string;
  punishmentType: '现场处罚' | '扣留机动车' | '警告教育' | '移交办案' | '检验排查';
  punishmentCode: string; // 处罚决定书编号 / 强制措施凭证号
  illegalBehavior: string;
  verified: boolean; // 是否有效(处置时间必须晚于指令下发时间)
  notes?: string;
}

export type TaskCategory = 
  | '车辆缉查' 
  | '隐患治理' 
  | '违法查处' 
  | '重点管控' 
  | '专项整治' 
  | '其他';

export interface FeedbackElementConfig {
  key: string;
  name: string;
  enabled: boolean;
  required: boolean;
  type: 'text' | 'select' | 'image' | 'third_party_doc' | 'number' | 'radio';
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

export interface TaskVehicle {
  id: string;
  plateNo: string;
  plateType: PlateType;
  ownerName?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  riskReason: string; // 布控/下发原因 (如：多次违法未处理、重点嫌疑车辆、逾期未检验等)
  
  // 处置与反馈状态 (全局汇总 or 单元内部状态)
  isIntercepted: boolean;
  interceptedByUnitId?: string;
  interceptedByUnitName?: string;
  interceptedTime?: string;
  disposalRecord?: ThirdPartyDisposalRecord;
  feedbackRemarks?: string;
  evidenceImages?: string[];
  vehicleAuditStatus?: 'PENDING' | 'BRIGADE_PASSED' | 'PASSED' | 'REJECTED';
  brigadeAuditRemarks?: string;
  branchAuditRemarks?: string;
  rejectReason?: string;
  dynamicFeedbackValues?: Record<string, any>; // 动态配置的反馈要素字段值
}

// 每个中队或大队对应的具体执行节点
export interface TaskExecutionNode {
  id: string;
  taskId: string;
  unitId: string;
  unitName: string;
  unitLevel: OrgLevel;
  parentId?: string; // 如果是中队节点，指向对应大队节点id
  
  status: NodeStatus;
  
  signedTime?: string;
  signedBy?: string;
  
  dispatchedDownTime?: string; // 大队下发中队时间
  dispatchedToSquadronIds?: string[]; // 下发给哪些中队
  
  // 车辆处置清单 (本单元负责的车辆状态)
  vehiclesStatus: {
    vehicleId: string;
    plateNo: string;
    plateType: PlateType;
    isIntercepted: boolean;
    disposalRecord?: ThirdPartyDisposalRecord;
    feedbackRemarks?: string;
    evidenceImages?: string[];
    auditStatus: 'PENDING' | 'SUBMITTED' | 'PASSED' | 'REJECTED';
    rejectReason?: string;
  }[];
  
  feedbackTime?: string;
  feedbackBy?: string;
  feedbackSummary?: string;
  
  // 审核信息
  brigadeAudit?: {
    auditor: string;
    auditTime: string;
    result: 'PASS' | 'REJECT';
    remarks: string;
  };
  
  branchAudit?: {
    auditor: string;
    auditTime: string;
    result: 'PASS' | 'REJECT';
    remarks: string;
  };
}

export interface DispatchTask {
  id: string;
  taskNo: string; // 指令编号, 如 ZD-20260901-001
  title: string;
  category: TaskCategory; // 调度/指令类别 (车辆缉查, 隐患治理, 违法查处等)
  creatorLevel: 'branch' | 'brigade';
  creatorUnitId: string;
  creatorUnitName: string;
  creatorName: string;
  createdAt: string;
  dispatchTime: string;
  deadline: string;
  urgency: '特急' | '紧急' | '常规';
  
  completionRule: CompletionRule; // 任一完成 | 全部完成
  
  content: string; // 指令处置要求
  targetArea?: string;
  
  // 动态反馈要素配置 (可配置是否启用及是否必填)
  feedbackElements?: FeedbackElementConfig[];
  
  // 附件清单
  attachments?: TaskAttachment[];
  
  vehicles: TaskVehicle[];
  
  targetBrigadeIds: string[]; // 目标大队列表
  
  // 执行拓扑节点
  executionNodes: TaskExecutionNode[];
  
  // 全局指令状态: PROCESSING 流转中 | COMPLETED 已完结 | OVERDUE 超时 | CANCELLED_ERROR 派件错误-已撤销 | RETURNED_DRAFT 已退回待更正
  overallStatus: 'PROCESSING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED_ERROR' | 'RETURNED_DRAFT';
  completedTime?: string;
  completionSummary?: string;

  // 错件撤销存证记录 (未签收撤销)
  cancelRecord?: {
    cancelledByUnitId: string;
    cancelledByUnitName: string;
    cancelledByName: string;
    cancelledTime: string;
    reason: string;
  };

  // 退回修改协商记录 (已签收退回)
  returnRequest?: {
    requestedByUnitId: string;
    requestedByUnitName: string;
    requestedByName: string;
    requestedTime: string;
    reason: string;
    status: 'PENDING_CONFIRM' | 'CONFIRMED' | 'REJECTED';
    confirmedBy?: string;
    confirmedTime?: string;
    confirmRemarks?: string;
  };

  // 历史流转日志
  actionLogs: {
    id: string;
    timestamp: string;
    operatorName: string;
    operatorUnit: string;
    action: string;
    details: string;
  }[];
}

export interface UserRoleContext {
  unitId: string;
  unitName: string;
  level: OrgLevel;
  userName: string;
  policeNo: string;
}

export type NoticeType =
  | 'TASK_CANCELLED'                 // 支队/大队已经撤销
  | 'RETURN_APPROVED'                // 申请回退通过
  | 'UPPER_DIRECT_RETURN'            // 上级主动退回修改 (召回更正)
  | 'DISPATCH_NEW'                   // 新下发待签收 (支队到大队 / 转派到中队 / 大队自发到中队)
  | 'AUDIT_REJECTED'                 // 审核未通过驳回 (待重新填报整改)
  | 'SQUADRON_RETURN_REQUEST'        // 中队错件申请退单 (待大队审批)
  | 'SQUADRON_FEEDBACK_SUBMITTED';   // 中队提交处置反馈 (待大队初审)

export interface SystemNotice {
  id: string;
  type: NoticeType;
  targetUnitId: string;        // 目标接收单位ID (如 brigade-01, squadron-01-01)
  targetUnitName?: string;
  targetLevel?: OrgLevel;
  taskId: string;
  taskNo: string;
  taskTitle: string;
  title: string;
  content: string;
  urgency?: '特急' | '紧急' | '常规';
  timestamp: string;
  isRead: boolean;
  isDismissedFromToast?: boolean; // 在右下角浮窗中是否已忽略/已关闭
  actionTab?: string;             // 对应待办的页签Key (如 PENDING_SIGN, PENDING_FEEDBACK, REJECTED_FIX, BRIGADE_DISPATCH_DOWN)
  actionType?: 'GOTO_TODO' | 'VIEW_TASK'; // 跳转待办处理 还是 查看工单台账
}
