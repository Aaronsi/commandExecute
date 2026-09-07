import React, { useState } from 'react';
import { 
  Search, Filter, Shield, Radio, CheckCircle2, Clock, 
  AlertTriangle, GitBranch, ArrowRight, Car, Plus, UserCheck, 
  RotateCcw, Eye, Ban, Send, AlertCircle, Check, X, Building2, Tag
} from 'lucide-react';
import { DispatchTask, CompletionRule, UserRoleContext, TaskCategory, OrgUnit } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { Pagination } from './Pagination';

interface TaskListViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onOpenCreateModal: () => void;
  onUpdateTask?: (updatedTask: DispatchTask) => void;
  onReDispatchTask?: (task: DispatchTask) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onOpenCreateModal,
  onUpdateTask,
  onReDispatchTask,
}) => {
  // 按照需求：单独的输入与选择查询条件
  const [taskNoFilter, setTaskNoFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [plateNoFilter, setPlateNoFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [targetUnitFilter, setTargetUnitFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<'ALL' | CompletionRule>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | '特急' | '紧急' | '常规'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 分页状态 (满足需求：查询结果增加分页显示)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 纠错弹窗状态：错件撤销
  const [cancelModalTask, setCancelModalTask] = useState<DispatchTask | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('派发责任单位错误');
  const [cancelReasonDetail, setCancelReasonDetail] = useState('');

  // 纠错弹窗状态：退回修改申请 (下级提起)
  const [returnRequestModalTask, setReturnRequestModalTask] = useState<DispatchTask | null>(null);
  const [returnReasonPreset, setReturnReasonPreset] = useState('【非本辖区】车辆已驶离进入其他管辖大队');
  const [returnReasonDetail, setReturnReasonDetail] = useState('');

  // 大队再下发给中队弹窗
  const [dispatchDownTask, setDispatchDownTask] = useState<DispatchTask | null>(null);
  const [selectedSquadronIds, setSelectedSquadronIds] = useState<string[]>([]);

  // 重置所有查询条件
  const handleResetFilters = () => {
    setTaskNoFilter('');
    setTitleFilter('');
    setPlateNoFilter('');
    setCategoryFilter('ALL');
    setTargetUnitFilter('ALL');
    setRuleFilter('ALL');
    setUrgencyFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Role-based visibility filtering (遵循交警权限与最小查看原则)
  const isTaskVisibleToRole = (t: DispatchTask) => {
    if (currentRole.level === 'branch') {
      // 支队：查看全量（支队下发任务 + 各大队自发任务）
      return true;
    }
    if (currentRole.level === 'brigade') {
      // 大队：查看本大队创建的任务，或支队下派给本大队的任务
      if (t.creatorUnitId === currentRole.unitId) return true;
      if (t.targetBrigadeIds.includes(currentRole.unitId)) return true;
      if (t.executionNodes.some((n) => n.unitId === currentRole.unitId)) return true;
      return false;
    }
    if (currentRole.level === 'squadron') {
      // 中队：遵循最小查看原则，仅展示派发至本中队的指令
      return t.executionNodes.some((n) => n.unitId === currentRole.unitId);
    }
    return true;
  };

  const roleVisibleTasks = tasks.filter(isTaskVisibleToRole);

  // Filter tasks based on UI search/filters
  const filteredTasks = roleVisibleTasks.filter((t) => {
    // 1. 指令编号
    if (taskNoFilter.trim() && !t.taskNo.toLowerCase().includes(taskNoFilter.trim().toLowerCase())) {
      return false;
    }

    // 2. 指令标题
    if (titleFilter.trim() && !t.title.toLowerCase().includes(titleFilter.trim().toLowerCase())) {
      return false;
    }

    // 3. 车辆号牌
    if (
      plateNoFilter.trim() &&
      !t.vehicles.some((v) => v.plateNo.toLowerCase().includes(plateNoFilter.trim().toLowerCase()))
    ) {
      return false;
    }

    // 4. 指令业务类别
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
      return false;
    }

    // 5. 责任单位
    if (targetUnitFilter !== 'ALL') {
      const matchTargetBrigade = t.targetBrigadeIds.includes(targetUnitFilter);
      const matchNode = t.executionNodes.some((n) => n.unitId === targetUnitFilter);
      if (!matchTargetBrigade && !matchNode) {
        return false;
      }
    }

    // 6. 完成判定规则
    if (ruleFilter !== 'ALL' && t.completionRule !== ruleFilter) {
      return false;
    }

    // 7. 紧急程度
    if (urgencyFilter !== 'ALL' && t.urgency !== urgencyFilter) {
      return false;
    }

    // 8. 状态
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'CANCELLED_ERROR' && t.overallStatus !== 'CANCELLED_ERROR') return false;
      if (statusFilter === 'RETURNED_DRAFT' && t.overallStatus !== 'RETURNED_DRAFT') return false;
      if (statusFilter === 'PROCESSING' && t.overallStatus !== 'PROCESSING') return false;
      if (statusFilter === 'COMPLETED' && t.overallStatus !== 'COMPLETED') return false;
    }

    return true;
  });

  // 分页计算
  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

  // 判断工单是否具备“未签收撤销”条件：
  // 1. 发令上级操作 (支队发起的由支队撤销，大队自发的由大队撤销)
  // 2. 所有下级节点均未签收 (status 均为 PENDING_SIGN)
  const canPerformCancelError = (task: DispatchTask) => {
    if (task.overallStatus !== 'PROCESSING') return false;
    const isCreator = task.creatorUnitId === currentRole.unitId || currentRole.level === 'branch';
    if (!isCreator) return false;
    // 检查是否有任何节点已签收
    const hasAnySigned = task.executionNodes.some(
      (n) => n.status !== 'PENDING_SIGN' && n.status !== 'CANCELLED'
    );
    return !hasAnySigned;
  };

  // 判断是否可发起“退回修改申请” (下级已签收但未完结)：
  const canApplyReturn = (task: DispatchTask) => {
    if (task.overallStatus !== 'PROCESSING') return false;
    if (task.returnRequest?.status === 'PENDING_CONFIRM') return false;
    const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);
    if (!myNode) return false;
    return myNode.status === 'SIGNED' || myNode.status === 'DISPATCHED_DOWN';
  };

  // 判断上级是否可直接发起“退回修改”或确认下级退回申请：
  const canUpperConfirmReturn = (task: DispatchTask) => {
    const isUpper = task.creatorUnitId === currentRole.unitId || currentRole.level === 'branch';
    if (!isUpper) return false;
    return task.overallStatus === 'PROCESSING';
  };

  // 执行“未签收错件撤销”
  const handleConfirmCancelError = () => {
    if (!cancelModalTask || !onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonFull = `${cancelReasonPreset}：${cancelReasonDetail.trim() || '上级发令员发起错件撤销'}`;

    const updatedTask: DispatchTask = {
      ...cancelModalTask,
      overallStatus: 'CANCELLED_ERROR',
      cancelRecord: {
        cancelledByUnitId: currentRole.unitId,
        cancelledByUnitName: currentRole.unitName,
        cancelledByName: `${currentRole.userName} (${currentRole.policeNo})`,
        cancelledTime: nowStr,
        reason: reasonFull,
      },
      executionNodes: cancelModalTask.executionNodes.map((n) => ({
        ...n,
        status: 'CANCELLED' as const,
      })),
      actionLogs: [
        ...cancelModalTask.actionLogs,
        {
          id: `log-cancel-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '错件撤销（未签收）',
          details: `由 ${currentRole.unitName} 发起错件撤销作废。理由：【${reasonFull}】。工单直接标记为【派件错误 - 已撤销】，剔除有效考核统计，下级待办同步清空。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setCancelModalTask(null);
    setCancelReasonDetail('');
  };

  // 执行“下级提起退回修改申请”
  const handleConfirmReturnRequest = () => {
    if (!returnRequestModalTask || !onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reasonFull = `${returnReasonPreset}。${returnReasonDetail.trim() || '申请上级退回修改并更正派发。'}`;

    const updatedTask: DispatchTask = {
      ...returnRequestModalTask,
      returnRequest: {
        requestedByUnitId: currentRole.unitId,
        requestedByUnitName: currentRole.unitName,
        requestedByName: `${currentRole.userName} (${currentRole.policeNo})`,
        requestedTime: nowStr,
        reason: reasonFull,
        status: 'PENDING_CONFIRM',
      },
      executionNodes: returnRequestModalTask.executionNodes.map((n) => {
        if (n.unitId === currentRole.unitId) {
          return { ...n, status: 'RETURN_PENDING' as const };
        }
        return n;
      }),
      actionLogs: [
        ...returnRequestModalTask.actionLogs,
        {
          id: `log-return-req-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '提起退回修改申请',
          details: `${currentRole.unitName} 民警已签收但核实需退单，提出错派协商理由：【${reasonFull}】。等待上级指挥员审批确认。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setReturnRequestModalTask(null);
    setReturnReasonDetail('');
  };

  // 执行上级确认同意退回（工单回炉待更正重发）
  const handleUpperApproveReturn = (task: DispatchTask) => {
    if (!onUpdateTask) return;
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
            confirmRemarks: '同意退回，工单返回初始待下发草稿池，由上级修改更正后重发。',
          }
        : {
            requestedByUnitId: currentRole.unitId,
            requestedByUnitName: currentRole.unitName,
            requestedByName: `${currentRole.userName} (${currentRole.policeNo})`,
            requestedTime: nowStr,
            reason: '上级指挥员主动发现派发要素有误，直接发起退回修改',
            status: 'CONFIRMED',
            confirmedBy: `${currentRole.userName} (${currentRole.policeNo})`,
            confirmedTime: nowStr,
            confirmRemarks: '已直接退回修改',
          },
      executionNodes: [], // 清空执行节点，下级待办彻底移除
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-appr-ret-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '确认退回修改',
          details: `${currentRole.unitName} 确认同意退回修改，工单返回待更正重发池。下级各责任单位待办已彻底释放，不再计入超时倒计时。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
  };

  // 大队再下发中队
  const handleBrigadeDispatchDown = () => {
    if (!dispatchDownTask || selectedSquadronIds.length === 0 || !onUpdateTask) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const squadronNodes = selectedSquadronIds.map((sqId) => {
      const sqObj = MOCK_ORG_UNITS.find((u) => u.id === sqId);
      return {
        id: `node-${sqId}-${Date.now()}`,
        taskId: dispatchDownTask.id,
        unitId: sqId,
        unitName: sqObj ? sqObj.name : sqId,
        unitLevel: 'squadron' as const,
        parentId: `node-${currentRole.unitId}`,
        status: 'PENDING_SIGN' as const,
        vehiclesStatus: dispatchDownTask.vehicles.map((v) => ({
          vehicleId: v.id,
          plateNo: v.plateNo,
          plateType: v.plateType,
          isIntercepted: false,
          auditStatus: 'PENDING' as const,
        })),
      };
    });

    const updatedNodes = dispatchDownTask.executionNodes.map((n) => {
      if (n.unitId === currentRole.unitId) {
        return {
          ...n,
          status: 'DISPATCHED_DOWN' as const,
          dispatchedDownTime: nowStr,
          dispatchedToSquadronIds: selectedSquadronIds,
        };
      }
      return n;
    });

    const updatedTask: DispatchTask = {
      ...dispatchDownTask,
      executionNodes: [...updatedNodes, ...squadronNodes],
      actionLogs: [
        ...dispatchDownTask.actionLogs,
        {
          id: `log-disp-down-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '大队转派下发中队',
          details: `大队已将指令再下发至 [${selectedSquadronIds.map((id) => MOCK_ORG_UNITS.find((u) => u.id === id)?.name).join('、')}]，等待中队签收与路面布控处置。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setDispatchDownTask(null);
    setSelectedSquadronIds([]);
  };

  const categories: TaskCategory[] = [
    '车辆缉查',
    '隐患治理',
    '违法查处',
    '重点管控',
    '专项整治',
    '其他',
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-5 space-y-4">
      {/* 结构化多维查询条件表单 (满足需求：指令编号、指令标题、指令业务类别、车辆号牌、责任单位、完成判定规则、紧急程度等) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>交管指令组合检索条件</span>
            <span className="text-[11px] font-normal text-slate-400">支持模糊匹配与多字段精确交叉过滤</span>
          </div>
        </div>

        {/* 条件栅格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* 1. 指令编号 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">指令编号</label>
            <input
              type="text"
              value={taskNoFilter}
              onChange={(e) => setTaskNoFilter(e.target.value)}
              placeholder="如：ZD-20260901-001"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* 2. 指令标题 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">指令标题</label>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="请输入指令标题关键词..."
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* 3. 车辆号牌 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">车辆号牌</label>
            <input
              type="text"
              value={plateNoFilter}
              onChange={(e) => setPlateNoFilter(e.target.value)}
              placeholder="如：浙A9988G"
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono transition uppercase"
            />
          </div>

          {/* 4. 指令业务类别 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">指令业务类别</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">全部业务类别</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 责任单位 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">责任下发单位</label>
            <select
              value={targetUnitFilter}
              onChange={(e) => setTargetUnitFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">全部单位</option>
              <optgroup label="直属各大队">
                {MOCK_ORG_UNITS.filter((u) => u.level === 'brigade').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="基层中队">
                {MOCK_ORG_UNITS.filter((u) => u.level === 'squadron').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 6. 完成判定规则 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">完成判定规则</label>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">全部规则</option>
              <option value="ANY_COMPLETE">任一完成 (ANY_COMPLETE)</option>
              <option value="ALL_COMPLETE">全部完成 (ALL_COMPLETE)</option>
            </select>
          </div>

          {/* 7. 紧急程度 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">紧急程度</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">全部紧急度</option>
              <option value="特急">特急 (红)</option>
              <option value="紧急">紧急 (橙)</option>
              <option value="常规">常规 (灰)</option>
            </select>
          </div>

          {/* 8. 指令状态 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">指令流转状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">全部状态</option>
              <option value="PROCESSING">流转中</option>
              <option value="COMPLETED">已完结归档</option>
              <option value="RETURNED_DRAFT">已退回·待更正重发</option>
              <option value="CANCELLED_ERROR">派件错误·已撤销</option>
            </select>
          </div>
        </div>

        {/* 底部重置与查询按钮 (满足需求：重置按钮放在查询条件底部；同时在重置按钮后面增加 查询 按钮) */}
        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>重置</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className="px-5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition flex items-center space-x-1.5 font-semibold cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>查询</span>
          </button>
        </div>
      </div>

      {/* 指令列表 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <Shield className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">未查询到符合条件的交管指令记录</p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              清空筛选条件并重新检索
            </button>
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const isCompleted = task.overallStatus === 'COMPLETED';
            const isCancelled = task.overallStatus === 'CANCELLED_ERROR';
            const isReturnedDraft = task.overallStatus === 'RETURNED_DRAFT';
            const hasReturnPending = task.returnRequest?.status === 'PENDING_CONFIRM';

            const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);
            const canCancel = canPerformCancelError(task);
            const canApplyRet = canApplyReturn(task);
            const canUpperConfirm = canUpperConfirmReturn(task);

            // 大队是否可以“再下发中队”
            const canBrigadeDispatchDown =
              currentRole.level === 'brigade' &&
              myNode &&
              myNode.status === 'SIGNED' &&
              task.overallStatus === 'PROCESSING';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all duration-150 shadow-xs ${
                  isCancelled
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : isReturnedDraft
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* 状态横幅预警 (如已撤销、退单协商等) */}
                {isCancelled && task.cancelRecord && (
                  <div className="mb-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>【派件错误 - 已撤销】本指令已依规作废，不纳入有效工单统计与时效考核</span>
                        <span className="font-mono text-[11px] text-rose-700">撤销时间：{task.cancelRecord.cancelledTime}</span>
                      </div>
                      <div className="text-[11px] text-rose-800">
                        撤销操作人：<strong>{task.cancelRecord.cancelledByName}</strong> ({task.cancelRecord.cancelledByUnitName})
                      </div>
                      <div className="text-[11px] text-rose-800">
                        撤销原因：{task.cancelRecord.reason}
                      </div>
                    </div>
                  </div>
                )}

                {isReturnedDraft && task.returnRequest && (
                  <div className="mb-3 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>【已退回 · 待更正重发】工单已返回初始待发池，请上级修改内容/更正单位后重新下发</span>
                        <span className="font-mono text-[11px] text-amber-700">退回时间：{task.returnRequest.confirmedTime || task.returnRequest.requestedTime}</span>
                      </div>
                      <div className="text-[11px] text-amber-800">
                        提出单位：<strong>{task.returnRequest.requestedByUnitName}</strong> ({task.returnRequest.requestedByName})
                      </div>
                      <div className="text-[11px] text-amber-800">
                        错派原因：{task.returnRequest.reason}
                      </div>
                    </div>
                  </div>
                )}

                {hasReturnPending && task.returnRequest && (
                  <div className="mb-3 p-2.5 rounded bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>【退回修改申请审批中】下级已提交错派退回申请，等待上级核实确认</span>
                        <span className="font-mono text-[11px] text-orange-700">{task.returnRequest.requestedTime}</span>
                      </div>
                      <div className="text-[11px]">
                        申请人：<strong>{task.returnRequest.requestedByName}</strong> · 原因：{task.returnRequest.reason}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Task Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {task.taskNo}
                      </span>

                      {/* Category Badge */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {task.category}
                      </span>

                      {/* Urgency */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                          task.urgency === '特急'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : task.urgency === '紧急'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {task.urgency}
                      </span>

                      {/* Rule */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          task.completionRule === 'ANY_COMPLETE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>{task.completionRule === 'ANY_COMPLETE' ? '任一完成' : '全部完成'}</span>
                      </span>

                      {/* Global Status Badge */}
                      {isCancelled ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <Ban className="w-3 h-3 text-slate-600" />
                          <span>派件错误·已撤销</span>
                        </span>
                      ) : isReturnedDraft ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-amber-700" />
                          <span>已退回·待更正重发</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>已完结</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          流转中
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      {task.title}
                    </h3>

                    {/* Target vehicles tags snippet */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>目标车辆 ({task.vehicles.length})：</span>
                      </span>
                      {task.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                        >
                          <span className="font-mono text-slate-900 font-bold">{v.plateNo}</span>
                          <span className="text-slate-500 text-[10px]">({v.plateType})</span>
                          {v.isIntercepted && (
                            <span className="text-emerald-600 font-bold text-[10px] ml-0.5">✓ 已拦截</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Target unit tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>责任单位：</span>
                      {task.targetBrigadeIds.map((bId) => {
                        const bObj = MOCK_ORG_UNITS.find((u) => u.id === bId);
                        return (
                          <span
                            key={bId}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]"
                          >
                            {bObj ? bObj.name : bId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Actions & Operator Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2.5 text-xs">
                    <div className="space-y-0.5 text-slate-500 text-left lg:text-right">
                      <div>下发单位：<strong className="text-slate-800">{task.creatorUnitName}</strong></div>
                      <div className="text-[11px]">
                        下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span>
                      </div>
                      <div className="text-[11px]">
                        截止时间：<span className="font-mono text-rose-700">{task.deadline}</span>
                      </div>
                    </div>

                    {/* Action Group */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* 1. 查看详情 */}
                      <button
                        onClick={() => onSelectTask(task)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition text-xs border border-blue-200 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>查看详情</span>
                      </button>

                      {/* 2. 未签收撤销 (错件撤销) */}
                      {canCancel && (
                        <button
                          onClick={() => setCancelModalTask(task)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition text-xs border border-rose-200 shadow-2xs"
                          title="下级尚未签收，上级可直接作废该错件"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>错件撤销</span>
                        </button>
                      )}

                      {/* 3. 大队再下发中队 */}
                      {canBrigadeDispatchDown && (
                        <button
                          onClick={() => {
                            setDispatchDownTask(task);
                            setSelectedSquadronIds([]);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition text-xs border border-indigo-200 shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>再下发中队</span>
                        </button>
                      )}

                      {/* 4. 下级申请退回修改 */}
                      {canApplyRet && (
                        <button
                          onClick={() => setReturnRequestModalTask(task)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium transition text-xs border border-amber-200 shadow-2xs"
                          title="发现派发错辖区或信息有误，申请退回上级修改"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>申请退回修改</span>
                        </button>
                      )}

                      {/* 5. 上级确认同意退回 */}
                      {hasReturnPending && canUpperConfirm && (
                        <button
                          onClick={() => handleUpperApproveReturn(task)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition text-xs shadow-2xs"
                          title="确认下级的退回申请，让工单返回待更正重发池"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>确认退回</span>
                        </button>
                      )}

                      {/* 6. 更正并重新下发 */}
                      {isReturnedDraft && (task.creatorUnitId === currentRole.unitId || currentRole.level === 'branch') && (
                        <button
                          onClick={() => onReDispatchTask && onReDispatchTask(task)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold transition text-xs shadow-xs active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>更正并重新下发</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页控制器 (满足需求：共**条 每页显示多少条 上一页箭头 具体页数 下一页箭头) */}
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

      {/* 弹窗 1：未签收错件撤销确认 */}
      {cancelModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-700">
                <Ban className="w-5 h-5" />
                <h3 className="text-sm font-bold">错件撤销存证确认（未签收）</h3>
              </div>
              <button
                onClick={() => setCancelModalTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-2.5 rounded bg-rose-50 border border-rose-100 text-rose-900 space-y-1">
                <div>指令编号：<strong className="font-mono">{cancelModalTask.taskNo}</strong></div>
                <div>指令标题：{cancelModalTask.title}</div>
                <div className="text-[11px] text-rose-700">
                  ⚠️ 经系统检测，该指令所有接收单位<strong>均处于未签收状态</strong>，路面警力尚未投入。撤销后工单将直接标记【派件错误 - 已撤销】，剔除考核基数，下级待办同步清空。
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  撤销原因类型 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="派发责任单位错误">派发责任单位错误 (误派其他管辖大队)</option>
                  <option value="车辆号牌/要素录入错误">车辆号牌/要素录入错误</option>
                  <option value="警情/警报重复下发">警情/警报重复下发</option>
                  <option value="车辆已提前驶离本市域">车辆已提前驶离本市域，无需布控</option>
                  <option value="其他原因">其他原因</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">补充说明与撤销留痕备注</label>
                <textarea
                  value={cancelReasonDetail}
                  onChange={(e) => setCancelReasonDetail(e.target.value)}
                  rows={3}
                  placeholder="详细记录错派原因，全程留痕存证备查..."
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCancelModalTask(null)}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelError}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                确认作废并撤销工单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 2：下级提起退回修改申请 */}
      {returnRequestModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-sm font-bold">提起退回修改申请（派错协商）</h3>
              </div>
              <button
                onClick={() => setReturnRequestModalTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-2.5 rounded bg-amber-50 border border-amber-100 text-amber-900 space-y-1">
                <div>指令编号：<strong className="font-mono">{returnRequestModalTask.taskNo}</strong></div>
                <div>当前签收单位：{currentRole.unitName} ({currentRole.userName})</div>
                <div className="text-[11px] text-amber-800">
                  说明：本单位已签收指令，但经核查属于派发错误。提交退回修改申请后，上级指挥中心确认后将释放本单位待办，并退回修改更正重新下发。
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  错派原因类别 <span className="text-amber-600">*</span>
                </label>
                <select
                  value={returnReasonPreset}
                  onChange={(e) => setReturnReasonPreset(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="【非本辖区】车辆已驶离进入其他管辖大队">
                    【非本辖区】车辆已驶离进入其他管辖大队
                  </option>
                  <option value="【非本辖区】该道路或卡点属于其他中队辖区">
                    【非本辖区】该道路或卡点属于其他中队辖区
                  </option>
                  <option value="【车辆信息有误】号牌或车型与研判证据不符">
                    【车辆信息有误】号牌或车型与研判证据不符
                  </option>
                  <option value="【警情已解决】该车已在其他警情中拦截查扣">
                    【警情已解决】该车已在其他警情中拦截查扣
                  </option>
                  <option value="其他原因协商退回">其他原因协商退回</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">详细核查情况说明</label>
                <textarea
                  value={returnReasonDetail}
                  onChange={(e) => setReturnReasonDetail(e.target.value)}
                  rows={3}
                  placeholder="例：视频卡口抓拍证实该车已于半小时前由中河高架驶入三大队辖区，建议更正为三大队处置..."
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReturnRequestModalTask(null)}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnRequest}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                提交退单修改申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 3：大队再下发中队 */}
      {dispatchDownTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Send className="w-5 h-5" />
                <h3 className="text-sm font-bold">已创建指令再下发（大队派发中队）</h3>
              </div>
              <button
                onClick={() => setDispatchDownTask(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-2.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-900 space-y-1">
                <div>指令编号：<strong className="font-mono">{dispatchDownTask.taskNo}</strong></div>
                <div>指令标题：{dispatchDownTask.title}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  选择接收并负责拦截的下属中队 <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded p-2">
                  {MOCK_ORG_UNITS.filter(
                    (u) => u.level === 'squadron' && u.parentId === currentRole.unitId
                  ).map((sq) => {
                    const isSelected = selectedSquadronIds.includes(sq.id);
                    return (
                      <div
                        key={sq.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSquadronIds(selectedSquadronIds.filter((id) => id !== sq.id));
                          } else {
                            setSelectedSquadronIds([...selectedSquadronIds, sq.id]);
                          }
                        }}
                        className={`p-2 rounded border cursor-pointer flex items-center justify-between transition text-xs ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                            : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <div>{sq.name}</div>
                          <div className="text-[10px] text-slate-400">负责人：{sq.leader}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDispatchDownTask(null)}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                disabled={selectedSquadronIds.length === 0}
                onClick={handleBrigadeDispatchDown}
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs"
              >
                确认下发中队
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
