import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, RotateCcw, AlertCircle, 
  Search, Filter, ArrowRight, Shield, CheckCircle2, ChevronRight,
  ExternalLink, Building2
} from 'lucide-react';
import { DispatchTask, UserRoleContext } from '../types';

interface WarningListViewProps {
  tasks: DispatchTask[];
  onSelectTask: (task: DispatchTask) => void;
  onOpenCreateModal: () => void;
}

export const WarningListView: React.FC<WarningListViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateModal,
}) => {
  const [warningType, setWarningType] = useState<'ALL' | 'TIMEOUT_SIGN' | 'TIMEOUT_FEEDBACK' | 'MULTI_REJECT' | 'WRONG_DISPATCH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Warning items
  const warnings = [
    {
      id: 'warn-1',
      type: 'TIMEOUT_SIGN',
      typeName: '逾期未签收预警',
      typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '重点嫌疑套牌客车 (鲁L·89912) 跨区查缉指令',
      taskNo: 'ZD-20260901-001',
      unitName: '东港大队·城东一中队',
      duration: '已超期 35 分钟',
      severity: 'HIGH',
      taskRef: tasks[0] || null,
      desc: '支队指令下发至中队已超 1 小时，路面中队尚未进行系统签收响应。',
    },
    {
      id: 'warn-2',
      type: 'TIMEOUT_FEEDBACK',
      typeName: '逾期未反馈预警',
      typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      title: '多次违法未处理危化品运输车 (鲁L·A8839) 拦截指令',
      taskNo: 'ZD-20260901-002',
      unitName: '岚山大队·机动铁骑中队',
      duration: '已超期 1 小时 20 分',
      severity: 'HIGH',
      taskRef: tasks[1] || tasks[0] || null,
      desc: '节点已签收，但超过截止时限未录入第三方交管处罚凭证或拦截照片。',
    },
    {
      id: 'warn-3',
      type: 'MULTI_REJECT',
      typeName: '多次驳回整改预警',
      typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '夜间重点路段酒驾醉驾专项整治指令',
      taskNo: 'ZD-20260901-003',
      unitName: '莒县大队·二中队',
      duration: '驳回 2 次',
      severity: 'MEDIUM',
      taskRef: tasks[2] || tasks[0] || null,
      desc: '提交的现场文书凭证时间存在倒挂异常，被上一级主管连续驳回要求整改。',
    },
    {
      id: 'warn-4',
      type: 'WRONG_DISPATCH',
      typeName: '跨辖区错派异常',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '误派至非管辖路段排查协查任务',
      taskNo: 'ZD-20260901-004',
      unitName: '经开区大队',
      duration: '申请退回派发中',
      severity: 'LOW',
      taskRef: tasks[0] || null,
      desc: '执行大队核实目标车辆行驶轨迹不在本大队管辖路段，申请协调改派。',
    },
    {
      id: 'warn-5',
      type: 'TIMEOUT_SIGN',
      typeName: '逾期未签收预警',
      typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '恶劣天气临水临崖路段安全隐患巡查',
      taskNo: 'ZD-20260901-005',
      unitName: '五莲大队·三中队',
      duration: '已超期 18 分钟',
      severity: 'MEDIUM',
      taskRef: tasks[1] || tasks[0] || null,
      desc: '特急指令下发后超 15 分钟未签收，系统自动触发督导红灯预警。',
    },
  ];

  const filteredWarnings = warnings.filter((w) => {
    const matchType = warningType === 'ALL' || w.type === warningType;
    const matchSearch = w.title.includes(searchTerm) || w.unitName.includes(searchTerm) || w.taskNo.includes(searchTerm);
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-6 bg-rose-600 rounded-full" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>指令异常预警中心</span>
            <span className="text-sm font-normal text-slate-500">· 实时监控流转卡阻、逾期未办结与异常倒挂</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>当前待督导异常：5 件</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: '全部预警 (5)' },
            { key: 'TIMEOUT_SIGN', label: '逾期未签收 (2)' },
            { key: 'TIMEOUT_FEEDBACK', label: '逾期未反馈 (1)' },
            { key: 'MULTI_REJECT', label: '多次驳回 (1)' },
            { key: 'WRONG_DISPATCH', label: '错派退回 (1)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setWarningType(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                warningType === tab.key
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索预警工单或单位..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Warning Cards List */}
      <div className="space-y-3">
        {filteredWarnings.map((warn) => (
          <div
            key={warn.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-rose-300 p-5 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${warn.typeBadge}`}>
                  {warn.typeName}
                </span>
                <span className="font-mono text-xs text-slate-500 font-semibold">{warn.taskNo}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>责任单位：{warn.unitName}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {warn.duration}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{warn.title}</h3>
                <p className="text-xs text-slate-500">{warn.desc}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => warn.taskRef && onSelectTask(warn.taskRef)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center space-x-1"
                >
                  <span>立即督办并查看</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
