import React, { useState, useMemo } from 'react';
import { 
  X, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, 
  GitBranch, Send, ArrowRight, UserCheck, Search, Car, FileText, CheckSquare, Layers,
  Paperclip, Download, Tag, FileCheck, ExternalLink, Printer, Stamp, Filter, RefreshCw, Eye, Building2,
  RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext, PlateType, ThirdPartyDisposalRecord, SystemNotice, TaskAttachment } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { VehicleEvidenceModal } from './VehicleEvidenceModal';

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

  // Attachment preview modal state (Requirement 1: 指令创建时的附件查看)
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  // Text directive feedback detail modal state (Requirement 3: 反馈内容详细查看)
  const [selectedFeedbackNode, setSelectedFeedbackNode] = useState<TaskExecutionNode | null>(null);

  if (!isOpen) return null;

  // Identify current logged in unit's node
  const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);

  // Helper to re-evaluate overall task completion based on vehicles approved by final audit authority or text reports approved
  const evaluateOverallCompletion = (currentTask: DispatchTask): { 
    isCompleted: boolean; 
    summary: string;
    passedVehiclesCount: number;
    totalVehiclesCount: number;
  } => {
    if (currentTask.directiveType === 'TEXT') {
      // For text directives, check reporting nodes (squadrons or direct brigades)
      const leafNodes = currentTask.executionNodes.filter((n) => 
        n.unitLevel === 'squadron' || (n.unitLevel === 'brigade' && (!n.dispatchedToSquadronIds || n.dispatchedToSquadronIds.length === 0))
      );
      const totalUnitsCount = leafNodes.length;
      const passedUnitsCount = leafNodes.filter((n) => 
        n.status === 'AUDITED_PASS' || 
        n.status === 'OVERALL_COMPLETED' || 
        n.branchAudit?.result === 'PASS' || 
        (currentTask.creatorLevel === 'brigade' && n.brigadeAudit?.result === 'PASS')
      ).length;
      const isCompleted = passedUnitsCount === totalUnitsCount && totalUnitsCount > 0;
      return {
        isCompleted,
        passedVehiclesCount: passedUnitsCount,
        totalVehiclesCount: totalUnitsCount,
        summary: isCompleted
          ? `【文本指令模式】：全部 ${totalUnitsCount} 家责任单位处置报告均已终审通过，指令已全量闭环结案！`
          : `【文本指令模式】：已终审通过 ${passedUnitsCount} / ${totalUnitsCount} 家责任单位处置报告`,
      };
    }

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

  // Filtered reporting text nodes for Text Directive (Requirement 3: 处置反馈清单)
  const filteredReportingNodes = useMemo(() => {
    // Reporting units are squadrons, or brigades that do not dispatch to squadrons (direct handling)
    const directNodes = task.executionNodes.filter((n) => {
      if (n.unitLevel === 'squadron') return true;
      if (n.unitLevel === 'brigade') {
        return !n.dispatchedToSquadronIds || n.dispatchedToSquadronIds.length === 0;
      }
      return false;
    });

    if (selectedDeptFilter === 'ALL') {
      if (currentRole.level === 'squadron') {
        return directNodes.filter(n => n.unitId === currentRole.unitId);
      }
      if (currentRole.level === 'brigade') {
        return directNodes.filter(n => n.unitId === currentRole.unitId || n.parentId === myNode?.id);
      }
      return directNodes;
    }

    return directNodes.filter(n => n.unitId === selectedDeptFilter || n.parentId === selectedDeptFilter);
  }, [task.executionNodes, selectedDeptFilter, currentRole, myNode]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      {/* Drawer background backdrop click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Drawer Panel Sliding from Right */}
      <div className="relative bg-white border-l border-slate-200 w-full max-w-5xl h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
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

              {/* Directive Type Badge */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                task.directiveType === 'TEXT'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                {task.directiveType === 'TEXT' ? <FileText className="w-3 h-3 text-indigo-600" /> : <Car className="w-3 h-3 text-slate-600" />}
                <span>{task.directiveType === 'TEXT' ? '文本指令 (免车辆)' : '按车反馈指令'}</span>
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

            {/* Directive Creation Attachments (Requirement 1: 指令创建时的附件查看) */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1 shrink-0">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>指令创建附件 ({task.attachments.length})：</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.attachments.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs transition shadow-2xs group cursor-pointer"
                      title={`点击查看附件详情与模拟下载：${att.name} (${att.size})`}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
                      <span className="font-medium max-w-[220px] truncate">{att.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                      <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600 ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            <span>{task.directiveType === 'TEXT' ? '审核通过单位：' : '终审通过数：'}<strong className="text-blue-700">{evalStatus.passedVehiclesCount}</strong> / {evalStatus.totalVehiclesCount} {task.directiveType === 'TEXT' ? '家' : '辆'}</span>
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
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <span>台账综合详情查看（详情页仅供查阅，签收、反馈或审核处置请前往</span>
              <strong className="text-blue-700 font-semibold">「我的待办」</strong>
              <span>专区操作）</span>
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

          {/* TAB 2: VEHICLE MATRIX or DISPOSAL FEEDBACK LIST (Requirement 3) */}
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vehicles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {task.directiveType === 'TEXT' ? (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>处置反馈清单 ({task.executionNodes.filter(n => n.unitLevel === 'squadron' || (!n.dispatchedToSquadronIds || n.dispatchedToSquadronIds.length === 0)).length})</span>
              </>
            ) : (
              <>
                <Car className="w-3.5 h-3.5" />
                <span>目标车辆处置总表 ({task.vehicles.length})</span>
              </>
            )}
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
              {task.directiveType === 'TEXT' ? (
                /* =================== 文本指令：处置反馈清单 (Requirement 3) =================== */
                <>
                  {/* Department Filter Bar */}
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
                      <span>责任单位：<strong className="text-slate-900">{filteredReportingNodes.length}</strong> 家</span>
                      <span>|</span>
                      <span>已提交反馈：<strong className="text-purple-700">{filteredReportingNodes.filter(n => n.status === 'FEEDBACK_SUBMITTED' || n.status === 'COMPLETED' || n.brigadeAudit).length}</strong> 家</span>
                      <span>|</span>
                      <span>终审通过：<strong className="text-emerald-700">{filteredReportingNodes.filter(n => n.status === 'COMPLETED' || n.branchAudit?.result === 'PASS').length}</strong> 家</span>
                    </div>
                  </div>

                  {/* Text Directive Feedback List Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                          <th className="p-3">处置责任单位 / 处警民警</th>
                          <th className="p-3">处警时间</th>
                          <th className="p-3">大队初审</th>
                          <th className="p-3">支队终审 (办结考核)</th>
                          <th className="p-3">反馈内容 (简写 · 点击查看完整)</th>
                          <th className="p-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredReportingNodes.map((node) => {
                          const isPassBranch = node.branchAudit?.result === 'PASS' || node.status === 'COMPLETED';
                          const isRejectBranch = node.branchAudit?.result === 'REJECT';
                          const isPassBrigade = node.brigadeAudit?.result === 'PASS';
                          const isRejectBrigade = node.brigadeAudit?.result === 'REJECT';

                          return (
                            <tr key={node.id} className="hover:bg-slate-50/60 transition">
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${node.unitLevel === 'squadron' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    <span>{node.unitName}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    处警民警：{node.feedbackOfficer || (node.signedBy ? `${node.signedBy} (签收)` : '待指派')}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 font-mono text-[11px]">
                                {node.feedbackTime ? (
                                  <div className="space-y-0.5">
                                    <div className="text-slate-800 font-medium">{node.feedbackTime}</div>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block font-sans">
                                      ✓ 已上报
                                    </span>
                                  </div>
                                ) : node.signedTime ? (
                                  <div className="space-y-0.5">
                                    <div className="text-slate-500">{node.signedTime}</div>
                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block font-sans">
                                      已签收·待反馈
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">待签收</span>
                                )}
                              </td>

                              {/* 大队初审 */}
                              <td className="p-3">
                                {isPassBrigade ? (
                                  <div className="space-y-0.5">
                                    <span className="text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                      初审通过
                                    </span>
                                    {node.brigadeAudit?.auditorName && (
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {node.brigadeAudit.auditorName}
                                      </div>
                                    )}
                                  </div>
                                ) : isRejectBrigade ? (
                                  <div className="space-y-0.5">
                                    <span className="text-rose-800 bg-rose-50 font-bold px-2 py-0.5 rounded border border-rose-200 inline-block">
                                      初审驳回
                                    </span>
                                    {node.brigadeAudit?.opinion && (
                                      <div className="text-[10px] text-rose-600 truncate max-w-[120px]" title={node.brigadeAudit.opinion}>
                                        {node.brigadeAudit.opinion}
                                      </div>
                                    )}
                                  </div>
                                ) : node.status === 'FEEDBACK_SUBMITTED' ? (
                                  <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium">
                                    待大队初审
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* 支队终审 (办结考核) */}
                              <td className="p-3">
                                {isPassBranch ? (
                                  <div className="space-y-0.5">
                                    <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-300 inline-block">
                                      ★ 终审通过 (已生效)
                                    </span>
                                    {node.branchAudit?.auditorName && (
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {node.branchAudit.auditorName}
                                      </div>
                                    )}
                                  </div>
                                ) : isRejectBranch ? (
                                  <div className="space-y-0.5">
                                    <span className="text-rose-800 bg-rose-50 font-bold px-2 py-0.5 rounded border border-rose-200 inline-block">
                                      终审驳回
                                    </span>
                                    {node.branchAudit?.opinion && (
                                      <div className="text-[10px] text-rose-600 truncate max-w-[120px]" title={node.branchAudit.opinion}>
                                        {node.branchAudit.opinion}
                                      </div>
                                    )}
                                  </div>
                                ) : isPassBrigade ? (
                                  <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                                    待支队终审
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* 反馈内容 (列表显示简写，点击可以查看详细反馈内容) */}
                              <td className="p-3 max-w-[280px]">
                                {node.feedbackText ? (
                                  <div
                                    onClick={() => setSelectedFeedbackNode(node)}
                                    className="cursor-pointer group hover:text-blue-700"
                                    title="点击查看详细反馈内容与佐证凭证"
                                  >
                                    <div className="text-slate-800 group-hover:text-blue-700 transition line-clamp-1 leading-relaxed font-medium">
                                      {node.feedbackText}
                                    </div>
                                    <div className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-1 mt-0.5 font-medium">
                                      <FileText className="w-3 h-3 text-blue-500" />
                                      <span>查看详情全文与佐证 ({node.feedbackAttachments?.length || 0})</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">尚未提交文字报告</span>
                                )}
                              </td>

                              {/* 操作 */}
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedFeedbackNode(node)}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>查看详情</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* =================== 车辆指令：目标车辆处置总表 =================== */
                <>
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
                      <th className="p-3 text-right">处置证据卷宗</th>
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
                                待大队初审
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
                              {/* 查看卷宗证据 (只读查阅) */}
                              {veh.isIntercepted ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewEvidenceVehicle(veh)}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                                  <span>查看卷宗</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">待路面排查处置</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
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

                  {/* Target Vehicles Matrix or Text Directive Mode */}
                  {task.directiveType === 'TEXT' ? (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900">【指令类别与处置模式】：</div>
                      <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>本指令为<strong>【文本指令】</strong>，无关联重点车辆，各主送单位负责组织实地核查排查并上报处置报告。</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                          免录入车辆
                        </span>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {/* Attachments Section in Official Document (Requirement 1) */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="font-bold text-slate-900">【公文随附附件 ({task.attachments.length})】：</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {task.attachments.map((att) => (
                          <div key={att.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 truncate pr-2">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-medium text-slate-800 truncate">{att.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{att.size} · 上传人：{att.uploadedBy}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="px-2 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 text-xs shrink-0 transition"
                            >
                              查看 / 模拟下载
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

      {/* Sub-modal: Directive Attachment Preview (Requirement 1) */}
      {previewAttachment && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">指令随附附件查阅</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start space-x-3">
                <FileText className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">{previewAttachment.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    大小：{previewAttachment.size} · 上传人：{previewAttachment.uploadedBy} · 时间：{previewAttachment.uploadTime}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="font-semibold text-slate-900">【附件查验摘要说明】：</div>
                <p className="leading-relaxed">
                  该附件为指令发布单位（市局交警支队指挥调度中心）于下达《{task.title}》时同步上传的法定依据公文及工作指引。各主送大队及一线基层执勤中队应组织学习并严格遵照执行。
                </p>
                <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>数字摘要：SHA256: 8e7a4b...c39f</span>
                  <span className="text-emerald-600 font-semibold">✓ 经警务内网电子验签完整</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">公文流水号：{task.taskNo}</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    alert(`模拟下载：已将 ${previewAttachment.name} 导出至本地警务安全下载目录。`);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载附件</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Text Directive Feedback Detail (Requirement 3) */}
      {selectedFeedbackNode && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">
                  {selectedFeedbackNode.unitName} · 处置文字反馈报告详情
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackNode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400">处置责任单位</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedFeedbackNode.unitName}</div>
                </div>
                <div>
                  <div className="text-slate-400">处警民警</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedFeedbackNode.feedbackOfficer || '尚未指派'}</div>
                </div>
                <div>
                  <div className="text-slate-400">处警上报时间</div>
                  <div className="font-mono text-slate-800 mt-0.5">{selectedFeedbackNode.feedbackTime || '尚未填报'}</div>
                </div>
                <div>
                  <div className="text-slate-400">签收民警 / 时间</div>
                  <div className="text-slate-700 mt-0.5 font-mono">
                    {selectedFeedbackNode.signedBy ? `${selectedFeedbackNode.signedBy}` : '待签收'}
                  </div>
                </div>
              </div>

              {/* Feedback Text Content */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>反馈文字报告内容全文：</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedbackNode.feedbackText || (
                    <span className="text-slate-400 italic">该单位尚未录入处置文字总结。</span>
                  )}
                </div>
              </div>

              {/* Feedback Attachments */}
              {selectedFeedbackNode.feedbackAttachments && selectedFeedbackNode.feedbackAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>现场处置佐证附件 ({selectedFeedbackNode.feedbackAttachments.length})：</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedFeedbackNode.feedbackAttachments.map((att, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <div className="font-medium text-slate-800 truncate">{att.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{att.size}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert(`模拟查阅佐证材料：${att.name}`)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs shrink-0 transition"
                        >
                          查看
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Level Audit Opinions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Brigade Audit Opinion */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">大队初审结论</span>
                    {selectedFeedbackNode.brigadeAudit?.result === 'PASS' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">通过</span>
                    ) : selectedFeedbackNode.brigadeAudit?.result === 'REJECT' ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">驳回</span>
                    ) : (
                      <span className="text-slate-400">待初审</span>
                    )}
                  </div>
                  {selectedFeedbackNode.brigadeAudit && (
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div>审核人：<span className="font-medium text-slate-800">{selectedFeedbackNode.brigadeAudit.auditorName}</span></div>
                      <div>审核时间：<span className="font-mono text-slate-500">{selectedFeedbackNode.brigadeAudit.auditTime}</span></div>
                      <div className="p-2 rounded bg-white border border-slate-200 mt-1">
                        意见：{selectedFeedbackNode.brigadeAudit.opinion || '初审通过，同意上报支队'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Branch Audit Opinion */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">支队终审 (办结考核)</span>
                    {selectedFeedbackNode.branchAudit?.result === 'PASS' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">终审通过</span>
                    ) : selectedFeedbackNode.branchAudit?.result === 'REJECT' ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">终审驳回</span>
                    ) : (
                      <span className="text-slate-400">待终审</span>
                    )}
                  </div>
                  {selectedFeedbackNode.branchAudit && (
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div>终审人：<span className="font-medium text-slate-800">{selectedFeedbackNode.branchAudit.auditorName}</span></div>
                      <div>终审时间：<span className="font-mono text-slate-500">{selectedFeedbackNode.branchAudit.auditTime}</span></div>
                      <div className="p-2 rounded bg-white border border-slate-200 mt-1">
                        意见：{selectedFeedbackNode.branchAudit.opinion || '终审合格，准予办结归档'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFeedbackNode(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
