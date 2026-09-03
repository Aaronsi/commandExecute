import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, AlertCircle, 
  RotateCcw, Shield, ChevronRight, ExternalLink, ArrowRight,
  UserCheck, Send, CheckSquare, RefreshCw, Eye
} from 'lucide-react';
import { DispatchTask, UserRoleContext } from '../types';

interface WorkbenchViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
  onSelectTask: (task: DispatchTask) => void;
  onNavigateToManagement: (filter?: { keyword?: string; status?: string }) => void;
  onOpenCreateModal: () => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  tasks,
  currentRole,
  onSelectTask,
  onNavigateToManagement,
  onOpenCreateModal,
}) => {
  // Mock Workbench Pending Task Items matching Design 2
  const pendingItems = [
    {
      id: 'task-mock-01',
      type: '待签收',
      typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '重点车辆缉查布控',
      source: '支队指挥调度中心',
      deadline: '2026-08-04 14:00',
      status: '即将超时',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
      actionText: '签收',
      actionType: 'sign',
      targetTask: tasks[0] || null,
    },
    {
      id: 'task-mock-02',
      type: '待反馈',
      typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '节假日交通疏导安排',
      source: '测试大队',
      deadline: '2026-08-04 17:00',
      status: '正常',
      statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
      actionText: '反馈',
      actionType: 'feedback',
      targetTask: tasks[1] || tasks[0] || null,
    },
    {
      id: 'task-mock-03',
      type: '待审核',
      typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '隐患路段整改落实情况',
      source: '测试一中队',
      deadline: '2026-08-04 12:00',
      status: '即将超时',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
      actionText: '审核',
      actionType: 'audit',
      targetTask: tasks[2] || tasks[0] || null,
    },
    {
      id: 'task-mock-04',
      type: '被驳回',
      typeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '夜间违法整治反馈',
      source: '测试一中队',
      deadline: '2026-08-04 18:00',
      status: '待整改',
      statusColor: 'bg-rose-100 text-rose-800 border-rose-200',
      actionText: '处理',
      actionType: 're-edit',
      targetTask: tasks[1] || tasks[0] || null,
    },
    {
      id: 'task-mock-05',
      type: '被退回',
      typeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      title: '误派至其他辖区',
      source: '支队指挥调度中心',
      deadline: '—',
      status: '已退回',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: '查看',
      actionType: 'view',
      targetTask: tasks[0] || null,
    },
  ];

  const handleAction = (item: typeof pendingItems[0]) => {
    if (item.targetTask) {
      onSelectTask(item.targetTask);
    } else if (tasks.length > 0) {
      onSelectTask(tasks[0]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* 7 Metric Indicator Cards in Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {/* Metric 1: Today Dispatched */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">今日下发数</div>
          <div className="my-2 text-2xl font-extrabold text-blue-600 font-mono">128</div>
          <div className="text-[11px] text-slate-400">较昨日 +12</div>
        </div>

        {/* Metric 2: Pending Sign */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">待签收</div>
          <div className="my-2 text-2xl font-extrabold text-amber-500 font-mono">23</div>
          <div className="text-[11px] text-rose-600 font-medium">逾期未签收 8</div>
        </div>

        {/* Metric 3: Pending Feedback */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">待反馈</div>
          <div className="my-2 text-2xl font-extrabold text-blue-600 font-mono">45</div>
          <div className="text-[11px] text-rose-600 font-medium">逾期未反馈 5</div>
        </div>

        {/* Metric 4: Pending Audit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">待审核</div>
          <div className="my-2 text-2xl font-extrabold text-sky-500 font-mono">18</div>
          <div className="text-[11px] text-slate-500">2条被驳回</div>
        </div>

        {/* Metric 5: Completed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">已办结</div>
          <div className="my-2 text-2xl font-extrabold text-emerald-600 font-mono">86</div>
          <div className="text-[11px] text-slate-500">办结率 67.2%</div>
        </div>

        {/* Metric 6: Wrong Dispatched */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">错件处理</div>
          <div className="my-2 flex items-center justify-center space-x-3">
            <div>
              <span className="text-xl font-extrabold text-rose-600 font-mono">2</span>
              <div className="text-[10px] text-slate-400">撤销</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-xl font-extrabold text-amber-500 font-mono">1</span>
              <div className="text-[10px] text-slate-400">退回</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">跨区协查退回</div>
        </div>

        {/* Metric 7: Multi-rejected */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs text-slate-500 font-medium">多次驳回整改</div>
          <div className="my-2 text-2xl font-extrabold text-rose-600 font-mono">4</div>
          <div className="text-[11px] text-slate-400">—</div>
        </div>
      </div>

      {/* Main Content Area: Left "My Pending" & Right "Status Distribution" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): My Pending Tasks List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
              <span>我的待办</span>
            </h2>
            <button
              onClick={() => onNavigateToManagement()}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
            >
              <span>查看更多</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">类型</th>
                  <th className="py-2.5 px-3">工单主题</th>
                  <th className="py-2.5 px-3">来源</th>
                  <th className="py-2.5 px-3">时限</th>
                  <th className="py-2.5 px-3">状态</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium border ${item.typeColor}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-blue-600 cursor-pointer" onClick={() => handleAction(item)}>
                      {item.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {item.source}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {item.deadline}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleAction(item)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-2 py-1 rounded hover:bg-blue-50 transition"
                      >
                        {item.actionText}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1/3 width): Task Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
                <span>工单状态分布</span>
              </h2>
            </div>

            {/* Horizontal Progress Bars */}
            <div className="mt-5 space-y-5">
              {/* Item 1: Pending Sign */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                    <span className="text-slate-600">待签收</span>
                    <span className="font-mono font-bold text-slate-900">23</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">13.4%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '13.4%' }} />
                </div>
              </div>

              {/* Item 2: Processing */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                    <span className="text-slate-600">处置中</span>
                    <span className="font-mono font-bold text-slate-900">45</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">26.2%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: '26.2%' }} />
                </div>
              </div>

              {/* Item 3: Pending Audit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                    <span className="text-slate-600">待审核</span>
                    <span className="font-mono font-bold text-slate-900">18</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">10.5%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: '10.5%' }} />
                </div>
              </div>

              {/* Item 4: Completed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                    <span className="text-slate-600">已办结</span>
                    <span className="font-mono font-bold text-slate-900">86</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">50.0%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Button in Distribution panel */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">共计 172 条在办及归档工单</span>
            {currentRole.level !== 'squadron' && (
              <button
                onClick={onOpenCreateModal}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>快速下发指令</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
