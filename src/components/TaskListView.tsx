import React, { useState } from 'react';
import { 
  Search, Filter, Shield, Radio, CheckCircle2, Clock, 
  AlertTriangle, GitBranch, ArrowRight, Car, Plus, UserCheck, RefreshCw, Send, Eye
} from 'lucide-react';
import { DispatchTask, CompletionRule, UserRoleContext } from '../types';

interface TaskListViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onOpenCreateModal: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onOpenCreateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ruleFilter, setRuleFilter] = useState<'ALL' | CompletionRule>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | '特急' | '紧急' | '常规'>('ALL');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicles.some((v) => v.plateNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRule = ruleFilter === 'ALL' || t.completionRule === ruleFilter;
    const matchStatus = statusFilter === 'ALL' || t.overallStatus === statusFilter;
    const matchUrgency = urgencyFilter === 'ALL' || t.urgency === urgencyFilter;

    return matchSearch && matchRule && matchStatus && matchUrgency;
  });

  // Calculate quick metrics
  const processingTasks = tasks.filter((t) => t.overallStatus === 'PROCESSING').length;
  const completedTasks = tasks.filter((t) => t.overallStatus === 'COMPLETED').length;
  
  // Pending for current role
  const myPendingTasks = tasks.filter((t) => {
    const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
    return myNode && (myNode.status === 'PENDING_SIGN' || myNode.status === 'SIGNED');
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Top Banner & Quick Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">进行中查缉指令</div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{processingTasks}</div>
            <div className="text-[11px] text-blue-600">包含多级流转中节点</div>
          </div>
          <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">当前身份待办/待签收</div>
            <div className="text-2xl font-bold text-amber-600 font-mono">{myPendingTasks}</div>
            <div className="text-[11px] text-slate-500">{currentRole.unitName}</div>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">已完结归档指令</div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{completedTasks}</div>
            <div className="text-[11px] text-emerald-600">达成闭环考核要求</div>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">查控闭环完成率</div>
            <div className="text-2xl font-bold text-indigo-600 font-mono">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
            </div>
            <div className="text-[11px] text-slate-500">双模式自动收敛引擎</div>
          </div>
          <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <GitBranch className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-lg space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索指令标题、指令编号、目标车牌号码..."
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Completion Rule Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setRuleFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                ruleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部规则
            </button>
            <button
              onClick={() => setRuleFilter('ANY_COMPLETE')}
              className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                ruleFilter === 'ANY_COMPLETE' ? 'bg-white text-amber-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>任一完成</span>
            </button>
            <button
              onClick={() => setRuleFilter('ALL_COMPLETE')}
              className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                ruleFilter === 'ALL_COMPLETE' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>全部完成</span>
            </button>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            {(['ALL', '特急', '紧急', '常规'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUrgencyFilter(u)}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  urgencyFilter === u ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {u === 'ALL' ? '全部' : u}
              </button>
            ))}
          </div>

          {/* Create Task Button (if not squadron) */}
          {currentRole.level !== 'squadron' && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建下发指令</span>
            </button>
          )}
        </div>
      </div>

      {/* Task List Grid */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <Shield className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">暂无匹配的交管指令记录</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.overallStatus === 'COMPLETED';
            const myNode = task.executionNodes.find((n) => n.unitId === currentRole.unitId);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-150 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Task Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {task.taskNo}
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
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          task.completionRule === 'ANY_COMPLETE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>{task.completionRule === 'ANY_COMPLETE' ? '任一完成' : '全部完成'}</span>
                      </span>

                      {isCompleted ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>已完结</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          流转中
                        </span>
                      )}

                      {/* Current role pending indicator */}
                      {myNode && (myNode.status === 'PENDING_SIGN' || myNode.status === 'SIGNED') && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>本单位待办</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      {task.title}
                    </h3>

                    {/* Target vehicles tags snippet */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>目标车辆 ({task.vehicles.length})：</span>
                      </span>
                      {task.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                        >
                          <span className="font-mono text-slate-900 font-bold">{v.plateNo}</span>
                          <span className="text-slate-500 text-[10px]">({v.plateType})</span>
                          {v.isIntercepted && (
                            <span className="text-emerald-600 font-bold text-[10px] ml-0.5">✓ 已拦截</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Distribution & Quick Trigger */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 text-xs">
                    <div className="space-y-1 text-slate-500 text-left lg:text-right">
                      <div>下发单位：<strong className="text-slate-800">{task.creatorUnitName}</strong></div>
                      <div className="text-[11px]">
                        下发时间：<span className="font-mono text-slate-700">{task.dispatchTime}</span>
                      </div>
                      <div className="text-[11px]">
                        参与节点：<span className="text-blue-600 font-semibold">{task.executionNodes.length} 个大队/中队</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition text-xs border border-slate-200 hover:border-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>查看流转拓扑与详情</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
