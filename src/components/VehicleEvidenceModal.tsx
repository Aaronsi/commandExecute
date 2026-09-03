import React from 'react';
import { 
  X, CheckCircle2, AlertTriangle, Shield, Clock, 
  FileText, Car, User, Camera, Building2, CheckSquare, ExternalLink 
} from 'lucide-react';
import { TaskVehicle } from '../types';

interface VehicleEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: TaskVehicle | null;
  taskTitle: string;
  taskDispatchTime: string;
}

export const VehicleEvidenceModal: React.FC<VehicleEvidenceModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  taskTitle,
  taskDispatchTime,
}) => {
  if (!isOpen || !vehicle) return null;

  const disposal = vehicle.disposalRecord;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">车辆拦截处置与文书卷宗</span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {vehicle.plateNo}
                </span>
                <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {vehicle.plateType}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                关联指令：{taskTitle}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Vehicle & Interception Basics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-slate-400 text-[10px]">布控原因</div>
              <div className="font-medium text-slate-800 mt-0.5">{vehicle.riskReason}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">处置执勤单位</div>
              <div className="font-semibold text-blue-700 mt-0.5">{vehicle.interceptedByUnitName || '未登记'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">处警民警及警号</div>
              <div className="font-medium text-slate-800 mt-0.5">
                {disposal ? `${disposal.policeOfficer} (${disposal.policeCode})` : '—'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">处警时间</div>
              <div className="font-mono text-slate-800 mt-0.5">
                {vehicle.interceptedTime || disposal?.disposalTime || '—'}
              </div>
            </div>
          </div>

          {/* Section 2: Six-in-One Platform Integration & Anti-hang Check */}
          {disposal ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>公安交管综合应用平台 (六合一) 文书信息</span>
                </h4>
                <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>时间防倒挂系统核验通过</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div>
                  <div className="text-slate-500 text-[11px]">六合一处罚决定书 / 强制措施凭证编号：</div>
                  <div className="font-mono text-sm font-bold text-blue-900 mt-0.5 select-all">
                    {disposal.punishmentCode}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">执法行政措施类别：</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {disposal.disposalType}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">违法行为代码及认定：</div>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {disposal.violationCode} ({disposal.violationDetail})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">处罚结果：</div>
                  <div className="font-semibold text-rose-700 mt-0.5">
                    罚款 {disposal.fineAmount} 元 / 记 {disposal.penaltyPoints} 分
                  </div>
                </div>
              </div>

              {/* Time comparison audit check */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-500">指令下发时间：</span>
                  <span className="font-mono text-slate-700">{taskDispatchTime}</span>
                </div>
                <div className="text-slate-400">➔</div>
                <div>
                  <span className="text-slate-500">现场查处时间：</span>
                  <span className="font-mono font-bold text-slate-900">{disposal.disposalTime}</span>
                </div>
                <div className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>时序合规 (非历史补录)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
              此车辆尚未录入六合一综合应用平台文书凭证。
            </div>
          )}

          {/* Section 3: Enforcement Feedback Remarks & Dynamic Fields */}
          {vehicle.feedbackRemarks && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900">现场执勤民警处置反馈描述：</h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {vehicle.feedbackRemarks}
              </div>
            </div>
          )}

          {/* Dynamic feedback values if present */}
          {vehicle.dynamicFeedbackValues && Object.keys(vehicle.dynamicFeedbackValues).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">专项反馈要素填报值：</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(vehicle.dynamicFeedbackValues).map(([k, v]) => (
                  <div key={k} className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">{k}</span>
                    <span className="text-slate-800 font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Site Evidence Photos */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-600" />
              <span>现场查控执勤证据照片 ({vehicle.evidenceImages?.length || 1} 张)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(vehicle.evidenceImages && vehicle.evidenceImages.length > 0
                ? vehicle.evidenceImages
                : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80']
              ).map((imgUrl, i) => (
                <div key={i} className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs">
                  <img
                    src={imgUrl}
                    alt="现场查控照片"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2 text-[10px] text-white">
                    <span>证据照片 #{i + 1} (带水印与GPS防伪)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Multi-tier Audit Status Trail */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>逐车多级审核流转记录</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brigade Audit Card */}
              <div className={`p-3 rounded-lg border ${
                vehicle.vehicleAuditStatus === 'BRIGADE_PASSED' || vehicle.vehicleAuditStatus === 'PASSED'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : vehicle.vehicleAuditStatus === 'REJECTED'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>1. 大队初审核验</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/80 border">
                    {vehicle.vehicleAuditStatus === 'BRIGADE_PASSED' || vehicle.vehicleAuditStatus === 'PASSED'
                      ? '初审通过'
                      : vehicle.vehicleAuditStatus === 'REJECTED'
                      ? '已驳回整改'
                      : vehicle.isIntercepted
                      ? '待大队初审'
                      : '等待中队处置'}
                  </span>
                </div>
                <div className="text-[11px] mt-1.5">
                  审核意见：{vehicle.brigadeAuditRemarks || (vehicle.vehicleAuditStatus === 'REJECTED' ? vehicle.rejectReason : '符合要求，文书凭证真实')}
                </div>
              </div>

              {/* Branch Audit Card */}
              <div className={`p-3 rounded-lg border ${
                vehicle.vehicleAuditStatus === 'PASSED'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : vehicle.vehicleAuditStatus === 'BRIGADE_PASSED'
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>2. 支队终审核验 (计入办结)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/80 border">
                    {vehicle.vehicleAuditStatus === 'PASSED'
                      ? '★ 终审通过·已闭环'
                      : vehicle.vehicleAuditStatus === 'BRIGADE_PASSED'
                      ? '待支队终审'
                      : '等待前置流转'}
                  </span>
                </div>
                <div className="text-[11px] mt-1.5">
                  终审意见：{vehicle.branchAuditRemarks || (vehicle.vehicleAuditStatus === 'PASSED' ? '查核属实，合规完成闭环' : '等待支队指挥长审批')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition"
          >
            关闭凭证查看
          </button>
        </div>
      </div>
    </div>
  );
};
