import React, { useState, useMemo } from 'react';
import { 
  Scale, Download, Calendar, Filter, ChevronRight, 
  ArrowLeft, Building2, CheckCircle2, AlertTriangle, 
  Shield, Check, Search, BarChart3, AlertOctagon,
  TrendingUp, Award, Car
} from 'lucide-react';
import { DispatchTask, UserRoleContext } from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';

interface PunishStatsViewProps {
  tasks: DispatchTask[];
  currentRole: UserRoleContext;
}

type TimeMode = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

export const PunishStatsView: React.FC<PunishStatsViewProps> = ({ tasks, currentRole }) => {
  // 1. 统计条件状态
  const [timeMode, setTimeMode] = useState<TimeMode>('DAY');
  const [dayStartDate, setDayStartDate] = useState('2026-09-01');
  const [dayEndDate, setDayEndDate] = useState('2026-09-07');
  const [selectedWeek, setSelectedWeek] = useState('2026-W36');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedQuarter, setSelectedQuarter] = useState('2026-Q3');
  const [selectedYear, setSelectedYear] = useState('2026');

  // 违法行为筛选
  const [selectedBehavior, setSelectedBehavior] = useState<string>('ALL');

  // 下钻状态：支队账号下钻大队，查看下辖中队
  const [drillDownBrigadeId, setDrillDownBrigadeId] = useState<string | null>(null);

  // 导出提示
  const [exportToast, setExportToast] = useState(false);
  // 统计执行成功轻提示
  const [statsToast, setStatsToast] = useState(false);

  // 组织架构
  const allBrigades = useMemo(() => MOCK_ORG_UNITS.filter((u) => u.level === 'brigade'), []);
  const allSquadrons = useMemo(() => MOCK_ORG_UNITS.filter((u) => u.level === 'squadron'), []);

  // 统计执行触发
  const handleExecuteStats = () => {
    setStatsToast(true);
    setTimeout(() => setStatsToast(false), 2500);
  };

  // 违法行为清单
  const violationTypes = [
    '假牌套牌',
    '超速行驶',
    '闯红灯',
    '酒驾醉驾',
    '危化品未按规定路线行驶',
    '未按规定检验 (逾期未审)',
    '逆向行驶',
    '客车超员',
  ];

  // 当前下钻的大队对象
  const activeDrillBrigade = useMemo(() => {
    if (!drillDownBrigadeId) return null;
    return allBrigades.find((b) => b.id === drillDownBrigadeId) || null;
  }, [drillDownBrigadeId, allBrigades]);

  // 时间区间说明
  const timeFilterText = useMemo(() => {
    switch (timeMode) {
      case 'DAY':
        return `${dayStartDate} 至 ${dayEndDate}`;
      case 'WEEK':
        return `2026年度 第36周 (08-31 ~ 09-06)`;
      case 'MONTH':
        return `${selectedMonth} 月度`;
      case 'QUARTER':
        return `${selectedQuarter} 季度`;
      case 'YEAR':
        return `${selectedYear} 年度`;
      default:
        return '全部时间';
    }
  }, [timeMode, dayStartDate, dayEndDate, selectedWeek, selectedMonth, selectedQuarter, selectedYear]);

  // 根据部门和违法行为生成指标数据
  const generateUnitViolationMetrics = (unitId: string, unitName: string, isSquadron = false) => {
    const seed = unitId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const multiplier = isSquadron ? 1 : 4.5;

    // 若用户选择了具体违法行为，则只统计该项，否则统计汇总项
    const activeBehaviorText = selectedBehavior === 'ALL' ? '全类违法综合查处' : selectedBehavior;

    // 查处数 (拦截排查核实数)
    const baseInvestigated = Math.round(((seed % 15) + 18) * multiplier);
    // 处罚数 (开具处罚决定书、采取强制措施)
    const penaltyRatio = 0.82 + ((seed % 12) * 0.012);
    const penalizedCount = Math.round(baseInvestigated * Math.min(penaltyRatio, 0.96));
    const penaltyRate = baseInvestigated > 0 ? ((penalizedCount / baseInvestigated) * 100).toFixed(1) + '%' : '100%';

    return {
      unitId,
      unitName,
      violationType: activeBehaviorText,
      investigatedCount: baseInvestigated,
      penalizedCount,
      penaltyRate,
      rawRate: (penalizedCount / baseInvestigated) * 100,
    };
  };

  // 表格展示数据行
  const tableRows = useMemo(() => {
    // 支队下钻大队
    if (currentRole.level === 'branch' && drillDownBrigadeId) {
      const squadronsOfBrigade = allSquadrons.filter((s) => s.parentId === drillDownBrigadeId);
      return squadronsOfBrigade.map((s) => generateUnitViolationMetrics(s.id, s.name, true));
    }

    // 大队账号直接统计辖区中队
    if (currentRole.level === 'brigade') {
      const mySquadrons = allSquadrons.filter((s) => s.parentId === currentRole.unitId);
      return mySquadrons.map((s) => generateUnitViolationMetrics(s.id, s.name, true));
    }

    // 中队账号
    if (currentRole.level === 'squadron') {
      const myUnit = MOCK_ORG_UNITS.find((u) => u.id === currentRole.unitId);
      const mySquadrons = allSquadrons.filter((s) => s.parentId === myUnit?.parentId);
      return mySquadrons.map((s) => generateUnitViolationMetrics(s.id, s.name, true));
    }

    // 支队默认各大队数据
    return allBrigades.map((b) => generateUnitViolationMetrics(b.id, b.name, false));
  }, [currentRole.level, currentRole.unitId, drillDownBrigadeId, allBrigades, allSquadrons, selectedBehavior]);

  // 汇总行计算
  const summaryRow = useMemo(() => {
    const totalInvestigated = tableRows.reduce((acc, r) => acc + r.investigatedCount, 0);
    const totalPenalized = tableRows.reduce((acc, r) => acc + r.penalizedCount, 0);
    const penaltyRate = totalInvestigated > 0 ? ((totalPenalized / totalInvestigated) * 100).toFixed(1) + '%' : '100%';

    return {
      unitName: currentRole.level === 'branch' && !drillDownBrigadeId ? '全市各大队查处与处罚汇总' : '本责任辖区中队汇总',
      violationType: selectedBehavior === 'ALL' ? '全部重点交通违法行为' : selectedBehavior,
      investigatedCount: totalInvestigated,
      penalizedCount: totalPenalized,
      penaltyRate,
    };
  }, [tableRows, currentRole.level, drillDownBrigadeId, selectedBehavior]);

  // 导出 Excel
  const handleExportExcel = () => {
    let csvContent = '\uFEFF';
    csvContent += '责任部门,违法行为类别,查处数(辆/起),处罚数(起),处罚率(%)\n';

    tableRows.forEach((row) => {
      csvContent += `"${row.unitName}","${row.violationType}",${row.investigatedCount},${row.penalizedCount},"${row.penaltyRate}"\n`;
    });

    csvContent += `"${summaryRow.unitName}","${summaryRow.violationType}",${summaryRow.investigatedCount},${summaryRow.penalizedCount},"${summaryRow.penaltyRate}"\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `重点交通违法查处与处罚效能考核台账_${timeMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      {/* 导出轻提示 */}
      {exportToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>违法处罚效能考核台账已成功导出！</span>
        </div>
      )}

      {/* 统计完成轻提示 */}
      {statsToast && (
        <div className="fixed top-16 right-6 z-50 bg-blue-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-blue-700 animate-in fade-in">
          <Check className="w-4 h-4 text-blue-300" />
          <span>已根据当前选择的违法时间与违法行为类型完成查处处罚效能重新统计！</span>
        </div>
      )}

      {/* 统计条件筛选栏 (Requirement 四-2) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
        {/* 时间维度切换 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">违法时间筛选：</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              {(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'] as TimeMode[]).map((mode) => {
                const labels: Record<TimeMode, string> = {
                  DAY: '按日筛选',
                  WEEK: '按周筛选',
                  MONTH: '按月筛选',
                  QUARTER: '按季度',
                  YEAR: '按年度',
                };
                return (
                  <button
                    key={mode}
                    onClick={() => setTimeMode(mode)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      timeMode === mode
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-blue-700 font-mono font-medium">
            统计区间：{timeFilterText}
          </div>
        </div>

        {/* 动态时间输入及违法行为筛选 */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {timeMode === 'DAY' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">日期范围：</span>
              <input
                type="date"
                value={dayStartDate}
                onChange={(e) => setDayStartDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={dayEndDate}
                onChange={(e) => setDayEndDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              />
            </div>
          )}

          {timeMode === 'WEEK' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">单周选择：</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="2026-W36">2026年 第36周 (08-31 ~ 09-06) [本周]</option>
                <option value="2026-W35">2026年 第35周 (08-24 ~ 08-30)</option>
                <option value="2026-W34">2026年 第34周 (08-17 ~ 08-23)</option>
              </select>
            </div>
          )}

          {timeMode === 'MONTH' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">单月选择：</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              />
            </div>
          )}

          {timeMode === 'QUARTER' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">单季度选择：</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="2026-Q3">2026年 第三季度 (Q3: 07-01 ~ 09-30)</option>
                <option value="2026-Q2">2026年 第二季度 (Q2: 04-01 ~ 06-30)</option>
              </select>
            </div>
          )}

          {timeMode === 'YEAR' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">年度选择：</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="2026">2026 年度</option>
                <option value="2025">2025 年度</option>
              </select>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* 违法行为筛选 */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold">违法行为类型：</span>
            <select
              value={selectedBehavior}
              onChange={(e) => setSelectedBehavior(e.target.value)}
              className="border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-800"
            >
              <option value="ALL">全部重点违法行为</option>
              {violationTypes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* 统计执行按钮 (Requirement: 统计条件后面增加统计按钮) */}
          <div className="flex items-center ml-auto">
            <button
              onClick={handleExecuteStats}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>统计</span>
            </button>
          </div>
        </div>
      </div>

      {/* 结果指标表格与层级下钻 (Requirement 四-2) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* 表头与下钻指示及导出按钮 */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              违法行为查处与处罚结果台账
            </span>

            {/* 下钻面包屑 */}
            {currentRole.level === 'branch' && drillDownBrigadeId && activeDrillBrigade && (
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => setDrillDownBrigadeId(null)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  全市大队汇总
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">
                  {activeDrillBrigade.name} 下属中队明细
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentRole.level === 'branch' && drillDownBrigadeId && (
              <button
                onClick={() => setDrillDownBrigadeId(null)}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>返回大队级汇总</span>
              </button>
            )}

            <span className="text-[11px] text-slate-400 hidden md:inline-block">
              {currentRole.level === 'branch' && !drillDownBrigadeId
                ? '提示：点击大队行可下钻查看中队明细'
                : '展示当前部门查处与处罚详情'}
            </span>

            {/* 导出 Excel 放置在列表标题最右边 */}
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-1 transition active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 Excel</span>
            </button>
          </div>
        </div>

        {/* 表格内容 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">责任部门</th>
                <th className="py-3 px-4">违法行为类别</th>
                <th className="py-3 px-3 text-right">查处数 (起/辆)</th>
                <th className="py-3 px-3 text-right">处罚数 (起)</th>
                <th className="py-3 px-3 text-right">处罚率 (%)</th>
                <th className="py-3 px-4 text-center">处置成效分析</th>
                {currentRole.level === 'branch' && !drillDownBrigadeId && (
                  <th className="py-3 px-4 text-center">下钻操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tableRows.map((row) => (
                <tr
                  key={row.unitId}
                  className="hover:bg-blue-50/40 transition group cursor-pointer"
                  onClick={() => {
                    if (currentRole.level === 'branch' && !drillDownBrigadeId) {
                      setDrillDownBrigadeId(row.unitId);
                    }
                  }}
                >
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center space-x-2">
                    <span>{row.unitName}</span>
                    {currentRole.level === 'branch' && !drillDownBrigadeId && (
                      <span className="text-[10px] text-blue-600 font-normal bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                        可下钻
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {row.violationType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    {row.investigatedCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    {row.penalizedCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                    {row.penaltyRate}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        row.rawRate >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : row.rawRate >= 80
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {row.rawRate >= 90 ? '精准查处 · 优秀' : row.rawRate >= 80 ? '正常达标' : '待强化核实'}
                    </span>
                  </td>
                  {currentRole.level === 'branch' && !drillDownBrigadeId && (
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrillDownBrigadeId(row.unitId);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded border border-blue-200 transition font-medium inline-flex items-center space-x-1"
                      >
                        <span>查看下辖中队</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {/* 汇总统计行 */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td className="py-3.5 px-4 text-slate-900">{summaryRow.unitName}</td>
                <td className="py-3.5 px-4 text-slate-700">{summaryRow.violationType}</td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-900 font-bold">
                  {summaryRow.investigatedCount}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold">
                  {summaryRow.penalizedCount}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-indigo-700 font-bold text-sm">
                  {summaryRow.penaltyRate}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    考核达标 (综合 {summaryRow.penaltyRate})
                  </span>
                </td>
                {currentRole.level === 'branch' && !drillDownBrigadeId && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
