import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Shield, AlertTriangle, FileText, User } from 'lucide-react';
import { UserRoleContext, TaskVehicle, ThirdPartyDisposalRecord } from '../types';

interface AuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  unitName: string;
  vehicle: TaskVehicle;
  taskDispatchTime: string;
  currentRole: UserRoleContext;
  onAuditSubmit: (data: {
    result: 'PASS' | 'REJECT';
    remarks: string;
    rejectReason?: string;
  }) => void;
}

const REJECT_REASONS = [
  '第三方平台文书处置时间早于指令下发时间 (时间倒挂)',
  '号牌种类与实际查扣车辆不符 (如黄牌误填为蓝牌)',
  '处罚决定书编号在六合一系统中未生效或无执勤民警签字',
  '未达到指令明确的扣车/强制排查处置标准',
  '现场查验记录缺少必要证明材料',
];

export const AuditDialog: React.FC<AuditDialogProps> = ({
  isOpen,
  onClose,
  nodeId,
  unitName,
  vehicle,
  taskDispatchTime,
  currentRole,
  onAuditSubmit,
}) => {
  const [decision, setDecision] = useState<'PASS' | 'REJECT'>('PASS');
  const [remarks, setRemarks] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState(REJECT_REASONS[0]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (decision === 'REJECT' && !remarks.trim() && !selectedRejectReason) {
      alert('请选择或输入驳回原因');
      return;
    }

    onAuditSubmit({
      result: decision,
      remarks: decision === 'PASS' 
        ? (remarks.trim() || '审核通过，处置凭证与时间有效合规。')
        : (remarks.trim() ? `${selectedRejectReason}。${remarks.trim()}` : selectedRejectReason),
      rejectReason: decision === 'REJECT' ? selectedRejectReason : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {currentRole.level === 'branch' ? '支队指挥中心终审' : '交警大队初审复核'}
              </h2>
              <p className="text-xs text-slate-500">
                审核人：{currentRole.userName} ({currentRole.unitName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Target and Feedback Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-mono">
                  {vehicle.plateNo}
                </span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                  {vehicle.plateType}
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                填报单位：<strong className="text-slate-800">{unitName}</strong>
              </span>
            </div>

            {/* Evidence details */}
            {vehicle.disposalRecord && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px] shadow-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">处罚决定书编号：</span>
                  <span className="font-mono text-slate-900 font-bold">{vehicle.disposalRecord.punishmentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">第三方系统录入时间：</span>
                  <span className="font-mono text-amber-700 font-semibold">{vehicle.disposalRecord.disposalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">处警民警及警号：</span>
                  <span className="text-slate-800">{vehicle.disposalRecord.policeName} ({vehicle.disposalRecord.policeId})</span>
                </div>
                <div className="pt-1 text-slate-600 border-t border-slate-100 mt-1">
                  <span className="font-medium text-slate-700">反馈情况：</span> {vehicle.feedbackRemarks || vehicle.disposalRecord.notes}
                </div>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              审核裁定意见 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('PASS')}
                className={`p-3 rounded-lg border flex items-center justify-center space-x-2 font-bold transition ${
                  decision === 'PASS'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>审核通过</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`p-3 rounded-lg border flex items-center justify-center space-x-2 font-bold transition ${
                  decision === 'REJECT'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>予以驳回 (需重新反馈)</span>
              </button>
            </div>
          </div>

          {/* Rejection standardized options if rejected */}
          {decision === 'REJECT' && (
            <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-2.5">
              <label className="block text-xs font-semibold text-rose-800">
                标准驳回原因分类
              </label>
              <div className="space-y-1.5">
                {REJECT_REASONS.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRejectReason(r)}
                    className={`p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                      selectedRejectReason === r
                        ? 'bg-rose-100 border-rose-400 text-rose-900 font-medium'
                        : 'bg-white border-rose-200/60 text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {decision === 'PASS' ? '审批评语 / 归档批注' : '详细驳回说明及整改要求'}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={decision === 'PASS' ? '凭证齐全，符合闭环要求，同意归档。' : '请说明具体不符合项，以便基层民警核对重新上报...'}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-xs"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
              decision === 'PASS'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {decision === 'PASS' ? '确认审核通过' : '确认驳回并通知填报单位'}
          </button>
        </div>
      </div>
    </div>
  );
};
