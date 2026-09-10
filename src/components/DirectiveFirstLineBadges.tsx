import React from 'react';
import { 
  Car, FileText, GitBranch, Ban, RotateCcw, 
  CheckCircle2, Clock, AlertTriangle 
} from 'lucide-react';
import { DispatchTask } from '../types';

export interface DirectiveFirstLineBadgesProps {
  task: DispatchTask | {
    taskNo: string;
    directiveType?: 'VEHICLE' | 'TEXT';
    category?: string;
    urgency?: '特急' | '紧急' | '常规' | string;
    completionRule?: 'ANY_COMPLETE' | 'ALL_COMPLETE' | string;
    overallStatus?: string;
    returnRequest?: { status: string };
    vehicles?: Array<{ vehicleAuditStatus?: string }>;
    executionNodes?: Array<{ status?: string }>;
  };
}

export const DirectiveFirstLineBadges: React.FC<DirectiveFirstLineBadgesProps> = ({ task }) => {
  const taskNo = task.taskNo || '---';
  const isTextDirective = task.directiveType === 'TEXT';
  const category = task.category || '车辆缉查';
  const urgency = task.urgency || '常规';
  const isAnyComplete = task.completionRule === 'ANY_COMPLETE';

  // Determine overall flow status (流转状态)
  const isCancelled = task.overallStatus === 'CANCELLED_ERROR';
  const isReturnedDraft = task.overallStatus === 'RETURNED_DRAFT';
  const isCompleted = task.overallStatus === 'COMPLETED';
  const isReturnPending = task.returnRequest?.status === 'PENDING_CONFIRM';
  const isOverdue = task.overallStatus === 'OVERDUE';
  const hasRejection = Boolean(
    (task.vehicles && task.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED')) ||
    (task.executionNodes && task.executionNodes.some((n) => n.status === 'REJECTED'))
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. 指令唯一编号 */}
      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center shrink-0">
        {taskNo}
      </span>

      {/* 2. 指令类别 */}
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
          isTextDirective
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        }`}
      >
        {isTextDirective ? (
          <FileText className="w-3 h-3 text-indigo-600 shrink-0" />
        ) : (
          <Car className="w-3 h-3 text-sky-600 shrink-0" />
        )}
        <span>{isTextDirective ? '文本指令' : '按车指令'}</span>
      </span>

      {/* 3. 业务类别 */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
        {category}
      </span>

      {/* 4. 紧急程度 */}
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${
          urgency === '特急'
            ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
            : urgency === '紧急'
            ? 'bg-orange-50 text-orange-700 border-orange-200'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {urgency}
      </span>

      {/* 5. 判定规则 */}
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
          isAnyComplete
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
      >
        <GitBranch className="w-3 h-3 shrink-0" />
        <span>{isAnyComplete ? '任一完成' : '全部完成'}</span>
      </span>

      {/* 6. 流转状态 */}
      {isCancelled ? (
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 shrink-0">
          <Ban className="w-3 h-3 text-slate-600 shrink-0" />
          <span>派件错误·已撤销</span>
        </span>
      ) : isReturnedDraft ? (
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
          <RotateCcw className="w-3 h-3 text-amber-700 shrink-0" />
          <span>已退回·待更正重发</span>
        </span>
      ) : isCompleted ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>已完结</span>
        </span>
      ) : isReturnPending ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-orange-600 shrink-0" />
          <span>退单审批中</span>
        </span>
      ) : hasRejection ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>审核驳回·待补正</span>
        </span>
      ) : isOverdue ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>超时未结</span>
        </span>
      ) : (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center shrink-0">
          流转中
        </span>
      )}
    </div>
  );
};
