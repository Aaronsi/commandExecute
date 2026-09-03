import React from 'react';
import { Shield, Radio, Layers, BookOpen, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { UserRoleContext, OrgUnit } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';

interface NavbarProps {
  currentRole: UserRoleContext;
  onRoleChange: (role: UserRoleContext) => void;
  activeView: 'workbench' | 'outline' | 'stats';
  onViewChange: (view: 'workbench' | 'outline' | 'stats') => void;
  onNewTaskClick: () => void;
  processingCount: number;
  pendingAuditCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  onNewTaskClick,
  processingCount,
  pendingAuditCount,
}) => {
  // Preset quick roles
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

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white shadow-xs shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm sm:text-base text-white tracking-tight">
                  交通警察支队指令下发与反馈协同系统
                </span>
                <span className="hidden sm:inline-block text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-medium">
                  三级协同闭环
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Views */}
          <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-md border border-slate-700">
            <button
              onClick={() => onViewChange('workbench')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeView === 'workbench'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>指令流转演练</span>
              {processingCount > 0 && (
                <span className="bg-blue-500/40 text-blue-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {processingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('outline')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeView === 'outline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>系统架构与方案大纲</span>
            </button>

            <button
              onClick={() => onViewChange('stats')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeView === 'stats'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>效能考核看板</span>
            </button>
          </div>

          {/* Right Role Switcher & Action */}
          <div className="flex items-center space-x-3">
            {/* Role dropdown switcher */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1 rounded-md cursor-pointer transition">
                <div className={`w-2 h-2 rounded-full ${
                  currentRole.level === 'branch' ? 'bg-amber-400' :
                  currentRole.level === 'brigade' ? 'bg-blue-400' :
                  'bg-emerald-400'
                }`} />
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1">
                    <span>{currentRole.userName}</span>
                    <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300">
                      {currentRole.level === 'branch' ? '支队' : currentRole.level === 'brigade' ? '大队' : '中队'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role switch dropdown menu */}
              <div className="absolute right-0 mt-1 w-64 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                  切换模拟身份与操作权限
                </div>
                {rolePresets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onRoleChange(p.role)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 flex items-center justify-between transition-colors ${
                      currentRole.unitId === p.role.unitId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{p.label}</div>
                      <div className="text-[10px] text-slate-500">{p.role.policeNo} | {p.role.unitName}</div>
                    </div>
                    {currentRole.unitId === p.role.unitId && (
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Task Button (Available to branch and brigade) */}
            {currentRole.level !== 'squadron' && (
              <button
                onClick={onNewTaskClick}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xs transition active:scale-95"
              >
                <span>+ 创建新指令</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
