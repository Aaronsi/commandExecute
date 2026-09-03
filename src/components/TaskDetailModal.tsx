import React, { useState } from 'react';
import { 
  X, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, 
  GitBranch, Send, ArrowRight, UserCheck, Search, Car, FileText, CheckSquare, Layers,
  Paperclip, Download, Tag, FileCheck, ExternalLink, Printer, Stamp
} from 'lucide-react';
import { DispatchTask, TaskExecutionNode, TaskVehicle, UserRoleContext, PlateType, ThirdPartyDisposalRecord } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';
import { VehicleInterceptionDialog } from './VehicleInterceptionDialog';
import { AuditDialog } from './AuditDialog';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DispatchTask;
  currentRole: UserRoleContext;
  onUpdateTask: (updatedTask: DispatchTask) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  currentRole,
  onUpdateTask,
}) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'vehicles' | 'document' | 'logs'>('topology');

  // Modal sub-states
  const [dispatchDownModalNode, setDispatchDownModalNode] = useState<TaskExecutionNode | null>(null);
  const [selectedSquadronIds, setSelectedSquadronIds] = useState<string[]>([]);

  // Interception dialog state
  const [interceptionTarget, setInterceptionTarget] = useState<{
    node: TaskExecutionNode;
    vehicle: TaskVehicle;
  } | null>(null);

  // Audit dialog state
  const [auditTarget, setAuditTarget] = useState<{
    node: TaskExecutionNode;
    vehicle: TaskVehicle;
  } | null>(null);

  if (!isOpen) return null;

  // Identify current logged in unit's node
  const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);

  // Identify nodes requiring audit by current role
  const squadronsNeedingBrigadeAudit = currentRole.level === 'brigade'
    ? task.executionNodes.filter(
        (n) => n.unitLevel === 'squadron' && n.parentId === myNode?.id && n.status === 'FEEDBACK_SUBMITTED' && !n.brigadeAudit
      )
    : [];

  const nodesNeedingBranchAudit = currentRole.level === 'branch'
    ? task.executionNodes.filter((n) => {
        if (n.unitLevel === 'brigade' && n.status === 'FEEDBACK_SUBMITTED') return true;
        if (n.unitLevel === 'squadron' && n.status === 'FEEDBACK_SUBMITTED' && n.brigadeAudit?.result === 'PASS' && !n.branchAudit) return true;
        return false;
      })
    : [];

  // Helper to re-evaluate overall task completion
  const evaluateOverallCompletion = (currentTask: DispatchTask): { isCompleted: boolean; summary: string } => {
    const { completionRule, executionNodes, vehicles } = currentTask;

    if (completionRule === 'ANY_COMPLETE') {
      // Any leaf node passed branch audit (or brigade self-handled passed branch audit)
      const anyPassedNode = executionNodes.find((n) => {
        if (n.unitLevel === 'squadron') {
          return n.status === 'AUDITED_PASS' || (n.branchAudit?.result === 'PASS' && n.brigadeAudit?.result === 'PASS');
        }
        if (n.unitLevel === 'brigade' && n.status !== 'DISPATCHED_DOWN') {
          return n.status === 'AUDITED_PASS' || n.branchAudit?.result === 'PASS';
        }
        return false;
      });

      if (anyPassedNode) {
        return {
          isCompleted: true,
          summary: `【任一完成】由 ${anyPassedNode.unitName} 完成拦截与审批，整单已自动收敛完结。`,
        };
      }
      return { isCompleted: false, summary: '【任一完成模式】：等待任一大队或中队完成处置并审核通过' };
    } else {
      // ALL_COMPLETE: Find all leaf active nodes
      const activeLeafNodes = executionNodes.filter((n) => {
        if (n.unitLevel === 'brigade') {
          // Only leaf if it did not dispatch down
          return n.status !== 'DISPATCHED_DOWN';
        }
        return true; // squadrons are always leaves
      });

      if (activeLeafNodes.length === 0) {
        return { isCompleted: false, summary: '【全部完成模式】：尚未分配具体执行节点' };
      }

      const allPassed = activeLeafNodes.every((n) => {
        if (n.unitLevel === 'squadron') {
          return n.status === 'AUDITED_PASS' || (n.branchAudit?.result === 'PASS' && n.brigadeAudit?.result === 'PASS');
        }
        return n.status === 'AUDITED_PASS' || n.branchAudit?.result === 'PASS';
      });

      const passedCount = activeLeafNodes.filter((n) => n.status === 'AUDITED_PASS' || n.branchAudit?.result === 'PASS').length;

      if (allPassed) {
        return {
          isCompleted: true,
          summary: `【全部完成】所有 ${activeLeafNodes.length} 个责任责任单元均已完成闭环审核，指令完结。`,
        };
      }
      return {
        isCompleted: false,
        summary: `【全部完成模式】：已完成 ${passedCount} / ${activeLeafNodes.length} 个责任单元`,
      };
    }
  };

  // Action: Node Sign In (签收)
  const handleSignIn = (nodeId: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedNodes = task.executionNodes.map((n) => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: 'SIGNED' as const,
          signedTime: nowStr,
          signedBy: currentRole.userName,
        };
      }
      return n;
    });

    const targetNode = task.executionNodes.find((n) => n.id === nodeId);

    const updatedTask: DispatchTask = {
      ...task,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '指令签收',
          details: `${targetNode?.unitName || currentRole.unitName} 已签收指令并进入响应处置。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
  };

  // Action: Brigade dispatches down to Squadrons (大队下发中队)
  const handleConfirmDispatchDown = () => {
    if (!dispatchDownModalNode || selectedSquadronIds.length === 0) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Create new squadron nodes
    const newSquadronNodes: TaskExecutionNode[] = selectedSquadronIds.map((sqId) => {
      const sqObj = MOCK_ORG_UNITS.find((u) => u.id === sqId);
      return {
        id: `node-${sqId}-${Date.now()}`,
        taskId: task.id,
        unitId: sqId,
        unitName: sqObj?.name || sqId,
        unitLevel: 'squadron',
        parentId: dispatchDownModalNode.id,
        status: 'PENDING_SIGN',
        vehiclesStatus: task.vehicles.map((v) => ({
          vehicleId: v.id,
          plateNo: v.plateNo,
          plateType: v.plateType,
          isIntercepted: false,
          auditStatus: 'PENDING',
        })),
      };
    });

    // Update parent brigade node
    const updatedNodes = task.executionNodes.map((n) => {
      if (n.id === dispatchDownModalNode.id) {
        return {
          ...n,
          status: 'DISPATCHED_DOWN' as const,
          dispatchedDownTime: nowStr,
          dispatchedToSquadronIds: selectedSquadronIds,
        };
      }
      return n;
    }).concat(newSquadronNodes);

    const sqNames = selectedSquadronIds
      .map((id) => MOCK_ORG_UNITS.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join('、');

    const updatedTask: DispatchTask = {
      ...task,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '大队转派中队',
          details: `${dispatchDownModalNode.unitName} 将指令转派至下属执勤中队：${sqNames}。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setDispatchDownModalNode(null);
    setSelectedSquadronIds([]);
  };

  // Action: Interception Feedback Submit (车辆拦截与凭证提交)
  const handleInterceptionSubmit = (data: {
    vehicleId: string;
    plateNo: string;
    plateType: PlateType;
    disposalRecord: ThirdPartyDisposalRecord;
    feedbackRemarks: string;
    location: string;
    evidenceImages?: string[];
    dynamicFeedbackValues?: Record<string, any>;
  }) => {
    if (!interceptionTarget) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const targetNodeId = interceptionTarget.node.id;

    const updatedNodes = task.executionNodes.map((node) => {
      if (node.id === targetNodeId) {
        const updatedVehiclesStatus = node.vehiclesStatus.map((vs) => {
          if (vs.vehicleId === data.vehicleId) {
            return {
              ...vs,
              isIntercepted: true,
              disposalRecord: data.disposalRecord,
              feedbackRemarks: data.feedbackRemarks,
              auditStatus: 'SUBMITTED' as const,
            };
          }
          return vs;
        });

        return {
          ...node,
          status: 'FEEDBACK_SUBMITTED' as const,
          feedbackTime: nowStr,
          feedbackBy: currentRole.userName,
          feedbackSummary: `已拦截车辆【${data.plateNo} ${data.plateType}】，关联文书号：${data.disposalRecord.punishmentCode}`,
          vehiclesStatus: updatedVehiclesStatus,
        };
      }
      return node;
    });

    // Also update global vehicle status
    const updatedVehicles = task.vehicles.map((v) => {
      if (v.id === data.vehicleId) {
        return {
          ...v,
          isIntercepted: true,
          interceptedByUnitId: interceptionTarget.node.unitId,
          interceptedByUnitName: interceptionTarget.node.unitName,
          interceptedTime: data.disposalRecord.disposalTime,
          disposalRecord: data.disposalRecord,
          feedbackRemarks: data.feedbackRemarks,
          evidenceImages: data.evidenceImages,
          dynamicFeedbackValues: data.dynamicFeedbackValues,
          vehicleAuditStatus: 'PENDING' as const,
        };
      }
      return v;
    });

    const updatedTask: DispatchTask = {
      ...task,
      vehicles: updatedVehicles,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '拦截反馈提交',
          details: `${interceptionTarget.node.unitName} 成功拦截 ${data.plateNo} (${data.plateType})，文书编号：${data.disposalRecord.punishmentCode}，已提交审核。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setInterceptionTarget(null);
  };

  // Action: Audit Submit (审核/驳回)
  const handleAuditSubmit = (auditResult: {
    result: 'PASS' | 'REJECT';
    remarks: string;
    rejectReason?: string;
  }) => {
    if (!auditTarget) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const isBranch = currentRole.level === 'branch';
    const isBrigade = currentRole.level === 'brigade';

    const updatedNodes = task.executionNodes.map((node) => {
      if (node.id === auditTarget.node.id) {
        let newStatus = node.status;
        let brigadeAudit = node.brigadeAudit;
        let branchAudit = node.branchAudit;

        if (isBrigade) {
          brigadeAudit = {
            auditor: currentRole.userName,
            auditTime: nowStr,
            result: auditResult.result,
            remarks: auditResult.remarks,
          };
          newStatus = auditResult.result === 'PASS' ? 'FEEDBACK_SUBMITTED' : 'REJECTED';
        } else if (isBranch) {
          branchAudit = {
            auditor: currentRole.userName,
            auditTime: nowStr,
            result: auditResult.result,
            remarks: auditResult.remarks,
          };
          newStatus = auditResult.result === 'PASS' ? 'AUDITED_PASS' : 'REJECTED';
        }

        const updatedVehiclesStatus = node.vehiclesStatus.map((vs) => {
          if (vs.vehicleId === auditTarget.vehicle.id) {
            return {
              ...vs,
              auditStatus: auditResult.result === 'PASS' ? ('PASSED' as const) : ('REJECTED' as const),
              rejectReason: auditResult.rejectReason,
            };
          }
          return vs;
        });

        return {
          ...node,
          status: newStatus,
          brigadeAudit,
          branchAudit,
          vehiclesStatus: updatedVehiclesStatus,
        };
      }
      return node;
    });

    // Update global vehicle audit status
    const updatedVehicles = task.vehicles.map((v) => {
      if (v.id === auditTarget.vehicle.id) {
        return {
          ...v,
          vehicleAuditStatus: auditResult.result === 'PASS' ? ('PASSED' as const) : ('REJECTED' as const),
        };
      }
      return v;
    });

    let preliminaryTask: DispatchTask = {
      ...task,
      vehicles: updatedVehicles,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: isBranch
            ? auditResult.result === 'PASS' ? '支队终审通过' : '支队终审驳回'
            : auditResult.result === 'PASS' ? '大队初审通过' : '大队初审驳回',
          details: `对 ${auditTarget.node.unitName} 提交的车辆【${auditTarget.vehicle.plateNo}】进行审核。结论：${
            auditResult.result === 'PASS' ? '通过' : '驳回（' + auditResult.remarks + '）'
          }`,
        },
      ],
    };

    // Re-evaluate task overall status
    const evaluation = evaluateOverallCompletion(preliminaryTask);
    if (evaluation.isCompleted) {
      preliminaryTask.overallStatus = 'COMPLETED';
      preliminaryTask.completedTime = nowStr;
      preliminaryTask.completionSummary = evaluation.summary;
    }

    onUpdateTask(preliminaryTask);
    setAuditTarget(null);
  };

  // Group brigade and squadron nodes for 1->N->M tree display
  const brigadeNodes = task.executionNodes.filter((n) => n.unitLevel === 'brigade');
  const getSquadronsForBrigade = (brigadeNodeId: string) => {
    return task.executionNodes.filter((n) => n.parentId === brigadeNodeId);
  };

  const evalStatus = evaluateOverallCompletion(task);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-xl overflow-hidden my-4">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
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

              {task.overallStatus === 'COMPLETED' ? (
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

            {/* Task Attachments if any */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>指令附件 ({task.attachments.length}):</span>
                </span>
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs transition"
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span>{att.name}</span>
                    <span className="text-[10px] text-slate-400">({att.size})</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Completion Rule Banner */}
        <div className={`px-6 py-2.5 border-b text-xs flex items-center justify-between ${
          task.overallStatus === 'COMPLETED'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium'
            : 'bg-slate-50/70 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{evalStatus.summary}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            目标车辆：{task.vehicles.length} 辆 | 参与大队：{task.targetBrigadeIds.length} 个
          </div>
        </div>

        {/* 🚨 CURRENT ROLE OPERATIONAL ACTION DESK (执勤与指挥快速响应工作台) */}
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              席
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">当前操作席位：{currentRole.unitName}</span>
                <span className="text-[11px] text-slate-500 font-mono">({currentRole.userName})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-blue-700 shadow-2xs">
                  {currentRole.level === 'branch' ? '市支队指挥长' : currentRole.level === 'brigade' ? '大队指挥长' : '基层执勤中队'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {myNode ? (
                  <>
                    本单位状态：
                    <span className="font-semibold text-slate-900 ml-1">
                      {myNode.status === 'PENDING_SIGN' && '🔴 待签收指令'}
                      {myNode.status === 'SIGNED' && (myNode.unitLevel === 'brigade' ? '🟡 已签收 (支持大队自办或转派中队)' : '🟡 执勤排查中 (待路面拦截与反馈)')}
                      {myNode.status === 'DISPATCHED_DOWN' && '🔵 已下发转派下属中队'}
                      {myNode.status === 'FEEDBACK_SUBMITTED' && '🟣 已提交要素反馈 (正在等待审核)'}
                      {myNode.status === 'AUDITED_PASS' && '🟢 审核通过，已闭环归档'}
                      {myNode.status === 'REJECTED' && '⚠️ 被驳回，请按审核意见重新反馈'}
                    </span>
                  </>
                ) : currentRole.level === 'branch' ? (
                  <span>市支队发端与终审监管视角 (可监控所有大队及下属中队处置)</span>
                ) : (
                  <span>当前席位未参与本指令的责任分配</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for Current Operator */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 1. Sign In Action */}
            {myNode && myNode.status === 'PENDING_SIGN' && (
              <button
                onClick={() => handleSignIn(myNode.id)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>一键签收指令</span>
              </button>
            )}

            {/* 2. Squadron: Road Intercept & Feedback Form */}
            {myNode && (myNode.status === 'SIGNED' || myNode.status === 'REJECTED') && myNode.unitLevel === 'squadron' && (
              <button
                onClick={() => {
                  const targetVeh = task.vehicles.find((v) => !v.isIntercepted) || task.vehicles[0];
                  setInterceptionTarget({ node: myNode, vehicle: targetVeh });
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-1.5 animate-pulse"
              >
                <FileCheck className="w-4 h-4" />
                <span>⚡ 立即填报现场拦截与要素化反馈</span>
              </button>
            )}

            {/* 3. Brigade: Self-handle Feedback OR Dispatch Down */}
            {myNode && myNode.status === 'SIGNED' && myNode.unitLevel === 'brigade' && (
              <>
                <button
                  onClick={() => {
                    const targetVeh = task.vehicles.find((v) => !v.isIntercepted) || task.vehicles[0];
                    setInterceptionTarget({ node: myNode, vehicle: targetVeh });
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>⚡ 大队自办并填报反馈</span>
                </button>

                <button
                  onClick={() => {
                    setDispatchDownModalNode(myNode);
                    const defaultSq = MOCK_ORG_UNITS.filter((u) => u.parentId === myNode.unitId).map((u) => u.id);
                    setSelectedSquadronIds(defaultSq);
                  }}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>转派下发下属中队</span>
                </button>
              </>
            )}

            {/* 4. Brigade: Audit sub-squadron */}
            {squadronsNeedingBrigadeAudit.length > 0 && (
              <button
                onClick={() => {
                  const sq = squadronsNeedingBrigadeAudit[0];
                  const veh = task.vehicles[0];
                  setAuditTarget({ node: sq, vehicle: veh });
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>大队初审核验 ({squadronsNeedingBrigadeAudit.length}份待审)</span>
              </button>
            )}

            {/* 5. Branch: Final Audit */}
            {nodesNeedingBranchAudit.length > 0 && (
              <button
                onClick={() => {
                  const node = nodesNeedingBranchAudit[0];
                  const veh = task.vehicles[0];
                  setAuditTarget({ node, vehicle: veh });
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>支队终审核验 ({nodesNeedingBranchAudit.length}份待审)</span>
              </button>
            )}
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('topology')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'topology'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>1 ➔ N ➔ M 组织流转拓扑</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vehicles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>目标车辆拦截处置总表 ({task.vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('document')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'document'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>交管红头督办指令单</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>流转与审核证据日志 ({task.actionLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* TAB 1: TOPOLOGY */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              {/* Branch Root Header */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold">
                    支
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{task.creatorUnitName}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">指令发端与终审</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      下发人：{task.creatorName} | 要求：{task.content}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400 text-[11px]">终审状态</div>
                  <div className="font-semibold text-blue-700">支队指挥调度中心</div>
                </div>
              </div>

              {/* Brigades and Squadrons List */}
              <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-slate-200 relative">
                {brigadeNodes.map((bNode) => {
                  const squadrons = getSquadronsForBrigade(bNode.id);
                  const isCurrentBrigadeUser = currentRole.unitId === bNode.unitId;

                  return (
                    <div key={bNode.id} className="space-y-3 relative">
                      {/* Branch line indicator */}
                      <div className="absolute -left-[25px] sm:-left-[33px] top-6 w-5 sm:w-7 h-0.5 bg-slate-200" />

                      {/* Brigade Node Card */}
                      <div className={`p-4 rounded-xl border transition ${
                        bNode.status === 'AUDITED_PASS'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : bNode.status === 'DISPATCHED_DOWN'
                          ? 'bg-blue-50/40 border-blue-200'
                          : bNode.status === 'REJECTED'
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center justify-center text-xs">
                              大
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">{bNode.unitName}</span>
                                {isCurrentBrigadeUser && (
                                  <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                                    👈 当前操作席位
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {bNode.status === 'PENDING_SIGN' && '🔴 待签收'}
                                {bNode.status === 'SIGNED' && '🟡 已签收 (自办处置中)'}
                                {bNode.status === 'DISPATCHED_DOWN' && '🔵 已下发转派下属中队'}
                                {bNode.status === 'FEEDBACK_SUBMITTED' && '🟣 已提交反馈 (待支队审核)'}
                                {bNode.status === 'AUDITED_PASS' && '🟢 审核通过完结'}
                                {bNode.status === 'REJECTED' && '⚠️ 已被驳回'}
                              </div>
                            </div>
                          </div>

                          {/* Brigade Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {/* Sign In Button if Pending */}
                            {bNode.status === 'PENDING_SIGN' && isCurrentBrigadeUser && (
                              <button
                                onClick={() => handleSignIn(bNode.id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>大队立即签收</span>
                              </button>
                            )}

                            {/* Options once signed: Self-handle OR Dispatch to squadrons */}
                            {bNode.status === 'SIGNED' && isCurrentBrigadeUser && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setDispatchDownModalNode(bNode);
                                    // Default select squadrons under this brigade
                                    const defaultSq = MOCK_ORG_UNITS.filter((u) => u.parentId === bNode.unitId).map((u) => u.id);
                                    setSelectedSquadronIds(defaultSq);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>转派下属中队</span>
                                </button>
                              </div>
                            )}

                            {/* Branch Audit on Brigade (if self-handled and submitted) */}
                            {bNode.status === 'FEEDBACK_SUBMITTED' && currentRole.level === 'branch' && (
                              <button
                                onClick={() => {
                                  const targetV = task.vehicles[0];
                                  setAuditTarget({ node: bNode, vehicle: targetV });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1"
                              >
                                <span>支队审核</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* If Brigade self-handles (SIGNED or FEEDBACK_SUBMITTED): Show vehicle actions */}
                        {bNode.status !== 'DISPATCHED_DOWN' && (
                          <div className="mt-3 space-y-2">
                            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                              <span>大队自办拦截清单：</span>
                              {bNode.signedTime && (
                                <span className="font-mono text-[10px] text-slate-400">签收时间：{bNode.signedTime}</span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {task.vehicles.map((veh) => {
                                const vStat = bNode.vehiclesStatus.find((v) => v.vehicleId === veh.id);
                                return (
                                  <div
                                    key={veh.id}
                                    className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">{veh.plateNo}</span>
                                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                          {veh.plateType}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        {vStat?.isIntercepted ? (
                                          <span className="text-emerald-700 font-semibold">已拦截处置 ({vStat.auditStatus})</span>
                                        ) : (
                                          <span className="text-slate-400">待拦截</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action button if current user is this Brigade and not yet intercepted */}
                                    {isCurrentBrigadeUser && bNode.status === 'SIGNED' && !vStat?.isIntercepted && (
                                      <button
                                        onClick={() => setInterceptionTarget({ node: bNode, vehicle: veh })}
                                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-xs"
                                      >
                                        拦截并核验证据
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Squadron Nodes under this Brigade (if dispatched down) */}
                      {bNode.status === 'DISPATCHED_DOWN' && (
                        <div className="pl-6 sm:pl-8 space-y-2 border-l-2 border-indigo-200 relative">
                          <div className="text-[11px] text-indigo-700 font-semibold mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>下属执勤中队 ({squadrons.length} 个中队)</span>
                          </div>

                          {squadrons.map((sqNode) => {
                            const isCurrentSquadronUser = currentRole.unitId === sqNode.unitId;

                            return (
                              <div
                                key={sqNode.id}
                                className={`p-3.5 rounded-lg border transition ${
                                  sqNode.status === 'AUDITED_PASS'
                                    ? 'bg-emerald-50/70 border-emerald-300'
                                    : sqNode.status === 'REJECTED'
                                    ? 'bg-rose-50/70 border-rose-300'
                                    : sqNode.status === 'FEEDBACK_SUBMITTED'
                                    ? 'bg-purple-50/60 border-purple-200'
                                    : 'bg-white border-slate-200 shadow-xs'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center justify-center text-[11px]">
                                      中
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-slate-900">{sqNode.unitName}</span>
                                        {isCurrentSquadronUser && (
                                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                                            👈 当前操作席位
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        {sqNode.status === 'PENDING_SIGN' && '🔴 待签收'}
                                        {sqNode.status === 'SIGNED' && '🟡 执勤中 (待路面拦截)'}
                                        {sqNode.status === 'FEEDBACK_SUBMITTED' && '🟣 已反馈 (待大队/支队审核)'}
                                        {sqNode.status === 'AUDITED_PASS' && '🟢 审核通过完结'}
                                        {sqNode.status === 'REJECTED' && '⚠️ 被驳回 (待重新反馈)'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Squadron Actions */}
                                  <div className="flex items-center space-x-2">
                                    {/* Squadron sign in */}
                                    {sqNode.status === 'PENDING_SIGN' && isCurrentSquadronUser && (
                                      <button
                                        onClick={() => handleSignIn(sqNode.id)}
                                        className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                                      >
                                        中队签收
                                      </button>
                                    )}

                                    {/* Squadron feedback action */}
                                    {(sqNode.status === 'SIGNED' || sqNode.status === 'REJECTED') && isCurrentSquadronUser && (
                                      <button
                                        onClick={() => {
                                          const firstVeh = task.vehicles[0];
                                          setInterceptionTarget({ node: sqNode, vehicle: firstVeh });
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                                      >
                                        {sqNode.status === 'REJECTED' ? '重新拦截/再次反馈' : '路面拦截与核验调证'}
                                      </button>
                                    )}

                                    {/* Brigade Audit Button (if brigade user) */}
                                    {sqNode.status === 'FEEDBACK_SUBMITTED' && isCurrentBrigadeUser && !sqNode.brigadeAudit && (
                                      <button
                                        onClick={() => {
                                          const targetV = task.vehicles[0];
                                          setAuditTarget({ node: sqNode, vehicle: targetV });
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
                                      >
                                        大队初审
                                      </button>
                                    )}

                                    {/* Branch Audit Button (if branch user and brigade passed) */}
                                    {sqNode.status === 'FEEDBACK_SUBMITTED' && currentRole.level === 'branch' && sqNode.brigadeAudit?.result === 'PASS' && (
                                      <button
                                        onClick={() => {
                                          const targetV = task.vehicles[0];
                                          setAuditTarget({ node: sqNode, vehicle: targetV });
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
                                      >
                                        支队终审
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Rejection reason badge if rejected */}
                                {sqNode.status === 'REJECTED' && (
                                  <div className="mt-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                                    <strong>驳回原因：</strong> {sqNode.brigadeAudit?.remarks || sqNode.branchAudit?.remarks || '证据不合规'}
                                  </div>
                                )}

                                {/* Feedback Summary if submitted */}
                                {sqNode.feedbackSummary && (
                                  <div className="mt-2 p-2 rounded-md bg-slate-50 text-[11px] text-slate-700 border border-slate-200 flex items-center justify-between">
                                    <span>{sqNode.feedbackSummary}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{sqNode.feedbackTime}</span>
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

          {/* TAB 2: VEHICLE MATRIX */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="p-3">号牌号码</th>
                      <th className="p-3">号牌种类</th>
                      <th className="p-3">布控原因</th>
                      <th className="p-3">拦截处置状态</th>
                      <th className="p-3">处警单位 / 民警</th>
                      <th className="p-3">第三方文书编号</th>
                      <th className="p-3">核验状态</th>
                      <th className="p-3 text-right">处置与核验操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {task.vehicles.map((veh) => {
                      const canCurrentRoleFeedback = myNode && (myNode.status === 'SIGNED' || myNode.status === 'REJECTED');

                      return (
                        <tr key={veh.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded">{veh.plateNo}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">{veh.plateType}</span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{veh.riskReason}</td>
                          <td className="p-3">
                            {veh.isIntercepted ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 已拦截处置
                              </span>
                            ) : (
                              <span className="text-slate-400">待拦截</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">
                            {veh.interceptedByUnitName || '-'}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-amber-700 font-medium">
                            {veh.disposalRecord?.punishmentCode || '-'}
                          </td>
                          <td className="p-3">
                            {veh.vehicleAuditStatus === 'PASSED' ? (
                              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                审核通过
                              </span>
                            ) : veh.vehicleAuditStatus === 'REJECTED' ? (
                              <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                已驳回
                              </span>
                            ) : veh.isIntercepted ? (
                              <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                待审批
                              </span>
                            ) : (
                              <span className="text-slate-400">排查中</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {canCurrentRoleFeedback && !veh.isIntercepted && (
                              <button
                                onClick={() => setInterceptionTarget({ node: myNode!, vehicle: veh })}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition"
                              >
                                填报此车反馈
                              </button>
                            )}
                            {veh.isIntercepted && (
                              <button
                                onClick={() => setInterceptionTarget({ node: myNode || task.executionNodes[0], vehicle: veh })}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                              >
                                查看文书证据
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RED-HEADER OFFICIAL DOCUMENT */}
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

          {/* TAB 4: ACTION LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {task.actionLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">{log.action}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-700">{log.details}</div>
                  <div className="text-[11px] text-slate-500">
                    操作人：{log.operatorName} ({log.operatorUnit})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition"
          >
            关闭详情
          </button>
        </div>
      </div>

      {/* Sub-modal: Brigade dispatch down to squadrons */}
      {dispatchDownModalNode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>转派下发至下属执勤中队</span>
            </h3>
            <p className="text-xs text-slate-500">
              大队：{dispatchDownModalNode.unitName}
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {MOCK_ORG_UNITS.filter((u) => u.parentId === dispatchDownModalNode.unitId).map((sq) => {
                const checked = selectedSquadronIds.includes(sq.id);
                return (
                  <div
                    key={sq.id}
                    onClick={() => {
                      if (checked) {
                        setSelectedSquadronIds(selectedSquadronIds.filter((id) => id !== sq.id));
                      } else {
                        setSelectedSquadronIds([...selectedSquadronIds, sq.id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                      checked
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium">{sq.name}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setDispatchDownModalNode(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white shadow-xs"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDispatchDown}
                disabled={selectedSquadronIds.length === 0}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-40"
              >
                确认下发 ({selectedSquadronIds.length} 个中队)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Road Interception with 3rd-party query */}
      {interceptionTarget && (
        <VehicleInterceptionDialog
          isOpen={true}
          onClose={() => setInterceptionTarget(null)}
          vehicle={{
            vehicleId: interceptionTarget.vehicle.id,
            plateNo: interceptionTarget.vehicle.plateNo,
            plateType: interceptionTarget.vehicle.plateType,
            riskReason: interceptionTarget.vehicle.riskReason,
          }}
          taskDispatchTime={task.dispatchTime}
          taskCategory={task.category}
          feedbackElements={task.feedbackElements}
          currentRole={currentRole}
          onSubmitFeedback={handleInterceptionSubmit}
        />
      )}

      {/* Sub-modal: Audit & Reject dialog */}
      {auditTarget && (
        <AuditDialog
          isOpen={true}
          onClose={() => setAuditTarget(null)}
          nodeId={auditTarget.node.id}
          unitName={auditTarget.node.unitName}
          vehicle={auditTarget.vehicle}
          taskDispatchTime={task.dispatchTime}
          currentRole={currentRole}
          onAuditSubmit={handleAuditSubmit}
        />
      )}
    </div>
  );
};
