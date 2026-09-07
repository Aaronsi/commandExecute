import React, { useMemo } from 'react';
import { 
  Send, Clock, AlertTriangle, AlertCircle, FileCheck, CheckCircle2, 
  RotateCcw, Shield, ChevronRight, ArrowRight, LayoutDashboard,
  Car, AlertOctagon, Flame, ShieldAlert, FileText, CheckSquare,
  Sparkles, Layers
} from 'lucide-react';
import { DispatchTask, UserRoleContext, TaskCategory } from '../types';

interface WorkbenchViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onNavigateToTodo: (tabKey?: string, filter?: { category?: string; urgency?: string }) => void;
  onNavigateToManagement: (filter?: { keyword?: string; status?: string }) => void;
  onOpenCreateModal: () => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onNavigateToTodo,
  onNavigateToManagement,
  onOpenCreateModal,
}) => {
  // 1. 过滤当前登录用户所属部门（包含其所辖范围）的相关任务
  // 统计周期：当天 (以系统今日为统计基准)
  const scopedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (currentRole.level === 'branch') return true;
      if (currentRole.level === 'brigade') {
        return (
          t.creatorUnitId === currentRole.unitId ||
          t.targetBrigadeIds.includes(currentRole.unitId) ||
          t.executionNodes.some((n) => n.unitId === currentRole.unitId || n.parentId === `node-${currentRole.unitId}`)
        );
      }
      // 中队级别
      return t.executionNodes.some((n) => n.unitId === currentRole.unitId);
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 计算上方 9 大指标
  // 下发数 (Dispatched)
  const dispatchedCount = scopedTasks.length;

  // 待签收 (Pending Sign)
  const pendingSignTasks = scopedTasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    const myNode = t.executionNodes.find((n) => 
      currentRole.level === 'branch' ? true : n.unitId === currentRole.unitId
    );
    return myNode && myNode.status === 'PENDING_SIGN';
  });
  const pendingSignCount = pendingSignTasks.length;

  // 逾期未签收 (Overdue Sign)
  const overdueSignCount = scopedTasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    const isUnsigned = t.executionNodes.some((n) => n.status === 'PENDING_SIGN');
    return isUnsigned && t.urgency === '特急';
  }).length;

  // 待反馈 (Pending Feedback)
  const pendingFeedbackTasks = scopedTasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    return t.executionNodes.some((n) => 
      (currentRole.level === 'branch' || n.unitId === currentRole.unitId) &&
      (n.status === 'SIGNED' || n.status === 'FEEDBACK_SUBMITTED')
    );
  });
  const pendingFeedbackCount = pendingFeedbackTasks.length;

  // 逾期未反馈 (Overdue Feedback)
  const overdueFeedbackCount = scopedTasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    const hasUnfeedback = t.executionNodes.some((n) => n.status === 'SIGNED');
    const nowTime = new Date().getTime();
    const deadlineTime = new Date(t.deadline.replace(/-/g, '/')).getTime();
    return hasUnfeedback && deadlineTime < nowTime;
  }).length;

  // 待审核 (Pending Audit)
  const pendingAuditCount = scopedTasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    return t.vehicles.some((v) => v.vehicleAuditStatus === 'PENDING');
  }).length;

  // 已办结 (Completed)
  const completedCount = scopedTasks.filter((t) => t.overallStatus === 'COMPLETED').length;

  // 错件处理：撤销数 与 退回数 (分别显示)
  const canceledErrorCount = scopedTasks.filter((t) => t.overallStatus === 'CANCELLED_ERROR').length;
  const returnedCount = scopedTasks.filter((t) => {
    return (
      t.overallStatus === 'RETURNED_DRAFT' ||
      t.returnRequest?.status === 'PENDING_CONFIRM' ||
      t.returnRequest?.status === 'CONFIRMED'
    );
  }).length;

  // 多次驳回整改数
  const multiRejectCount = scopedTasks.filter((t) => {
    const hasRejectedVehicle = t.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED');
    const rejectLogs = t.actionLogs.filter((l) => l.action.includes('驳回') || l.details.includes('驳回'));
    return hasRejectedVehicle || rejectLogs.length >= 2;
  }).length;

  // 业务类别列表及统计 (每个指令业务类别总数 / 待办数)
  const categories: TaskCategory[] = [
    '车辆缉查',
    '隐患治理',
    '违法查处',
    '重点管控',
    '专项整治',
    '其他',
  ];

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catTasks = scopedTasks.filter((t) => t.category === cat);
      const total = catTasks.length;
      // 待办定义：未完结且未撤销
      const pending = catTasks.filter(
        (t) => t.overallStatus === 'PROCESSING' || t.overallStatus === 'RETURNED_DRAFT'
      ).length;
      return {
        category: cat,
        total,
        pending,
      };
    });
  }, [scopedTasks]);

  // 紧急程度列表及统计 (每个紧急程度总数 / 待办数)
  const urgencies: ('特急' | '紧急' | '常规')[] = ['特急', '紧急', '常规'];

  const urgencyStats = useMemo(() => {
    return urgencies.map((urg) => {
      const urgTasks = scopedTasks.filter((t) => t.urgency === urg);
      const total = urgTasks.length;
      const pending = urgTasks.filter(
        (t) => t.overallStatus === 'PROCESSING' || t.overallStatus === 'RETURNED_DRAFT'
      ).length;
      return {
        urgency: urg,
        total,
        pending,
      };
    });
  }, [scopedTasks]);

  // 今日实时日期
  const todayStr = '2026-09-07';

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      {/* 顶部标题与统计周期（去除责任部门，统计周期放置在顶部最右边） */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>交管指令综合工作台</span>
            <span className="text-sm font-normal text-slate-500">· 实时履职监控、闭环效能汇算与待办直达</span>
          </h1>
        </div>

        {/* 统计周期放顶部最右边 */}
        <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
          <span className="font-semibold text-slate-600">统计周期：</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            当天实时汇算 ({todayStr})
          </span>
        </div>
      </div>

      {/* 页面上方展示：履职指标卡片（签收情况卡片整合待签收/逾期未签收；反馈情况卡片整合待反馈/逾期未反馈；错件处理卡片整合撤销/退回） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>当天实时履职核心指标卡</span>
          <span className="text-slate-400 font-normal">点击各指标数字可直接穿透至「我的待办」对应处置视图</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {/* 1. 下发数 */}
          <div
            onClick={() => onNavigateToManagement()}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group min-h-[128px]"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold text-slate-700">下发数</span>
              <Send className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
              {dispatchedCount}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>当天指令总派发</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* 2. 签收情况（包含：待签收、逾期未签收） */}
          <div className="p-4 bg-white border border-blue-200 bg-blue-50/15 rounded-xl hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between min-h-[128px]">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold">签收情况</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100 mt-1">
              <div
                onClick={() => onNavigateToTodo('PENDING_SIGN')}
                className="pr-2 cursor-pointer group hover:bg-blue-50/50 rounded p-1 transition"
                title="点击查看待签收任务"
              >
                <div className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
                  <span>待签收</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded">直达</span>
                </div>
                <div className="text-2xl font-bold font-mono text-blue-700 group-hover:scale-105 transition">
                  {pendingSignCount}
                </div>
              </div>
              <div
                onClick={() => onNavigateToTodo('PENDING_SIGN')}
                className="pl-2 cursor-pointer group hover:bg-rose-50/50 rounded p-1 transition"
                title="点击查看逾期未签收任务"
              >
                <div className="text-[11px] font-semibold text-rose-700 flex items-center justify-between">
                  <span>逾期未签收</span>
                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-bold">催办</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-700 group-hover:scale-105 transition">
                  {overdueSignCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>待响应 / 超期警示</span>
            </div>
          </div>

          {/* 3. 反馈情况（包含：待反馈、逾期未反馈） */}
          <div className="p-4 bg-white border border-indigo-200 bg-indigo-50/15 rounded-xl hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between min-h-[128px]">
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-xs font-bold">反馈情况</span>
              <Car className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100 mt-1">
              <div
                onClick={() => onNavigateToTodo('PENDING_FEEDBACK')}
                className="pr-2 cursor-pointer group hover:bg-indigo-50/50 rounded p-1 transition"
                title="点击查看待反馈处置任务"
              >
                <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
                  <span>待反馈</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded">直达</span>
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-700 group-hover:scale-105 transition">
                  {pendingFeedbackCount}
                </div>
              </div>
              <div
                onClick={() => onNavigateToTodo('PENDING_FEEDBACK')}
                className="pl-2 cursor-pointer group hover:bg-amber-50/50 rounded p-1 transition"
                title="点击查看逾期未反馈任务"
              >
                <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-between">
                  <span>逾期未反馈</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">预警</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-700 group-hover:scale-105 transition">
                  {overdueFeedbackCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>待核实 / 查处超期</span>
            </div>
          </div>

          {/* 4. 待审核 */}
          <div
            onClick={() => onNavigateToTodo(currentRole.level === 'branch' ? 'BRANCH_AUDIT' : 'BRIGADE_AUDIT')}
            className="p-4 bg-white border border-emerald-200 bg-emerald-50/15 rounded-xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group min-h-[128px]"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold">待审核</span>
              <FileCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
              {pendingAuditCount}
            </div>
            <div className="text-[11px] text-emerald-700/80 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>{currentRole.level === 'branch' ? '支队终审待办' : '大队初审待办'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">审核</span>
            </div>
          </div>

          {/* 5. 已办结 */}
          <div
            onClick={() => onNavigateToManagement({ status: 'COMPLETED' })}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group min-h-[128px]"
          >
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold">已办结</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
              {completedCount}
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>全流程闭环归档</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* 6. 错件处理（分别显示：撤销、退回） */}
          <div className="p-4 bg-white border border-amber-200 bg-amber-50/15 rounded-xl hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between min-h-[128px]">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold">错件处理</span>
              <RotateCcw className="w-4 h-4 text-amber-600" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100 mt-1">
              <div
                onClick={() => onNavigateToManagement({ status: 'CANCELLED_ERROR' })}
                className="pr-2 cursor-pointer group hover:bg-slate-100/70 rounded p-1 transition"
                title="点击查看派错撤销指令"
              >
                <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>撤销</span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono">撤单</span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-800 group-hover:scale-105 transition">
                  {canceledErrorCount}
                </div>
              </div>
              <div
                onClick={() => onNavigateToTodo('RETURN_CONFIRM')}
                className="pl-2 cursor-pointer group hover:bg-amber-50/50 rounded p-1 transition"
                title="点击进入退单待审核确认"
              >
                <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-between">
                  <span>退回</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">退单</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-700 group-hover:scale-105 transition">
                  {returnedCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>派错撤销 / 退单更正</span>
            </div>
          </div>

          {/* 7. 多次驳回整改数 */}
          <div
            onClick={() => onNavigateToTodo('REJECTED_FIX')}
            className="p-4 bg-white border border-rose-200 bg-rose-50/15 rounded-xl hover:border-rose-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group min-h-[128px]"
          >
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-xs font-bold">多次驳回整改</span>
              <AlertCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-700 mt-1">
              {multiRejectCount}
            </div>
            <div className="text-[11px] text-rose-700/80 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>凭证不符要求重报</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">整改</span>
            </div>
          </div>
        </div>
      </div>

      {/* 页面下方展示：每个业务类别总数/待办数 & 每个紧急程度总数/待办数 (Requirement 三) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 下方左侧：每个指令业务类别总数 / 待办数 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                指令业务类别分布（总数 / 待办数）
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              点击待办数字直接跳转待办
            </span>
          </div>

          <div className="space-y-3">
            {categoryStats.map((item) => {
              const pendingRatio = item.total > 0 ? Math.round((item.pending / item.total) * 100) : 0;
              return (
                <div
                  key={item.category}
                  className="p-3 bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/80 rounded-xl transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {item.category.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.category}</div>
                      <div className="text-[11px] text-slate-400">
                        未办结占比 {pendingRatio}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-mono">
                        总数: <strong className="text-slate-800">{item.total}</strong> 件
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToTodo(undefined, { category: item.category })}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-blue-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs group"
                    >
                      <span>待办:</span>
                      <span className="font-mono text-sm group-hover:text-white">{item.pending}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 下方右侧：每个紧急程度总数 / 待办数 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                指令紧急程度分布（总数 / 待办数）
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              按响应紧急级别分流督办
            </span>
          </div>

          <div className="space-y-3">
            {urgencyStats.map((item) => {
              const isHigh = item.urgency === '特急';
              const isMedium = item.urgency === '紧急';

              return (
                <div
                  key={item.urgency}
                  className={`p-3.5 border rounded-xl transition flex items-center justify-between gap-3 ${
                    isHigh
                      ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70'
                      : isMedium
                      ? 'bg-orange-50/40 border-orange-200 hover:bg-orange-50/70'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isHigh
                          ? 'bg-rose-600 text-white shadow-xs'
                          : isMedium
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {item.urgency}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.urgency}响应指令</span>
                        {isHigh && (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">
                            限时15分签收
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isHigh ? '涉重特大警情、重案逃逸或危化品失控' : isMedium ? '涉重点嫌疑套牌车查缉或隐患治理' : '常态化秩序专项整治与报备排查'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-mono">
                        总数: <strong className="text-slate-800">{item.total}</strong> 件
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToTodo(undefined, { urgency: item.urgency })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs ${
                        isHigh
                          ? 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700'
                          : isMedium
                          ? 'bg-orange-600 text-white hover:bg-orange-700 border-orange-700'
                          : 'bg-white hover:bg-blue-600 hover:text-white text-blue-700 border-slate-200'
                      }`}
                    >
                      <span>待办:</span>
                      <span className="font-mono text-sm">{item.pending}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 督办与规范提醒贴士 */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <Shield className="w-3.5 h-3.5" />
              <span>交警闭环调度考核规范</span>
            </div>
            <div className="text-[11px] text-blue-800/90 leading-relaxed">
              根据支队指挥调度效能考核标准：特急指令签收时限 ≤ 15分钟，常规指令 ≤ 30分钟；所有路面处置结果必须上传公安交管第三方凭证并进行两级审核方可闭环归档。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
