import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, AlertCircle, AlertTriangle, 
  RotateCcw, Shield, Clock, ChevronRight, TrendingUp,
  Building2, Users, Search, ArrowUpRight, Filter
} from 'lucide-react';
import { DispatchTask, UserRoleContext } from '../types';

interface BranchHomeViewProps {
  tasks: DispatchTask[];
  onSelectTask: (task: DispatchTask) => void;
  onNavigateToManagement: (filter?: { keyword?: string; status?: string; brigade?: string }) => void;
  onOpenCreateModal: () => void;
}

export const BranchHomeView: React.FC<BranchHomeViewProps> = ({
  tasks,
  onSelectTask,
  onNavigateToManagement,
  onOpenCreateModal,
}) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [levelFilter, setLevelFilter] = useState<'all' | 'brigade' | 'squadron'>('all');
  const [selectedRankDetail, setSelectedRankDetail] = useState<{ title: string; unit: string; count: number } | null>(null);

  // Top5 Rankings data structured as in Design 1
  const topBrigadeLateSign = [
    { rank: 1, name: '东港大队', count: 23 },
    { rank: 2, name: '岚山大队', count: 19 },
    { rank: 3, name: '莒县大队', count: 16 },
    { rank: 4, name: '五莲大队', count: 14 },
    { rank: 5, name: '经开区大队', count: 12 },
  ];

  const topBrigadeLateFeedback = [
    { rank: 1, name: '岚山大队', count: 21 },
    { rank: 2, name: '东港大队', count: 18 },
    { rank: 3, name: '五莲大队', count: 15 },
    { rank: 4, name: '莒县大队', count: 13 },
    { rank: 5, name: '山海天大队', count: 11 },
  ];

  const topBrigadeRejected = [
    { rank: 1, name: '东港大队', count: 14 },
    { rank: 2, name: '莒县大队', count: 12 },
    { rank: 3, name: '岚山大队', count: 10 },
    { rank: 4, name: '五莲大队', count: 8 },
    { rank: 5, name: '经开大队', count: 7 },
  ];

  const topSquadronLateSign = [
    { rank: 1, name: '东港一中队', count: 12 },
    { rank: 2, name: '岚山二中队', count: 10 },
    { rank: 3, name: '莒县三中队', count: 9 },
    { rank: 4, name: '五莲一中队', count: 7 },
    { rank: 5, name: '经开二中队', count: 6 },
  ];

  const topSquadronLateFeedback = [
    { rank: 1, name: '岚山一中队', count: 11 },
    { rank: 2, name: '东港二中队', count: 9 },
    { rank: 3, name: '五莲三中队', count: 8 },
    { rank: 4, name: '莒县一中队', count: 7 },
    { rank: 5, name: '山海天中队', count: 5 },
  ];

  const topSquadronRejected = [
    { rank: 1, name: '东港一中队', count: 8 },
    { rank: 2, name: '莒县二中队', count: 7 },
    { rank: 3, name: '岚山一中队', count: 6 },
    { rank: 4, name: '五莲二中队', count: 4 },
    { rank: 5, name: '经开一中队', count: 3 },
  ];

  const handleRankClick = (title: string, item: { name: string; count: number }) => {
    setSelectedRankDetail({
      title,
      unit: item.name,
      count: item.count,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Header Bar with Blue Pill and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>支队首页</span>
            <span className="text-sm font-normal text-slate-500">· 全市交通指令调度与督导监控</span>
          </h1>
        </div>

        {/* Filters on the right */}
        <div className="flex items-center space-x-3">
          {/* Day / Week / Month */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 rounded-md transition ${
                timeRange === 'day' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              日
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-md transition ${
                timeRange === 'week' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              周
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-md transition ${
                timeRange === 'month' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              月
            </button>
          </div>

          {/* All / Brigade / Squadron */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                levelFilter === 'all' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setLevelFilter('brigade')}
              className={`px-3 py-1 rounded-md transition ${
                levelFilter === 'brigade' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              大队
            </button>
            <button
              onClick={() => setLevelFilter('squadron')}
              className={`px-3 py-1 rounded-md transition ${
                levelFilter === 'squadron' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              中队
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: 6 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Dispatched */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>工单总下发数</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              1,248
            </div>
          </div>
          <div className="mt-6">
            <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>较昨日 +86</span>
            </span>
          </div>
        </div>

        {/* Card 2: Sign-in Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>签收情况</span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                率 94.2%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500">签收数</div>
                <div className="text-base font-bold text-slate-900 font-mono">1,156</div>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <div className="text-[11px] text-emerald-800">按时签收数</div>
                <div className="text-base font-bold text-emerald-700 font-mono">1,089</div>
              </div>
              <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                <div className="text-[11px] text-rose-700">未签收数</div>
                <div className="text-base font-bold text-rose-600 font-mono">92</div>
              </div>
              <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <div className="text-[11px] text-amber-800">逾期签收数</div>
                <div className="text-base font-bold text-amber-600 font-mono">67</div>
              </div>
            </div>
          </div>
          {/* Distribution bar */}
          <div className="mt-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '87.2%' }} />
              <div className="bg-amber-400 h-full" style={{ width: '5.4%' }} />
              <div className="bg-rose-500 h-full" style={{ width: '7.4%' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Feedback Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>反馈情况</span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                率 93.5%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500">反馈数</div>
                <div className="text-base font-bold text-slate-900 font-mono">1,023</div>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <div className="text-[11px] text-emerald-800">按时反馈数</div>
                <div className="text-base font-bold text-emerald-700 font-mono">956</div>
              </div>
              <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                <div className="text-[11px] text-rose-700">未反馈数</div>
                <div className="text-base font-bold text-rose-600 font-mono">133</div>
              </div>
              <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <div className="text-[11px] text-amber-800">逾期反馈数</div>
                <div className="text-base font-bold text-amber-600 font-mono">67</div>
              </div>
            </div>
          </div>
          {/* Distribution bar */}
          <div className="mt-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '82%' }} />
              <div className="bg-amber-400 h-full" style={{ width: '5.8%' }} />
              <div className="bg-rose-500 h-full" style={{ width: '12.2%' }} />
            </div>
          </div>
        </div>

        {/* Card 4: Rejected / Re-submit count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>驳回整改数</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
              45
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="text-xs text-slate-600 font-medium">待重新提交</span>
          </div>
        </div>

        {/* Card 5: Returned count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>错件退回数</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-amber-600 tracking-tight font-mono">
              18
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-xs text-slate-600 font-medium">已退回派发</span>
          </div>
        </div>

        {/* Card 6: Completion Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>办结率</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
                87.4%
              </span>
              <span className="text-xs font-semibold text-slate-500">已达标</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>目标 ≥85%</span>
            <span className="text-emerald-600 font-bold font-mono">+2.4%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Top5 Supervision Ranking Cards (Brigade Level) */}
      {(levelFilter === 'all' || levelFilter === 'brigade') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Top5 Overdue Sign - Brigade */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 逾期签收大队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                大队层级
              </span>
            </div>

            <div className="space-y-2">
              {topBrigadeLateSign.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('逾期签收', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-rose-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '逾期' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-rose-600 font-bold">84</strong> 件</span>
            </div>
          </div>

          {/* Top5 Overdue Feedback - Brigade */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 逾期反馈大队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                大队层级
              </span>
            </div>

            <div className="space-y-2">
              {topBrigadeLateFeedback.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('逾期反馈', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-amber-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '逾期' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-amber-600 font-bold">78</strong> 件</span>
            </div>
          </div>

          {/* Top5 Rejected / Rectified - Brigade */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 被驳回整改大队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                大队层级
              </span>
            </div>

            <div className="space-y-2">
              {topBrigadeRejected.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('被驳回整改', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-rose-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '驳回' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-rose-600 font-bold">51</strong> 件</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Top5 Supervision Ranking Cards (Squadron Level) */}
      {(levelFilter === 'all' || levelFilter === 'squadron') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Top5 Overdue Sign - Squadron */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 逾期签收中队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                中队层级
              </span>
            </div>

            <div className="space-y-2">
              {topSquadronLateSign.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('逾期签收', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-rose-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '逾期' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-rose-600 font-bold">44</strong> 件</span>
            </div>
          </div>

          {/* Top5 Overdue Feedback - Squadron */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 逾期反馈中队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                中队层级
              </span>
            </div>

            <div className="space-y-2">
              {topSquadronLateFeedback.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('逾期反馈', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-amber-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '逾期' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-amber-600 font-bold">40</strong> 件</span>
            </div>
          </div>

          {/* Top5 Rejected / Rectified - Squadron */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Top5 被驳回整改中队</h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                中队层级
              </span>
            </div>

            <div className="space-y-2">
              {topSquadronRejected.map((item) => (
                <div
                  key={item.rank}
                  onClick={() => handleRankClick('被驳回整改', item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-rose-600 font-mono">{item.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => onNavigateToManagement({ keyword: '驳回' })}
                className="text-slate-500 hover:text-blue-600 transition"
              >
                点击查看明细工单
              </button>
              <span className="font-mono text-slate-700">合计：<strong className="text-rose-600 font-bold">28</strong> 件</span>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Quick Modal if a ranking item is clicked */}
      {selectedRankDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{selectedRankDetail.unit} · {selectedRankDetail.title}督导明细</span>
              </h3>
              <button
                onClick={() => setSelectedRankDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                关闭
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">单位名称：</span>
                <span className="font-semibold text-slate-800">{selectedRankDetail.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">督导预警类型：</span>
                <span className="font-semibold text-rose-600">{selectedRankDetail.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">涉及未按期闭环指令数：</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedRankDetail.count} 件</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">相关关联督导指令：</div>
              {tasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedRankDetail(null);
                    onSelectTask(t);
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{t.taskNo} · {t.deadline}</div>
                  </div>
                  <span className="text-blue-600 text-xs font-semibold flex items-center">
                    查看 <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedRankDetail(null);
                  onNavigateToManagement({ brigade: selectedRankDetail.unit });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
              >
                在指令管理中查看全部
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
