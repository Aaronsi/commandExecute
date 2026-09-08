import React, { useState, useMemo } from 'react';
import { 
  X, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, 
  GitBranch, Send, ArrowRight, UserCheck, Search, Car, FileText, CheckSquare, Layers,
  Paperclip, Download, Tag, FileCheck, ExternalLink, Printer, Stamp, Filter, RefreshCw, Eye, Building2,
  RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext, PlateType, ThirdPartyDisposalRecord, SystemNotice } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { VehicleEvidenceModal } from './VehicleEvidenceModal';
import { AuditDialog } from './AuditDialog';
import { VehicleInterceptionDialog } from './VehicleInterceptionDialog';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DispatchTask;
  taskList?: DispatchTask[];
  onSwitchTask?: (task: DispatchTask) => void;
  currentRole: UserRoleContext;
  onUpdateTask?: (updatedTask: DispatchTask) => void;
  onAddNotice?: (notice: SystemNotice) => void;
}

type DetailTab = 'tracking' | 'vehicles' | 'document' | 'logs';

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  taskList,
  onSwitchTask,
  currentRole,
  onUpdateTask,
  onAddNotice,
}) => {
  // Default to tracking (执行进度与流转跟踪)
  const [activeTab, setActiveTab] = useState<DetailTab>('tracking');

  // Compute current task index in taskList for continuous work mode
  const currentIndex = useMemo(() => {
    if (!taskList || taskList.length === 0) return -1;
    return taskList.findIndex((t) => t.id === task.id);
  }, [taskList, task.id]);

  // Department filter for Vehicle Matrix tab (支队/大队多级部门筛选)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Evidence preview modal state
  const [previewEvidenceVehicle, setPreviewEvidenceVehicle] = useState<TaskVehicle | null>(null);

  // 逐车审核弹窗状态 (大队初审 / 支队终审)
  const [auditVehicle, setAuditVehicle] = useState<TaskVehicle | null>(null);

  // 逐车填报/重报弹窗状态
  const [feedbackVehicle, setFeedbackVehicle] = useState<TaskVehicle | null>(null);

  // 上级主动退回修改确认弹窗状态 (下级已签收但未反馈)
  const [showUpperReturnModal, setShowUpperReturnModal] = useState(false);
  const [upperReturnPreset, setUpperReturnPreset] = useState('发现下发目标车辆或信息录入有误');
  const [upperReturnDetail, setUpperReturnDetail] = useState('');

  // 判断发令上级是否可直接发起“退回修改” (下级已签收但未反馈/未完结)
  const canDirectUpperReturn = useMemo(() => {
    if (task.overallStatus !== 'PROCESSING') return false;
    const isCreator = task.creatorUnitId === currentRole.unitId || currentRole.level === 'branch';
    if (!isCreator) return false;
    const hasSigned = task.executionNodes.some(
      (n) => n.status === 'SIGNED' || n.status === 'DISPATCHED_DOWN' || n.status === 'FEEDBACK_SUBMITTED'
    );
    const isAllPassed = task.vehicles.length > 0 && task.vehicles.every((v) => v.vehicleAuditStatus === 'PASSED');
    return hasSigned && !isAllPassed;
  }, [task, currentRole]);

  if (!isOpen) return null;

  // Identify current logged in unit's node
  const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);

  // Helper to re-evaluate overall task completion based on vehicles approved by final audit authority
  const evaluateOverallCompletion = (currentTask: DispatchTask): { 
    isCompleted: boolean; 
    summary: string;
    passedVehiclesCount: number;
    totalVehiclesCount: number;
  } => {
    const { completionRule, vehicles } = currentTask;
    const totalVehiclesCount = vehicles.length;
    
    // 统计终审通过的车辆数 (支队下发的由支队终审，大队自发的由大队终审)
    const passedVehiclesCount = vehicles.filter((v) => v.vehicleAuditStatus === 'PASSED').length;

    if (completionRule === 'ANY_COMPLETE') {
      const isCompleted = passedVehiclesCount >= 1;
      return {
        isCompleted,
        passedVehiclesCount,
        totalVehiclesCount,
        summary: isCompleted
          ? `【任一完成模式】：已通过 ${passedVehiclesCount} 辆车终审（要求≥1辆），整单已自动收敛完结！`
          : `【任一完成模式】：已通过 ${passedVehiclesCount} / ${totalVehiclesCount} 辆车终审（任一车辆通过即办结）`,
      };
    } else {
      const isCompleted = passedVehiclesCount === totalVehiclesCount && totalVehiclesCount > 0;
      return {
        isCompleted,
        passedVehiclesCount,
        totalVehiclesCount,
        summary: isCompleted
          ? `【全部完成模式】：全单 ${totalVehiclesCount} 辆目标车辆均已通过终审审批，整单已全量闭环！`
          : `【全部完成模式】：已通过 ${passedVehiclesCount} / ${totalVehiclesCount} 辆车终审，需全量审核通过后方可完结`,
      };
    }
  };

  const evalStatus = evaluateOverallCompletion(task);

  // 执行发令上级主动退回修改 (召回更正)
  const handleConfirmDirectReturn = () => {
    if (!onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonFull = `${upperReturnPreset}${upperReturnDetail.trim() ? `：${upperReturnDetail.trim()}` : ''}`;

    const updatedTask: DispatchTask = {
      ...task,
      overallStatus: 'RETURNED_DRAFT',
      returnRequest: {
        requestedByUnitId: currentRole.unitId,
        requestedByUnitName: currentRole.unitName,
        requestedByName: `${currentRole.userName} (${currentRole.policeNo})`,
        requestedTime: nowStr,
        reason: `上级主动退回更正：${reasonFull}`,
        status: 'CONFIRMED',
        confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
        confirmedTime: nowStr,
        confirmRemarks: '发令上级在指令详情中主动发起召回更正，下级待办清空释放。',
      },
      executionNodes: [], // 彻底清空执行节点，下级待办彻底注销
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-upper-ret-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '上级主动退回修改',
          details: `由发令上级 ${currentRole.unitName} (${currentRole.userName}) 在下级已签收状态下主动发起退回修改。召回原因：【${reasonFull}】。系统已自动撤销下级各节点的待办任务与时效考核，工单返回【已退回·待更正重发】。`,
        },
      ],
    };

    onUpdateTask(updatedTask);

    // 触发系统消息提醒（推送给所有被召回的下级大队/中队）
    if (onAddNotice) {
      task.executionNodes.forEach((node) => {
        onAddNotice({
          id: `notice-upper-ret-${Date.now()}-${node.unitId}`,
          type: 'UPPER_DIRECT_RETURN',
          targetUnitId: node.unitId,
          targetUnitName: node.unitName,
          targetLevel: node.unitLevel,
          taskId: task.id,
          taskNo: task.taskNo,
          taskTitle: task.title,
          title: '上级主动退回修改提醒 (任务召回)',
          content: `${currentRole.unitName} 已对指令【${task.taskNo}】发起主动退回更正，贵单位待办已同步注销释放，不计入考核。原因：${reasonFull}`,
          urgency: task.urgency,
          timestamp: nowStr,
          isRead: false,
          isDismissedFromToast: false,
          actionType: 'VIEW_TASK',
        });
      });
    }

    setShowUpperReturnModal(false);
    onClose();
  };

  // 逐车审核提交处理 (初审/终审)
  const handleAuditSubmit = (data: {
    result: 'PASS' | 'REJECT';
    remarks: string;
    rejectReason?: string;
  }) => {
    if (!auditVehicle || !onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const isBranch = currentRole.level === 'branch';
    const isReject = data.result === 'REJECT';

    const updatedVehicles = task.vehicles.map((v) => {
      if (v.id === auditVehicle.id) {
        if (isReject) {
          return {
            ...v,
            vehicleAuditStatus: 'REJECTED' as const,
            rejectReason: data.remarks,
          };
        } else {
          return {
            ...v,
            vehicleAuditStatus: (isBranch ? 'PASSED' : 'BRIGADE_PASSED') as 'PASSED' | 'BRIGADE_PASSED',
            brigadeAuditRemarks: !isBranch ? data.remarks : v.brigadeAuditRemarks,
            branchAuditRemarks: isBranch ? data.remarks : v.branchAuditRemarks,
          };
        }
      }
      return v;
    });

    const isNowAllPassed =
      task.completionRule === 'ANY_COMPLETE'
        ? updatedVehicles.some((v) => v.vehicleAuditStatus === 'PASSED')
        : updatedVehicles.every((v) => v.vehicleAuditStatus === 'PASSED');

    const updatedTask: DispatchTask = {
      ...task,
      vehicles: updatedVehicles,
      overallStatus: isNowAllPassed ? 'COMPLETED' : task.overallStatus,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-audit-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: isReject
            ? (isBranch ? '支队终审驳回' : '大队初审驳回')
            : (isBranch ? '支队终审通过' : '大队初审通过'),
          details: `${currentRole.unitName} 对车辆【${auditVehicle.plateNo}】进行了审核（${
            isReject ? '驳回整改' : '审核通过'
          }）。意见：【${data.remarks}】。`,
        },
      ],
    };

    onUpdateTask(updatedTask);

    // 驳回时触发系统消息提醒通知责任下级
    if (isReject && onAddNotice) {
      const targetUnitId = auditVehicle.interceptedByUnitId || (isBranch ? 'brigade-01' : 'squadron-01-01');
      const targetUnitName = auditVehicle.interceptedByUnitName || (isBranch ? '直属一大队' : '城东一中队');
      const targetLevel = targetUnitId.startsWith('squadron') ? 'squadron' : 'brigade';

      onAddNotice({
        id: `notice-rej-${Date.now()}`,
        type: 'AUDIT_REJECTED',
        targetUnitId,
        targetUnitName,
        targetLevel,
        taskId: task.id,
        taskNo: task.taskNo,
        taskTitle: task.title,
        title: isBranch ? '支队审核提交反馈车辆不通过' : '大队初审驳回车辆处置反馈待整改',
        content: `${currentRole.unitName} 审核驳回了车辆【${auditVehicle.plateNo}】的处置凭证：${data.remarks}。请及时在我的待办中补齐重报。`,
        urgency: task.urgency,
        timestamp: nowStr,
        isRead: false,
        isDismissedFromToast: false,
        actionTab: targetLevel === 'squadron' ? 'REJECTED_FIX' : 'PENDING_FEEDBACK',
        actionType: 'GOTO_TODO',
      });
    }

    setAuditVehicle(null);
  };

  // 逐车反馈提交处理
  const handleFeedbackSubmit = (data: {
    vehicleId: string;
    plateNo: string;
    plateType: PlateType;
    disposalRecord: ThirdPartyDisposalRecord;
    feedbackRemarks: string;
    location: string;
    evidenceImages?: string[];
    dynamicFeedbackValues?: Record<string, any>;
  }) => {
    if (!onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedVehicles = task.vehicles.map((v) => {
      if (v.id === data.vehicleId) {
        return {
          ...v,
          isIntercepted: true,
          interceptedByUnitId: currentRole.unitId,
          interceptedByUnitName: currentRole.unitName,
          interceptedTime: nowStr,
          disposalRecord: data.disposalRecord,
          feedbackRemarks: data.feedbackRemarks,
          vehicleAuditStatus: 'PENDING' as const,
          rejectReason: undefined,
        };
      }
      return v;
    });

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.unitId === currentRole.unitId) {
        return {
          ...n,
          status: 'FEEDBACK_SUBMITTED' as const,
          feedbackSummary: `已处置查扣车辆【${data.plateNo}】，凭证号：${data.disposalRecord.punishmentCode}`,
          feedbackTime: nowStr,
        };
      }
      return n;
    });

    const updatedTask: DispatchTask = {
      ...task,
      vehicles: updatedVehicles,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-fb-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '填报车辆处置凭证',
          details: `${currentRole.unitName} 民警完成了车辆【${data.plateNo}】的现场处置并录入凭证【${data.disposalRecord.punishmentCode}】。`,
        },
      ],
    };

    onUpdateTask(updatedTask);

    if (onAddNotice && currentRole.level === 'squadron') {
      const parentUnit = MOCK_ORG_UNITS.find((u) => u.id === currentRole.unitId);
      const targetBrigadeId = parentUnit?.parentId || 'brigade-01';
      const targetBrigade = MOCK_ORG_UNITS.find((u) => u.id === targetBrigadeId);
      onAddNotice({
        id: `notice-sq-fb-${Date.now()}`,
        type: 'SQUADRON_FEEDBACK_SUBMITTED',
        targetUnitId: targetBrigadeId,
        targetUnitName: targetBrigade?.name || '直属一大队',
        targetLevel: 'brigade',
        taskId: task.id,
        taskNo: task.taskNo,
        taskTitle: task.title,
        title: '中队提交处置凭证待大队初审',
        content: `${currentRole.unitName} 已对指令【${task.taskNo}】目标车辆【${data.plateNo}】完成查扣并录入凭证（${data.disposalRecord.punishmentCode}），待大队指挥员初审报送。`,
        urgency: task.urgency,
        timestamp: '刚刚',
        isRead: false,
        isDismissedFromToast: false,
        actionTab: 'BRIGADE_AUDIT',
        actionType: 'GOTO_TODO',
      });
    }

    setFeedbackVehicle(null);
  };

  // Group brigade and squadron nodes for topology view
  const brigadeNodes = task.executionNodes.filter((n) => n.unitLevel === 'brigade');
  const getSquadronsForBrigade = (brigadeNodeId: string) => {
    return task.executionNodes.filter((n) => n.parentId === brigadeNodeId);
  };

  // Filter topology nodes based on minimal view principle (遵循最小查看原则)
  const visibleBrigadeNodesInTopology = useMemo(() => {
    if (currentRole.level === 'branch') {
      // Branch sees all brigades
      return brigadeNodes;
    }
    if (currentRole.level === 'brigade') {
      // Brigade sees only its own brigade node
      return brigadeNodes.filter((b) => b.unitId === currentRole.unitId);
    }
    if (currentRole.level === 'squadron') {
      // Squadron sees only its parent brigade
      if (!myNode || !myNode.parentId) return brigadeNodes;
      return brigadeNodes.filter((b) => b.id === myNode.parentId);
    }
    return brigadeNodes;
  }, [brigadeNodes, currentRole.level, currentRole.unitId, myNode]);

  // Options for department filter in vehicle table
  const availableDeptFilters = useMemo(() => {
    if (currentRole.level === 'branch') {
      // All brigades and squadrons involved in this task
      const brigadeItems = task.executionNodes
        .filter((n) => n.unitLevel === 'brigade')
        .map((n) => ({ id: n.unitId, name: n.unitName, type: '大队' }));
      const squadronItems = task.executionNodes
        .filter((n) => n.unitLevel === 'squadron')
        .map((n) => ({ id: n.unitId, name: n.unitName, type: '中队' }));
      return [
        { id: 'ALL', name: '全部处置部门 (全市全景)', type: '全部' },
        ...brigadeItems,
        ...squadronItems,
      ];
    }
    if (currentRole.level === 'brigade') {
      const mySquadrons = task.executionNodes
        .filter((n) => n.parentId === myNode?.id)
        .map((n) => ({ id: n.unitId, name: n.unitName, type: '下属中队' }));
      return [
        { id: 'ALL', name: '全部辖区部门 (大队自办 + 下属中队)', type: '全部' },
        { id: currentRole.unitId, name: `${currentRole.unitName} (大队自办)`, type: '大队自办' },
        ...mySquadrons,
      ];
    }
    // Squadron: locked to current squadron
    return [
      { id: currentRole.unitId, name: `${currentRole.unitName} (本中队责任清单)`, type: '本中队' },
    ];
  }, [currentRole, task.executionNodes, myNode]);

  // Filtered vehicles for the Vehicle Matrix tab
  const filteredVehicles = useMemo(() => {
    if (selectedDeptFilter === 'ALL') {
      if (currentRole.level === 'squadron') {
        // Squadron only sees vehicles assigned to squadron
        return task.vehicles;
      }
      return task.vehicles;
    }
    return task.vehicles.filter((v) => {
      if (v.interceptedByUnitId === selectedDeptFilter) return true;
      // If filtering by brigade, also match if intercepted by this brigade
      return false;
    });
  }, [task.vehicles, selectedDeptFilter, currentRole.level]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {task.taskNo}
              </span>
              {task.category && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>{task.category}</span>
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  task.urgency === '特急'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : task.urgency === '紧急'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {task.urgency}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                  task.completionRule === 'ANY_COMPLETE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <GitBranch className="w-3 h-3" />
                <span>{task.completionRule === 'ANY_COMPLETE' ? '任一完成模式' : '全部完成模式'}</span>
              </span>

              {task.overallStatus === 'CANCELLED_ERROR' ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>派件错误 · 已撤销（不计入考核）</span>
                </span>
              ) : task.overallStatus === 'RETURNED_DRAFT' ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>已退回 · 待更正重发</span>
                </span>
              ) : task.overallStatus === 'COMPLETED' ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>全单已完结归档</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  办理流转中
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {task.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div>下发单位：<strong className="text-slate-800">{task.creatorUnitName}</strong></div>
              <div>下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span></div>
              <div>截止时限：<span className="font-mono text-amber-700 font-medium">{task.deadline}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {taskList && taskList.length > 1 && onSwitchTask && currentIndex !== -1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <button
                  id="btn-prev-task-modal"
                  disabled={currentIndex <= 0}
                  onClick={() => onSwitchTask(taskList[currentIndex - 1])}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition"
                  title="切换至上一条工单"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-normal">
                    连续作业模式
                  </span>
                  <span className="font-mono">{currentIndex + 1} / {taskList.length}</span>
                </div>
                <button
                  id="btn-next-task-modal"
                  disabled={currentIndex >= taskList.length - 1}
                  onClick={() => onSwitchTask(taskList[currentIndex + 1])}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition"
                  title="切换至下一条工单"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              id="btn-close-task-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Completion Rule Banner with Progress Metric */}
        <div className={`px-6 py-2.5 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 ${
          task.overallStatus === 'COMPLETED'
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 font-medium'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{evalStatus.summary}</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span>终审通过数：<strong className="text-blue-700">{evalStatus.passedVehiclesCount}</strong> / {evalStatus.totalVehiclesCount} 辆</span>
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden inline-block align-middle">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${task.overallStatus === 'COMPLETED' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${evalStatus.totalVehiclesCount > 0 ? (evalStatus.passedVehiclesCount / evalStatus.totalVehiclesCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Operator Seat Status Ribbon */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-900">当前查看席位：{currentRole.unitName}</span>
            <span className="text-[11px] text-slate-500 font-mono">({currentRole.userName})</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-blue-700 shadow-2xs">
              {currentRole.level === 'branch' ? '市支队全域监管' : currentRole.level === 'brigade' ? '大队指挥长' : '基层执勤中队'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {canDirectUpperReturn && (
              <button
                type="button"
                onClick={() => setShowUpperReturnModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                title="下级已签收但未反馈，发令上级可直接发起退回修改"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>退回修改 (召回更正)</span>
              </button>
            )}
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <span>台账综合详情模式（如需签收、反馈或审核处置，请前往</span>
              <strong className="text-blue-700">「我的待办」</strong>
              <span>专区）</span>
            </div>
          </div>
        </div>

        {/* 4 Distinct Clean Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-2.5 border-b border-slate-200 bg-white shrink-0">
          {/* TAB 1: TRACKING (执行跟踪与拓扑 - 纯查看) */}
          <button
            onClick={() => setActiveTab('tracking')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'tracking'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>执行进度与流转跟踪</span>
          </button>

          {/* TAB 2: VEHICLE MATRIX (目标车辆拦截总表 - 含部门筛选) */}
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vehicles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>目标车辆处置总表 ({task.vehicles.length})</span>
          </button>

          {/* TAB 3: OFFICIAL DOCUMENT */}
          <button
            onClick={() => setActiveTab('document')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'document'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>交管红头督办单</span>
          </button>

          {/* TAB 4: ACTION LOGS */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>流转与审核日志 ({task.actionLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 2: 📊 执行跟踪与流转拓扑 (纯查看监控) - 遵循最小查看原则与操作分离 */}
          {/* ========================================================================= */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Minimal view notice */}
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>【{currentRole.unitName}】流转跟踪视角：</strong>
                    {currentRole.level === 'branch' && '支队全域视图 —— 监控全市各大队及下辖中队的执行流转树。'}
                    {currentRole.level === 'brigade' && '大队辖区视图 —— 遵循最小查看原则，仅展示支队发端 ➔ 本大队 ➔ 本辖区中队。'}
                    {currentRole.level === 'squadron' && '基层中队责任视图 —— 遵循最小查看原则，仅展示上级调度发端 ➔ 承接大队 ➔ 本中队。'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">纯查看监控模式</span>
              </div>

              {/* Branch Root Header */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold">
                    支
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{task.creatorUnitName}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                        发端调度单位
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      签发指挥长：{task.creatorName} | 下发时间：{task.dispatchTime}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-mono text-slate-600">指令编号：{task.taskNo}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">目标车辆：{task.vehicles.length} 辆</div>
                </div>
              </div>

              {/* Brigade & Squadron Level Cards */}
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 ml-4">
                {visibleBrigadeNodesInTopology.map((bNode) => {
                  const subSquadrons = getSquadronsForBrigade(bNode.id);
                  const isCurrentBrigade = bNode.unitId === currentRole.unitId;

                  return (
                    <div key={bNode.id} className="space-y-3">
                      {/* Brigade Node Box */}
                      <div className={`p-4 rounded-xl border transition ${
                        isCurrentBrigade
                          ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-slate-200'
                      } shadow-xs`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs shrink-0 mt-0.5">
                              大
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">{bNode.unitName}</span>
                                {isCurrentBrigade && (
                                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                    当前所属大队
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                签收状态：
                                {bNode.status === 'PENDING_SIGN' && <span className="text-amber-600 font-medium">待签收</span>}
                                {bNode.status === 'SIGNED' && <span className="text-blue-600 font-medium">已签收 ({bNode.signedTime})</span>}
                                {bNode.status === 'DISPATCHED_DOWN' && <span className="text-indigo-600 font-medium">已下发中队 ({bNode.dispatchedDownTime})</span>}
                                {bNode.status === 'FEEDBACK_SUBMITTED' && <span className="text-purple-600 font-medium">大队自办反馈</span>}
                                {bNode.status === 'AUDITED_PASS' && <span className="text-emerald-600 font-medium">审核通过归档</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            <span className="text-[11px] text-slate-500">
                              {bNode.status === 'DISPATCHED_DOWN'
                                ? `已转派下属 ${subSquadrons.length} 个中队`
                                : bNode.status === 'SIGNED'
                                ? '待转派或自办'
                                : '流转推进中'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Squadron Nodes (Filtered if in squadron mode) */}
                      {subSquadrons.length > 0 && (
                        <div className="space-y-2 pl-6 border-l-2 border-dashed border-indigo-200 ml-4">
                          {subSquadrons
                            .filter((sq) => {
                              // If squadron role, only show own squadron
                              if (currentRole.level === 'squadron') {
                                return sq.unitId === currentRole.unitId;
                              }
                              return true;
                            })
                            .map((sqNode) => {
                              const isMySquadron = sqNode.unitId === currentRole.unitId;

                              return (
                                <div
                                  key={sqNode.id}
                                  className={`p-3 rounded-lg border text-xs transition ${
                                    isMySquadron
                                      ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                                      : 'bg-slate-50/80 border-slate-200'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                                        中
                                      </div>
                                      <span className="font-bold text-slate-800">{sqNode.unitName}</span>
                                      {isMySquadron && (
                                        <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded font-medium">
                                          当前中队席位
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-3 text-[11px]">
                                      <span className="text-slate-500">
                                        状态：
                                        <strong className={
                                          sqNode.status === 'AUDITED_PASS'
                                            ? 'text-emerald-700'
                                            : sqNode.status === 'FEEDBACK_SUBMITTED'
                                            ? 'text-purple-700'
                                            : sqNode.status === 'REJECTED'
                                            ? 'text-rose-700'
                                            : 'text-amber-700'
                                        }>
                                          {sqNode.status === 'PENDING_SIGN' && '待签收'}
                                          {sqNode.status === 'SIGNED' && '执勤排查中'}
                                          {sqNode.status === 'FEEDBACK_SUBMITTED' && '已反馈待审'}
                                          {sqNode.status === 'AUDITED_PASS' && '审核通过'}
                                          {sqNode.status === 'REJECTED' && '被驳回'}
                                        </strong>
                                      </span>
                                      {sqNode.signedTime && (
                                        <span className="font-mono text-slate-400">签收：{sqNode.signedTime.split(' ')[1]}</span>
                                      )}
                                    </div>
                                  </div>

                                  {sqNode.feedbackSummary && (
                                    <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-700">
                                      反馈描述：{sqNode.feedbackSummary}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 🚗 目标车辆拦截处置总表 (含部门筛选与逐车审批记录) */}
          {/* ========================================================================= */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              {/* Department Filter Bar (支队/大队/中队部门筛选) */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">处置责任部门筛选：</span>
                  
                  {currentRole.level === 'squadron' ? (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      {currentRole.unitName} (基层视角锁定)
                    </span>
                  ) : (
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 text-xs text-slate-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {availableDeptFilters.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex items-center space-x-2">
                  <span>符合条件车辆：<strong className="text-slate-900">{filteredVehicles.length}</strong> 辆</span>
                  <span>|</span>
                  <span>已拦截：<strong className="text-emerald-700">{filteredVehicles.filter(v => v.isIntercepted).length}</strong> 辆</span>
                  <span>|</span>
                  <span>终审通过：<strong className="text-blue-700">{filteredVehicles.filter(v => v.vehicleAuditStatus === 'PASSED').length}</strong> 辆</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="p-3">号牌号码</th>
                      <th className="p-3">号牌种类</th>
                      <th className="p-3">处置责任单位 / 处警民警</th>
                      <th className="p-3">六合一文书编号</th>
                      <th className="p-3">处警时间 & 防倒挂校验</th>
                      <th className="p-3">大队初审</th>
                      <th className="p-3">支队终审 (办结考核)</th>
                      <th className="p-3 text-right">卷宗与凭证操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVehicles.map((veh) => {
                      const isPassed = veh.vehicleAuditStatus === 'PASSED';
                      const isBrigadePassed = veh.vehicleAuditStatus === 'BRIGADE_PASSED' || isPassed;

                      return (
                        <tr key={veh.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {veh.plateNo}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {veh.plateType}
                            </span>
                          </td>
                          <td className="p-3">
                            {veh.isIntercepted ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800">{veh.interceptedByUnitName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  警员：{veh.disposalRecord?.policeOfficer || '已录入'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">待路面排查</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-blue-900 font-medium">
                            {veh.disposalRecord?.punishmentCode || '-'}
                          </td>
                          <td className="p-3">
                            {veh.isIntercepted ? (
                              <div className="space-y-0.5">
                                <div className="font-mono text-slate-700">{veh.disposalRecord?.disposalTime || veh.interceptedTime}</div>
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block font-medium">
                                  ✓ 时序合规通过
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          
                          {/* Brigade Audit column */}
                          <td className="p-3">
                            {isBrigadePassed ? (
                              <span className="text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                初审通过
                              </span>
                            ) : veh.vehicleAuditStatus === 'REJECTED' ? (
                              <span className="text-rose-800 bg-rose-50 font-bold px-2 py-0.5 rounded border border-rose-200">
                                审核驳回
                              </span>
                            ) : veh.isIntercepted ? (
                              <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                待大队审核
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Branch Audit column */}
                          <td className="p-3">
                            {isPassed ? (
                              <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-300">
                                ★ 终审通过 (已生效)
                              </span>
                            ) : veh.vehicleAuditStatus === 'BRIGADE_PASSED' ? (
                              <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                待支队终审
                              </span>
                            ) : veh.vehicleAuditStatus === 'REJECTED' ? (
                              <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                驳回整改
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* 查看卷宗证据 */}
                              {veh.isIntercepted && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewEvidenceVehicle(veh)}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                                >
                                  查看卷宗
                                </button>
                              )}

                              {/* 大队初审按钮 */}
                              {currentRole.level === 'brigade' && veh.isIntercepted && (veh.vehicleAuditStatus === 'PENDING' || !veh.vehicleAuditStatus) && (
                                <button
                                  type="button"
                                  onClick={() => setAuditVehicle(veh)}
                                  className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-xs transition"
                                >
                                  大队初审
                                </button>
                              )}

                              {/* 支队终审按钮 */}
                              {currentRole.level === 'branch' && veh.isIntercepted && veh.vehicleAuditStatus !== 'PASSED' && (
                                <button
                                  type="button"
                                  onClick={() => setAuditVehicle(veh)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-xs transition"
                                >
                                  支队终审
                                </button>
                              )}

                              {/* 逐车填报反馈 / 驳回整改重报 */}
                              {(!veh.isIntercepted || veh.vehicleAuditStatus === 'REJECTED') && (
                                <button
                                  type="button"
                                  onClick={() => setFeedbackVehicle(veh)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold shadow-xs transition ${
                                    veh.vehicleAuditStatus === 'REJECTED'
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {veh.vehicleAuditStatus === 'REJECTED' ? '补正重报' : '填报反馈'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: OFFICIAL DOCUMENT */}
          {/* ========================================================================= */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs text-slate-500">
                  公安交通集成指挥平台标准公文格式 (符合 GA/T 调度规范)
                </span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印公文单 / 导出 PDF</span>
                </button>
              </div>

              {/* Red-Header Document Container */}
              <div className="bg-white border-2 border-slate-300 p-8 rounded-xl shadow-xs max-w-3xl mx-auto text-slate-800 font-serif leading-relaxed">
                {/* Red Header Title */}
                <div className="text-center space-y-2 pb-6 border-b-2 border-rose-600">
                  <div className="text-2xl font-bold tracking-widest text-rose-600 font-sans">
                    市公安局交通警察支队指挥调度令
                  </div>
                  <div className="text-xs tracking-wider text-rose-600 font-mono">
                    PUBLIC SECURITY TRAFFIC POLICE COMMAND & DISPATCH DIRECTIVE
                  </div>
                  <div className="flex items-center justify-between pt-4 text-xs font-sans text-slate-600">
                    <div>
                      发文字号：<span className="font-mono font-bold text-slate-900">{task.taskNo}</span>
                    </div>
                    <div>
                      签发人：<span className="font-bold text-slate-900">{task.creatorName}</span>
                    </div>
                    <div>
                      密级/缓急：
                      <span className={`font-bold ${task.urgency === '特急' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {task.urgency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="py-6 space-y-5 text-sm font-sans">
                  <div className="font-bold text-base text-slate-900">
                    【主送单位】：
                    <span className="font-normal text-slate-700">
                      {task.targetBrigadeIds.map(id => MOCK_ORG_UNITS.find(u => u.id === id)?.name || id).join('、')}
                    </span>
                  </div>

                  <div className="font-bold text-base text-slate-900">
                    【指令事由】：
                    <span className="text-slate-800 font-semibold">{task.title}</span>
                  </div>

                  <div className="text-slate-800 leading-relaxed text-justify indent-8 bg-slate-50/70 p-4 rounded-lg border border-slate-200">
                    {task.content}
                  </div>

                  {/* Target Vehicles Matrix */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">【重点布控车辆清单】：</div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">序号</th>
                            <th className="p-2.5">号牌号码</th>
                            <th className="p-2.5">号牌种类 (GA/T 16.7)</th>
                            <th className="p-2.5">布控原因与处置要求</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {task.vehicles.map((veh, idx) => (
                            <tr key={veh.id} className="bg-white">
                              <td className="p-2.5 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-blue-700">{veh.plateNo}</td>
                              <td className="p-2.5">{veh.plateType}</td>
                              <td className="p-2.5 text-slate-700">{veh.riskReason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Operational Requirements */}
                  <div className="space-y-2 pt-2">
                    <div className="font-bold text-slate-900">【工作要求与收敛时限】：</div>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-2">
                      <li>签收时限：各主送大队须在 <span className="font-mono font-bold text-amber-700">10分钟内</span> 签收并明确自办或下发。</li>
                      <li>处置时限：现场执勤警力须在 <span className="font-mono font-bold text-rose-700">{task.deadline}</span> 前完成路面查控与要素反馈。</li>
                      <li>办结规则：本指令执行 <span className="font-bold text-blue-700">{task.completionRule === 'ANY_COMPLETE' ? '【任一完成即办结】' : '【全部完成才办结】'}</span>。</li>
                      <li>数据联动：处置结果须依法填报公安交管综合应用平台六合一文书编号，严禁时间倒挂。</li>
                    </ul>
                  </div>

                  {/* Stamp & Signature Footer */}
                  <div className="pt-10 flex items-end justify-between">
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>抄送：支队督察大队、秩序管理大队、科技信息科</div>
                      <div>制单时间：<span className="font-mono">{task.dispatchTime}</span></div>
                    </div>

                    <div className="relative text-right space-y-1.5 pr-6">
                      <div className="text-sm font-bold text-slate-900">市公安局交通警察支队</div>
                      <div className="text-xs text-slate-600 font-mono">指挥调度中心 (发)</div>
                      <div className="text-xs text-slate-500 font-mono">{task.dispatchTime.split(' ')[0]}</div>

                      {/* Red Electronic Stamp */}
                      <div className="absolute -top-6 right-0 w-28 h-28 border-2 border-rose-500/80 rounded-full flex flex-col items-center justify-center text-rose-500/80 pointer-events-none transform -rotate-12 select-none">
                        <div className="text-[10px] font-bold tracking-widest">★ 专用公章 ★</div>
                        <div className="text-[10px] font-bold text-center leading-tight">
                          市交警支队<br/>指挥调度专用章
                        </div>
                        <div className="text-[8px] font-mono mt-0.5">030100998</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ACTION LOGS */}
          {/* ========================================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {task.actionLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">{log.action}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-800">{log.details}</div>
                  <div className="text-[11px] text-slate-500">
                    操作民警：{log.operatorName} ({log.operatorUnit})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {taskList && taskList.length > 1 && currentIndex !== -1 ? (
              <span className="text-slate-600">
                当前为<strong>连续作业模式</strong>，正在查看第 <strong className="font-mono text-blue-600">{currentIndex + 1}</strong> 条（共 {taskList.length} 条待办）
              </span>
            ) : (
              <span>公安交通集成指挥调度子系统 · 多级闭环协同引擎</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {taskList && taskList.length > 1 && onSwitchTask && currentIndex !== -1 && (
              <>
                <button
                  id="btn-footer-prev-task"
                  disabled={currentIndex <= 0}
                  onClick={() => onSwitchTask(taskList[currentIndex - 1])}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一条</span>
                </button>
                <button
                  id="btn-footer-next-task"
                  disabled={currentIndex >= taskList.length - 1}
                  onClick={() => onSwitchTask(taskList[currentIndex + 1])}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <span>下一条</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              id="btn-footer-close"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition"
            >
              关闭详情
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Vehicle Evidence & Case file preview */}
      {previewEvidenceVehicle && (
        <VehicleEvidenceModal
          isOpen={true}
          onClose={() => setPreviewEvidenceVehicle(null)}
          vehicle={previewEvidenceVehicle}
          taskTitle={task.title}
          taskDispatchTime={task.dispatchTime}
        />
      )}

      {/* 逐车审核流转弹窗 (大队初审 / 支队终审) */}
      {auditVehicle && (
        <AuditDialog
          isOpen={true}
          onClose={() => setAuditVehicle(null)}
          nodeId={auditVehicle.interceptedByUnitId || currentRole.unitId}
          unitName={auditVehicle.interceptedByUnitName || currentRole.unitName}
          vehicle={auditVehicle}
          taskDispatchTime={task.dispatchTime}
          currentRole={currentRole}
          onAuditSubmit={handleAuditSubmit}
        />
      )}

      {/* 逐车拦截处置填报与驳回重报弹窗 */}
      {feedbackVehicle && (
        <VehicleInterceptionDialog
          isOpen={true}
          onClose={() => setFeedbackVehicle(null)}
          vehicle={{
            vehicleId: feedbackVehicle.id,
            plateNo: feedbackVehicle.plateNo,
            plateType: feedbackVehicle.plateType,
            riskReason: feedbackVehicle.riskReason,
          }}
          taskDispatchTime={task.dispatchTime}
          taskCategory={task.category}
          feedbackElements={task.feedbackElements}
          currentRole={currentRole}
          onSubmitFeedback={handleFeedbackSubmit}
        />
      )}

      {/* Sub-modal: Upper direct return confirmation (召回退回修改) */}
      {showUpperReturnModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-sm font-bold">上级主动退回修改确认（已签收召回）</h3>
              </div>
              <button
                onClick={() => setShowUpperReturnModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div>指令编号：<strong className="font-mono">{task.taskNo}</strong></div>
                <div>指令标题：<strong>{task.title}</strong></div>
                <div className="text-[11px] text-amber-800 leading-relaxed pt-1.5 border-t border-amber-200/60">
                  ⚠️ <strong>业务机制说明：</strong>当前下级责任单位<strong>已完成签收</strong>。
                  发令上级可在下级完成最终处置反馈前，主动发起<strong>召回退回修改</strong>。
                  确认后，系统将<strong>自动撤销下级单位各节点的待办任务</strong>，不计入下级考核及超时时效；
                  工单直接返回您的<strong>【已退回·待更正重发】</strong>池，修改后可一键重新下发。
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  退回修改原因 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={upperReturnPreset}
                  onChange={(e) => setUpperReturnPreset(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="发现下发目标车辆或信息录入有误">发现下发目标车辆或信息录入有误</option>
                  <option value="研判核查无需继续路面拦截处置">研判核查无需继续路面拦截处置</option>
                  <option value="责任管辖辖区指派需纠偏更正">责任管辖辖区指派需纠偏更正</option>
                  <option value="指令处置要求与时限要素调整">指令处置要求与时限要素调整</option>
                  <option value="其他情况发令上级主动召回">其他情况发令上级主动召回</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  更正说明与修改备注（选填）
                </label>
                <textarea
                  rows={3}
                  value={upperReturnDetail}
                  onChange={(e) => setUpperReturnDetail(e.target.value)}
                  placeholder="请输入需要修改更正的要点，便于重发时对齐核对..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowUpperReturnModal(false)}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectReturn}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                确认退回修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
