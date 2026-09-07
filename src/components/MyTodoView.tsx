import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertTriangle, AlertCircle, RotateCcw, 
  Shield, CheckCircle2, ChevronRight, Eye, Send, Car, Building2,
  FileCheck, GitBranch, ArrowRight, UserCheck, Check, X, Ban,
  Search, Filter, RefreshCw, Layers, BellRing, ChevronDown, CheckCircle
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { Pagination } from './Pagination';

interface MyTodoViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onUpdateTask: (updatedTask: DispatchTask) => void;
  onNavigateToManagement: () => void;
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
  initialTab,
  filterCategory,
  filterUrgency,
}) => {
  // 1. 中队角色待办分类
  // PENDING_SIGN: 待我签收
  // PENDING_FEEDBACK: 待处置反馈
  // REJECTED_FIX: 驳回待整改
  // 2. 大队角色待办分类
  // BRIGADE_AUDIT: 待大队初审
  // BRIGADE_SIGN: 待我签收 (大队直办)
  // BRIGADE_DISPATCH_DOWN: 待转派中队
  // RETURN_CONFIRM: 错件退单审批
  // 3. 支队角色待办分类
  // BRANCH_AUDIT: 待支队终审
  // RETURN_CONFIRM: 错件退单审批
  // RETURNED_DRAFT: 错件待更正重发
  // OVERDUE_SUPERVISE: 逾期催办督办

  const defaultTab = useMemo(() => {
    if (initialTab) return initialTab;
    if (currentRole.level === 'squadron') return 'PENDING_SIGN';
    if (currentRole.level === 'brigade') return 'BRIGADE_AUDIT';
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

  // 催办弹窗状态
  const [superviseToast, setSuperviseToast] = useState<string | null>(null);

  // === 各种具体待办任务提取 ===

  // 1. 待我签收 (中队 & 大队直办)
  const pendingSignTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      return myNode && myNode.status === 'PENDING_SIGN';
    });
  }, [tasks, currentRole.unitId]);

  // 2. 待处置反馈 (中队路面执勤席 / 大队直办)
  const pendingFeedbackTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      if (!myNode) return false;
      if (myNode.status === 'SIGNED' || myNode.status === 'FEEDBACK_SUBMITTED') {
        // 还有未完成审核通过的车辆
        return t.vehicles.some(
          (v) => !v.isIntercepted || v.vehicleAuditStatus === 'PENDING'
        );
      }
      return false;
    });
  }, [tasks, currentRole.unitId]);

  // 3. 驳回待整改 (中队)
  const rejectedFixTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      if (!myNode) return false;
      return t.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED');
    });
  }, [tasks, currentRole.unitId]);

  // 4. 待大队初审 (大队)
  const brigadeAuditTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      // 找出本大队辖区中队提交的反馈待大队初审
      const squadronNodes = t.executionNodes.filter(
        (n) => n.unitLevel === 'squadron' && n.parentId === `node-${currentRole.unitId}`
      );
      return squadronNodes.some((n) =>
        n.vehiclesStatus?.some(
          (vs) => vs.isIntercepted && vs.auditStatus === 'PENDING'
        )
      );
    });
  }, [tasks, currentRole.unitId]);

  // 5. 待转派中队 (大队: 支队下发至大队，大队尚未转派给下属中队)
  const brigadeDispatchDownTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      // 大队已签收，但还没有子中队节点
      if (!myNode) return false;
      const hasSquadrons = t.executionNodes.some(
        (n) => n.unitLevel === 'squadron' && n.parentId === myNode.id
      );
      return (myNode.status === 'SIGNED' || myNode.status === 'PENDING_SIGN') && !hasSquadrons;
    });
  }, [tasks, currentRole.unitId]);

  // 6. 待审批退单申请 (上级指挥员：大队审核中队退单 / 支队审核大队退单)
  const pendingReturnConfirmTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      if (t.returnRequest?.status !== 'PENDING_CONFIRM') return false;
      if (currentRole.level === 'branch') return true;
      if (currentRole.level === 'brigade') {
        // 下级中队发起的退单
        return t.returnRequest.requestedByUnitId.startsWith('squadron-01') || t.creatorUnitId === currentRole.unitId;
      }
      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 7. 待支队终审 (支队)
  const branchAuditTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      // 车辆待终审：大队初审通过或者直属大队直接反馈
      return t.vehicles.some((v) => {
        if (v.vehicleAuditStatus !== 'PENDING') return false;
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

  // 8. 错件待更正重发 (支队指挥长)
  const returnedDraftTasks = useMemo(() => {
    return tasks.filter((t) => t.overallStatus === 'RETURNED_DRAFT');
  }, [tasks]);

  // 9. 超期催办督办 (支队/大队督办)
  const overdueSuperviseTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const nowTime = new Date().getTime();
      const deadlineTime = new Date(t.deadline.replace(/-/g, '/')).getTime();
      return deadlineTime < nowTime || t.urgency === '特急';
    });
  }, [tasks]);

  // 依据用户当前角色确定可显示的页签清单
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
          key: 'BRIGADE_AUDIT',
          label: '待大队初审',
          count: brigadeAuditTasks.length,
          icon: FileCheck,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-600 text-white',
          desc: '核实下辖中队提交的处置凭证并审核上报支队',
        },
        {
          key: 'PENDING_SIGN',
          label: '待我签收',
          count: pendingSignTasks.length,
          icon: Clock,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-600 text-white',
          desc: '支队直达大队或大队直办自查指令签收',
        },
        {
          key: 'BRIGADE_DISPATCH_DOWN',
          label: '待转派中队',
          count: brigadeDispatchDownTasks.length,
          icon: GitBranch,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badgeColor: 'bg-amber-600 text-white',
          desc: '已签收上级指令，待二次分派给下辖各中队执行',
        },
        {
          key: 'RETURN_CONFIRM',
          label: '错件退单审批',
          count: pendingReturnConfirmTasks.length,
          icon: RotateCcw,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-600 text-white',
          desc: '中队申请退回修改的错件待大队指挥长核实确认',
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
  };

  // 确认同意退回（上级）
  const handleApproveReturn = (task: DispatchTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedTask: DispatchTask = {
      ...task,
      overallStatus: 'RETURNED_DRAFT',
      returnRequest: task.returnRequest
        ? {
            ...task.returnRequest,
            status: 'CONFIRMED',
            confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
            confirmedTime: nowStr,
            confirmRemarks: '同意退回修改，工单重回待发池，请上级更正后重新下发。',
          }
        : undefined,
      executionNodes: [],
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-ret-appr-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '确认退回修改',
          details: `${currentRole.unitName} 确认同意退回修改，下级待办彻底释放，工单返回待更正重发池。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
  };

  // 驳回退回申请（上级）
  const handleRejectReturn = (task: DispatchTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.returnRequest) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedTask: DispatchTask = {
      ...task,
      returnRequest: {
        ...task.returnRequest,
        status: 'REJECTED',
        confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
        confirmedTime: nowStr,
        confirmRemarks: '经指挥中心核实，该车辆仍在辖区主要通道，维持原派发，请继续拦截。',
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
          details: `上级指挥中心驳回了 ${task.returnRequest.requestedByUnitName} 的退回申请，指令维持原责任执行。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
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
                onClick={() => onSelectTask(task)}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 cursor-pointer shadow-xs transition hover:shadow-md space-y-3"
              >
                {/* 顶部状态与标签 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {task.taskNo}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {task.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        task.urgency === '特急'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                          : task.urgency === '紧急'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {task.urgency}
                    </span>
                    <span className="text-xs text-slate-500">
                      规则：<strong>{task.completionRule === 'ANY_COMPLETE' ? '任一完成' : '全部完成'}</strong>
                    </span>

                    {/* 驳回标记 */}
                    {task.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED') && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>审核被驳回待补正</span>
                      </span>
                    )}

                    {/* 退回标记 */}
                    {task.overallStatus === 'RETURNED_DRAFT' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        错派已退回 · 待更正重发
                      </span>
                    )}
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

                {/* 目标车辆清单 */}
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

                    {/* 去反馈 */}
                    {(activeTab === 'PENDING_FEEDBACK' || activeTab === 'REJECTED_FIX') && (
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>{activeTab === 'REJECTED_FIX' ? '补齐材料重报' : '逐车填报反馈'}</span>
                      </button>
                    )}

                    {/* 大队初审 / 支队终审 */}
                    {(activeTab === 'BRIGADE_AUDIT' || activeTab === 'BRANCH_AUDIT') && (
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{activeTab === 'BRIGADE_AUDIT' ? '立即初审' : '立即终审归档'}</span>
                      </button>
                    )}

                    {/* 审批退单 */}
                    {activeTab === 'RETURN_CONFIRM' && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleRejectReturn(task, e)}
                          className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
                        >
                          驳回退回申请
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleApproveReturn(task, e)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                        >
                          同意退回 (更正重发)
                        </button>
                      </>
                    )}

                    {/* 更正重发 */}
                    {activeTab === 'RETURNED_DRAFT' && (
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
    </div>
  );
};
