import React, { useState, useRef } from 'react';
import { 
  X, Search, Shield, CheckCircle2, AlertTriangle, FileCheck, 
  MapPin, User, Clock, RefreshCw, Paperclip, Upload, Image as ImageIcon,
  FileText, Check, Tag, Info
} from 'lucide-react';
import { PlateType, ThirdPartyDisposalRecord, UserRoleContext, FeedbackElementConfig, TaskCategory } from '../types';
import { MOCK_THIRD_PARTY_RECORDS } from '../data/mockData';

interface VehicleInterceptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    vehicleId: string;
    plateNo: string;
    plateType: PlateType;
    riskReason?: string;
  };
  taskDispatchTime: string; // 指令下发时间，用来比对
  taskCategory?: TaskCategory; // 指令类别
  feedbackElements?: FeedbackElementConfig[]; // 指令中设定的反馈要素字段
  currentRole: UserRoleContext;
  onSubmitFeedback: (data: {
    vehicleId: string;
    plateNo: string;
    plateType: PlateType;
    disposalRecord: ThirdPartyDisposalRecord;
    feedbackRemarks: string;
    location: string;
    evidenceImages?: string[];
    dynamicFeedbackValues?: Record<string, any>;
  }) => void;
}

export const VehicleInterceptionDialog: React.FC<VehicleInterceptionDialogProps> = ({
  isOpen,
  onClose,
  vehicle,
  taskDispatchTime,
  taskCategory = '车辆缉查',
  feedbackElements,
  currentRole,
  onSubmitFeedback,
}) => {
  const [isQuerying, setIsQuerying] = useState(false);
  const [matchedRecord, setMatchedRecord] = useState<ThirdPartyDisposalRecord | null>(null);
  const [location, setLocation] = useState('凤起路与延安路交叉口机动执勤卡点');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [punishmentType, setPunishmentType] = useState<'现场处罚' | '扣留机动车' | '警告教育' | '移交办案' | '检验排查'>('现场处罚');
  const [customDocCode, setCustomDocCode] = useState('');
  
  // Evidence photos
  const [evidenceImages, setEvidenceImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
  ]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Dynamic feedback fields state
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({
    driver_info: '张建军 (33010419880922****) 1395801****',
    hidden_danger_type: '已消除安全隐患',
  });

  if (!isOpen) return null;

  // Active elements configuration from the task
  const activeElements = feedbackElements && feedbackElements.length > 0
    ? feedbackElements.filter((f) => f.enabled)
    : [
        { key: 'third_party_doc', name: '第三方交管处罚凭证/文书号', enabled: true, required: true, type: 'third_party_doc' as const },
        { key: 'punish_result', name: '现场处置结果与行政强制措施', enabled: true, required: true, type: 'select' as const, options: ['现场处罚', '扣留机动车', '警告教育', '移交办案', '检验排查'] },
        { key: 'location', name: '拦截/排查执勤卡点或具体路段', enabled: true, required: true, type: 'text' as const },
        { key: 'site_photo', name: '现场执法核查佐证照片', enabled: true, required: true, type: 'image' as const },
        { key: 'detail_notes', name: '处置过程详细情况说明', enabled: true, required: false, type: 'text' as const },
      ];

  // Helper to check if a specific element is required
  const isFieldRequired = (key: string): boolean => {
    const el = activeElements.find((f) => f.key === key);
    return el ? el.required : false;
  };

  const isFieldEnabled = (key: string): boolean => {
    return activeElements.some((f) => f.key === key);
  };

  // Simulate calling the Police Traffic Management Integrated Application Platform (六合一/综合应用平台)
  const handleQueryThirdParty = () => {
    setIsQuerying(true);

    setTimeout(() => {
      setIsQuerying(false);
      // Look up mock database
      const found = MOCK_THIRD_PARTY_RECORDS.find(
        (r) => r.plateNo.toUpperCase() === vehicle.plateNo.toUpperCase() && r.plateType === vehicle.plateType
      );

      if (found) {
        setMatchedRecord(found);
        setFeedbackRemarks(found.notes || '路面执勤警力已拦截该嫌疑车辆，现场查验无误并开具处罚决定书。');
        setPunishmentType(found.punishmentType);
      } else {
        // Auto-generate a new real-time simulated enforcement record
        const now = new Date();
        const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
        const autoRec: ThirdPartyDisposalRecord = {
          recordId: `TP-REC-${Date.now()}`,
          plateNo: vehicle.plateNo,
          plateType: vehicle.plateType,
          disposalTime: nowStr,
          policeName: currentRole.userName.split(' ')[0],
          policeId: currentRole.policeNo,
          location: location,
          punishmentType: punishmentType,
          punishmentCode: customDocCode || `330100${Date.now().toString().slice(-10)}`,
          illegalBehavior: '代码1039/1344: 重点嫌疑排查、违章未处理及违反禁令标志',
          verified: true,
          notes: '现场已拦截处置完毕，当事人签字并已将车辆信息同步至公安交通管理综合应用平台。',
        };
        setMatchedRecord(autoRec);
        setFeedbackRemarks(autoRec.notes || '');
      }
    }, 600);
  };

  // Photo adding simulation
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Add simulated image preview
      const newImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80';
      setEvidenceImages((prev) => [...prev, newImg]);
    }
  };

  // Compare times: is disposalTime >= taskDispatchTime?
  const isTimeValid = matchedRecord
    ? new Date(matchedRecord.disposalTime).getTime() >= new Date(taskDispatchTime).getTime()
    : false;

  const handleSubmit = () => {
    // 1. Verify Third party document if required
    if (isFieldEnabled('third_party_doc')) {
      if (!matchedRecord) {
        alert('【必填项未满足】：请先查询并关联第三方交管综合应用平台有效文书凭证！');
        return;
      }
      if (!isTimeValid) {
        alert('【核验拦截失败】：查询到的第三方处置时间早于指令下发时间，存在时间倒挂，不可作为本次处置凭证！');
        return;
      }
    }

    // 2. Verify Location if required
    if (isFieldEnabled('location') && isFieldRequired('location') && !location.trim()) {
      alert('【必填项未满足】：请输入实际拦截执勤卡点或路段！');
      return;
    }

    // 3. Verify Photo if required
    if (isFieldEnabled('site_photo') && isFieldRequired('site_photo') && evidenceImages.length === 0) {
      alert('【必填项未满足】：指令要求必须上传至少一张现场核查或处罚佐证照片！');
      return;
    }

    // 4. Verify custom/dynamic required fields
    for (const el of activeElements) {
      if (['third_party_doc', 'punish_result', 'location', 'site_photo', 'detail_notes'].includes(el.key)) {
        continue;
      }
      if (el.required && (!dynamicValues[el.key] || String(dynamicValues[el.key]).trim() === '')) {
        alert(`【必填项未满足】：请填写要素字段【${el.name}】！`);
        return;
      }
    }

    const finalRecord: ThirdPartyDisposalRecord = matchedRecord || {
      recordId: `TP-MANUAL-${Date.now()}`,
      plateNo: vehicle.plateNo,
      plateType: vehicle.plateType,
      disposalTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      policeName: currentRole.userName,
      policeId: currentRole.policeNo,
      location,
      punishmentType,
      punishmentCode: customDocCode || '现场查处并核验无违章',
      illegalBehavior: '现场核查',
      verified: true,
      notes: feedbackRemarks,
    };

    onSubmitFeedback({
      vehicleId: vehicle.vehicleId,
      plateNo: vehicle.plateNo,
      plateType: vehicle.plateType,
      disposalRecord: finalRecord,
      feedbackRemarks: feedbackRemarks.trim() || '执勤民警已拦截并完成现场处置',
      location,
      evidenceImages,
      dynamicFeedbackValues: dynamicValues,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 border border-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">路面车辆拦截与要素化反馈</h2>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded font-medium">
                  {taskCategory}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                处置填报民警：{currentRole.userName} · {currentRole.unitName} (警号: {currentRole.policeNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Target Vehicle Tag */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">目标排查车辆 (复合主键唯一标识)</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {vehicle.plateNo}
                </span>
                <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">
                  {vehicle.plateType}
                </span>
              </div>
              {vehicle.riskReason && (
                <div className="text-[11px] text-slate-500 mt-1">布控原因：{vehicle.riskReason}</div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">指令下发时间锚点</div>
              <div className="text-xs font-mono text-amber-700 font-semibold flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" />
                <span>{taskDispatchTime}</span>
              </div>
              <div className="text-[10px] text-slate-400">凭证处置时间须晚于此锚点</div>
            </div>
          </div>

          {/* Feedback Form Fields - Dynamically conditioned on Task Feedback Elements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>指令要求填报的反馈要素表单</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                标记 <span className="text-rose-500 font-bold">*</span> 为指令设定的必填项
              </span>
            </div>

            {/* Element 1: Location */}
            {isFieldEnabled('location') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>实际拦截/排查执勤卡点或路段</span>
                    {isFieldRequired('location') && <span className="text-rose-500">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{isFieldRequired('location') ? '必填项' : '选填项'}</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="请输入执勤卡点或路口具体位置"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Element 2: Third Party System Inquiry Box */}
            {isFieldEnabled('third_party_doc') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">
                      公安交通管理综合应用平台 (六合一) 接口联动
                      {isFieldRequired('third_party_doc') && <span className="text-rose-500 ml-1">*</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQueryThirdParty}
                    disabled={isQuerying}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
                    <span>{isQuerying ? '系统调取中...' : '自动调取处置文书'}</span>
                  </button>
                </div>

                {/* Query result */}
                {matchedRecord ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] text-slate-600">
                        第三方文书编号：<code className="text-slate-900 font-mono font-bold">{matchedRecord.punishmentCode}</code>
                      </span>
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        {matchedRecord.punishmentType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                      <div>
                        <span className="text-slate-500">处警民警：</span> {matchedRecord.policeName} ({matchedRecord.policeId})
                      </div>
                      <div>
                        <span className="text-slate-500">违法代码：</span> {matchedRecord.illegalBehavior.split(':')[0]}
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">第三方录入时间：</span>{' '}
                        <span className="font-mono text-amber-700 font-bold">{matchedRecord.disposalTime}</span>
                      </div>
                    </div>

                    {/* Evidence Validity Comparison Badge */}
                    <div className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                      isTimeValid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {isTimeValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold">【证据核验合规】处置时间有效</div>
                            <div className="text-[11px] text-emerald-700">
                              处警时间 ({matchedRecord.disposalTime}) 晚于指令下发时间 ({taskDispatchTime})，证据链完整。
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold">【证据核验失败】时间倒挂预警</div>
                            <div className="text-[11px] text-rose-700">
                              该文书处置时间 ({matchedRecord.disposalTime}) 早于指令下发时间 ({taskDispatchTime})，为历史处置记录，不可用！
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    <Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <p>点击上方按钮，通过车牌+种类实时拉取路面处罚/扣留凭证</p>
                  </div>
                )}
              </div>
            )}

            {/* Element 3: Punish Result */}
            {isFieldEnabled('punish_result') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    现场处置结果与行政强制措施
                    {isFieldRequired('punish_result') && <span className="text-rose-500 ml-1">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{isFieldRequired('punish_result') ? '必填项' : '选填项'}</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['现场处罚', '扣留机动车', '警告教育', '移交办案', '检验排查'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setPunishmentType(type)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition ${
                        punishmentType === type
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Element 4: Site Photo Upload */}
            {isFieldEnabled('site_photo') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>现场执法与核查佐证照片</span>
                    {isFieldRequired('site_photo') && <span className="text-rose-500">*</span>}
                  </label>
                  <span className="text-[10px] text-slate-400">{isFieldRequired('site_photo') ? '必填项' : '选填项'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {evidenceImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 group">
                      <img src={img} alt="现场证据" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEvidenceImages(evidenceImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-0.5 bg-slate-900/70 text-white rounded-full hover:bg-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={photoInputRef}
                    onChange={handleAddPhoto}
                    className="hidden"
                    id="photo-feedback-input"
                  />
                  <label
                    htmlFor="photo-feedback-input"
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">添加照片</span>
                  </label>
                </div>
              </div>
            )}

            {/* Dynamic/Custom Fields from task configuration */}
            {activeElements.filter(f => !['third_party_doc', 'punish_result', 'location', 'site_photo', 'detail_notes'].includes(f.key)).map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    {field.name}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{field.required ? '必填项' : '选填项'}</span>
                </label>
                {field.type === 'select' && field.options ? (
                  <select
                    value={dynamicValues[field.key] || field.options[0]}
                    onChange={(e) => setDynamicValues({ ...dynamicValues, [field.key]: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={dynamicValues[field.key] || ''}
                    placeholder={field.placeholder || `请输入${field.name}`}
                    onChange={(e) => setDynamicValues({ ...dynamicValues, [field.key]: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}
              </div>
            ))}

            {/* Element: Feedback Remarks */}
            {isFieldEnabled('detail_notes') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    处置情况详细说明与执勤记录
                    {isFieldRequired('detail_notes') && <span className="text-rose-500 ml-1">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{isFieldRequired('detail_notes') ? '必填项' : '选填项'}</span>
                </label>
                <textarea
                  rows={2}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder="简述路面拦查过程、驾驶人信息核实情况及后续移交说明..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            按指令要求完成要素采集并提交上一级审核
          </div>
          <div className="flex items-center space-x-3">
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
              disabled={isFieldEnabled('third_party_doc') && (!matchedRecord || !isTimeValid)}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>确认并提交上一级审核</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
