import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Clock, AlertTriangle, AlertCircle, RotateCcw, 
  Shield, CheckCircle2, ChevronRight, Eye, Send, Car, Building2,
  FileCheck, GitBranch, ArrowRight, UserCheck, Check, X, Ban
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';

interface MyTodoViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onUpdateTask: (updatedTask: DispatchTask) => void;
  onNavigateToManagement: () => void;
}

type TodoCategory = 'ALL' | 'SIGN' | 'FEEDBACK' | 'AUDIT' | 'RETURN';

export const MyTodoView: React.FC<MyTodoViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onUpdateTask,
  onNavigateToManagement,
}) => {
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('ALL');

  // 退单申请弹窗状态
  const [returnDialogTask, setReturnDialogTask] = useState<DispatchTask | null>(null);
  const [returnPreset, setReturnPreset] = useState('【非本辖区】车辆已驶离进入其他管辖大队');
  const [returnDetail, setReturnDetail] = useState('');

  // 1. 待我签收 (Pending Sign)
  const pendingSignTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      return myNode && myNode.status === 'PENDING_SIGN';
    });
  }, [tasks, currentRole.unitId]);

  // 2. 待我反馈 (Pending Feedback)
  const pendingFeedbackTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
      if (!myNode) return false;
      // 已签收状态，或者提交了部分反馈
      if (myNode.status === 'SIGNED' || myNode.status === 'FEEDBACK_SUBMITTED') {
        // 检查是否还有未通过终审的车辆或被驳回的车辆
        return t.vehicles.some(
          (v) => v.vehicleAuditStatus === 'PENDING' || v.vehicleAuditStatus === 'REJECTED'
        );
      }
      return false;
    });
  }, [tasks, currentRole.unitId]);

  // 3. 待我审核 (Pending Audit)
  // 大队用户：审核中队提交上来的反馈
  // 支队用户：审核大队通过或大队直办提交的终审
  const pendingAuditTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;

      if (currentRole.level === 'branch') {
        // 支队终审待办：有车辆处于待支队终审状态
        // 即大队已初审通过(BRIGADE_APPROVED) 或者大队直办反馈(BRIGADE_DIRECT)且总状态为PENDING
        return t.vehicles.some((v) => {
          if (v.vehicleAuditStatus !== 'PENDING') return false;
          // 查看对应节点
          const nodeWithFeedback = t.executionNodes.find((n) =>
            n.vehiclesStatus?.some((vs) => vs.vehicleId === v.id && vs.isIntercepted)
          );
          if (!nodeWithFeedback) return false;
          // 若中队提交，需等大队初审通过后再到支队
          if (nodeWithFeedback.unitLevel === 'squadron') {
            return v.brigadeAuditResult === 'PASS';
          }
          return true;
        });
      }

      if (currentRole.level === 'brigade') {
        // 大队初审待办：本大队下属中队提交了反馈，但尚未完成大队初审
        const squadronNodes = t.executionNodes.filter(
          (n) => n.unitLevel === 'squadron' && n.parentId === `node-${currentRole.unitId}`
        );
        return squadronNodes.some((n) =>
          n.vehiclesStatus?.some(
            (vs) => vs.isIntercepted && vs.auditStatus === 'PENDING'
          )
        );
      }

      return false;
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 4. 待我审批退单 (Pending Return Confirm)
  // 上级指挥长审核下级提出的退单申请
  const pendingReturnConfirmTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.overallStatus !== 'PROCESSING') return false;
      if (t.returnRequest?.status !== 'PENDING_CONFIRM') return false;
      // 是由本单位下发的，或者支队权限
      return t.creatorUnitId === currentRole.unitId || currentRole.level === 'branch';
    });
  }, [tasks, currentRole.level, currentRole.unitId]);

  // 一键签收
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

  // 下级提交退回申请
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

  // 待办总数
  const totalPendingCount = 
    pendingSignTasks.length + 
    pendingFeedbackTasks.length + 
    pendingAuditTasks.length + 
    pendingReturnConfirmTasks.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
      {/* 顶部身份与待办概览条 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">交管指令 · 我的待办办理中心</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                待办共 {totalPendingCount} 项
              </span>
            </div>
            <p className="text-xs text-slate-500">
              当前执行席位：<strong className="text-slate-800">{currentRole.unitName}</strong> · 民警：{currentRole.userName} ({currentRole.policeNo})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onNavigateToManagement}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
          >
            <span>切换至指令管理综合台账</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 快速分类导航卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. 待签收 */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'SIGN' ? 'ALL' : 'SIGN')}
          className={`p-3 rounded-lg border text-left transition relative ${
            activeCategory === 'SIGN'
              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">待我签收</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {pendingSignTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">指令接收与倒计时启动</div>
        </button>

        {/* 2. 待反馈 */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'FEEDBACK' ? 'ALL' : 'FEEDBACK')}
          className={`p-3 rounded-lg border text-left transition relative ${
            activeCategory === 'FEEDBACK'
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">待我反馈</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {pendingFeedbackTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">路面查扣核实与要素录入</div>
        </button>

        {/* 3. 待审核 */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'AUDIT' ? 'ALL' : 'AUDIT')}
          className={`p-3 rounded-lg border text-left transition relative ${
            activeCategory === 'AUDIT'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {currentRole.level === 'branch' ? '待支队终审' : '待大队初审'}
            </span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {pendingAuditTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">处置证据与文书复核</div>
        </button>

        {/* 4. 待退单确认 */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'RETURN' ? 'ALL' : 'RETURN')}
          className={`p-3 rounded-lg border text-left transition relative ${
            activeCategory === 'RETURN'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">待处理退单申请</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {pendingReturnConfirmTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">派错协商与退回确认</div>
        </button>
      </div>

      {/* 待办主列表 */}
      <div className="space-y-3">
        {totalPendingCount === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <div className="text-sm font-bold text-slate-800">当前没有待办事项</div>
            <p className="text-xs text-slate-500">
              当前登录席位的所有签收、反馈和审核任务均已按期处理完成。
            </p>
          </div>
        ) : (
          <>
            {/* 1. 待我签收区域 */}
            {(activeCategory === 'ALL' || activeCategory === 'SIGN') && pendingSignTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>待签收指令 ({pendingSignTasks.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">下级收到指令后需先完成签收，责任时限才正式生效</span>
                </div>

                {pendingSignTasks.map((task) => (
                  <div
                    key={`sign-${task.id}`}
                    onClick={() => onSelectTask(task)}
                    className="p-4 bg-white border border-blue-200 rounded-lg hover:border-blue-400 cursor-pointer shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {task.taskNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
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
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          待您签收
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span> · 
                        截止：<span className="font-mono text-rose-600 font-bold">{task.deadline}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>目标车辆：</span>
                      {task.vehicles.map((v) => (
                        <span key={v.id} className="font-mono font-bold bg-slate-50 border px-1.5 py-0.5 rounded text-[11px]">
                          {v.plateNo}
                        </span>
                      ))}
                    </div>

                    {/* 操作区 */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        发令单位：<strong>{task.creatorUnitName}</strong>
                      </span>
                      <div className="flex items-center space-x-2">
                        {/* 派错申请退回 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReturnDialogTask(task);
                          }}
                          className="px-2.5 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition"
                        >
                          派错退回
                        </button>
                        {/* 立即签收 */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickSign(task, e)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition active:scale-95 flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>立即签收</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. 待我反馈区域 */}
            {(activeCategory === 'ALL' || activeCategory === 'FEEDBACK') && pendingFeedbackTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                    <Car className="w-4 h-4 text-indigo-600" />
                    <span>待我处置反馈 ({pendingFeedbackTasks.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">已签收指令，需对每辆车进行路面布控核查并上传要素佐证</span>
                </div>

                {pendingFeedbackTasks.map((task) => (
                  <div
                    key={`feedback-${task.id}`}
                    onClick={() => onSelectTask(task)}
                    className="p-4 bg-white border border-indigo-200 rounded-lg hover:border-indigo-400 cursor-pointer shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {task.taskNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          待录入反馈
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        截止倒计时：<span className="font-mono text-amber-700 font-bold">{task.deadline}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>

                    {/* 车辆核查状态清单 */}
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                      {task.vehicles.map((v) => {
                        const isIntercepted = v.isIntercepted;
                        const isRejected = v.vehicleAuditStatus === 'REJECTED';
                        return (
                          <div key={v.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900">{v.plateNo}</span>
                              <span className="text-slate-500 text-[11px]">({v.plateType})</span>
                              {isRejected && (
                                <span className="text-rose-600 font-bold text-[10px] bg-rose-50 border border-rose-200 px-1 py-0.5 rounded">
                                  审核驳回：{v.rejectReason || '证据材料不全，请重报'}
                                </span>
                              )}
                            </div>
                            <span className={`text-[11px] font-medium ${isIntercepted ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                              {isIntercepted ? '✓ 已填报' : '● 待布控反馈'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        判定规则：【{task.completionRule === 'ANY_COMPLETE' ? '任一完成' : '全部完成'}】
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>去逐车反馈处置</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. 待我审核区域 */}
            {(activeCategory === 'ALL' || activeCategory === 'AUDIT') && pendingAuditTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {currentRole.level === 'branch'
                        ? `待支队终审 (${pendingAuditTasks.length})`
                        : `待大队初审 (${pendingAuditTasks.length})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {currentRole.level === 'branch'
                      ? '大队初审通过后由支队做最终审批，终审通过自动计入完成'
                      : '中队反馈后由大队进行初审，同意通过后自动上报支队'}
                  </span>
                </div>

                {pendingAuditTasks.map((task) => (
                  <div
                    key={`audit-${task.id}`}
                    onClick={() => onSelectTask(task)}
                    className="p-4 bg-white border border-emerald-200 rounded-lg hover:border-emerald-400 cursor-pointer shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {task.taskNo}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {currentRole.level === 'branch' ? '待支队终审' : '待大队初审'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        下发时间：{task.dispatchTime}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="text-xs text-slate-600">
                        待审车辆数：<strong>{task.vehicles.filter((v) => v.vehicleAuditStatus === 'PENDING').length}</strong> 辆
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>立即审核处置</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. 待处理退单申请区域 (上级审核) */}
            {(activeCategory === 'ALL' || activeCategory === 'RETURN') && pendingReturnConfirmTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>待审批下级退单申请 ({pendingReturnConfirmTasks.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">下级签收后提出派发错误，上级确认同意后工单退回待发池</span>
                </div>

                {pendingReturnConfirmTasks.map((task) => (
                  <div
                    key={`ret-${task.id}`}
                    onClick={() => onSelectTask(task)}
                    className="p-4 bg-amber-50/50 border border-amber-300 rounded-lg shadow-xs transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-white border px-2 py-0.5 rounded">
                          {task.taskNo}
                        </span>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          下级申请退回修改中
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        申请时间：{task.returnRequest?.requestedTime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>

                    {task.returnRequest && (
                      <div className="p-2.5 bg-white rounded border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div>
                          申请单位：<strong>{task.returnRequest.requestedByUnitName}</strong> ({task.returnRequest.requestedByName})
                        </div>
                        <div>
                          退回原因：<span className="font-medium text-amber-950">{task.returnRequest.reason}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={(e) => handleRejectReturn(task, e)}
                        className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded"
                      >
                        驳回申请 (继续执行)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleApproveReturn(task, e)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs"
                      >
                        确认同意退回 (工单待更正)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
