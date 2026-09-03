import React from 'react';
import { 
  LayoutDashboard, Layers, FileText, AlertTriangle, 
  BarChart3, BookOpen, ChevronLeft, ChevronRight, Shield,
  Radio, Wifi
} from 'lucide-react';

export type MainNavView = 'workbench' | 'branch_home' | 'tasks' | 'warnings' | 'stats' | 'outline';

interface SidebarProps {
  activeView: MainNavView;
  onViewChange: (view: MainNavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  taskCount?: number;
  warningCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  taskCount = 12,
  warningCount = 5,
}) => {
  const menuItems = [
    {
      id: 'workbench' as MainNavView,
      label: '工作台',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'branch_home' as MainNavView,
      label: '支队首页',
      icon: Layers,
      badge: null,
      isCurrentTag: true,
    },
    {
      id: 'tasks' as MainNavView,
      label: '指令管理',
      icon: FileText,
      badge: taskCount > 0 ? String(taskCount) : null,
      badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'warnings' as MainNavView,
      label: '指令异常预警',
      icon: AlertTriangle,
      badge: warningCount > 0 ? String(warningCount) : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'stats' as MainNavView,
      label: '工作量统计',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'outline' as MainNavView,
      label: '设计大纲与规范',
      icon: BookOpen,
      badge: null,
    },
  ];

  if (isCollapsed) {
    // Collapsed Mode (Dark Navy style as in Design 2)
    return (
      <aside className="w-16 bg-[#162b75] text-white flex flex-col justify-between items-center py-4 select-none shrink-0 transition-all duration-200 z-30 shadow-lg">
        {/* Top Mini Brand */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => onViewChange('branch_home')}
            className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-white hover:bg-blue-500/50 transition"
            title="指令调度子系统"
          >
            <Shield className="w-5 h-5 text-white" />
          </button>

          {/* Nav Icons */}
          <nav className="flex flex-col space-y-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  title={item.label}
                  className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs font-bold'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Expand Toggle */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={onToggleCollapse}
            title="展开侧边栏"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white flex items-center justify-center transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Mode (Light clean gray style as in Design 1)
  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between py-4 select-none shrink-0 transition-all duration-200 z-30">
      <div className="space-y-6">
        {/* Top Header & Window Dots */}
        <div className="px-5 space-y-3">
          <div className="flex items-center space-x-1.5 pb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight">指令调度子系统</div>
              <div className="text-[11px] text-slate-400">交警指挥中心</div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="px-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
            功能导航
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.isCurrentTag && isActive && (
                      <span className="text-[10px] bg-blue-100/70 text-blue-700 px-1.5 py-0.5 rounded font-normal">
                        当前
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                          item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Network Status and Collapse Button */}
      <div className="px-4 space-y-3 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>链路状态: 正常</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">12ms</span>
          </div>
          <div className="text-[10px] text-slate-500">指挥调度专网连接稳定</div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center space-x-1 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>收起侧边栏</span>
        </button>
      </div>
    </aside>
  );
};
