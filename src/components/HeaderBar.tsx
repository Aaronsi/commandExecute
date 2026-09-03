import React, { useState } from 'react';
import { 
  Menu, RefreshCw, Bell, Maximize2, UserCheck, 
  ChevronDown, X, Plus, Shield, Layers, Radio
} from 'lucide-react';
import { UserRoleContext } from '../types';
import { MainNavView } from './Sidebar';

interface HeaderBarProps {
  currentRole: UserRoleContext;
  onRoleChange: (role: UserRoleContext) => void;
  activeView: MainNavView;
  onViewChange: (view: MainNavView) => void;
  onToggleSidebar: () => void;
  onOpenCreateModal: () => void;
  warningCount?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  onToggleSidebar,
  onOpenCreateModal,
  warningCount = 5,
}) => {
  const [openTabs, setOpenTabs] = useState<MainNavView[]>([
    'workbench',
    'warnings',
    'stats',
    'branch_home',
    'tasks',
  ]);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tab display names
  const tabNames: Record<MainNavView, string> = {
    workbench: '工作台',
    branch_home: '支队首页',
    tasks: '指令管理',
    warnings: '指令异常预警',
    stats: '工作量统计',
    outline: '设计大纲与规范',
  };

  const breadcrumbName: Record<MainNavView, string> = {
    workbench: '工作台',
    branch_home: '支队首页',
    tasks: '指令管理',
    warnings: '指令异常预警',
    stats: '工作量统计',
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

          {/* Notifications / Warnings */}
          <button
            onClick={() => onViewChange('warnings')}
            title="异常预警通知"
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <Bell className="w-4 h-4" />
            {warningCount > 0 && (
              <span className="absolute 0.5 top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                {warningCount}
              </span>
            )}
          </button>

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
