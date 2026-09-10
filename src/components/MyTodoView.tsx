import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertTriangle, AlertCircle, RotateCcw, 
  Shield, CheckCircle2, ChevronRight, Eye, Send, Car, Building2,
  FileCheck, GitBranch, ArrowRight, UserCheck, Check, X, Ban,
  Search, Filter, RefreshCw, Layers, BellRing, ChevronDown, CheckCircle,
  FileText, Paperclip
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext, SystemNotice } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { Pagination } from './Pagination';
import { DirectiveFirstLineBadges } from './DirectiveFirstLineBadges';
import { TaskOperationModal, TaskOperationMode } from './TaskOperationModal';

interface MyTodoViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask, contextTasks?: DispatchTask[]) => void;
  onUpdateTask: (updatedTask: DispatchTask) => void;
  onNavigateToManagement: () => void;
  onReDispatchTask?: (task: DispatchTask) => void;
  onAddNotice?: (notice: SystemNotice) => void;
  initialTab?: string;
  filterCategory?: string;
  filterUrgency?: string;
}

export const MyTodoView: React.FC<MyTodoViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onUpdateTask,
  onNavigateToManagement,
  onReDispatchTask,
  onAddNotice,
  initialTab,
  filterCategory,
  filterUrgency,
}) => {
  // 1. 中队角色待办分类
  // PENDING_SIGN: 待我签收
  // PENDING_FEEDBACK: 待处置反馈
  // REJECTED_FIX: 驳回待整改
  // 2. 大队角色待办分类 (按用户最新要求顺序):
  // 1. 待我签收 (PENDING_SIGN)
  // 2. 待转派中队 (BRIGADE_DISPATCH_DOWN)
  // 3. 待处置反馈 (PENDING_FEEDBACK)
  // 4. 待大队初审 (BRIGADE_AUDIT)
  // 5. 错件退单审批 (RETURN_CONFIRM)
  // 3. 支队角色待办分类:
  // BRANCH_AUDIT: 待支队终审
  // RETURN_CONFIRM: 错件退单审批
  // RETURNED_DRAFT: 错件待更正重发

  const defaultTab = useMemo(() => {
    if (initialTab) return initialTab;
    if (currentRole.level === 'squadron') return 'PENDING_SIGN';
    if (currentRole.level === 'brigade') return 'PENDING_SIGN'; // 大队默认第一项：待我签收
    return 'BRANCH_AUDIT';
  }, [currentRole.level, initialTab]);

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory || 'ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>(filterUrgency || 'ALL');

  // 分页状态 (满足需求：每个页签下的待办列表记录都要有分页显示)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedCategory, selectedUrgency]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (filterCategory) {
      setSelectedCategory(filterCategory);
    }
  }, [filterCategory]);

  useEffect(() => {
    if (filterUrgency) {
      setSelectedUrgency(filterUrgency);
    }
  }, [filterUrgency]);

  // 退单申请弹窗状态
  const [returnDialogTask, setReturnDialogTask] = useState<DispatchTask | null>(null);
  const [returnPreset, setReturnPreset] = useState('【非本辖区】车辆已驶离进入其他管辖大队');
  const [returnDetail, setReturnDetail] = useState('');

  // 错件退单审批弹窗状态 (支队/大队统一弹窗审批：选择 同意/驳回 并填写理由)
  const [returnApprovalTask, setReturnApprovalTask] = useState<DispatchTask | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'AGREE' | 'REJECT'>('AGREE');
  const [approvalReason, setApprovalReason] = useState<string>('核实属非本辖区管辖，同意退回修改，工单重回发令池重新下发。');

  // 催办与操作成功轻提示状态
  const [superviseToast, setSuperviseToast] = useState<string | null>(null);

  // 指令专属处置/审核操作弹窗 (仅展示目标车辆处置总表)
  const [operationTask, setOperationTask] = useState<{ task: DispatchTask; mode: TaskOperationMode } | null>(null);

  // 大队：再下发中队弹窗状态
  const [dispatchDownTask, setDispatchDownTask] = useState<DispatchTask | null>(null);
  const [selectedSquadronIds, setSelectedSquadronIds] = useState<string[]>([]);
  const [dispatchDownNotes, setDispatchDownNotes] = useState<string>('');

  // 获取当前大队下辖的全部中队
  const subordinateSquadrons = useMemo(() => {
    return MOCK_ORG_UNITS.filter((u) => u.parentId === currentRole.unitId && u.level === 'squadron');
  }, [currentRole.unitId]);

  // 打开再下发中队弹窗时，默认选中前两个中队
  useEffect(() => {
    if (dispatchDownTask && subordinateSquadrons.length > 0) {
      setSelectedSquadronIds(subordinateSquadrons.slice(0, 2).map((s) => s.id));
      setDispatchDownNotes('请各中队立即在辖区主干卡点组织警力布控查扣，查扣后依法录入处罚凭证！');
    }
  }, [dispatchDownTask, subordinateSquadrons]);

  // === 各种具体待办任务提取 ===

  // 1. 待我签收 (中队 & 大队直达签收)
  const pendingSignTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      return myNode && myNode.status === 'PENDING_SIGN';
    });
  }, [tasks, currentRole.unitId]);

  // 2. 待转派中队 (大队: 支队下发至大队，大队已签收或待签收，且未下发中队，也未自办反馈)
  const brigadeDispatchDownTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      // 用户明确要求：大队自发指令不在此页签，仅上级派给大队的指令
      if (t.creatorUnitId === currentRole.unitId) return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      if (!myNode) return false;

      // 互斥逻辑1: 若大队已转派给中队，则在「待转派中队」中彻底消失！
      const hasSquadrons = t.executionNodes.some(
        (n) => n.unitLevel === 'squadron' && (n.parentId === myNode.id || n.parentId === `node-${currentRole.unitId}`)
      );
      if (hasSquadrons) return false;

      // 互斥逻辑2: 若大队已进行了自办处置反馈，则在「待转派中队」中彻底消失！
      if (myNode.status === 'FEEDBACK_SUBMITTED' || myNode.status === 'AUDITED_PASS') return false;
      const hasDirectFeedback = myNode.vehiclesStatus?.some((vs) => vs.isIntercepted);
      if (hasDirectFeedback) return false;

      // 待转派状态：已签收或待签收
      return myNode.status === 'SIGNED' || myNode.status === 'PENDING_SIGN';
    });
  }, [tasks, currentRole.unitId]);

  // 3. 待处置反馈 (中队路面执勤席 / 大队自办直办)
  const pendingFeedbackTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      if (!myNode) return false;

      if (currentRole.level === 'brigade') {
        // 用户明确要求：大队自发指令不需要在「待处置反馈」中跟进 (在指令管理或待大队初审中)
        if (t.creatorUnitId === currentRole.unitId) return false;

        // 互斥逻辑: 若大队已选择了再下发中队，则在「待处置反馈」中立即消失！
        const hasSquadrons = t.executionNodes.some(
          (n) => n.unitLevel === 'squadron' && (n.parentId === myNode.id || n.parentId === `node-${currentRole.unitId}`)
        );
        if (hasSquadrons) return false;

        // 大队自办直办：大队已签收或已自办反馈
        if (myNode.status === 'SIGNED' || myNode.status === 'FEEDBACK_SUBMITTED') {
          if (t.directiveType === 'TEXT') {
            return !myNode.feedbackText || myNode.status === 'SIGNED';
          }
          return t.vehicles.some(
            (v) => !v.isIntercepted || v.vehicleAuditStatus === 'PENDING' || v.vehicleAuditStatus === 'REJECTED'
          );
        }
        return false;
      } else if (currentRole.level === 'squadron') {
        // 中队待处置反馈：中队已签收或已反馈
        if (myNode.status === 'SIGNED' || myNode.status === 'FEEDBACK_SUBMITTED') {
          if (t.directiveType === 'TEXT') {
            return !myNode.feedbackText || myNode.status === 'SIGNED';
          }
          return t.vehicles.some(
            (v) => !v.isIntercepted || v.vehicleAuditStatus === 'PENDING'
          );
        }
        return false;
      }
      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 4. 待大队初审 (大队：中队提交反馈后，不论是转派指令还是大队自发指令，均在此审核)
  const brigadeAuditTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const mySubSquadronIds = MOCK_ORG_UNITS.filter((u) => u.parentId === currentRole.unitId).map((u) => u.id);
      const squadronNodes = t.executionNodes.filter(
        (n) =>
          n.unitLevel === 'squadron' &&
          (mySubSquadronIds.includes(n.unitId) ||
            n.parentId === `node-${currentRole.unitId}` ||
            n.parentId?.startsWith('node-brigade-01'))
      );
      return squadronNodes.some((n) => {
        if (t.directiveType === 'TEXT') {
          return n.status === 'FEEDBACK_SUBMITTED' && (!n.brigadeAudit || !n.brigadeAudit.result);
        }
        return (
          n.vehiclesStatus?.some((vs) => vs.isIntercepted && vs.auditStatus === 'PENDING') ||
          n.status === 'FEEDBACK_SUBMITTED'
        );
      });
    });
  }, [tasks, currentRole.unitId]);

  // 5. 待审批退单申请 (大队审核中队退单 / 支队审核大队退单)
  const pendingReturnConfirmTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      if (t.returnRequest?.status !== 'PENDING_CONFIRM') return false;
      if (currentRole.level === 'branch') return true;
      if (currentRole.level === 'brigade') {
        const mySubSquadronIds = MOCK_ORG_UNITS.filter((u) => u.parentId === currentRole.unitId).map((u) => u.id);
        return (
          mySubSquadronIds.includes(t.returnRequest.requestedByUnitId) ||
          t.creatorUnitId === currentRole.unitId
        );
      }
      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 6. 驳回待整改 (中队路面重新采集 / 大队整改跟进)
  const rejectedFixTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      if (currentRole.level === 'squadron') {
        const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
        if (!myNode) return false;
        if (t.directiveType === 'TEXT') {
          return myNode.status === 'REJECTED';
        }
        return t.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED');
      } else if (currentRole.level === 'brigade') {
        const mySubSquadronIds = MOCK_ORG_UNITS.filter((u) => u.parentId === currentRole.unitId).map((u) => u.id);
        const hasRelevantNode = t.executionNodes.some(
          (n) => n.unitId === currentRole.unitId || mySubSquadronIds.includes(n.unitId)
        );
        if (t.directiveType === 'TEXT') {
          return t.executionNodes.some(
            (n) => (n.unitId === currentRole.unitId || mySubSquadronIds.includes(n.unitId)) && n.status === 'REJECTED'
          );
        }
        return hasRelevantNode && t.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED');
      }
      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 7. 待支队终审 (支队)
  const branchAuditTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      if (t.directiveType === 'TEXT') {
        return t.executionNodes.some((n) => {
          if (n.unitLevel === 'squadron') {
            return n.brigadeAudit?.result === 'PASS' && (!n.branchAudit || n.branchAudit.result !== 'PASS');
          }
          if (n.unitLevel === 'brigade') {
            const hasSquadrons = t.executionNodes.some(
              (sn) => sn.unitLevel === 'squadron' && (sn.parentId === n.id || sn.parentId === `node-${n.unitId}`)
            );
            if (!hasSquadrons) {
              return (
                (n.status === 'FEEDBACK_SUBMITTED' || n.status === 'AUDITED_PASS') &&
                (!n.branchAudit || n.branchAudit.result !== 'PASS')
              );
            }
          }
          return false;
        });
      }
      return t.vehicles.some((v) => {
        if (v.vehicleAuditStatus !== 'PENDING' && v.vehicleAuditStatus !== 'BRIGADE_PASSED') return false;
        const node = t.executionNodes.find((n) =>
          n.vehiclesStatus?.some((vs) => vs.vehicleId === v.id && vs.isIntercepted)
        );
        if (!node) return false;
        if (node.unitLevel === 'squadron') {
          return v.brigadeAuditRemarks || true;
        }
        return true;
      });
    });
  }, [tasks]);

  // 8. 错件待更正重发 (支队指挥长 / 大队自发退单)
  const returnedDraftTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'RETURNED_DRAFT') return false;
      if (currentRole.level === 'branch') return true;
      if (currentRole.level === 'brigade') {
        return t.creatorUnitId === currentRole.unitId;
      }
      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 依据用户当前角色确定可显示的页签清单 (大队页签顺序严格按照用户指定：1.待我签收 2.待转派中队 3.待处置反馈 4.待大队初审 5.错件退单审批)
  const roleTabs = useMemo(() => {
    if (currentRole.level === 'squadron') {
      return [
        {
          key: 'PENDING_SIGN',
          label: '待我签收',
          count: pendingSignTasks.length,
          icon: Clock,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-600 text-white',
          desc: '接收上级下达指令并在规定时限内核验签收',
        },
        {
          key: 'PENDING_FEEDBACK',
          label: '待处置反馈',
          count: pendingFeedbackTasks.length,
          icon: Car,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badgeColor: 'bg-indigo-600 text-white',
          desc: '路面布控查扣，录入处罚决定书等要素佐证',
        },
        {
          key: 'REJECTED_FIX',
          label: '驳回待整改',
          count: rejectedFixTasks.length,
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-600 text-white',
          desc: '审核未通过退回补充证据材料',
        },
      ];
    } else if (currentRole.level === 'brigade') {
      return [
        {
          key: 'PENDING_SIGN',
          label: '待我签收',
          count: pendingSignTasks.length,
          icon: Clock,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-600 text-white',
          desc: '支队直达大队指令，核验证据要素并在线快速签收启动责任',
        },
        {
          key: 'BRIGADE_DISPATCH_DOWN',
          label: '待转派中队',
          count: brigadeDispatchDownTasks.length,
          icon: GitBranch,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badgeColor: 'bg-amber-600 text-white',
          desc: '已签收上级指令，可二次转派给下辖各中队执勤（与大队自办反馈互斥，二选一）',
        },
        {
          key: 'PENDING_FEEDBACK',
          label: '待处置反馈',
          count: pendingFeedbackTasks.length,
          icon: Car,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badgeColor: 'bg-indigo-600 text-white',
          desc: '大队自办直办处置，填报拦截处罚凭证（与下发中队互斥，二选一）',
        },
        {
          key: 'BRIGADE_AUDIT',
          label: '待大队初审',
          count: brigadeAuditTasks.length,
          icon: FileCheck,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-600 text-white',
          desc: '核实下辖中队提交的处置凭证并审核上报支队终审',
        },
        {
          key: 'REJECTED_FIX',
          label: '驳回待整改',
          count: rejectedFixTasks.length,
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-600 text-white',
          desc: '上级终审驳回或中队反馈被驳回需整改补充凭证',
        },
        {
          key: 'RETURN_CONFIRM',
          label: '错件退单审批',
          count: pendingReturnConfirmTasks.length,
          icon: RotateCcw,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badgeColor: 'bg-amber-600 text-white',
          desc: '下辖中队申请退回修改的错件待大队指挥长核准确认',
        },
        {
          key: 'RETURNED_DRAFT',
          label: '退单待更正重发',
          count: returnedDraftTasks.length,
          icon: AlertCircle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-600 text-white',
          desc: '大队自发错派退回工单，更正目标责任单位后重新下发',
        },
      ];
    } else {
      // branch (支队)
      return [
        {
          key: 'BRANCH_AUDIT',
          label: '待支队终审',
          count: branchAuditTasks.length,
          icon: Shield,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-600 text-white',
          desc: '大队初审通过或自办反馈，终审通过后指令自动完结归档',
        },
        {
          key: 'RETURN_CONFIRM',
          label: '错件退单审批',
          count: pendingReturnConfirmTasks.length,
          icon: RotateCcw,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badgeColor: 'bg-amber-600 text-white',
          desc: '下级大队/中队申请退单待支队指挥长核准',
        },
        {
          key: 'RETURNED_DRAFT',
          label: '退单待更正重发',
          count: returnedDraftTasks.length,
          icon: AlertCircle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-600 text-white',
          desc: '已确认错派退回工单，更正目标责任单位后重新下发',
        },
      ];
    }
  }, [
    currentRole.level,
    pendingSignTasks.length,
    pendingFeedbackTasks.length,
    rejectedFixTasks.length,
    brigadeAuditTasks.length,
    brigadeDispatchDownTasks.length,
    pendingReturnConfirmTasks.length,
    branchAuditTasks.length,
    returnedDraftTasks.length,
  ]);

  // 根据当前 activeTab 获取原始列表
  const currentTabRawTasks = useMemo(() => {
    switch (activeTab) {
      case 'PENDING_SIGN':
        return pendingSignTasks;
      case 'PENDING_FEEDBACK':
        return pendingFeedbackTasks;
      case 'REJECTED_FIX':
        return rejectedFixTasks;
      case 'BRIGADE_AUDIT':
        return brigadeAuditTasks;
      case 'BRIGADE_DISPATCH_DOWN':
        return brigadeDispatchDownTasks;
      case 'RETURN_CONFIRM':
        return pendingReturnConfirmTasks;
      case 'BRANCH_AUDIT':
        return branchAuditTasks;
      case 'RETURNED_DRAFT':
        return returnedDraftTasks;
      default:
        return pendingSignTasks;
    }
  }, [
    activeTab,
    pendingSignTasks,
    pendingFeedbackTasks,
    rejectedFixTasks,
    brigadeAuditTasks,
    brigadeDispatchDownTasks,
    pendingReturnConfirmTasks,
    branchAuditTasks,
    returnedDraftTasks,
  ]);

  // 进行搜索与过滤
  const filteredTasks = useMemo(() => {
    return currentTabRawTasks.filter((task) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTaskNo = task.taskNo.toLowerCase().includes(query);
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchPlate = task.vehicles.some((v) => v.plateNo.toLowerCase().includes(query));
        if (!matchTaskNo && !matchTitle && !matchPlate) return false;
      }
      if (selectedCategory !== 'ALL' && task.category !== selectedCategory) {
        return false;
      }
      if (selectedUrgency !== 'ALL' && task.urgency !== selectedUrgency) {
        return false;
      }
      return true;
    });
  }, [currentTabRawTasks, searchTerm, selectedCategory, selectedUrgency]);

  // 分页计算 (满足需求：每个页签下的待办列表记录都要有分页显示)
  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }, [filteredTasks, startIndex, pageSize]);

  // 快速签收
  const handleQuickSign = (task: DispatchTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.unitId === currentRole.unitId) {
        return {
          ...n,
          status: 'SIGNED' as const,
          signedAt: nowStr,
          signedBy: `${currentRole.userName} (${currentRole.policeNo})`,
        };
      }
      return n;
    });

    const updatedTask: DispatchTask = {
      ...task,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-sign-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '指令快速签收',
          details: `${currentRole.unitName}民警 ${currentRole.userName} 已完成在线签收，责任时限已正式启动。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setSuperviseToast(`已成功在线签收指令【${task.taskNo}】，责任时限已正式启动！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 打开错件退单审批弹窗
  const openReturnApprovalModal = (task: DispatchTask) => {
    setReturnApprovalTask(task);
    setApprovalDecision('AGREE');
    setApprovalReason('核实属非本辖区管辖，同意退回修改，工单重回发令池重新下发。');
  };

  // 切换审批决策并智能设置预设理由
  const handleSelectDecision = (decision: 'AGREE' | 'REJECT') => {
    setApprovalDecision(decision);
    if (decision === 'AGREE') {
      setApprovalReason('核实属非本辖区管辖，同意退回修改，工单重回发令池重新下发。');
    } else {
      setApprovalReason('经指挥中心核实，该车辆仍在该辖区主要通道，证据不足以退单，维持原派发，请继续排查拦截。');
    }
  };

  // 确认提交退回审批结论 (支持 同意 / 驳回)
  const handleConfirmReturnApproval = () => {
    if (!returnApprovalTask || !returnApprovalTask.returnRequest) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const task = returnApprovalTask;
    const reasonText = approvalReason.trim() || (approvalDecision === 'AGREE' ? '同意退回修改。' : '驳回退回申请。');

    if (approvalDecision === 'AGREE') {
      const updatedTask: DispatchTask = {
        ...task,
        overallStatus: 'RETURNED_DRAFT',
        returnRequest: {
          ...task.returnRequest,
          status: 'CONFIRMED',
          confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
          confirmedTime: nowStr,
          confirmRemarks: reasonText,
        },
        executionNodes: [],
        actionLogs: [
          ...task.actionLogs,
          {
            id: `log-ret-appr-${Date.now()}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '确认退回修改',
            details: `${currentRole.unitName} 审批结论：【同意退回修改】。审批理由：${reasonText}。下级待办彻底释放，工单返回待更正重发池。`,
          },
        ],
      };

      onUpdateTask(updatedTask);

      // 触发系统消息提醒 (推送给申请退单的下级单位)
      if (onAddNotice && task.returnRequest) {
        onAddNotice({
          id: `notice-ret-appr-${Date.now()}`,
          type: 'RETURN_APPROVED',
          targetUnitId: task.returnRequest.requestedByUnitId,
          targetUnitName: task.returnRequest.requestedByUnitName,
          targetLevel: task.returnRequest.requestedByUnitId.startsWith('squadron') ? 'squadron' : 'brigade',
          taskId: task.id,
          taskNo: task.taskNo,
          taskTitle: task.title,
          title: '错件退回申请已审批通过',
          content: `${currentRole.unitName} 审核同意了贵单位关于指令【${task.taskNo}】的错派退回申请。审批理由：${reasonText}。本单位责任已释放，工单已退回待更正重发。`,
          urgency: task.urgency,
          timestamp: nowStr,
          isRead: false,
          isDismissedFromToast: false,
          actionType: 'VIEW_TASK',
        });
      }

      setSuperviseToast(`已同意指令【${task.taskNo}】退回申请，工单已流转至“退单待更正重发”！`);
    } else {
      // 驳回退回申请
      const updatedTask: DispatchTask = {
        ...task,
        returnRequest: {
          ...task.returnRequest,
          status: 'REJECTED',
          confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
          confirmedTime: nowStr,
          confirmRemarks: reasonText,
        },
        executionNodes: task.executionNodes.map((n) => {
          if (n.unitId === task.returnRequest?.requestedByUnitId) {
            return { ...n, status: 'SIGNED' as const };
          }
          return n;
        }),
        actionLogs: [
          ...task.actionLogs,
          {
            id: `log-ret-rej-${Date.now()}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '驳回退回申请',
            details: `${currentRole.unitName} 审批结论：【驳回退回申请】。驳回理由：${reasonText}。指令维持原责任执行。`,
          },
        ],
      };

      onUpdateTask(updatedTask);

      // 触发系统消息提醒 (推送给申请退单的下级单位)
      if (onAddNotice && task.returnRequest) {
        onAddNotice({
          id: `notice-ret-rej-${Date.now()}`,
          type: 'AUDIT_REJECTED',
          targetUnitId: task.returnRequest.requestedByUnitId,
          targetUnitName: task.returnRequest.requestedByUnitName,
          targetLevel: task.returnRequest.requestedByUnitId.startsWith('squadron') ? 'squadron' : 'brigade',
          taskId: task.id,
          taskNo: task.taskNo,
          taskTitle: task.title,
          title: '错件退回申请已被驳回',
          content: `${currentRole.unitName} 驳回了贵单位关于指令【${task.taskNo}】的退单申请。驳回理由：${reasonText}。请按原指令要求继续排查拦截。`,
          urgency: '特急',
          timestamp: nowStr,
          isRead: false,
          isDismissedFromToast: false,
          actionType: 'VIEW_TASK',
        });
      }

      setSuperviseToast(`已驳回指令【${task.taskNo}】退回申请，指令维持原派发责任继续执行！`);
    }

    setReturnApprovalTask(null);
    setTimeout(() => setSuperviseToast(null), 3500);
  };

  // 确认再下发中队 (大队选择转派中队)
  const handleConfirmDispatchDown = () => {
    if (!dispatchDownTask || selectedSquadronIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let brigadeNode = dispatchDownTask.executionNodes.find((n) => n.unitId === currentRole.unitId);
    const brigadeNodeId = brigadeNode ? brigadeNode.id : `node-${currentRole.unitId}-${Date.now()}`;

    const updatedBrigadeNode: TaskExecutionNode = brigadeNode
      ? {
          ...brigadeNode,
          status: 'DISPATCHED_DOWN',
          signedAt: brigadeNode.signedAt || nowStr,
          signedBy: brigadeNode.signedBy || `${currentRole.userName} (${currentRole.policeNo})`,
        }
      : {
          id: brigadeNodeId,
          taskId: dispatchDownTask.id,
          unitId: currentRole.unitId,
          unitName: currentRole.unitName,
          unitLevel: 'brigade',
          status: 'DISPATCHED_DOWN',
          signedAt: nowStr,
          signedBy: `${currentRole.userName} (${currentRole.policeNo})`,
        };

    // 为每个选中的中队创建执行节点
    const newSquadronNodes: TaskExecutionNode[] = selectedSquadronIds.map((sqId) => {
      const sq = subordinateSquadrons.find((s) => s.id === sqId);
      return {
        id: `node-${sqId}-${Date.now()}`,
        taskId: dispatchDownTask.id,
        unitId: sqId,
        unitName: sq?.name || '执勤中队',
        unitLevel: 'squadron' as const,
        parentId: brigadeNodeId,
        status: 'PENDING_SIGN' as const,
        vehiclesStatus: dispatchDownTask.vehicles.map((v) => ({
          vehicleId: v.id,
          plateNo: v.plateNo,
          plateType: v.plateType,
          isIntercepted: false,
          auditStatus: 'PENDING',
        })),
      };
    });

    const otherNodes = dispatchDownTask.executionNodes.filter((n) => n.unitId !== currentRole.unitId);
    const updatedNodes = [...otherNodes, updatedBrigadeNode, ...newSquadronNodes];

    const selectedSquadronNames = selectedSquadronIds
      .map((id) => subordinateSquadrons.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join('、');

    const updatedTask: DispatchTask = {
      ...dispatchDownTask,
      executionNodes: updatedNodes,
      actionLogs: [
        ...dispatchDownTask.actionLogs,
        {
          id: `log-disp-down-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '大队转派下发中队',
          details: `${currentRole.unitName} 已将指令二次分派至辖区：${selectedSquadronNames}。要求路面警力立即就位拦截！备注：${dispatchDownNotes}`,
        },
      ],
    };

    onUpdateTask(updatedTask);

    // 触发系统消息提醒 (推送给所有被下发中队待签收)
    selectedSquadronIds.forEach((sqId) => {
      const sq = subordinateSquadrons.find((s) => s.id === sqId);
      if (sq && onAddNotice) {
        onAddNotice({
          id: `notice-disp-${Date.now()}-${sqId}`,
          type: 'DISPATCH_NEW',
          targetUnitId: sqId,
          targetUnitName: sq.name,
          targetLevel: 'squadron',
          taskId: dispatchDownTask.id,
          taskNo: dispatchDownTask.taskNo,
          taskTitle: dispatchDownTask.title,
          title: '您有新的待签收指令 (大队转派)',
          content: `${currentRole.unitName} 已将指令【${dispatchDownTask.taskNo}】转派至贵中队，请及时在规定时限内签收并组织警力查扣。`,
          urgency: dispatchDownTask.urgency,
          timestamp: nowStr,
          isRead: false,
          isDismissedFromToast: false,
          actionType: 'GOTO_TODO',
          actionTab: 'PENDING_SIGN',
        });
      }
    });

    setDispatchDownTask(null);
    setSuperviseToast(`已成功将指令【${dispatchDownTask.taskNo}】转派至 ${selectedSquadronNames}，路面待办已激活！`);
    setTimeout(() => setSuperviseToast(null), 3500);
  };

  // 提交退回申请（下级）
  const handleConfirmReturnRequest = () => {
    if (!returnDialogTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonFull = `${returnPreset}。${returnDetail.trim() || '申请退回修改。'}`;

    const updatedTask: DispatchTask = {
      ...returnDialogTask,
      returnRequest: {
        requestedByUnitId: currentRole.unitId,
        requestedByUnitName: currentRole.unitName,
        requestedByName: `${currentRole.userName} (${currentRole.policeNo})`,
        requestedTime: nowStr,
        reason: reasonFull,
        status: 'PENDING_CONFIRM',
      },
      executionNodes: returnDialogTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return { ...n, status: 'RETURN_PENDING' as const };
        }
        return n;
      }),
      actionLogs: [
        ...returnDialogTask.actionLogs,
        {
          id: `log-ret-req-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '提起退回修改申请',
          details: `${currentRole.unitName} 提起退单申请：【${reasonFull}】。`,
        },
      ],
    };

    onUpdateTask(updatedTask);

    if (onAddNotice && currentRole.level === 'squadron') {
      const parentUnit = MOCK_ORG_UNITS.find((u) => u.id === currentRole.unitId);
      const targetBrigadeId = parentUnit?.parentId || 'brigade-01';
      const targetBrigade = MOCK_ORG_UNITS.find((u) => u.id === targetBrigadeId);
      onAddNotice({
        id: `notice-sq-ret-${Date.now()}`,
        type: 'SQUADRON_RETURN_REQUEST',
        targetUnitId: targetBrigadeId,
        targetUnitName: targetBrigade?.name || '直属一大队',
        targetLevel: 'brigade',
        taskId: returnDialogTask.id,
        taskNo: returnDialogTask.taskNo,
        taskTitle: returnDialogTask.title,
        title: '中队错件申请退单待大队审批',
        content: `${currentRole.unitName} 就指令【${returnDialogTask.taskNo}】提交错件退单申请。理由：【${reasonFull}】。请大队指挥员及时审批。`,
        urgency: returnDialogTask.urgency,
        timestamp: '刚刚',
        isRead: false,
        isDismissedFromToast: false,
        actionTab: 'RETURN_CONFIRM',
        actionType: 'GOTO_TODO',
      });
    }

    setReturnDialogTask(null);
    setReturnDetail('');
  };

  // 一键催办督办
  const handleSuperviseTask = (task: DispatchTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedTask: DispatchTask = {
      ...task,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-sup-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '指挥催办督办',
          details: `${currentRole.unitName} 指挥调度席发出限时加急催办督办通知，要求责任单位立即处置上报！`,
        },
      ],
    };
    onUpdateTask(updatedTask);
    setSuperviseToast(`已向指令【${task.taskNo}】所有承办单位下发加急督办提醒！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 批量操作状态与交互 (方案2)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBatchDispatchModalOpen, setIsBatchDispatchModalOpen] = useState(false);
  const [batchDispatchSquadronIds, setBatchDispatchSquadronIds] = useState<string[]>([]);
  const [batchDispatchNotes, setBatchDispatchNotes] = useState('');

  // 切换页签或筛选条件时清空勾选
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [activeTab, searchTerm, selectedCategory, selectedUrgency, currentPage]);

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAllCurrentPage = () => {
    const pageIds = paginatedTasks.map((t) => t.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // 1. 一键批量签收
  const handleBatchSign = () => {
    if (selectedTaskIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let count = 0;

    selectedTaskIds.forEach((taskId) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const updatedNodes = targetTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return {
            ...n,
            status: 'SIGNED' as const,
            signedAt: nowStr,
            signedBy: `${currentRole.userName} (${currentRole.policeNo})`,
          };
        }
        return n;
      });

      const updatedTask: DispatchTask = {
        ...targetTask,
        executionNodes: updatedNodes,
        actionLogs: [
          ...targetTask.actionLogs,
          {
            id: `log-batch-sign-${Date.now()}-${taskId}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '批量签收指令',
            details: `${currentRole.unitName} 批量完成了此指令的在线签收接收。`,
          },
        ],
      };

      onUpdateTask(updatedTask);
      count++;
    });

    setSelectedTaskIds([]);
    setSuperviseToast(`已成功批量签收 ${count} 项待办指令！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 2. 一键批量大队初审通过
  const handleBatchBrigadeAudit = () => {
    if (selectedTaskIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let count = 0;

    selectedTaskIds.forEach((taskId) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const updatedVehicles = targetTask.vehicles.map((v) => {
        if (v.isIntercepted && (v.vehicleAuditStatus === 'PENDING' || !v.vehicleAuditStatus)) {
          return {
            ...v,
            vehicleAuditStatus: 'BRIGADE_PASSED' as const,
            brigadeAuditTime: nowStr,
            brigadeAuditOperator: `${currentRole.userName} (${currentRole.policeNo})`,
            brigadeAuditRemarks: '大队批量初审合格，准予报送支队终审。',
          };
        }
        return v;
      });

      const updatedNodes = targetTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return {
            ...n,
            status: 'AUDITED_PASS' as const,
          };
        }
        return n;
      });

      const updatedTask: DispatchTask = {
        ...targetTask,
        vehicles: updatedVehicles,
        executionNodes: updatedNodes,
        actionLogs: [
          ...targetTask.actionLogs,
          {
            id: `log-batch-audit-${Date.now()}-${taskId}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '批量大队初审通过',
            details: `${currentRole.unitName} 批量完成了指令内车辆处置凭证的初审把关，已通过报送支队。`,
          },
        ],
      };

      onUpdateTask(updatedTask);
      count++;
    });

    setSelectedTaskIds([]);
    setSuperviseToast(`已成功批量初审通过 ${count} 项待办指令！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 3. 一键批量支队终审通过
  const handleBatchBranchAudit = () => {
    if (selectedTaskIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let count = 0;

    selectedTaskIds.forEach((taskId) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const updatedVehicles = targetTask.vehicles.map((v) => {
        if (v.isIntercepted && (v.vehicleAuditStatus === 'BRIGADE_PASSED' || v.vehicleAuditStatus === 'PENDING' || !v.vehicleAuditStatus)) {
          return {
            ...v,
            vehicleAuditStatus: 'PASSED' as const,
            branchAuditTime: nowStr,
            branchAuditOperator: `${currentRole.userName} (${currentRole.policeNo})`,
            branchAuditRemarks: '支队批量终审核准通过，归档办结。',
          };
        }
        return v;
      });

      const passedCount = updatedVehicles.filter((v) => v.vehicleAuditStatus === 'PASSED').length;
      const isCompleted =
        targetTask.completionRule === 'ANY_COMPLETE'
          ? passedCount >= 1
          : passedCount === updatedVehicles.length && updatedVehicles.length > 0;

      const updatedNodes = targetTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return {
            ...n,
            status: 'AUDITED_PASS' as const,
          };
        }
        return n;
      });

      const updatedTask: DispatchTask = {
        ...targetTask,
        vehicles: updatedVehicles,
        executionNodes: updatedNodes,
        overallStatus: isCompleted ? 'COMPLETED' : targetTask.overallStatus,
        actionLogs: [
          ...targetTask.actionLogs,
          {
            id: `log-batch-audit-branch-${Date.now()}-${taskId}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '批量支队终审通过',
            details: `市交警支队批量终审核验通过。${isCompleted ? '整单全量闭环完结！' : ''}`,
          },
        ],
      };

      onUpdateTask(updatedTask);
      count++;
    });

    setSelectedTaskIds([]);
    setSuperviseToast(`已成功批量终审通过 ${count} 项待办指令！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 4. 一键批量核准同意退单
  const handleBatchConfirmReturn = () => {
    if (selectedTaskIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let count = 0;

    selectedTaskIds.forEach((taskId) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || !targetTask.returnRequest) return;

      const reqUnitId = targetTask.returnRequest.requestedByUnitId;
      const reqUnitName = targetTask.returnRequest.requestedByUnitName;

      const updatedTask: DispatchTask = {
        ...targetTask,
        overallStatus: 'RETURNED_DRAFT',
        returnRequest: {
          ...targetTask.returnRequest,
          status: 'CONFIRMED',
          confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
          confirmedTime: nowStr,
          confirmRemarks: '批量核准同意退回修改，原执行单位解除时限责任。',
        },
        executionNodes: targetTask.executionNodes.filter((n) => n.unitId !== reqUnitId),
        actionLogs: [
          ...targetTask.actionLogs,
          {
            id: `log-batch-ret-${Date.now()}-${taskId}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '批量核准退单通过',
            details: `${currentRole.unitName} 批量核准同意 ${reqUnitName} 的错件退单申请，整单退回修改重发。`,
          },
        ],
      };

      onUpdateTask(updatedTask);

      if (onAddNotice) {
        onAddNotice({
          id: `notice-ret-appr-${Date.now()}-${taskId}`,
          type: 'RETURN_APPROVED',
          targetUnitId: reqUnitId,
          targetUnitName: reqUnitName,
          targetLevel: reqUnitId.startsWith('squadron') ? 'squadron' : 'brigade',
          taskId: targetTask.id,
          taskNo: targetTask.taskNo,
          taskTitle: targetTask.title,
          title: '错件申请退回已获批量核准同意',
          content: `${currentRole.unitName} 已批量同意您对指令【${targetTask.taskNo}】的退回申请，责任考核与待办已解除。`,
          urgency: targetTask.urgency,
          timestamp: '刚刚',
          isRead: false,
          isDismissedFromToast: false,
          actionType: 'VIEW_TASK',
        });
      }

      count++;
    });

    setSelectedTaskIds([]);
    setSuperviseToast(`已成功批量同意 ${count} 项指令的错件退单申请！`);
    setTimeout(() => setSuperviseToast(null), 3000);
  };

  // 5. 批量转派中队确认执行
  const handleConfirmBatchDispatchDown = () => {
    if (batchDispatchSquadronIds.length === 0 || selectedTaskIds.length === 0) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const selectedSquadronNames = subordinateSquadrons
      .filter((s) => batchDispatchSquadronIds.includes(s.id))
      .map((s) => s.name)
      .join('、');

    let count = 0;
    selectedTaskIds.forEach((taskId) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const myNode = targetTask.executionNodes.find((n) => n.unitId === currentRole.unitId);
      const existingSquadronUnitIds = targetTask.executionNodes
        .filter((n) => n.unitLevel === 'squadron')
        .map((n) => n.unitId);

      const squadronsToCreate = batchDispatchSquadronIds.filter(
        (id) => !existingSquadronUnitIds.includes(id)
      );

      const newSquadronNodes: TaskExecutionNode[] = squadronsToCreate.map((sqId) => {
        const sq = subordinateSquadrons.find((s) => s.id === sqId);
        return {
          id: `node-${Date.now()}-${taskId}-${sqId}`,
          taskId: targetTask.id,
          unitId: sqId,
          unitName: sq ? sq.name : '直属中队',
          unitLevel: 'squadron',
          status: 'DISPATCHED',
          dispatchedAt: nowStr,
          parentId: myNode ? myNode.id : undefined,
        };
      });

      const updatedNodes = targetTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return {
            ...n,
            status: 'DISPATCHED_DOWN' as const,
            hasDispatchedToSquadron: true,
          };
        }
        return n;
      });

      const updatedTask: DispatchTask = {
        ...targetTask,
        executionNodes: [...updatedNodes, ...newSquadronNodes],
        actionLogs: [
          ...targetTask.actionLogs,
          {
            id: `log-batch-disp-${Date.now()}-${taskId}`,
            timestamp: nowStr,
            operatorName: currentRole.userName,
            operatorUnit: currentRole.unitName,
            action: '大队批量转派下发中队',
            details: `${currentRole.unitName} 批量将指令二次分派至辖区：${selectedSquadronNames}。备注：${batchDispatchNotes || '无'}`,
          },
        ],
      };

      onUpdateTask(updatedTask);

      // Trigger notices for newly dispatched squadrons
      batchDispatchSquadronIds.forEach((sqId) => {
        const sq = subordinateSquadrons.find((s) => s.id === sqId);
        if (sq && onAddNotice) {
          onAddNotice({
            id: `notice-batch-disp-${Date.now()}-${sqId}-${taskId}`,
            type: 'DISPATCH_NEW',
            targetUnitId: sqId,
            targetUnitName: sq.name,
            targetLevel: 'squadron',
            taskId: targetTask.id,
            taskNo: targetTask.taskNo,
            taskTitle: targetTask.title,
            title: '您有新的待签收指令 (大队批量转派)',
            content: `${currentRole.unitName} 已将指令【${targetTask.taskNo}】批量转派至贵中队，请及时签收并组织警力查扣。`,
            urgency: targetTask.urgency,
            timestamp: '刚刚',
            isRead: false,
            isDismissedFromToast: false,
            actionType: 'GOTO_TODO',
            actionTab: 'PENDING_SIGN',
          });
        }
      });

      count++;
    });

    setSelectedTaskIds([]);
    setIsBatchDispatchModalOpen(false);
    setBatchDispatchSquadronIds([]);
    setBatchDispatchNotes('');
    setSuperviseToast(`已成功将 ${count} 项指令批量转派至 ${selectedSquadronNames}！`);
    setTimeout(() => setSuperviseToast(null), 3500);
  };

  // 计算当前角色全部待办总数
  const totalRolePendingCount = roleTabs.reduce((acc, tab) => acc + tab.count, 0);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-5 space-y-4">
      {/* 督办提示轻提示 */}
      {superviseToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900/90 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{superviseToast}</span>
        </div>
      )}

      {/* 根据登录用户部门权限分别展示不同待办任务页签 (Requirement 二) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* 页签导航条 */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.2 rounded-full font-mono font-bold ${
                    tab.count > 0 ? tab.badgeColor : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 当前页签说明与搜索过滤区 */}
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            {roleTabs.find((t) => t.key === activeTab)?.desc}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 关键词搜索 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单号、标题、车牌..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 业务类别筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">全部业务类别</option>
              <option value="车辆缉查">车辆缉查</option>
              <option value="隐患治理">隐患治理</option>
              <option value="违法查处">违法查处</option>
              <option value="重点管控">重点管控</option>
              <option value="专项整治">专项整治</option>
            </select>

            {/* 紧急程度筛选 */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">全部紧急程度</option>
              <option value="特急">特急</option>
              <option value="紧急">紧急</option>
              <option value="常规">常规</option>
            </select>

            {(searchTerm || selectedCategory !== 'ALL' || selectedUrgency !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedUrgency('ALL');
                }}
                className="text-slate-500 hover:text-slate-800 text-xs px-2 py-1 underline"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {/* 全选与批量操作栏 (方案2) */}
        {filteredTasks.length > 0 && activeTab !== 'PENDING_FEEDBACK' && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={paginatedTasks.length > 0 && paginatedTasks.every((t) => selectedTaskIds.includes(t.id))}
                  onChange={handleToggleSelectAllCurrentPage}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>全选当前页 ({paginatedTasks.length} 项)</span>
              </label>

              {selectedTaskIds.length > 0 && (
                <span className="font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  已选择 {selectedTaskIds.length} 项指令
                </span>
              )}
            </div>

            {selectedTaskIds.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === 'PENDING_SIGN' && (
                  <button
                    id="btn-batch-sign"
                    onClick={handleBatchSign}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>一键批量签收 ({selectedTaskIds.length})</span>
                  </button>
                )}

                {activeTab === 'BRIGADE_DISPATCH_DOWN' && (
                  <button
                    id="btn-batch-dispatch-down"
                    onClick={() => {
                      setBatchDispatchSquadronIds([]);
                      setBatchDispatchNotes('');
                      setIsBatchDispatchModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>一键批量转派中队 ({selectedTaskIds.length})</span>
                  </button>
                )}

                {activeTab === 'BRIGADE_AUDIT' && (
                  <button
                    id="btn-batch-brigade-audit"
                    onClick={handleBatchBrigadeAudit}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>一键批量初审通过 ({selectedTaskIds.length})</span>
                  </button>
                )}

                {activeTab === 'BRANCH_AUDIT' && (
                  <button
                    id="btn-batch-branch-audit"
                    onClick={handleBatchBranchAudit}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>一键批量终审通过 ({selectedTaskIds.length})</span>
                  </button>
                )}

                {activeTab === 'RETURN_CONFIRM' && (
                  <button
                    id="btn-batch-confirm-return"
                    onClick={handleBatchConfirmReturn}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>一键批量同意退回 ({selectedTaskIds.length})</span>
                  </button>
                )}

                <button
                  id="btn-clear-selection"
                  onClick={() => setSelectedTaskIds([])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  取消勾选
                </button>
              </div>
            ) : (
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <span>💡 勾选多条指令可进行一键批量签收、转派或初审/终审</span>
              </span>
            )}
          </div>
        )}

        {/* 待办任务清单列表 */}
        <div className="p-4 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <div className="text-sm font-bold text-slate-800">
                当前页签下没有待办任务
              </div>
              <p className="text-xs text-slate-500">
                所有相关指令已按期响应或审批完成。
              </p>
            </div>
          ) : (
            paginatedTasks.map((task) => (
              <div
                key={`${activeTab}-${task.id}`}
                onClick={() => onSelectTask(task, filteredTasks)}
                className={`p-4 bg-white border rounded-xl cursor-pointer shadow-xs transition hover:shadow-md space-y-3 ${
                  activeTab !== 'PENDING_FEEDBACK' && selectedTaskIds.includes(task.id)
                    ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                {/* 顶部状态与标签 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab !== 'PENDING_FEEDBACK' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectTask(task.id);
                        }}
                        className="p-1 -ml-1 hover:bg-slate-100 rounded cursor-pointer flex items-center"
                        title={selectedTaskIds.includes(task.id) ? '取消勾选' : '勾选此指令'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    )}
                    <DirectiveFirstLineBadges task={task} />
                  </div>

                  <div className="text-[11px] text-slate-500">
                    下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span> · 
                    截止时限：<span className="font-mono text-rose-600 font-bold">{task.deadline}</span>
                  </div>
                </div>

                {/* 标题 */}
                <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition">
                  {task.title}
                </h3>

                {/* 目标车辆清单 或 文本指令要求 */}
                {task.directiveType === 'TEXT' ? (
                  <div className="space-y-2 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/80 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold text-indigo-950 flex items-center justify-between">
                          <span>指令内容及核查处置要求：</span>
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-[10px] font-medium">
                              <Paperclip className="w-3 h-3" />
                              <span>公文附件 ({task.attachments.length})</span>
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {task.content || '无具体文字要求'}
                        </p>
                      </div>
                    </div>

                    {/* 下级节点流转处置进度 */}
                    {task.executionNodes && task.executionNodes.length > 0 && (
                      <div className="pt-2 border-t border-indigo-100/60 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium">节点执行进度：</span>
                        {task.executionNodes.map((n) => {
                          let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                          let statusLabel = '待签收';
                          if (n.status === 'SIGNED') {
                            badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                            statusLabel = '已签收·待反馈';
                          } else if (n.status === 'FEEDBACK_SUBMITTED') {
                            badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                            statusLabel = '已反馈·待初审';
                          } else if (n.status === 'AUDITED_PASS') {
                            badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            statusLabel = '初审通过·待终审';
                          } else if (n.status === 'REJECTED') {
                            badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                            statusLabel = '已驳回·待整改';
                          } else if (n.status === 'COMPLETED') {
                            badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                            statusLabel = '终审通过·已办结';
                          } else if (n.status === 'DISPATCHED_DOWN') {
                            badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                            statusLabel = '已转派中队';
                          }

                          return (
                            <span
                              key={n.id}
                              className={`px-2 py-0.5 rounded border font-mono text-[10px] flex items-center gap-1 ${badgeStyle}`}
                            >
                              <span className="font-sans font-medium">{n.unitName}</span>
                              <span className="opacity-75 font-semibold">({statusLabel})</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium">涉及车辆 ({task.vehicles.length} 辆)：</span>
                    {task.vehicles.map((v) => (
                      <span
                        key={v.id}
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                          v.vehicleAuditStatus === 'REJECTED'
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : v.isIntercepted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        {v.plateNo}
                        {v.vehicleAuditStatus === 'REJECTED' && ' (被驳回)'}
                        {v.isIntercepted && v.vehicleAuditStatus !== 'REJECTED' && ' (已反馈)'}
                      </span>
                    ))}
                  </div>
                )}

                {/* 如果是文本指令且有被驳回的节点，直观展示驳回整改意见 */}
                {task.directiveType === 'TEXT' && (() => {
                  const rejectedNode = task.executionNodes.find(n => n.status === 'REJECTED');
                  if (!rejectedNode) return null;
                  const rejectAudit = rejectedNode.branchAudit?.result === 'REJECT' ? rejectedNode.branchAudit : rejectedNode.brigadeAudit;
                  return (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>【审核驳回待整改】{rejectedNode.unitName} 反馈未通过 · 意见：</span>
                      </div>
                      <div className="text-rose-950 font-medium pl-5 leading-relaxed">
                        {rejectAudit?.opinion || rejectAudit?.remarks || '请核实处置凭证后重新补充报送。'}
                      </div>
                    </div>
                  );
                })()}

                {/* 退单信息展示 (若有) */}
                {task.returnRequest && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>下级提起退单申请</span>
                    </div>
                    <div>申请单位：<strong>{task.returnRequest.requestedByUnitName}</strong> ({task.returnRequest.requestedByName})</div>
                    <div>退单原因：<span className="text-amber-950 font-medium">{task.returnRequest.reason}</span></div>
                  </div>
                )}

                {/* 大队：待转派中队 规则提示 */}
                {activeTab === 'BRIGADE_DISPATCH_DOWN' && (
                  <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong>二选一办理机制：</strong>大队可点击<strong>【再下发中队】</strong>二次分派（任务将移出待处置反馈）；亦可点击<strong>【大队自办反馈】</strong>由大队直办（任务将移出待转派中队）。
                      </span>
                    </div>
                  </div>
                )}

                {/* 大队：待处置反馈 规则提示 */}
                {activeTab === 'PENDING_FEEDBACK' && currentRole.level === 'brigade' && (
                  <div className="text-[11px] text-indigo-900 bg-indigo-50/80 p-2 rounded-lg border border-indigo-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        <strong>大队自办直办池：</strong>此处仅跟踪大队自办直办的待处置指令（大队自发指令在指令管理中跟进，中队提交后在待大队初审中审核）。若需转由中队路面拦截，可点击<strong>【转派中队执行】</strong>。
                      </span>
                    </div>
                  </div>
                )}

                {/* 底部信息与动作按钮 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    发令单位：<strong>{task.creatorUnitName}</strong> ({task.creatorName})
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* 中队/大队：错件退回 */}
                    {activeTab === 'PENDING_SIGN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReturnDialogTask(task);
                        }}
                        className="px-3 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition font-medium"
                      >
                        派错申请退回
                      </button>
                    )}

                    {/* 快速签收 */}
                    {activeTab === 'PENDING_SIGN' && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickSign(task, e)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>立即签收</span>
                      </button>
                    )}

                    {/* 大队：待转派中队 */}
                    {activeTab === 'BRIGADE_DISPATCH_DOWN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDispatchDownTask(task);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>再下发中队</span>
                      </button>
                    )}

                    {/* 待处置反馈 */}
                    {activeTab === 'PENDING_FEEDBACK' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOperationTask({ task, mode: 'FEEDBACK' });
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        {task.directiveType === 'TEXT' ? (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>填报反馈</span>
                          </>
                        ) : (
                          <>
                            <Car className="w-3.5 h-3.5" />
                            <span>逐车填报反馈</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* 驳回待整改 */}
                    {activeTab === 'REJECTED_FIX' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOperationTask({ task, mode: 'REJECTED_FIX' });
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>补齐材料重报</span>
                      </button>
                    )}

                    {/* 大队初审 / 支队终审 */}
                    {(activeTab === 'BRIGADE_AUDIT' || activeTab === 'BRANCH_AUDIT') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOperationTask({
                            task,
                            mode: activeTab === 'BRIGADE_AUDIT' ? 'BRIGADE_AUDIT' : 'BRANCH_AUDIT',
                          });
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{activeTab === 'BRIGADE_AUDIT' ? '大队初审' : '支队终审'}</span>
                      </button>
                    )}

                    {/* 错件退单审批：合并为一个 退回申请审批 按钮 */}
                    {activeTab === 'RETURN_CONFIRM' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReturnApprovalModal(task);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>退回申请审批</span>
                      </button>
                    )}

                    {/* 退单待更正重发：调用 onReDispatchTask 打开指令修改页面进行具体指令内容修改 */}
                    {activeTab === 'RETURNED_DRAFT' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onReDispatchTask) {
                            onReDispatchTask(task);
                          }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>更正并重新下发</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页组件 (满足需求：每个页签下的待办列表记录都要有分页显示) */}
        {filteredTasks.length > 0 && (
          <Pagination
            total={totalTasks}
            currentPage={validPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* 退回申请弹窗 */}
      {returnDialogTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-sm font-bold">提起错件退回修改申请</h3>
              </div>
              <button
                onClick={() => setReturnDialogTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-2.5 rounded bg-amber-50 border border-amber-100 text-amber-900 space-y-1">
                <div>指令编号：<strong className="font-mono">{returnDialogTask.taskNo}</strong></div>
                <div>指令标题：{returnDialogTask.title}</div>
                <div className="text-[11px] text-amber-800">
                  说明：若经排查属于误派非本辖区或车辆信息错误，可提起退回修改申请，上级确认后释放本单位责任。
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">错派原因</label>
                <select
                  value={returnPreset}
                  onChange={(e) => setReturnPreset(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none"
                >
                  <option value="【非本辖区】车辆已驶离进入其他管辖大队">【非本辖区】车辆已驶离进入其他管辖大队</option>
                  <option value="【非本辖区】该道路或卡点属于其他中队辖区">【非本辖区】该道路或卡点属于其他中队辖区</option>
                  <option value="【车辆信息有误】号牌或车型与研判证据不符">【车辆信息有误】号牌或车型与研判证据不符</option>
                  <option value="其他原因协商退回">其他原因协商退回</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">补充说明</label>
                <textarea
                  value={returnDetail}
                  onChange={(e) => setReturnDetail(e.target.value)}
                  rows={3}
                  placeholder="详细记录错派原因，便于上级修改更正后重新下发..."
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReturnDialogTask(null)}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnRequest}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                提交退回申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 大队：再下发中队弹窗 */}
      {dispatchDownTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <GitBranch className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">转派下发下辖执勤中队</h3>
              </div>
              <button
                onClick={() => setDispatchDownTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 指令概要 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">{dispatchDownTask.taskNo}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    dispatchDownTask.urgency === '特急' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {dispatchDownTask.urgency}
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-sm">{dispatchDownTask.title}</div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span>涉案车辆：{dispatchDownTask.vehicles.map((v) => v.plateNo).join('、')}</span>
                  <span>· 截止时限：<strong className="text-rose-600 font-mono">{dispatchDownTask.deadline}</strong></span>
                </div>
              </div>

              {/* 互斥说明提醒 */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>办理规则说明：</strong>选择再下发中队后，系统将自动生成下级中队执行节点，该指令将<strong>从大队「待转派中队」与「待处置反馈」中同步移出</strong>；后续中队录入处置凭证后，将自动推送至大队<strong>「待大队初审」</strong>页签。
              </div>

              {/* 选择下发中队 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">
                    选择目标执勤中队 ({selectedSquadronIds.length}/{subordinateSquadrons.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSquadronIds.length === subordinateSquadrons.length) {
                        setSelectedSquadronIds([]);
                      } else {
                        setSelectedSquadronIds(subordinateSquadrons.map((s) => s.id));
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedSquadronIds.length === subordinateSquadrons.length ? '全部取消' : '一键全选'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subordinateSquadrons.map((sq) => {
                    const isChecked = selectedSquadronIds.includes(sq.id);
                    return (
                      <label
                        key={sq.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-300 text-blue-950 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSquadronIds([...selectedSquadronIds, sq.id]);
                              } else {
                                setSelectedSquadronIds(selectedSquadronIds.filter((id) => id !== sq.id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span>{sq.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          辖区主要干道及卡点布控
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 下发调度说明 */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">转派调度要求与重点研判提示</label>
                <textarea
                  value={dispatchDownNotes}
                  onChange={(e) => setDispatchDownNotes(e.target.value)}
                  rows={2}
                  placeholder="填写对各中队的具体设卡、拦截与处置指令要求..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispatchDownTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                type="button"
                disabled={selectedSquadronIds.length === 0}
                onClick={handleConfirmDispatchDown}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>确认转派下发 ({selectedSquadronIds.length} 个中队)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量转派中队弹窗 (方案2) */}
      {isBatchDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-700">
                <GitBranch className="w-5 h-5" />
                <h3 className="text-sm font-bold">大队指令批量转派下属中队</h3>
              </div>
              <button
                onClick={() => setIsBatchDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 批量指令汇总说明 */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-1 text-indigo-950">
              <div className="font-semibold flex items-center justify-between">
                <span>已选中待转派指令：<strong>{selectedTaskIds.length} 项</strong></span>
                <span className="text-[11px] text-indigo-700 font-mono">大队二级网格批量分派</span>
              </div>
              <div className="text-[11px] text-indigo-800 line-clamp-2">
                指令编号：{selectedTaskIds.map((id) => tasks.find((t) => t.id === id)?.taskNo).filter(Boolean).join(', ')}
              </div>
            </div>

            {/* 目标中队多选 */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  选择接收并执行拦截的目标中队 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {subordinateSquadrons.map((sq) => {
                    const isChecked = batchDispatchSquadronIds.includes(sq.id);
                    return (
                      <label
                        key={`batch-sq-${sq.id}`}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-400 text-indigo-900 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBatchDispatchSquadronIds([...batchDispatchSquadronIds, sq.id]);
                              } else {
                                setBatchDispatchSquadronIds(
                                  batchDispatchSquadronIds.filter((id) => id !== sq.id)
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span>{sq.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          辖区卡口拦截与布控
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 下发调度说明 */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  批量转派调度要求与重点研判提示（选填）
                </label>
                <textarea
                  value={batchDispatchNotes}
                  onChange={(e) => setBatchDispatchNotes(e.target.value)}
                  rows={2}
                  placeholder="填写对所选中队的统一设卡查扣要求与联动处置指令..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchDispatchModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={batchDispatchSquadronIds.length === 0}
                onClick={handleConfirmBatchDispatchDown}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>确认批量转派 ({selectedTaskIds.length} 项指令 → {batchDispatchSquadronIds.length} 个中队)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 错件退单审批弹窗 (支持选择 同意/驳回 并填写具体理由) */}
      {returnApprovalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-4">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">错件退回申请审批</h3>
                  <p className="text-xs text-slate-500">
                    指令编号：<span className="font-mono font-semibold text-blue-700">{returnApprovalTask.taskNo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnApprovalTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 指令与下级申请信息卡片 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="font-bold text-slate-800 text-sm">
                  {returnApprovalTask.title}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/70">
                  <div>
                    申请单位：
                    <strong className="text-slate-800">
                      {returnApprovalTask.returnRequest?.requestedByUnitName || '下级责任单位'}
                    </strong>
                  </div>
                  <div>
                    申请人员：
                    <span className="text-slate-700 font-medium">
                      {returnApprovalTask.returnRequest?.requestedByName || '执勤民警'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    申请时间：
                    <span className="font-mono text-slate-700">
                      {returnApprovalTask.returnRequest?.requestedTime || returnApprovalTask.dispatchTime}
                    </span>
                  </div>
                </div>

                {/* 退单原因 */}
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                  <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>下级申报退单理由：</span>
                  </div>
                  <div className="leading-relaxed font-medium">
                    {returnApprovalTask.returnRequest?.reason || '申请错件退回修改。'}
                  </div>
                </div>
              </div>

              {/* 审批结论选择 (同意 / 驳回) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  审批结论 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === 'AGREE'
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="approvalDecision"
                      value="AGREE"
                      checked={approvalDecision === 'AGREE'}
                      onChange={() => handleSelectDecision('AGREE')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>同意退回修改</span>
                      </div>
                      <div className="text-[11px] text-emerald-700/80">
                        释放下级执行责任，工单退回待发池由发令人员更正重发
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      approvalDecision === 'REJECT'
                        ? 'bg-rose-50/80 border-rose-400 text-rose-950 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="approvalDecision"
                      value="REJECT"
                      checked={approvalDecision === 'REJECT'}
                      onChange={() => handleSelectDecision('REJECT')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-rose-800 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>驳回退回申请</span>
                      </div>
                      <div className="text-[11px] text-rose-700/80">
                        维持原派发责任，下级单位须继续开展排查查扣处置
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 审批理由说明 (同意/驳回 理由) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {approvalDecision === 'AGREE' ? '同意理由说明' : '驳回理由说明'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">将反馈至申请单位与指令流转存证</span>
                </div>

                {/* 快捷理由预设标签 */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(approvalDecision === 'AGREE'
                    ? [
                        '核实属非本辖区管辖，同意退回修改，工单重回发令池重新下发。',
                        '经研判目标车辆行驶轨迹已纠偏，同意撤回本单位待办。',
                        '排查责任单位确实下发有误，核准同意退回修改。',
                      ]
                    : [
                        '经指挥中心核实，该车辆仍在该辖区主要通道，证据不足以退单，维持原派发，请继续排查拦截。',
                        '卡口最新预警显示车辆仍在本责任网格内，请加派执勤力量处置。',
                        '退回证明材料不足，不符合错件退单标准，请严格按照指令要求执行。',
                      ]
                  ).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setApprovalReason(preset)}
                      className={`text-[11px] px-2 py-1 rounded-md border text-left transition cursor-pointer ${
                        approvalReason === preset
                          ? approvalDecision === 'AGREE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium'
                            : 'bg-rose-100 text-rose-800 border-rose-300 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  rows={3}
                  placeholder={
                    approvalDecision === 'AGREE'
                      ? '请填写同意退回的核准意见与说明...'
                      : '请填写驳回退回的具体原因与排查指导意见...'
                  }
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setReturnApprovalTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnApproval}
                disabled={!approvalReason.trim()}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 ${
                  approvalDecision === 'AGREE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{approvalDecision === 'AGREE' ? '确认同意退回' : '确认驳回申请'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 指令专属处置/审核操作弹窗 (仅展示目标车辆处置总表) */}
      {operationTask && (
        <TaskOperationModal
          isOpen={true}
          onClose={() => setOperationTask(null)}
          task={operationTask.task}
          mode={operationTask.mode}
          currentRole={currentRole}
          onAddNotice={onAddNotice}
          onUpdateTask={(updatedTask) => {
            onUpdateTask(updatedTask);
            setOperationTask({
              ...operationTask,
              task: updatedTask,
            });
          }}
        />
      )}
    </div>
  );
};
