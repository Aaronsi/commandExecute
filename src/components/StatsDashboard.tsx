import React from 'react';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, 
  TrendingUp, Award, Shield, FileCheck, Users, Car
} from 'lucide-react';
import { DispatchTask } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';

interface StatsDashboardProps {
  tasks: DispatchTask[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ tasks }) => {
  // Aggregate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.overallStatus === 'COMPLETED').length;
  
  const totalVehicles = tasks.reduce((acc, t) => acc + t.vehicles.length, 0);
  const interceptedVehicles = tasks.reduce(
    (acc, t) => acc + t.vehicles.filter((v) => v.isIntercepted).length,
    0
  );

  const brigadeList = MOCK_ORG_UNITS.filter((u) => u.level === 'brigade');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>交警支队指令闭环与缉查效能考核看板</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            动态统计各大队及下属中队签收响应时效、第三方凭证核验合规率与闭环归档效能
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md font-semibold">
            ● 考核周期：本日实时汇算
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-lg space-y-2 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>指令总下发量</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">{totalTasks}</div>
          <div className="text-[11px] text-slate-500">
            任一完成: {tasks.filter((t) => t.completionRule === 'ANY_COMPLETE').length} | 全部完成: {tasks.filter((t) => t.completionRule === 'ALL_COMPLETE').length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-lg space-y-2 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>目标嫌疑车辆数</span>
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 font-mono">
            {interceptedVehicles} <span className="text-sm font-normal text-slate-500">/ {totalVehicles} 辆</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            路面拦截率: {totalVehicles > 0 ? Math.round((interceptedVehicles / totalVehicles) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-lg space-y-2 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>平均签收响应时效</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-700 font-mono">4.8 <span className="text-sm font-normal text-slate-500">分钟</span></div>
          <div className="text-[11px] text-amber-700 font-medium">
            达标率 98.6% (标准 &le; 10分钟)
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-lg space-y-2 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>第三方凭证一次通过率</span>
            <FileCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-indigo-700 font-mono">92.4%</div>
          <div className="text-[11px] text-slate-500">
            有效杜绝历史文书倒挂提交
          </div>
        </div>
      </div>

      {/* Brigade Performance Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span>各大队履职与协同办结排行榜</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="p-3">排名</th>
                <th className="p-3">大队名称</th>
                <th className="p-3">大队长</th>
                <th className="p-3">下辖中队数</th>
                <th className="p-3">签收及时率</th>
                <th className="p-3">查控拦截成效</th>
                <th className="p-3">审核驳回率</th>
                <th className="p-3">综合效能得分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {brigadeList.map((b, idx) => {
                const sqCount = MOCK_ORG_UNITS.filter((u) => u.parentId === b.id).length;
                const score = (98.5 - idx * 2.1).toFixed(1);

                return (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[11px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{b.name}</td>
                    <td className="p-3 text-slate-500">{b.leader}</td>
                    <td className="p-3">{sqCount} 个中队</td>
                    <td className="p-3 font-mono text-emerald-700 font-semibold">100%</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${88 - idx * 10}%` }} />
                        </div>
                        <span className="font-mono text-slate-700">{88 - idx * 10}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-rose-700">{(idx * 1.8).toFixed(1)}%</td>
                    <td className="p-3 font-mono font-bold text-amber-700 text-sm">{score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
