import React, { useState, useMemo } from 'react';
import { 
  X, Shield, AlertTriangle, FileCheck, Car, CheckCircle2, 
  Calendar, Clock, Tag, GitBranch, ArrowRight, FileText, CheckCircle,
  Paperclip, Plus, Trash2, Download, Eye, Check, RefreshCw
} from 'lucide-react';
import { DispatchTask, TaskVehicle, TaskExecutionNode, TaskAttachment, UserRoleContext, SystemNotice } from '../types';
import { AuditDialog } from './AuditDialog';
import { VehicleInterceptionDialog } from './VehicleInterceptionDialog';
import { VehicleEvidenceModal } from './VehicleEvidenceModal';

export type TaskOperationMode = 'BRANCH_AUDIT' | 'BRIGADE_AUDIT' | 'FEEDBACK' | 'REJECTED_FIX';

interface TaskOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DispatchTask;
  mode: TaskOperationMode;
  currentRole: UserRoleContext;
  onUpdateTask: (updatedTask: DispatchTask) => void;
  onAddNotice?: (notice: SystemNotice) => void;
}

export const TaskOperationModal: React.FC<TaskOperationModalProps> = ({
  isOpen,
  onClose,
  task,
  mode,
  currentRole,
  onUpdateTask,
  onAddNotice,
}) => {
  // Operational dialog states
  const [auditVehicle, setAuditVehicle] = useState<TaskVehicle | null>(null);
  const [feedbackVehicle, setFeedbackVehicle] = useState<TaskVehicle | null>(null);
  const [previewEvidenceVehicle, setPreviewEvidenceVehicle] = useState<TaskVehicle | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isTextDirective = task.directiveType === 'TEXT';

  // For text directive feedback / fix
  const currentFeedbackNode = useMemo(() => {
    return task.executionNodes.find((n) => n.unitId === currentRole.unitId) || task.executionNodes[0];
  }, [task.executionNodes, currentRole.unitId]);

  const [textFeedbackContent, setTextFeedbackContent] = useState<string>(
    currentFeedbackNode?.feedbackText || ''
  );
  const [textOfficerName, setTextOfficerName] = useState<string>(
    currentFeedbackNode?.feedbackOfficer || `${currentRole.userName} (${currentRole.policeNo || '034981'})`
  );
  const [textAttachments, setTextAttachments] = useState<TaskAttachment[]>(
    currentFeedbackNode?.feedbackAttachments || []
  );

  // For text directive audits (Brigade or Branch)
  const auditableNodes = useMemo(() => {
    if (!isTextDirective) return [];
    if (mode === 'BRIGADE_AUDIT') {
      return task.executionNodes.filter(
        (n) => n.unitLevel === 'squadron' && (n.status === 'FEEDBACK_SUBMITTED' || Boolean(n.feedbackText))
      );
    }
    if (mode === 'BRANCH_AUDIT') {
      return task.executionNodes.filter(
        (n) =>
          n.brigadeAudit?.result === 'PASS' ||
          (n.unitLevel === 'brigade' && (n.status === 'FEEDBACK_SUBMITTED' || n.status === 'AUDITED_PASS'))
      );
    }
    return [];
  }, [isTextDirective, mode, task.executionNodes]);

  const [selectedAuditNodeId, setSelectedAuditNodeId] = useState<string>('');

  const activeAuditNode = useMemo(() => {
    if (selectedAuditNodeId) {
      const found = auditableNodes.find((n) => n.id === selectedAuditNodeId);
      if (found) return found;
    }
    return auditableNodes[0] || null;
  }, [auditableNodes, selectedAuditNodeId]);

  const [textAuditDecision, setTextAuditDecision] = useState<'PASS' | 'REJECT'>('PASS');
  const [textAuditRemarks, setTextAuditRemarks] = useState<string>('');

  if (!isOpen) return null;

  // Filter vehicles strictly to only those requiring action in this mode
  const filteredVehicles = useMemo(() => {
    switch (mode) {
      case 'BRANCH_AUDIT':
        // 待支队终审：已处置拦截且终审未通过
        return task.vehicles.filter((v) => v.isIntercepted && v.vehicleAuditStatus !== 'PASSED');
      case 'BRIGADE_AUDIT':
        // 待大队初审：已处置拦截且待初审
        return task.vehicles.filter(
          (v) => v.isIntercepted && (v.vehicleAuditStatus === 'PENDING' || !v.vehicleAuditStatus)
        );
      case 'FEEDBACK':
        // 待处置反馈：未拦截处置或被驳回待重报
        return task.vehicles.filter((v) => !v.isIntercepted || v.vehicleAuditStatus === 'REJECTED');
      case 'REJECTED_FIX':
        // 驳回待整改：仅显示审核被驳回的车辆
        return task.vehicles.filter((v) => v.vehicleAuditStatus === 'REJECTED');
      default:
        return task.vehicles;
    }
  }, [task.vehicles, mode]);

  const modeConfig = useMemo(() => {
    switch (mode) {
      case 'BRANCH_AUDIT':
        return {
          title: '支队终审核准与归档',
          badgeText: '待支队终审',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          btnLabel: '支队终审',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          desc: '核验大队初审结果、文书真实有效性及防倒挂合规，通过后全单办结归档。',
        };
      case 'BRIGADE_AUDIT':
        return {
          title: '大队初审核验把关',
          badgeText: '待大队初审',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
          btnLabel: '大队初审',
          btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
          desc: '核查基层中队处置凭证材料，初审合格后报送支队指挥中心终审。',
        };
      case 'FEEDBACK':
        return {
          title: '路面查控处置与反馈填报',
          badgeText: '待处置反馈',
          badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          btnLabel: '填报反馈',
          btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          desc: '执行路面布控查扣，录入六合一文书编号、现场照片及处置结果。',
        };
      case 'REJECTED_FIX':
        return {
          title: '审核驳回整改与重报',
          badgeText: '驳回待整改',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          btnLabel: '补正重报',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
          desc: '根据上级审核驳回意见，重新采集或核实凭证后再次报送初审。',
        };
    }
  }, [mode]);

  // Handle Feedback Submission
  const handleFeedbackSubmit = (data: {
    vehicleId: string;
    plateNo: string;
    plateType: any;
    disposalRecord: any;
    feedbackRemarks: string;
    location: string;
    evidenceImages?: string[];
    dynamicFeedbackValues?: Record<string, any>;
  }) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedVehicles: TaskVehicle[] = task.vehicles.map((v) => {
      if (v.id === data.vehicleId) {
        return {
          ...v,
          isIntercepted: true,
          interceptedByUnitId: currentRole.unitId,
          interceptedByUnitName: currentRole.unitName,
          interceptedTime: data.disposalRecord?.disposalTime || nowStr,
          disposalRecord: data.disposalRecord,
          feedbackRemarks: data.feedbackRemarks,
          evidenceImages: data.evidenceImages,
          dynamicFeedbackValues: data.dynamicFeedbackValues,
          vehicleAuditStatus: 'PENDING',
          rejectReason: undefined,
        };
      }
      return v;
    });

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.unitId === currentRole.unitId) {
        const vehiclesStatus = updatedVehicles.map((v) => ({
          vehicleId: v.id,
          plateNo: v.plateNo,
          isIntercepted: v.isIntercepted,
          auditStatus: v.vehicleAuditStatus,
          interceptedTime: v.interceptedTime,
        }));
        return {
          ...n,
          status: 'FEEDBACK_SUBMITTED' as const,
          vehiclesStatus,
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
          action: mode === 'REJECTED_FIX' ? '整改重新填报' : '逐车反馈填报',
          details: `${currentRole.unitName} 警员 ${currentRole.userName} 对车辆【${data.plateNo}】完成了处置反馈填报。文书号：${data.disposalRecord?.punishmentCode || '无'}。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setFeedbackVehicle(null);
    setSuccessToast(`车辆【${data.plateNo}】处置反馈已成功提交！`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Handle Audit Submission (Brigade or Branch)
  const handleAuditSubmit = (data: {
    result: 'PASS' | 'REJECT';
    remarks: string;
    rejectReason?: string;
  }) => {
    if (!auditVehicle) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const isBranch = mode === 'BRANCH_AUDIT';

    const updatedVehicles: TaskVehicle[] = task.vehicles.map((v) => {
      if (v.id === auditVehicle.id) {
        if (isBranch) {
          return {
            ...v,
            vehicleAuditStatus: data.result === 'PASS' ? 'PASSED' : 'REJECTED',
            branchAuditTime: nowStr,
            branchAuditOperator: `${currentRole.userName} (${currentRole.policeNo})`,
            branchAuditRemarks: data.remarks,
            rejectReason: data.result === 'REJECT' ? (data.rejectReason || data.remarks) : undefined,
          };
        } else {
          // Brigade audit
          return {
            ...v,
            vehicleAuditStatus: data.result === 'PASS' ? 'BRIGADE_PASSED' : 'REJECTED',
            brigadeAuditTime: nowStr,
            brigadeAuditOperator: `${currentRole.userName} (${currentRole.policeNo})`,
            brigadeAuditRemarks: data.remarks,
            rejectReason: data.result === 'REJECT' ? (data.rejectReason || data.remarks) : undefined,
          };
        }
      }
      return v;
    });

    const passedCount = updatedVehicles.filter((v) => v.vehicleAuditStatus === 'PASSED').length;
    const isCompleted =
      task.completionRule === 'ANY_COMPLETE'
        ? passedCount >= 1
        : passedCount === updatedVehicles.length && updatedVehicles.length > 0;

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.unitId === currentRole.unitId) {
        return {
          ...n,
          status: (data.result === 'PASS' ? 'AUDITED_PASS' : 'REJECTED') as any,
        };
      }
      return n;
    });

    const updatedTask: DispatchTask = {
      ...task,
      vehicles: updatedVehicles,
      executionNodes: updatedNodes,
      overallStatus: isCompleted ? 'COMPLETED' : task.overallStatus,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-audit-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: isBranch ? '市支队终审' : '辖区大队初审',
          details: `${currentRole.unitName} 对车辆【${auditVehicle.plateNo}】审核结论：【${data.result === 'PASS' ? '审核通过' : '审核驳回'}】。备注：${data.remarks}`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setAuditVehicle(null);
    setSuccessToast(
      `车辆【${auditVehicle.plateNo}】${isBranch ? '支队终审' : '大队初审'}已完成（${data.result === 'PASS' ? '通过' : '驳回'}）！`
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Text Directive: Add sample attachment
  const handleAddSampleAttachment = (type: 'PHOTO' | 'DOC' | 'TABLE') => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let newAtt: TaskAttachment;
    if (type === 'PHOTO') {
      newAtt = {
        id: `att-fb-${Date.now()}`,
        name: `现场核验与处置照片_${new Date().toISOString().slice(0, 10)}.jpg`,
        size: '2.4 MB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
        uploadedAt: nowStr,
        uploadedBy: currentRole.userName,
      };
    } else if (type === 'DOC') {
      newAtt = {
        id: `att-fb-${Date.now()}`,
        name: `整改复查通知书签收件_${new Date().toISOString().slice(0, 10)}.pdf`,
        size: '1.1 MB',
        type: 'application/pdf',
        url: '#',
        uploadedAt: nowStr,
        uploadedBy: currentRole.userName,
      };
    } else {
      newAtt = {
        id: `att-fb-${Date.now()}`,
        name: `排查台账与隐患责任清单_${new Date().toISOString().slice(0, 10)}.xlsx`,
        size: '480 KB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '#',
        uploadedAt: nowStr,
        uploadedBy: currentRole.userName,
      };
    }
    setTextAttachments([...textAttachments, newAtt]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setTextAttachments(textAttachments.filter((a) => a.id !== attId));
  };

  // Text Directive: Submit Feedback / Fix
  const handleTextFeedbackSubmit = () => {
    if (!textFeedbackContent.trim()) {
      alert('请填写处置排查情况及结果说明');
      return;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const targetNodeId = currentFeedbackNode?.id;

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.id === targetNodeId || n.unitId === currentRole.unitId) {
        return {
          ...n,
          status: 'FEEDBACK_SUBMITTED' as const,
          feedbackTime: nowStr,
          feedbackOfficer: textOfficerName,
          feedbackText: textFeedbackContent,
          feedbackAttachments: textAttachments,
          // 清除被驳回的历史状态
          brigadeAudit: mode === 'REJECTED_FIX' ? undefined : n.brigadeAudit,
          branchAudit: mode === 'REJECTED_FIX' ? undefined : n.branchAudit,
        };
      }
      return n;
    });

    const isBrigadeLevel = currentRole.level === 'brigade';
    const updatedTask: DispatchTask = {
      ...task,
      executionNodes: updatedNodes,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-fb-text-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: mode === 'REJECTED_FIX' ? '文本指令整改重报' : '文本指令反馈提交',
          details: `${currentRole.unitName} 警员 ${textOfficerName} 完成了文本指令处置反馈填报，并附带 ${textAttachments.length} 份佐证材料，报送${isBrigadeLevel ? '市支队终审' : '大队初审'}。`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setSuccessToast(`文本指令处置反馈已成功提交（报送${isBrigadeLevel ? '支队终审' : '大队初审'}）！`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  // Text Directive: Brigade Audit Submit
  const handleTextBrigadeAuditSubmit = () => {
    if (!activeAuditNode) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const remarks =
      textAuditRemarks.trim() ||
      (textAuditDecision === 'PASS'
        ? '大队核实该中队现场佐证充分，隐患整改及定点勤务落实到位，初审合格，报送市支队终审。'
        : '反馈内容过于简略，缺少具体文书凭证及复查取证照片，退回补充后重报。');

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.id === activeAuditNode.id) {
        return {
          ...n,
          status: (textAuditDecision === 'PASS' ? 'AUDITED_PASS' : 'REJECTED') as any,
          brigadeAudit: {
            auditor: currentRole.userName,
            auditorName: `${currentRole.userName} (大队长)`,
            auditTime: nowStr,
            result: textAuditDecision,
            remarks,
            opinion: remarks,
          },
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
          id: `log-audit-text-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '大队初审文本反馈',
          details: `直属大队对 ${activeAuditNode.unitName} 的处置报告初审结论：【${textAuditDecision === 'PASS' ? '初审通过' : '初审驳回'}】。审核意见：${remarks}`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setSuccessToast(`已完成对 ${activeAuditNode.unitName} 的大队初审（${textAuditDecision === 'PASS' ? '通过' : '驳回'}）！`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  // Text Directive: Branch Audit Submit
  const handleTextBranchAuditSubmit = () => {
    if (!activeAuditNode) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const remarks =
      textAuditRemarks.trim() ||
      (textAuditDecision === 'PASS'
        ? '市支队指挥中心终审核验通过，各单位现场排查详实、佐证齐全，准予结案归档。'
        : '支队复核发现佐证材料不全，退回直属大队组织重新核查补充。');

    const updatedNodes = task.executionNodes.map((n) => {
      if (n.id === activeAuditNode.id) {
        return {
          ...n,
          status: (textAuditDecision === 'PASS' ? 'COMPLETED' : 'REJECTED') as any,
          branchAudit: {
            auditor: currentRole.userName,
            auditorName: `${currentRole.userName} (支队指挥长)`,
            auditTime: nowStr,
            result: textAuditDecision,
            remarks,
            opinion: remarks,
          },
        };
      }
      return n;
    });

    // 检查是否全单已全部完成终审
    const leafNodes = updatedNodes.filter(
      (n) => n.unitLevel === 'squadron' || !updatedNodes.some((sub) => sub.parentId === n.id)
    );
    const allLeafPassed = leafNodes.length > 0 && leafNodes.every((n) => n.branchAudit?.result === 'PASS');

    const updatedTask: DispatchTask = {
      ...task,
      executionNodes: updatedNodes,
      overallStatus: allLeafPassed ? 'COMPLETED' : task.overallStatus,
      actionLogs: [
        ...task.actionLogs,
        {
          id: `log-branch-text-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: '市支队终审文本反馈',
          details: `市交警支队指挥中心对 ${activeAuditNode.unitName} 处置报告终审结论：【${textAuditDecision === 'PASS' ? '终审通过' : '终审驳回'}】。终审意见：${remarks}${allLeafPassed ? '。各责任节点均已审结，工单自动闭环归档。' : ''}`,
        },
      ],
    };

    onUpdateTask(updatedTask);
    setSuccessToast(
      `已完成对 ${activeAuditNode.unitName} 的支队终审（${textAuditDecision === 'PASS' ? '通过并办结' : '驳回'}）！`
    );
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-16 right-6 z-60 bg-slate-900/90 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Top Header: Instruction summary */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {task.taskNo}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>{task.category}</span>
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                  task.urgency === '特急'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                    : task.urgency === '紧急'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {task.urgency}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${modeConfig.badgeClass}`}>
                {modeConfig.badgeText}
              </span>
              {isTextDirective && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>公文/文本指令</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {task.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div>发令单位：<strong className="text-slate-800">{task.creatorUnitName}</strong></div>
              <div>下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span></div>
              <div>截止时限：<span className="font-mono text-rose-600 font-bold">{task.deadline}</span></div>
              <div>完结规则：<strong className="text-blue-700">{task.completionRule === 'ANY_COMPLETE' ? '任一完成' : '全部完成'}</strong></div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating Instruction Ribbon */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-700 shrink-0" />
            <span>{modeConfig.desc}</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            当前处理席位：<strong className="text-slate-800">{currentRole.unitName}</strong> ({currentRole.userName})
          </div>
        </div>

        {/* Sole Tab Header: 目标车辆处置总表 OR 文本指令处置/审核 */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center space-x-2 pb-2.5 border-b-2 border-blue-600 text-blue-700 font-bold text-xs">
            {isTextDirective ? (
              <>
                <FileText className="w-4 h-4 text-blue-600" />
                <span>
                  {mode === 'FEEDBACK'
                    ? '文本指令处置与情况反馈填报'
                    : mode === 'REJECTED_FIX'
                    ? '文本指令审核驳回整改与重报'
                    : mode === 'BRIGADE_AUDIT'
                    ? '基层中队文本处置报告 · 大队初审'
                    : '责任单位文本处置报告 · 支队终审 (办结归档)'}
                </span>
                <span className="text-[11px] px-2 py-0.2 rounded-full font-mono bg-blue-100 text-blue-800 font-bold">
                  {mode === 'BRIGADE_AUDIT' || mode === 'BRANCH_AUDIT'
                    ? `${auditableNodes.length} 个节点待审`
                    : '1 项待办待反馈'}
                </span>
              </>
            ) : (
              <>
                <Car className="w-4 h-4 text-blue-600" />
                <span>目标车辆处置总表</span>
                <span className="text-[11px] px-2 py-0.2 rounded-full font-mono bg-blue-100 text-blue-800 font-bold">
                  {filteredVehicles.length} 辆待处理
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 space-y-4">
          {/* ==================== TEXT DIRECTIVE INTERFACE ==================== */}
          {isTextDirective ? (
            <div className="space-y-4">
              {/* 指令工作要求及公文附件详情 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>指令下达内容与工作要求</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    发令单位：{task.creatorUnitName}
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                  {task.content || '无详细文字内容'}
                </div>

                {/* 随附公文附件 */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>发文附件材料 ({task.attachments.length})：</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {task.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                        >
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate font-medium text-slate-800" title={att.name}>
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{att.size}</span>
                          </div>
                          <a
                            href={att.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-1 text-[11px] font-medium shrink-0 flex items-center gap-0.5"
                          >
                            <Download className="w-3 h-3" />
                            <span>查看</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------- 模式 A: 待处置反馈 / 驳回待整改 ---------------- */}
              {(mode === 'FEEDBACK' || mode === 'REJECTED_FIX') && (
                <div className="space-y-4">
                  {/* 若处于整改模式且有驳回信息，高亮展示驳回详情 */}
                  {mode === 'REJECTED_FIX' && (() => {
                    const rejectAudit =
                      currentFeedbackNode?.branchAudit?.result === 'REJECT'
                        ? currentFeedbackNode.branchAudit
                        : currentFeedbackNode?.brigadeAudit;
                    return (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>上级审核驳回整改意见</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-900">
                          <div>
                            审核单位/人员：
                            <strong className="text-rose-950 font-bold">
                              {rejectAudit?.auditorName || rejectAudit?.auditor || '审核民警'}
                            </strong>
                          </div>
                          <div>
                            驳回时间：
                            <span className="font-mono text-rose-800">{rejectAudit?.auditTime || '近期'}</span>
                          </div>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-rose-200 text-rose-950 font-medium leading-relaxed">
                          {rejectAudit?.opinion || rejectAudit?.remarks || '请重新核实排查情况并补充有效佐证凭证。'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 填报表单卡片 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        <span>填报责任单位处置落实情况</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        填报单位：<strong className="text-slate-800">{currentRole.unitName}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          处置处警民警及警号 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={textOfficerName}
                          onChange={(e) => setTextOfficerName(e.target.value)}
                          placeholder="例如：张建国 (034981)"
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">处置填报时间</label>
                        <input
                          type="text"
                          disabled
                          value={new Date().toISOString().replace('T', ' ').substring(0, 19)}
                          className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* 快捷填入常用结论 */}
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>快捷填入标准处置结论：</span>
                        <span className="text-[11px] text-slate-400">点击自动填充至下方反馈内容</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '【排查无异常】现场排查完毕，未见明显违法异常，通行秩序良好。',
                          '【开具整改书】已责令相关责任主体限期整改，并现场开具整改通知书，纳入重点监管台账。',
                          '【定点勤务落实】已完成定点勤务布控与诱导分流，沿线信号配时优化到位。',
                          '【拉网摸排完成】已对责任路段开展拉网式排查，建立重点车辆及驾驶人排查专项档案。',
                        ].map((phrase, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTextFeedbackContent(phrase)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-700 text-[11px] transition cursor-pointer"
                          >
                            {phrase.split('】')[0]}】
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 处置情况详细说明 */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        处置排查情况及结果说明 <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={textFeedbackContent}
                        onChange={(e) => setTextFeedbackContent(e.target.value)}
                        placeholder="详细填写民警现场核实排查情况、采取的纠违/管控措施、隐患整改结论及跟进计划..."
                        className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>

                    {/* 佐证材料上传 */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                          <span>现场佐证照片与文书材料 ({textAttachments.length})</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddSampleAttachment('PHOTO')}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>现场实景照片</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSampleAttachment('DOC')}
                            className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>执法文书PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSampleAttachment('TABLE')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>排查台账Excel</span>
                          </button>
                        </div>
                      </div>

                      {textAttachments.length === 0 ? (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                          暂未添加佐证文件，可点击右上角按钮添加现场照片或文书
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {textAttachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                            >
                              <div className="flex items-center space-x-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="truncate font-medium text-slate-800" title={att.name}>
                                  {att.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{att.size}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                                title="移除文件"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 提交按钮栏 */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleTextFeedbackSubmit}
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {mode === 'REJECTED_FIX' ? '确认整改并重报' : currentRole.level === 'brigade' ? '提交支队终审' : '提交大队初审'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 模式 B: 大队初审 / 支队终审 ---------------- */}
              {(mode === 'BRIGADE_AUDIT' || mode === 'BRANCH_AUDIT') && (
                <div className="space-y-4">
                  {auditableNodes.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">当前没有需要审核的处置报告</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        所有基层中队或下级责任单位的文本报告均已完成审核把关。
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        完成并返回列表
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* 多节点切换页签 (若有多个单位报送) */}
                      {auditableNodes.length > 1 && (
                        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg overflow-x-auto text-xs">
                          <span className="text-slate-500 font-semibold px-2">待审责任单位：</span>
                          {auditableNodes.map((node) => {
                            const isSelected = activeAuditNode?.id === node.id;
                            return (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => setSelectedAuditNodeId(node.id)}
                                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {node.unitName}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 当前选中节点的处置报告 */}
                      {activeAuditNode && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span>{activeAuditNode.unitName} · 处置落实报告</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500">
                              报送时间：{activeAuditNode.feedbackTime || '已上报'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div>
                              填报人员：
                              <strong className="text-slate-800 font-semibold">
                                {activeAuditNode.feedbackOfficer || '执勤民警'}
                              </strong>
                            </div>
                            <div>
                              执行状态：
                              <span className="font-mono text-indigo-700 font-bold">
                                {activeAuditNode.status === 'FEEDBACK_SUBMITTED' ? '已报送初审' : activeAuditNode.status === 'AUDITED_PASS' ? '初审已通过' : activeAuditNode.status}
                              </span>
                            </div>
                          </div>

                          {/* 报告文本 */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">现场核实排查情况与整改结果说明：</label>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                              {activeAuditNode.feedbackText || '未录入文字说明'}
                            </div>
                          </div>

                          {/* 随附佐证材料 */}
                          {activeAuditNode.feedbackAttachments && activeAuditNode.feedbackAttachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                                <span>随附核查凭证 ({activeAuditNode.feedbackAttachments.length})：</span>
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeAuditNode.feedbackAttachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                                  >
                                    <div className="flex items-center space-x-2 overflow-hidden">
                                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                                      <span className="truncate font-medium text-slate-800" title={att.name}>
                                        {att.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{att.size}</span>
                                    </div>
                                    <a
                                      href={att.url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-purple-600 hover:text-purple-800 p-1 text-[11px] font-medium shrink-0 flex items-center gap-0.5"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>查阅</span>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 若处于支队终审且大队已有初审把关意见，展示大队初审结论 */}
                          {mode === 'BRANCH_AUDIT' && activeAuditNode.brigadeAudit && (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                              <div className="font-bold text-blue-900 flex items-center justify-between">
                                <span>直属大队初审把关意见：</span>
                                <span className="font-mono font-normal text-slate-500">
                                  审核人：{activeAuditNode.brigadeAudit.auditorName || activeAuditNode.brigadeAudit.auditor} ({activeAuditNode.brigadeAudit.auditTime})
                                </span>
                              </div>
                              <p className="text-blue-950 font-medium leading-relaxed">
                                结论：【{activeAuditNode.brigadeAudit.result === 'PASS' ? '初审合格通过' : '初审驳回'}】—— {activeAuditNode.brigadeAudit.opinion || activeAuditNode.brigadeAudit.remarks}
                              </p>
                            </div>
                          )}

                          {/* 审核结论输入区 */}
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-800">
                              {mode === 'BRIGADE_AUDIT' ? '大队初审把关结论' : '支队指挥中心终审意见'} <span className="text-rose-500">*</span>
                            </label>

                            <div className="flex items-center space-x-3">
                              <label
                                className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition select-none ${
                                  textAuditDecision === 'PASS'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="textAuditDecision"
                                  checked={textAuditDecision === 'PASS'}
                                  onChange={() => {
                                    setTextAuditDecision('PASS');
                                    setTextAuditRemarks(
                                      mode === 'BRIGADE_AUDIT'
                                        ? '大队核实该中队现场佐证充分，隐患整改及定点勤务落实到位，初审合格，报送市支队终审。'
                                        : '市支队指挥中心终审核验通过，各单位现场排查详实、佐证齐全，准予结案归档。'
                                    );
                                  }}
                                  className="hidden"
                                />
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                                <span>{mode === 'BRIGADE_AUDIT' ? '初审通过 (报送支队)' : '终审通过 (办结归档)'}</span>
                              </label>

                              <label
                                className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition select-none ${
                                  textAuditDecision === 'REJECT'
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="textAuditDecision"
                                  checked={textAuditDecision === 'REJECT'}
                                  onChange={() => {
                                    setTextAuditDecision('REJECT');
                                    setTextAuditRemarks(
                                      mode === 'BRIGADE_AUDIT'
                                        ? '反馈内容过于简略，缺少现场开具文书凭证及复查取证照片，退回中队补充佐证重报。'
                                        : '支队复核发现现场佐证不全，退回直属大队重新组织核查补充。'
                                    );
                                  }}
                                  className="hidden"
                                />
                                <AlertTriangle className="w-4 h-4 text-rose-600 mr-2" />
                                <span>{mode === 'BRIGADE_AUDIT' ? '初审驳回 (退回整改)' : '终审驳回 (退回大队)'}</span>
                              </label>
                            </div>

                            {/* 常用审核意见快捷选填 */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(textAuditDecision === 'PASS'
                                ? [
                                    mode === 'BRIGADE_AUDIT'
                                      ? '大队核实该中队现场佐证充分，初审合格，报送支队终审。'
                                      : '支队终审通过，现场排查落实到位，准予办结归档。',
                                    '排查记录详实完整，现场照片和文书凭证核验无误。',
                                  ]
                                : [
                                    '反馈内容过于简略，缺少具体文书凭证及复查取证照片，退回补充。',
                                    '未见整改责任书签收回执，责令中队复查核验后重新上报。',
                                    '现场排查遗漏支路死角，责令对盲区开展二次摸排。',
                                  ]
                              ).map((phrase, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setTextAuditRemarks(phrase)}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition cursor-pointer"
                                >
                                  {phrase.slice(0, 18)}...
                                </button>
                              ))}
                            </div>

                            <div>
                              <textarea
                                rows={3}
                                value={textAuditRemarks}
                                onChange={(e) => setTextAuditRemarks(e.target.value)}
                                placeholder="输入具体审核意见与把关说明..."
                                className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:ring-1 focus:ring-blue-500 leading-relaxed"
                              />
                            </div>

                            {/* 提交审核按钮 */}
                            <div className="pt-2 flex items-center justify-end space-x-2.5">
                              <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={
                                  mode === 'BRIGADE_AUDIT'
                                    ? handleTextBrigadeAuditSubmit
                                    : handleTextBranchAuditSubmit
                                }
                                className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                                  textAuditDecision === 'PASS'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                <span>
                                  {mode === 'BRIGADE_AUDIT'
                                    ? `确认大队初审结论 (${textAuditDecision === 'PASS' ? '通过' : '驳回'})`
                                    : `确认支队终审结论 (${textAuditDecision === 'PASS' ? '通过并办结' : '驳回'})`}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ==================== VEHICLE DIRECTIVE INTERFACE ==================== */
            filteredVehicles.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">当前页签下所有车辆均已处理完毕</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  指令中涉及的待处理车辆已全部完成处置或审核流程，无需进一步操作。
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  完成并返回待办列表
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">号牌号码</th>
                        <th className="p-3">号牌种类</th>
                        <th className="p-3">布控原因</th>
                        <th className="p-3">处警责任单位 / 民警</th>
                        <th className="p-3">处警凭证文书</th>
                        <th className="p-3">初审状态</th>
                        <th className="p-3">终审状态</th>
                        <th className="p-3 text-right">处置操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredVehicles.map((veh) => {
                        const isPassed = veh.vehicleAuditStatus === 'PASSED';
                        const isBrigadePassed = veh.vehicleAuditStatus === 'BRIGADE_PASSED' || isPassed;

                        return (
                          <tr key={veh.id} className="hover:bg-slate-50/60 transition">
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
                            <td className="p-3 text-slate-600 max-w-[160px] truncate" title={veh.riskReason}>
                              {veh.riskReason}
                            </td>
                            <td className="p-3">
                              {veh.isIntercepted ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800">{veh.interceptedByUnitName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    警员：{veh.disposalRecord?.policeOfficer || veh.disposalRecord?.policeName || '已录入'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">待路面排查处置</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-blue-900 font-medium">
                              {veh.disposalRecord?.punishmentCode || '-'}
                            </td>
                            
                            {/* Brigade Audit Status */}
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

                            {/* Branch Audit Status */}
                            <td className="p-3">
                              {isPassed ? (
                                <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-300">
                                  ★ 终审通过
                                </span>
                              ) : veh.vehicleAuditStatus === 'BRIGADE_PASSED' ? (
                                <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  待支队终审
                                </span>
                              ) : veh.vehicleAuditStatus === 'REJECTED' ? (
                                <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  驳回待整改
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {/* 查看卷宗证据 */}
                                {veh.isIntercepted && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewEvidenceVehicle(veh)}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
                                  >
                                    查验证据
                                  </button>
                                )}

                                {/* 操作按钮 (根据不同 mode 渲染) */}
                                {mode === 'BRANCH_AUDIT' && (
                                  <button
                                    type="button"
                                    onClick={() => setAuditVehicle(veh)}
                                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                                  >
                                    支队终审
                                  </button>
                                )}

                                {mode === 'BRIGADE_AUDIT' && (
                                  <button
                                    type="button"
                                    onClick={() => setAuditVehicle(veh)}
                                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                                  >
                                    大队初审
                                  </button>
                                )}

                                {mode === 'FEEDBACK' && (
                                  <button
                                    type="button"
                                    onClick={() => setFeedbackVehicle(veh)}
                                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                                  >
                                    填报反馈
                                  </button>
                                )}

                                {mode === 'REJECTED_FIX' && (
                                  <button
                                    type="button"
                                    onClick={() => setFeedbackVehicle(veh)}
                                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                                  >
                                    补正重报
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
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            完成所有车辆的处置或审核后，可点击右侧关闭返回我的待办。
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition"
          >
            关闭返回
          </button>
        </div>
      </div>

      {/* 卷宗凭证查看弹窗 */}
      {previewEvidenceVehicle && (
        <VehicleEvidenceModal
          isOpen={true}
          onClose={() => setPreviewEvidenceVehicle(null)}
          vehicle={previewEvidenceVehicle}
          taskTitle={task.title}
          taskDispatchTime={task.dispatchTime}
        />
      )}

      {/* 逐车审核弹窗 (大队初审 / 支队终审) */}
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

      {/* 逐车处置反馈与整改重报弹窗 */}
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
    </div>
  );
};
