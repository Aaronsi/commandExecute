import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Clock,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Volume2,
  Layers,
  CheckCheck,
  FileCheck,
  Send,
  Eye
} from 'lucide-react';
import { SystemNotice, UserRoleContext } from '../types';

interface NotificationToastProps {
  notices: SystemNotice[];
  currentRole: UserRoleContext;
  onNavigateToTodo: (tabKey?: string, taskNo?: string) => void;
  onSelectTask: (taskId: string) => void;
  onDismissNotice: (noticeId: string) => void;
  onDismissAllForRole: () => void;
  onMarkAsRead: (noticeId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notices,
  currentRole,
  onNavigateToTodo,
  onSelectTask,
  onDismissNotice,
  onDismissAllForRole,
  onMarkAsRead,
}) => {
  // Filter active notices for current role that haven't been dismissed from toast
  const activeNotices = useMemo(() => {
    return notices.filter(
      (n) =>
        (n.targetUnitId === currentRole.unitId || n.targetLevel === currentRole.level) &&
        !n.isDismissedFromToast
    );
  }, [notices, currentRole.unitId, currentRole.level]);

  // View mode: 'grouped' (智能合并防刷屏) or 'itemized' (逐条卡片)
  // When active notices >= 2, default to grouped mode to prevent screen fatigue
  const [viewMode, setViewMode] = useState<'grouped' | 'itemized'>('grouped');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync mode if count changes
  useEffect(() => {
    if (activeNotices.length <= 1 && viewMode === 'grouped') {
      setViewMode('itemized');
    }
  }, [activeNotices.length, viewMode]);

  // Keep index in range
  useEffect(() => {
    if (currentIndex >= activeNotices.length && activeNotices.length > 0) {
      setCurrentIndex(activeNotices.length - 1);
    }
  }, [activeNotices.length, currentIndex]);

  // Grouped breakdown statistics (Hook #6: unconditionally called at top level)
  const groupedSummary = useMemo(() => {
    const counts = {
      dispatchNew: 0,
      squadronReturn: 0,
      squadronAudit: 0,
      auditRejected: 0,
      other: 0,
      urgentCount: 0,
    };

    activeNotices.forEach((n) => {
      if (n.urgency === '特急' || n.urgency === '紧急') {
        counts.urgentCount++;
      }
      if (n.type === 'DISPATCH_NEW') counts.dispatchNew++;
      else if (n.type === 'SQUADRON_RETURN_REQUEST') counts.squadronReturn++;
      else if (n.type === 'SQUADRON_FEEDBACK_SUBMITTED') counts.squadronAudit++;
      else if (n.type === 'AUDIT_REJECTED') counts.auditRejected++;
      else counts.other++;
    });

    return counts;
  }, [activeNotices]);

  if (activeNotices.length === 0) {
    return null;
  }

  const currentNotice = activeNotices[currentIndex] || activeNotices[0];

  // Visual styling according to notice type
  const getTypeStyle = (type: SystemNotice['type']) => {
    switch (type) {
      case 'DISPATCH_NEW':
        return {
          themeColor: 'border-blue-500/40 bg-slate-900/95 text-blue-400',
          badgeBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
          icon: <Clock className="w-4 h-4 text-blue-400 animate-pulse" />,
          label: '新任务下发待签收',
          btnClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
          btnText: '立即前往签收',
        };
      case 'SQUADRON_RETURN_REQUEST':
        return {
          themeColor: 'border-amber-500/40 bg-slate-900/95 text-amber-400',
          badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
          icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
          label: '中队申请退单待审批',
          btnClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20',
          btnText: '立即前往审批',
        };
      case 'SQUADRON_FEEDBACK_SUBMITTED':
        return {
          themeColor: 'border-indigo-500/40 bg-slate-900/95 text-indigo-400',
          badgeBg: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
          icon: <FileCheck className="w-4 h-4 text-indigo-400" />,
          label: '中队提交反馈待初审',
          btnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
          btnText: '立即前往初审',
        };
      case 'AUDIT_REJECTED':
        return {
          themeColor: 'border-rose-500/40 bg-slate-900/95 text-rose-400',
          badgeBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          label: '审核未通过驳回',
          btnClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20',
          btnText: '立即补正重报',
        };
      case 'UPPER_DIRECT_RETURN':
        return {
          themeColor: 'border-amber-500/40 bg-slate-900/95 text-amber-400',
          badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
          label: '上级主动退回修改',
          btnClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20',
          btnText: '查看召回指令',
        };
      case 'RETURN_APPROVED':
        return {
          themeColor: 'border-emerald-500/40 bg-slate-900/95 text-emerald-400',
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: '申请回退已通过',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
          btnText: '查看工单状态',
        };
      case 'TASK_CANCELLED':
        return {
          themeColor: 'border-slate-500/40 bg-slate-900/95 text-slate-400',
          badgeBg: 'bg-slate-700/40 text-slate-300 border border-slate-600/40',
          icon: <Ban className="w-4 h-4 text-slate-400" />,
          label: '指令已撤销作废',
          btnClass: 'bg-slate-700 hover:bg-slate-600 text-white',
          btnText: '查看存证详情',
        };
      default:
        return {
          themeColor: 'border-blue-500/40 bg-slate-900/95 text-blue-400',
          badgeBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
          icon: <Bell className="w-4 h-4 text-blue-400" />,
          label: '系统业务提醒',
          btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
          btnText: '前往办理',
        };
    }
  };

  const style = getTypeStyle(currentNotice.type);

  const handleAction = (notice: SystemNotice) => {
    onMarkAsRead(notice.id);
    onDismissNotice(notice.id);
    if (notice.actionType === 'GOTO_TODO') {
      onNavigateToTodo(notice.actionTab, notice.taskNo);
    } else {
      onSelectTask(notice.taskId);
    }
  };

  const handleDismissCurrent = () => {
    onDismissNotice(currentNotice.id);
  };

  return (
    <div
      id="notification-toast-container"
      className="fixed bottom-5 right-6 z-50 w-[450px] max-w-[calc(100vw-32px)]"
    >
      <AnimatePresence mode="wait">
        {/* ================= 方案 1: 智能合并防刷屏聚合卡片 ================= */}
        {viewMode === 'grouped' && activeNotices.length > 1 ? (
          <motion.div
            key="grouped-view"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/70 overflow-hidden ring-1 ring-white/10"
          >
            {/* Top highlight gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

            <div className="p-4 sm:p-5">
              {/* Header row with batch count */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    待办提醒智能聚合
                  </span>
                  {groupedSummary.urgentCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      {groupedSummary.urgentCount} 条紧急/特急
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onDismissAllForRole}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs"
                    title="全部忽略清除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & prompt */}
              <div className="mb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>当前收到</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono text-xs border border-blue-500/30">
                    {activeNotices.length} 条待处理业务
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  系统已为您智能防抖合并，无需频繁点击关闭，支持一键分类穿梭办理或批量清空。
                </p>
              </div>

              {/* Breakdown Category Cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {groupedSummary.dispatchNew > 0 && (
                  <button
                    onClick={() => {
                      onDismissAllForRole();
                      onNavigateToTodo('PENDING_SIGN');
                    }}
                    className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/50 hover:border-blue-700/60 transition text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[11px] text-blue-300 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        待签收指令
                      </div>
                      <div className="text-sm font-bold text-blue-100 font-mono mt-0.5">
                        {groupedSummary.dispatchNew} <span className="text-[10px] font-normal text-blue-300">条</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                )}

                {groupedSummary.squadronReturn > 0 && (
                  <button
                    onClick={() => {
                      onDismissAllForRole();
                      onNavigateToTodo('RETURN_CONFIRM');
                    }}
                    className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/50 hover:border-amber-700/60 transition text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        中队退单审批
                      </div>
                      <div className="text-sm font-bold text-amber-100 font-mono mt-0.5">
                        {groupedSummary.squadronReturn} <span className="text-[10px] font-normal text-amber-300">条</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                )}

                {groupedSummary.squadronAudit > 0 && (
                  <button
                    onClick={() => {
                      onDismissAllForRole();
                      onNavigateToTodo('BRIGADE_AUDIT');
                    }}
                    className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/50 hover:border-indigo-700/60 transition text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-indigo-400" />
                        待大队初审
                      </div>
                      <div className="text-sm font-bold text-indigo-100 font-mono mt-0.5">
                        {groupedSummary.squadronAudit} <span className="text-[10px] font-normal text-indigo-300">条</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                )}

                {groupedSummary.auditRejected > 0 && (
                  <button
                    onClick={() => {
                      onDismissAllForRole();
                      onNavigateToTodo('PENDING_FEEDBACK');
                    }}
                    className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/50 hover:border-rose-700/60 transition text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        驳回需重报
                      </div>
                      <div className="text-sm font-bold text-rose-100 font-mono mt-0.5">
                        {groupedSummary.auditRejected} <span className="text-[10px] font-normal text-rose-300">条</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                )}
              </div>

              {/* Bottom bulk actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  id="btn-toggle-itemized-mode"
                  onClick={() => setViewMode('itemized')}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>逐条卡片查看</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-bulk-dismiss-all"
                    onClick={onDismissAllForRole}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 transition flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>全部忽略</span>
                  </button>

                  <button
                    id="btn-bulk-goto-todo"
                    onClick={() => {
                      onDismissAllForRole();
                      onNavigateToTodo();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
                  >
                    <span>进入待办集中处理</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ================= 逐条卡片模式 (可快速切换上一条/下一条/全部忽略) ================= */
          <motion.div
            key={currentNotice.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/10"
          >
            {/* Top highlight bar */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${
                currentNotice.type === 'AUDIT_REJECTED'
                  ? 'from-rose-500 via-rose-400 to-amber-500'
                  : currentNotice.type === 'SQUADRON_RETURN_REQUEST'
                  ? 'from-amber-500 via-yellow-400 to-orange-500'
                  : currentNotice.type === 'SQUADRON_FEEDBACK_SUBMITTED'
                  ? 'from-indigo-500 via-blue-400 to-cyan-500'
                  : currentNotice.type === 'UPPER_DIRECT_RETURN'
                  ? 'from-amber-500 via-yellow-400 to-amber-600'
                  : currentNotice.type === 'RETURN_APPROVED'
                  ? 'from-emerald-500 via-teal-400 to-cyan-500'
                  : currentNotice.type === 'TASK_CANCELLED'
                  ? 'from-slate-500 via-slate-400 to-zinc-500'
                  : 'from-blue-600 via-cyan-400 to-indigo-500'
              }`}
            />

            <div className="p-4 sm:p-5">
              {/* Header row */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.badgeBg}`}
                  >
                    {style.icon}
                    {style.label}
                  </span>

                  {currentNotice.urgency && (
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        currentNotice.urgency === '特急'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : currentNotice.urgency === '紧急'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700/40 text-slate-300'
                      }`}
                    >
                      {currentNotice.urgency}
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentNotice.timestamp}
                  </span>
                </div>

                {/* Close (X) button */}
                <button
                  id="btn-close-toast"
                  onClick={handleDismissCurrent}
                  title="忽略此消息"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task and Title */}
              <div className="mb-2.5">
                <div className="flex items-center gap-2 text-xs text-blue-400 font-mono font-medium mb-1">
                  <span>{currentNotice.taskNo}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 font-sans truncate max-w-[240px]">
                    {currentNotice.taskTitle}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                  {currentNotice.title}
                </h4>
              </div>

              {/* Content description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40 mb-4 font-normal">
                {currentNotice.content}
              </p>

              {/* Footer actions and pager */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
                {/* Pagination controls */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  {activeNotices.length > 1 ? (
                    <>
                      <button
                        id="btn-prev-toast-notice"
                        onClick={() =>
                          setCurrentIndex((prev) =>
                            prev === 0 ? activeNotices.length - 1 : prev - 1
                          )
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                        title="上一条"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono">
                        {currentIndex + 1} / {activeNotices.length}
                      </span>
                      <button
                        id="btn-next-toast-notice"
                        onClick={() =>
                          setCurrentIndex((prev) =>
                            prev === activeNotices.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                        title="下一条"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setViewMode('grouped')}
                        className="ml-2 text-[11px] text-blue-400 hover:text-blue-300 underline"
                      >
                        聚合视图
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Volume2 className="w-3 h-3 text-blue-400" />
                      即时业务提醒
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeNotices.length > 1 && (
                    <button
                      id="btn-ignore-all-notice"
                      onClick={onDismissAllForRole}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                      title="全部忽略"
                    >
                      全部忽略
                    </button>
                  )}

                  <button
                    id="btn-ignore-toast-notice"
                    onClick={handleDismissCurrent}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                  >
                    忽略
                  </button>

                  <button
                    id="btn-handle-toast-notice"
                    onClick={() => handleAction(currentNotice)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style.btnClass}`}
                  >
                    {currentNotice.actionType === 'GOTO_TODO' ? (
                      <>
                        <span>{style.btnText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>查看指令台账</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
