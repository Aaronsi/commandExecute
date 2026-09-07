import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, Clock, RotateCcw, AlertCircle, 
  Search, Filter, ArrowRight, Shield, CheckCircle2, ChevronRight,
  ExternalLink, Building2, BellRing, Check, Send
} from 'lucide-react';
import { DispatchTask } from '../types';
import { Pagination } from './Pagination';

interface WarningListViewProps {
  tasks: DispatchTask[];
  onSelectTask: (task: DispatchTask) => void;
  onOpenCreateModal?: () => void;
}

export interface WarningItem {
  id: string;
  type: 'TIMEOUT_SIGN' | 'TIMEOUT_FEEDBACK' | 'MULTI_REJECT' | 'WRONG_DISPATCH';
  typeName: string;
  typeBadge: string;
  title: string;
  taskNo: string;
  unitName: string;
  duration: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  taskRef: DispatchTask | null;
  desc: string;
}

export const WarningListView: React.FC<WarningListViewProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [warningType, setWarningType] = useState<'ALL' | 'TIMEOUT_SIGN' | 'TIMEOUT_FEEDBACK' | 'MULTI_REJECT' | 'WRONG_DISPATCH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 分页状态 (满足需求：预警列表也要有分页显示)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 督办提醒轻提示
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 当筛选条件或搜索改变时重置当前页为第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [warningType, searchTerm]);

  // 动态结合系统任务与典型异常，生成全量督办预警数据源
  const allWarnings: WarningItem[] = useMemo(() => {
    const list: WarningItem[] = [];

    // 1. 扫描当前工单中的异常
    tasks.forEach((t) => {
      // 1.1 逾期未签收
      const pendingSignNodes = t.executionNodes.filter((n) => n.status === 'PENDING_SIGN');
      if (pendingSignNodes.length > 0 && t.overallStatus === 'PROCESSING') {
        list.push({
          id: `warn-dyn-sign-${t.id}`,
          type: 'TIMEOUT_SIGN',
          typeName: '逾期未签收预警',
          typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          title: t.title,
          taskNo: t.taskNo,
          unitName: pendingSignNodes.map((n) => n.unitName).join('、'),
          duration: t.urgency === '特急' ? '已超期 45 分钟' : '已超期 1 小时 15 分',
          severity: t.urgency === '特急' ? 'HIGH' : 'MEDIUM',
          taskRef: t,
          desc: `该指令已由上级下达至责任单位，但${pendingSignNodes.map((n) => n.unitName).join('、')}尚未在规定时限内进行在线签收响应。`,
        });
      }

      // 1.2 逾期未反馈 / 待反馈滞后
      const signedNodes = t.executionNodes.filter((n) => n.status === 'SIGNED' || n.status === 'FEEDBACK_SUBMITTED');
      const hasUnfinishedVehicles = t.vehicles.some((v) => !v.isIntercepted || v.vehicleAuditStatus === 'PENDING');
      if (signedNodes.length > 0 && hasUnfinishedVehicles && t.overallStatus === 'PROCESSING') {
        list.push({
          id: `warn-dyn-feed-${t.id}`,
          type: 'TIMEOUT_FEEDBACK',
          typeName: '逾期未反馈预警',
          typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: t.title,
          taskNo: t.taskNo,
          unitName: signedNodes.map((n) => n.unitName).join('、'),
          duration: '截止时限已过 2 小时',
          severity: 'HIGH',
          taskRef: t,
          desc: '责任中队已签收上级指令，但现场查控超时未回传车辆拦截凭证或处罚文书。',
        });
      }

      // 1.3 多次驳回整改
      const hasRejected = t.vehicles.some((v) => v.vehicleAuditStatus === 'REJECTED');
      if (hasRejected) {
        list.push({
          id: `warn-dyn-rej-${t.id}`,
          type: 'MULTI_REJECT',
          typeName: '多次驳回整改预警',
          typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          title: t.title,
          taskNo: t.taskNo,
          unitName: t.executionNodes[0]?.unitName || '直属大队',
          duration: '凭证驳回 2 次',
          severity: 'MEDIUM',
          taskRef: t,
          desc: '填报的六合一处罚文书信息或抓拍佐证材料被上级指挥员驳回，待基层警力补充完善再报。',
        });
      }

      // 1.4 错派退回
      if (t.overallStatus === 'RETURNED_DRAFT' || t.returnRequest?.status === 'PENDING_CONFIRM') {
        list.push({
          id: `warn-dyn-ret-${t.id}`,
          type: 'WRONG_DISPATCH',
          typeName: '跨辖区错派异常',
          typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          title: t.title,
          taskNo: t.taskNo,
          unitName: t.returnRequest?.requestedByUnitName || t.executionNodes[0]?.unitName || '直属大队',
          duration: t.overallStatus === 'RETURNED_DRAFT' ? '待更正重发' : '申请退回待批',
          severity: 'LOW',
          taskRef: t,
          desc: t.returnRequest?.reason || '因车辆行驶路线脱离原辖区或要素录入有误，申请退回指挥中心改派责任大队。',
        });
      }
    });

    // 2. 预置基础典型预警案例以保证演示完整性
    const baselineMock: WarningItem[] = [
      {
        id: 'warn-base-1',
        type: 'TIMEOUT_SIGN',
        typeName: '逾期未签收预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '重点嫌疑套牌客车 (鲁L·89912) 跨区查缉指令',
        taskNo: 'ZD-20260901-001',
        unitName: '直属一大队·城东一中队',
        duration: '已超期 35 分钟',
        severity: 'HIGH',
        taskRef: tasks[0] || null,
        desc: '支队指令下发至中队已超 1 小时，路面中队尚未进行系统签收响应。',
      },
      {
        id: 'warn-base-2',
        type: 'TIMEOUT_FEEDBACK',
        typeName: '逾期未反馈预警',
        typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        title: '多次违法未处理危化品运输车 (鲁L·A8839) 拦截指令',
        taskNo: 'ZD-20260901-002',
        unitName: '直属二大队·机动铁骑中队',
        duration: '已超期 1 小时 20 分',
        severity: 'HIGH',
        taskRef: tasks[1] || tasks[0] || null,
        desc: '节点已签收，但超过截止时限未录入第三方交管处罚凭证或拦截照片。',
      },
      {
        id: 'warn-base-3',
        type: 'MULTI_REJECT',
        typeName: '多次驳回整改预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '夜间重点路段酒驾醉驾专项整治指令',
        taskNo: 'ZD-20260901-003',
        unitName: '直属一大队·城南二中队',
        duration: '驳回 2 次',
        severity: 'MEDIUM',
        taskRef: tasks[2] || tasks[0] || null,
        desc: '提交的现场文书凭证时间存在倒挂异常，被上一级主管连续驳回要求整改。',
      },
      {
        id: 'warn-base-4',
        type: 'WRONG_DISPATCH',
        typeName: '跨辖区错派异常',
        typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        title: '误派至非管辖路段排查协查任务',
        taskNo: 'ZD-20260901-004',
        unitName: '直属二大队',
        duration: '申请退回派发中',
        severity: 'LOW',
        taskRef: tasks[0] || null,
        desc: '执行大队核实目标车辆行驶轨迹不在本大队管辖路段，申请协调改派。',
      },
      {
        id: 'warn-base-5',
        type: 'TIMEOUT_SIGN',
        typeName: '逾期未签收预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '恶劣天气临水临崖路段安全隐患巡查',
        taskNo: 'ZD-20260901-005',
        unitName: '直属一大队·机动特勤中队',
        duration: '已超期 18 分钟',
        severity: 'MEDIUM',
        taskRef: tasks[1] || tasks[0] || null,
        desc: '特急指令下发后超 15 分钟未签收，系统自动触发督导红灯预警。',
      },
      {
        id: 'warn-base-6',
        type: 'TIMEOUT_FEEDBACK',
        typeName: '逾期未反馈预警',
        typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        title: '国省道沿线大型货运车辆严重超载超限联合突击检查',
        taskNo: 'ZD-20260904-003',
        unitName: '直属二大队·港区中队',
        duration: '已超期 2 小时 40 分',
        severity: 'HIGH',
        taskRef: tasks[0] || null,
        desc: '早班查获疑似百吨王挂车，尚未完成地磅称重单及文书上传。',
      },
      {
        id: 'warn-base-7',
        type: 'MULTI_REJECT',
        typeName: '多次驳回整改预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '涉嫌非法改装夜间飙车炸街扰民车辆查缉',
        taskNo: 'ZD-20260905-002',
        unitName: '直属一大队·城东一中队',
        duration: '驳回 3 次',
        severity: 'HIGH',
        taskRef: tasks[0] || null,
        desc: '查扣照片未拍摄排气管特写铭牌，连续三次初审未获通过，列入重点催办。',
      },
      {
        id: 'warn-base-8',
        type: 'WRONG_DISPATCH',
        typeName: '跨辖区错派异常',
        typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        title: '涉毒失格驾驶员营运货车流窜拦截',
        taskNo: 'ZD-20260904-005',
        unitName: '直属一大队',
        duration: '已确认退回',
        severity: 'LOW',
        taskRef: tasks[0] || null,
        desc: '目标车辆已通过高速互通驶往邻市，大队确认退回并建议发函外地交警协查。',
      },
      {
        id: 'warn-base-9',
        type: 'TIMEOUT_SIGN',
        typeName: '逾期未签收预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '涉案套牌奥迪A6轿车布控指令',
        taskNo: 'ZD-20260907-006',
        unitName: '直属二大队·园区二中队',
        duration: '已超期 25 分钟',
        severity: 'MEDIUM',
        taskRef: tasks[0] || null,
        desc: '卡口抓拍系统发现目标驶入园区大道，中队巡逻车电台联系未应答。',
      },
      {
        id: 'warn-base-10',
        type: 'TIMEOUT_FEEDBACK',
        typeName: '逾期未反馈预警',
        typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        title: '早高峰主干道机动车实线变道加塞集中整治',
        taskNo: 'ZD-20260904-001',
        unitName: '直属一大队·城西中队',
        duration: '已超期 1 小时',
        severity: 'MEDIUM',
        taskRef: tasks[0] || null,
        desc: '早高峰整治勤务结束超过 1 小时，尚未在系统录入查处量明细。',
      },
      {
        id: 'warn-base-11',
        type: 'TIMEOUT_SIGN',
        typeName: '逾期未签收预警',
        typeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        title: '严重逾期未检验危化品槽罐车紧急布控查扣',
        taskNo: 'ZD-20260907-008',
        unitName: '直属一大队·铁骑特勤中队',
        duration: '已超期 50 分钟',
        severity: 'HIGH',
        taskRef: tasks[0] || null,
        desc: '公安部高风险重点隐患车辆红标预警，下级铁骑中队尚未在线确认接令。',
      }
    ];

    // 合并并按 id 去重
    const mergedMap = new Map<string, WarningItem>();
    [...list, ...baselineMock].forEach((item) => {
      mergedMap.set(item.id, item);
    });

    return Array.from(mergedMap.values());
  }, [tasks]);

  // 各类预警统计
  const timeoutSignCount = allWarnings.filter((w) => w.type === 'TIMEOUT_SIGN').length;
  const timeoutFeedbackCount = allWarnings.filter((w) => w.type === 'TIMEOUT_FEEDBACK').length;
  const multiRejectCount = allWarnings.filter((w) => w.type === 'MULTI_REJECT').length;
  const wrongDispatchCount = allWarnings.filter((w) => w.type === 'WRONG_DISPATCH').length;

  // 筛选与检索
  const filteredWarnings = useMemo(() => {
    return allWarnings.filter((w) => {
      const matchType = warningType === 'ALL' || w.type === warningType;
      const query = searchTerm.trim().toLowerCase();
      const matchSearch =
        !query ||
        w.title.toLowerCase().includes(query) ||
        w.unitName.toLowerCase().includes(query) ||
        w.taskNo.toLowerCase().includes(query);
      return matchType && matchSearch;
    });
  }, [allWarnings, warningType, searchTerm]);

  // 分页计算 (满足需求：预警列表也要有分页显示：共**条 每页显示多少条 上一页箭头 具体页数 下一页箭头)
  const totalWarnings = filteredWarnings.length;
  const totalPages = Math.max(1, Math.ceil(totalWarnings / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedWarnings = useMemo(() => {
    return filteredWarnings.slice(startIndex, startIndex + pageSize);
  }, [filteredWarnings, startIndex, pageSize]);

  // 一键督办催办
  const handleSupervise = (warn: WarningItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setToastMessage(`已对责任单位【${warn.unitName}】发起针对指令【${warn.taskNo}】的限时催办督导令！`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 text-slate-800">
      {/* 督办提醒轻提示 */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (左右边距与其他视图一致保持 max-w-[1600px] px-6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-6 bg-rose-600 rounded-full" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>指令督办中心（原指令异常预警）</span>
            <span className="text-sm font-normal text-slate-500">· 实时监控流转卡阻、逾期未签收、超期未反馈与多次驳回</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>当前重点督办工单：{allWarnings.length} 件</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: `全部预警 (${allWarnings.length})` },
            { key: 'TIMEOUT_SIGN', label: `逾期未签收 (${timeoutSignCount})` },
            { key: 'TIMEOUT_FEEDBACK', label: `逾期未反馈 (${timeoutFeedbackCount})` },
            { key: 'MULTI_REJECT', label: `多次驳回 (${multiRejectCount})` },
            { key: 'WRONG_DISPATCH', label: `错派退回 (${wrongDispatchCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setWarningType(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索指令编号、标题、责任单位..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Warning Cards List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {filteredWarnings.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <div className="text-sm font-bold text-slate-800">未发现该类型异常或预警</div>
              <p className="text-xs text-slate-500">所有指令均在合理时效与流程标准内正常运转。</p>
            </div>
          ) : (
            paginatedWarnings.map((warn) => (
              <div
                key={warn.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-rose-300 p-4 sm:p-5 shadow-2xs hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${warn.typeBadge}`}>
                      {warn.typeName}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-semibold">{warn.taskNo}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>责任单位：{warn.unitName}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                      {warn.duration}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{warn.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{warn.desc}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleSupervise(warn, e)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>一键督办提醒</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => warn.taskRef && onSelectTask(warn.taskRef)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>工单详情</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页组件 (满足需求：预警列表也要有分页显示) */}
        {filteredWarnings.length > 0 && (
          <Pagination
            total={totalWarnings}
            currentPage={validPage}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
};
