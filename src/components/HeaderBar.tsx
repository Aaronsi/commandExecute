import React, { useState } from 'react';
import { 
  Menu, RefreshCw, Bell, Maximize2, UserCheck, 
  ChevronDown, X, Plus, Shield, Layers, Radio,
  Clock, AlertTriangle, RotateCcw, CheckCircle2, Ban, ArrowRight, Check, FileText
} from 'lucide-react';
import { UserRoleContext, SystemNotice } from '../types';
import { MainNavView } from './Sidebar';

interface HeaderBarProps {
  currentRole: UserRoleContext;
  onRoleChange: (role: UserRoleContext) => void;
  activeView: MainNavView;
  onViewChange: (view: MainNavView) => void;
  onToggleSidebar: () => void;
  onOpenCreateModal: () => void;
  warningCount?: number;
  systemNotices?: SystemNotice[];
  onNavigateToTodo?: (tabKey?: string, taskNo?: string) => void;
  onSelectTask?: (taskId: string) => void;
  onDismissNotice?: (noticeId: string) => void;
  onMarkAsRead?: (noticeId: string) => void;
  onDismissAllForRole?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  onToggleSidebar,
  onOpenCreateModal,
  warningCount = 5,
  systemNotices = [],
  onNavigateToTodo,
  onSelectTask,
  onDismissNotice,
  onMarkAsRead,
  onDismissAllForRole,
}) => {
  const [openTabs, setOpenTabs] = useState<MainNavView[]>([
    'branch_home',
    'workbench',
    'tasks',
    'todo',
    'warnings',
    'stats',
    'punish_stats',
  ]);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNoticeDropdownOpen, setIsNoticeDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Role's notices
  const roleNotices = systemNotices.filter(
    (n) => n.targetUnitId === currentRole.unitId || n.targetLevel === currentRole.level
  );
  const unreadNoticeCount = roleNotices.filter((n) => !n.isRead).length;

  // Tab display names
  const tabNames: Record<MainNavView, string> = {
    branch_home: '支队首页',
    workbench: '工作台',
    tasks: '指令管理',
    todo: '我的待办',
    warnings: '指令督办',
    stats: '工作量统计',
    punish_stats: '违法处罚统计',
    outline: '设计大纲与规范',
  };

  const breadcrumbName: Record<MainNavView, string> = {
    branch_home: '支队首页',
    workbench: '工作台',
    tasks: '指令管理',
    todo: '我的待办',
    warnings: '指令督办',
    stats: '工作量统计',
    punish_stats: '违法处罚统计',
    outline: '设计大纲与规范',
  };

  const rolePresets: { label: string; role: UserRoleContext }[] = [
    {
      label: '市支队指挥中心 (支队长)',
      role: {
        unitId: 'branch-01',
        unitName: '市交警支队指挥中心',
        level: 'branch',
        userName: '张志刚 (支队指挥长)',
        policeNo: '030001',
      },
    },
    {
      label: '直属一大队 (大队长-支持转派/自办)',
      role: {
        unitId: 'brigade-01',
        unitName: '直属一大队 (中心城区)',
        level: 'brigade',
        userName: '李卫民 (大队长)',
        policeNo: '031001',
      },
    },
    {
      label: '直属二大队 (大队长-自办)',
      role: {
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        level: 'brigade',
        userName: '赵建军 (大队长)',
        policeNo: '032001',
      },
    },
    {
      label: '一大队·城东一中队 (中队长/执勤警员)',
      role: {
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        level: 'squadron',
        userName: '陈勇 (中队长/警员)',
        policeNo: '034981',
      },
    },
    {
      label: '一大队·机动铁骑中队 (巡逻警员)',
      role: {
        unitId: 'squadron-01-03',
        unitName: '一大队·机动铁骑中队',
        level: 'squadron',
        userName: '林峰 (铁骑中队长)',
        policeNo: '034771',
      },
    },
  ];

  const handleCloseTab = (e: React.MouseEvent, tab: MainNavView) => {
    e.stopPropagation();
    if (openTabs.length <= 1) return;
    const nextTabs = openTabs.filter((t) => t !== tab);
    setOpenTabs(nextTabs);
    if (activeView === tab) {
      onViewChange(nextTabs[0]);
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 select-none sticky top-0 z-40">
      {/* Top Main Navigation Row */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Left: Hamburger & Breadcrumb */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="切换侧边栏"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>指挥调度</span>
            <span>/</span>
            <span className="flex items-center space-x-1.5 font-bold text-slate-800">
              {activeView === 'branch_home' && <Layers className="w-3.5 h-3.5 text-blue-600" />}
              <span>{breadcrumbName[activeView]}</span>
            </span>
          </div>
        </div>

        {/* Right Tools & Role Switcher */}
        <div className="flex items-center space-x-3">
          {/* Quick Create Task */}
          {currentRole.level !== 'squadron' && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建指令</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            title="刷新"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown (Real-time messages for Brigade & Squadron) */}
          <div className="relative">
            <button
              id="btn-header-bell"
              onClick={() => setIsNoticeDropdownOpen(!isNoticeDropdownOpen)}
              title="系统消息提醒"
              className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadNoticeCount > 0 ? (
                <span className="absolute 0.5 top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                  {unreadNoticeCount}
                </span>
              ) : warningCount > 0 ? (
                <span className="absolute 0.5 top-0.5 right-0.5 w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {warningCount}
                </span>
              ) : null}
            </button>

            {/* Notification Dropdown Panel */}
            {isNoticeDropdownOpen && (
              <div
                id="header-notice-dropdown"
                className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">系统消息提醒</span>
                    {unreadNoticeCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold font-mono">
                        {unreadNoticeCount} 未读
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {onDismissAllForRole && roleNotices.length > 0 && (
                      <button
                        onClick={() => {
                          onDismissAllForRole();
                          setIsNoticeDropdownOpen(false);
                        }}
                        className="text-[11px] text-slate-500 hover:text-blue-600 transition"
                      >
                        全部忽略
                      </button>
                    )}
                    <button
                      onClick={() => setIsNoticeDropdownOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notice List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {roleNotices.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <div>暂无系统业务消息提醒</div>
                    </div>
                  ) : (
                    roleNotices.map((notice) => {
                      const isUnread = !notice.isRead;
                      return (
                        <div
                          key={notice.id}
                          className={`p-3.5 hover:bg-slate-50/80 transition cursor-pointer ${
                            isUnread ? 'bg-blue-50/30' : ''
                          }`}
                          onClick={() => {
                            if (onMarkAsRead) onMarkAsRead(notice.id);
                            setIsNoticeDropdownOpen(false);
                            if (notice.actionType === 'GOTO_TODO' && onNavigateToTodo) {
                              onNavigateToTodo(notice.actionTab, notice.taskNo);
                            } else if (onSelectTask) {
                              onSelectTask(notice.taskId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              {notice.type === 'DISPATCH_NEW' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  待签收
                                </span>
                              )}
                              {notice.type === 'AUDIT_REJECTED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  审核驳回
                                </span>
                              )}
                              {notice.type === 'UPPER_DIRECT_RETURN' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  主动召回
                                </span>
                              )}
                              {notice.type === 'RETURN_APPROVED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  退回通过
                                </span>
                              )}
                              {notice.type === 'SQUADRON_RETURN_REQUEST' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  中队退单
                                </span>
                              )}
                              {notice.type === 'SQUADRON_FEEDBACK_SUBMITTED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                  <FileText className="w-3 h-3 text-indigo-600" />
                                  待大队初审
                                </span>
                              )}
                              {notice.type === 'TASK_CANCELLED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                  <Ban className="w-3 h-3 text-slate-500" />
                                  已撤销
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-500 font-bold">
                                {notice.taskNo}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {notice.timestamp}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 mb-1">
                            {notice.title}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                            {notice.content}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                            <span className="text-[10px] text-slate-400">
                              {isUnread ? '● 未读' : '已读'}
                            </span>
                            <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              {notice.actionType === 'GOTO_TODO' ? '前往办理' : '查看工单'}
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer link to Warnings */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setIsNoticeDropdownOpen(false);
                      onViewChange('warnings');
                    }}
                    className="text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <span>查看指令督办与异常预警 ({warningCount})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigateToTodo) onNavigateToTodo();
                      setIsNoticeDropdownOpen(false);
                    }}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    进入我的待办
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreenToggle}
            title="全屏切换"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* User Role Selector */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-lg hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                管
              </div>
              <div className="text-left text-xs font-medium text-slate-800 flex items-center gap-1">
                <span>{currentRole.userName.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </button>

            {/* Dropdown menu */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  切换执勤/指挥层级身份
                </div>
                <div className="py-1">
                  {rolePresets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onRoleChange(p.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition ${
                        currentRole.unitId === p.role.unitId ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.role.policeNo} · {p.role.unitName}</div>
                      </div>
                      {currentRole.unitId === p.role.unitId && (
                        <UserCheck className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Multi-Tab Row (As in Design 2) */}
      <div className="flex items-center px-4 sm:px-6 space-x-1 border-t border-slate-100 overflow-x-auto bg-slate-50/50">
        {openTabs.map((tab) => {
          const isActive = activeView === tab;
          return (
            <div
              key={tab}
              onClick={() => onViewChange(tab)}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <span>{tabNames[tab]}</span>
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(e, tab)}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
};
