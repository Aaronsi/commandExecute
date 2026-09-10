import React, { useState, useRef } from 'react';
import { 
  X, Plus, Trash2, Shield, AlertCircle, Car, Users, CheckCircle2, 
  Clock, Paperclip, Upload, FileText, Settings, Check, HelpCircle, 
  Sparkles, Tag, ChevronDown, ChevronUp, File, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { 
  DispatchTask, PlateType, CompletionRule, UserRoleContext, 
  TaskCategory, FeedbackElementConfig, TaskAttachment, SystemNotice,
  DirectiveType
} from '../types';
import { MOCK_ORG_UNITS } from '../data/mockData';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRoleContext;
  onCreateTask: (task: DispatchTask) => void;
  initialTask?: DispatchTask | null;
  onAddNotice?: (notice: SystemNotice) => void;
}

const PLATE_TYPES: PlateType[] = [
  '小型汽车',
  '大型汽车',
  '新能源小车',
  '新能源大车',
  '挂车',
  '教练车',
  '警用汽车',
  '普通摩托车',
];

const TASK_CATEGORIES: { category: TaskCategory; desc: string; icon: string; badgeColor: string }[] = [
  { 
    category: '车辆缉查', 
    desc: '假套牌/嫌疑涉案/失格驾驶/多次违法未处理等嫌疑机动车精准卡口布控与查扣拦截',
    icon: '🚗',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  { 
    category: '隐患治理', 
    desc: '高风险营运客货车/逾期未检验/逾期未报废/涉企源头隐患全量清零排查',
    icon: '⚠️',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  { 
    category: '违法查处', 
    desc: '酒驾醉驾/飙车炸街/超员超载/涉牌涉证专项集中整治查处行动',
    icon: '⚖️',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  { 
    category: '重点管控', 
    desc: '危化品运输车/渣土工程车/校车专项通行准入与路面动态联合监管',
    icon: '🛡️',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  { 
    category: '专项整治', 
    desc: '节假日客运疏导/恶劣天气应急管控/重大会议活动交通安保专项调度',
    icon: '📋',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  { 
    category: '其他', 
    desc: '日常交管综合调度指令及其他自定义业务协同任务',
    icon: '📌',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200'
  }
];

// Default feedback elements pool that creators can toggle and set required/optional
const DEFAULT_FEEDBACK_ELEMENTS: FeedbackElementConfig[] = [
  {
    key: 'third_party_doc',
    name: '六合一/综合应用平台处置凭证文书号',
    enabled: true,
    required: true,
    type: 'third_party_doc',
    description: '自动联动第三方交管综合平台检验处置文书编号与时间倒挂规则',
    placeholder: '如简易程序处罚决定书编号、强制措施凭证号',
  },
  {
    key: 'punish_result',
    name: '现场处置结果与行政强制措施',
    enabled: true,
    required: true,
    type: 'select',
    options: ['现场处罚', '扣留机动车', '警告教育', '移交办案', '检验排查', '消除隐患放行'],
    description: '执法民警现场对机动车或驾驶人采取的措施',
  },
  {
    key: 'location',
    name: '拦截/排查执勤卡点或具体路段',
    enabled: true,
    required: true,
    type: 'text',
    placeholder: '例：凤起路与延安路交叉口执勤卡点',
    description: '执勤警力实际拦截或处置发生的道路点位',
  },
  {
    key: 'site_photo',
    name: '现场执法核查佐证照片',
    enabled: true,
    required: true,
    type: 'image',
    description: '现场拦截照片、车辆特征、驾驶人及文书签字照片',
  },
  {
    key: 'driver_info',
    name: '驾驶人姓名及身份证号/联系方式',
    enabled: true,
    required: false,
    type: 'text',
    placeholder: '输入当事驾驶人姓名及联系方式（如有）',
    description: '核实当事机动车驾驶员身份信息',
  },
  {
    key: 'hidden_danger_type',
    name: '隐患排查整改/源头消除状态',
    enabled: false,
    required: false,
    type: 'select',
    options: ['已消除安全隐患', '已依法暂扣机动车', '已下发限期整改通知书', '移交运管/属地处理', '车辆不在本辖区'],
    description: '隐患治理类指令反馈车辆整改闭环情况',
  },
  {
    key: 'detail_notes',
    name: '处置过程详细情况说明与执勤记录',
    enabled: true,
    required: false,
    type: 'text',
    placeholder: '简述现场查缉拦截、当事人态度及配合处置情况...',
    description: '执勤民警详细情况陈述',
  },
];

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onCreateTask,
  initialTask,
  onAddNotice,
}) => {
  const isEditing = Boolean(initialTask);
  const [directiveType, setDirectiveType] = useState<DirectiveType>(initialTask?.directiveType || 'VEHICLE');
  const [title, setTitle] = useState(initialTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || '车辆缉查');
  const [urgency, setUrgency] = useState<'特急' | '紧急' | '常规'>(initialTask?.urgency || '紧急');
  const [completionRule, setCompletionRule] = useState<CompletionRule>(initialTask?.completionRule || 'ANY_COMPLETE');
  const [content, setContent] = useState(initialTask?.content || '');
  const [targetArea, setTargetArea] = useState(initialTask?.targetArea || '市辖主要道路及进出城主要通道卡口');
  const [deadlineHours, setDeadlineHours] = useState('12');

  // Feedback elements configuration
  const [feedbackConfigs, setFeedbackConfigs] = useState<FeedbackElementConfig[]>(
    initialTask?.feedbackElements && initialTask.feedbackElements.length > 0
      ? initialTask.feedbackElements
      : DEFAULT_FEEDBACK_ELEMENTS
  );
  const [customFieldModal, setCustomFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'select' | 'number'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>(
    initialTask?.attachments || [
      {
        id: 'att-init-1',
        name: '重点车辆轨迹研判与布控名单清单.pdf',
        size: '1.8 MB',
        type: 'application/pdf',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        uploadedBy: currentRole.userName,
      }
    ]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target units
  const availableTargetUnits = currentRole.level === 'branch'
    ? MOCK_ORG_UNITS.filter((u) => u.level === 'brigade')
    : MOCK_ORG_UNITS.filter((u) => u.level === 'squadron' && u.parentId === currentRole.unitId);

  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
    initialTask?.targetBrigadeIds && initialTask.targetBrigadeIds.length > 0
      ? initialTask.targetBrigadeIds
      : availableTargetUnits.map((u) => u.id)
  );

  // Target Vehicles
  const [vehicles, setVehicles] = useState<
    { id: string; plateNo: string; plateType: PlateType; riskReason: string; ownerName?: string }[]
  >(
    initialTask?.vehicles && initialTask.vehicles.length > 0
      ? initialTask.vehicles.map((v) => ({
          id: v.id,
          plateNo: v.plateNo,
          plateType: v.plateType,
          riskReason: v.riskReason,
          ownerName: v.ownerName,
        }))
      : [
          {
            id: `v-init-1`,
            plateNo: '浙A9988G',
            plateType: '小型汽车',
            riskReason: '多次严重违法未处理、涉嫌假牌套牌',
            ownerName: '张*伟',
          },
          {
            id: `v-init-2`,
            plateNo: '浙A6632B',
            plateType: '大型汽车',
            riskReason: '逾期未检验上路、疲劳驾驶预警',
            ownerName: '速安物流有限公司',
          }
        ]
  );

  const [newPlateNo, setNewPlateNo] = useState('');
  const [newPlateType, setNewPlateType] = useState<PlateType>('小型汽车');
  const [newRiskReason, setNewRiskReason] = useState('重点布控嫌疑车辆');

  if (!isOpen) return null;

  const handleCategoryChange = (cat: TaskCategory) => {
    setCategory(cat);
    // Auto-adjust default feedback element recommendations based on category
    if (cat === '隐患治理') {
      setFeedbackConfigs((prev) =>
        prev.map((f) => {
          if (f.key === 'hidden_danger_type') return { ...f, enabled: true, required: true };
          return f;
        })
      );
      if (!title.startsWith('【隐患治理】') && !title.startsWith('【专项缉查】')) {
        setTitle('【隐患治理】重点营运车辆检验与隐患清零排查指令');
      }
    } else if (cat === '车辆缉查') {
      if (!title.startsWith('【专项缉查】') && !title.startsWith('【隐患治理】')) {
        setTitle('【专项缉查】重点嫌疑客货运车辆全域排查与拦截指令');
      }
    }
  };

  const handleToggleFeedbackElement = (key: string) => {
    setFeedbackConfigs((prev) =>
      prev.map((el) => {
        if (el.key === key) {
          const nextEnabled = !el.enabled;
          return {
            ...el,
            enabled: nextEnabled,
            // if disabled, required should also reset
            required: nextEnabled ? el.required : false,
          };
        }
        return el;
      })
    );
  };

  const handleToggleFeedbackRequired = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedbackConfigs((prev) =>
      prev.map((el) => {
        if (el.key === key) {
          return {
            ...el,
            required: !el.required,
            enabled: true, // auto-enable if marked required
          };
        }
        return el;
      })
    );
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const newKey = `custom_${Date.now()}`;
    setFeedbackConfigs((prev) => [
      ...prev,
      {
        key: newKey,
        name: newFieldName.trim(),
        enabled: true,
        required: newFieldRequired,
        type: newFieldType,
        placeholder: `请输入${newFieldName.trim()}...`,
        description: '发布人自定义反馈要素字段',
      },
    ]);
    setNewFieldName('');
    setCustomFieldModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TaskAttachment[] = (Array.from(files) as File[]).map((file) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: `${sizeMB} MB`,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        uploadedBy: currentRole.userName,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddVehicle = () => {
    if (!newPlateNo.trim()) return;
    const cleanNo = newPlateNo.trim().toUpperCase();
    
    // Check if plateNo + plateType already exists
    const exists = vehicles.some((v) => v.plateNo === cleanNo && v.plateType === newPlateType);
    if (exists) {
      alert(`已存在相同号牌与车种的目标车辆：${cleanNo} (${newPlateType})`);
      return;
    }

    setVehicles([
      ...vehicles,
      {
        id: `v-${Date.now()}`,
        plateNo: cleanNo,
        plateType: newPlateType,
        riskReason: newRiskReason.trim() || '重点布控排查',
      },
    ]);
    setNewPlateNo('');
  };

  const handleRemoveVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const handleToggleUnit = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入指令标题');
      return;
    }
    if (directiveType === 'VEHICLE' && vehicles.length === 0) {
      alert('请至少添加一辆目标车辆（需包含号牌号码与号牌种类）');
      return;
    }
    if (selectedUnitIds.length === 0) {
      alert('请选择至少一个接收下发单位');
      return;
    }

    const enabledElements = feedbackConfigs.filter((f) => f.enabled);
    if (enabledElements.length === 0) {
      alert('请至少配置并启用一项反馈要素字段');
      return;
    }

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const deadlineDate = new Date(now.getTime() + parseInt(deadlineHours, 10) * 3600 * 1000);
    const deadlineStr = deadlineDate.toISOString().replace('T', ' ').substring(0, 19);

    const taskNo = initialTask
      ? initialTask.taskNo
      : `${currentRole.level === 'branch' ? 'ZD' : 'DD'}-${now.getFullYear()}${String(
          now.getMonth() + 1
        ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(
          Math.floor(Math.random() * 900) + 100
        )}`;

    // Build execution nodes for target brigades/squadrons
    const executionNodes = selectedUnitIds.map((uId) => {
      const unitObj = MOCK_ORG_UNITS.find((u) => u.id === uId);
      return {
        id: `node-${uId}-${Date.now()}`,
        taskId: initialTask ? initialTask.id : `task-${Date.now()}`,
        unitId: uId,
        unitName: unitObj?.name || uId,
        unitLevel: unitObj?.level || (currentRole.level === 'branch' ? 'brigade' : 'squadron'),
        status: 'PENDING_SIGN' as const,
        vehiclesStatus: directiveType === 'TEXT' ? [] : vehicles.map((v) => ({
          vehicleId: v.id,
          plateNo: v.plateNo,
          plateType: v.plateType,
          isIntercepted: false,
          auditStatus: 'PENDING' as const,
        })),
      };
    });

    const newTask: DispatchTask = {
      id: initialTask ? initialTask.id : `task-${Date.now()}`,
      taskNo,
      title: title.trim(),
      directiveType,
      category,
      creatorLevel: currentRole.level as 'branch' | 'brigade',
      creatorUnitId: currentRole.unitId,
      creatorUnitName: currentRole.unitName,
      creatorName: currentRole.userName,
      createdAt: initialTask ? initialTask.createdAt : nowStr,
      dispatchTime: nowStr,
      deadline: deadlineStr,
      urgency,
      completionRule: directiveType === 'TEXT' ? 'ALL_COMPLETE' : completionRule,
      content: content.trim() || (directiveType === 'TEXT' 
        ? '请各责任单位组织警力认真排查研判，按时完成处置并录入详细文字报告与现场佐证照片。'
        : '请各单位立即组织路面执勤警力进行卡口布控与车辆拦截核查，严格按指令配置的反馈要素上传处置文书与佐证材料。'),
      targetArea,
      feedbackElements: feedbackConfigs,
      attachments,
      vehicles: directiveType === 'TEXT' ? [] : vehicles.map((v) => ({
        id: v.id,
        plateNo: v.plateNo,
        plateType: v.plateType,
        riskReason: v.riskReason,
        ownerName: v.ownerName,
        isIntercepted: false,
      })),
      targetBrigadeIds: selectedUnitIds,
      executionNodes,
      overallStatus: 'PROCESSING',
      cancelRecord: undefined,
      returnRequest: initialTask?.returnRequest ? {
        ...initialTask.returnRequest,
        status: 'CONFIRMED',
        confirmedBy: currentRole.userName,
        confirmedTime: nowStr,
        confirmRemarks: '已根据退单原因更正信息并重新正式下发',
      } : undefined,
      actionLogs: [
        ...(initialTask ? initialTask.actionLogs : []),
        {
          id: `log-${Date.now()}`,
          timestamp: nowStr,
          operatorName: currentRole.userName,
          operatorUnit: currentRole.unitName,
          action: initialTask ? '更正并重新下发（纠错重发）' : '指令创建并下发',
          details: initialTask
            ? `【${category}】由 ${currentRole.userName} 更正接收责任单位及指令信息，重新向 [${selectedUnitIds.map(id => MOCK_ORG_UNITS.find(u => u.id === id)?.name || id).join('、')}] 下发。工单重回正常流转待签收池。`
            : `【${category}】由 ${currentRole.unitName} 正式下发至 ${selectedUnitIds.length} 个单位，配置了 ${enabledElements.length} 项反馈要素字段（${feedbackConfigs.filter(f => f.enabled && f.required).length} 项必填），挂载附件 ${attachments.length} 个，目标车辆 ${vehicles.length} 辆。`,
        },
      ],
    };

    onCreateTask(newTask);

    if (onAddNotice) {
      newTask.executionNodes.forEach((node) => {
        onAddNotice({
          id: `notice-disp-${Date.now()}-${node.unitId}`,
          type: 'DISPATCH_NEW',
          targetUnitId: node.unitId,
          targetUnitName: node.unitName,
          targetLevel: node.unitLevel,
          taskId: newTask.id,
          taskNo: newTask.taskNo,
          taskTitle: newTask.title,
          title: currentRole.level === 'branch' ? '支队下发重点查控指令待签收' : '大队下发重点车辆查处指令待签收',
          content: `${currentRole.unitName} 向 ${node.unitName} 下发了任务指令【${newTask.taskNo}】，请在规定时限内完成签收并落实查缉。`,
          urgency: newTask.urgency,
          timestamp: '刚刚',
          isRead: false,
          isDismissedFromToast: false,
          actionTab: 'PENDING_SIGN',
          actionType: 'GOTO_TODO',
        });
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">
                  {isEditing ? '更正并重新下发指令（纠错重发）' : '新建公安交警指挥调度指令'}
                </h2>
                <span className="text-[11px] bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded font-medium">
                  {isEditing ? '已退回工单重发' : '要素化下发与反馈配置'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isEditing 
                  ? `更正操作人：${currentRole.userName} · ${currentRole.unitName} (原指令编号：${initialTask?.taskNo})`
                  : `下发发起人：${currentRole.userName} · ${currentRole.unitName} (${currentRole.level === 'branch' ? '市支队指挥中心' : '交警大队指挥室'})`
                }
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Task Category & Urgency */}
          <div className="space-y-4">
            {/* Directive Type Selector (按车反馈指令 vs 文本指令) */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-4 rounded-xl border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>指令反馈类型模式</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-normal">
                  选择按车精准布控 或 综合勤务文本上报
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-directive-type-vehicle"
                  onClick={() => setDirectiveType('VEHICLE')}
                  className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                    directiveType === 'VEHICLE'
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 transition ${
                    directiveType === 'VEHICLE' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">按车反馈指令</span>
                      {directiveType === 'VEHICLE' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      需录入目标车辆清单。下级路面警力精准拦截、开具六合一处罚文书并逐车终审。
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="btn-directive-type-text"
                  onClick={() => setDirectiveType('TEXT')}
                  className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                    directiveType === 'TEXT'
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 transition ${
                    directiveType === 'TEXT' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">文本指令</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                          免填车辆
                        </span>
                      </div>
                      {directiveType === 'TEXT' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      综合勤务、隐患排查、交通组织等，无需车辆清单，责任单位填报文字报告与佐证附件。
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>1. 指令类别与基础信息</span>
              </h3>
              <span className="text-xs text-slate-500">支持不同业务类别自适应调度规则</span>
            </div>

            {/* Category Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                指令业务类别 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {TASK_CATEGORIES.map((item) => {
                  const isSelected = category === item.category;
                  return (
                    <button
                      type="button"
                      key={item.category}
                      onClick={() => handleCategoryChange(item.category)}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base">{item.icon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="mt-1.5 font-bold text-xs">{item.category}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-slate-700">类别说明：</strong>
                {TASK_CATEGORIES.find((c) => c.category === category)?.desc}
              </p>
            </div>

            {/* Title & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  指令标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：【专项查缉】重点嫌疑客货运车辆全域排查与拦截指令"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">紧急程度</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {(['特急', '紧急', '常规'] as const).map((u) => (
                    <button
                      type="button"
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`py-1.5 rounded-md text-xs font-semibold transition ${
                        urgency === u
                          ? u === '特急'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : u === '紧急'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Completion Rule Switcher */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                指令完成判定规则 (核心闭环逻辑) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  onClick={() => setCompletionRule('ANY_COMPLETE')}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
                    completionRule === 'ANY_COMPLETE'
                      ? 'bg-amber-50/70 border-amber-400 text-amber-900 ring-1 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                    completionRule === 'ANY_COMPLETE' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'
                  }`}>
                    {completionRule === 'ANY_COMPLETE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>任一完成模式 (OR 逻辑)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">推荐突发查控</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      只要任一参与的大队或中队完成该车辆拦截并审核通过，整条指令立即标记完结。
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setCompletionRule('ALL_COMPLETE')}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
                    completionRule === 'ALL_COMPLETE'
                      ? 'bg-blue-50/70 border-blue-400 text-blue-900 ring-1 ring-blue-400/40'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                    completionRule === 'ALL_COMPLETE' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {completionRule === 'ALL_COMPLETE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>全部完成模式 (AND 逻辑)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">推荐隐患清零</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      所有自办大队以及所有被下发的中队，必须逐一全部完成处置与审核，指令方可结案。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Directive content */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                处置要求与工作指令说明
              </label>
              <textarea
                rows={2}
                placeholder="说明具体布控要求、处置措施（如扣车、当场处罚、查验行车记录等）..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>
          </div>

          {/* Section 2: Feedback Elements Configuration (Dynamic & Optional/Required) */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>2. 下级反馈要素配置 (字段可选 / 必填项开关)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  勾选下级反馈时需采集的要素字段，并可自由设定每个字段是<strong>【必填项】</strong>还是<strong>【选填项】</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomFieldModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加自定义反馈字段</span>
              </button>
            </div>

            {/* Elements List Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {feedbackConfigs.map((element) => {
                  return (
                    <div
                      key={element.key}
                      onClick={() => handleToggleFeedbackElement(element.key)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        element.enabled
                          ? 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-100'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <input
                          type="checkbox"
                          checked={element.enabled}
                          onChange={() => {}} // Handled by container click
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{element.name}</span>
                            {element.type === 'third_party_doc' && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">六合一调证</span>
                            )}
                            {element.type === 'image' && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">照片附件</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{element.description || element.placeholder}</p>
                        </div>
                      </div>

                      {/* Required / Optional switch */}
                      {element.enabled && (
                        <div
                          onClick={(e) => handleToggleFeedbackRequired(element.key, e)}
                          className="shrink-0 ml-2"
                        >
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                              element.required
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="点击切换必填/选填"
                          >
                            {element.required ? '★ 必填项' : '选填项'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <span>
                  当前已启用 <strong>{feedbackConfigs.filter((f) => f.enabled).length}</strong> 项反馈要素（
                  <strong className="text-rose-600">{feedbackConfigs.filter((f) => f.enabled && f.required).length}</strong> 项必填，
                  <strong className="text-slate-700">{feedbackConfigs.filter((f) => f.enabled && !f.required).length}</strong> 项选填）
                </span>
                <span className="text-slate-400">下级处置反馈表单将严格按此要求动态生成</span>
              </div>
            </div>
          </div>

          {/* Section 3: Attachment Upload (指令附件上传) */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-purple-600" />
                  <span>3. 指令附件与研判材料上传 (支持PDF/图片/表格/压缩包)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  上传上级通报文件、嫌疑车辆轨迹研判报告、底册清单等佐证材料，随指令同步下达基层
                </p>
              </div>
              <div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="task-attachment-input"
                />
                <label
                  htmlFor="task-attachment-input"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传附件材料</span>
                </label>
              </div>
            </div>

            {/* Attachments List */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              {attachments.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-purple-300 transition cursor-pointer bg-white"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600 font-medium">点击此处或拖拽文件上传指令附件</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">支持 PDF, DOCX, XLSX, JPG, PNG, ZIP 等格式，单个文件最大 50MB</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-xs hover:border-purple-200 transition"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {file.size} · 上传人：{file.uploadedBy}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition shrink-0 ml-2"
                        title="删除附件"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Target Vehicles (Only for 'VEHICLE' directive type) */}
          {directiveType === 'VEHICLE' ? (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>4. 目标车辆清单 (号牌号码 + 号牌种类 复合主键)</span>
                </h3>
                <span className="text-xs text-slate-500">已添加 {vehicles.length} 辆</span>
              </div>

              {/* Add vehicle inline input */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-600 mb-1 font-medium">号牌号码</label>
                    <input
                      type="text"
                      placeholder="如：浙A9988G"
                      value={newPlateNo}
                      onChange={(e) => setNewPlateNo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-600 mb-1 font-medium">号牌种类</label>
                    <select
                      value={newPlateType}
                      onChange={(e) => setNewPlateType(e.target.value as PlateType)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      {PLATE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-600 mb-1 font-medium">排查/布控原因</label>
                    <input
                      type="text"
                      placeholder="如：涉嫌假牌套牌、多次违章"
                      value={newRiskReason}
                      onChange={(e) => setNewRiskReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-1.5 flex items-center justify-center transition shadow-xs"
                      title="添加车辆"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle list display */}
              <div className="space-y-2">
                {vehicles.map((v, idx) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-3.5 py-2.5 rounded-lg transition"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold text-xs tracking-wider">
                          {v.plateNo}
                        </span>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {v.plateType}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 truncate max-w-xs">{v.riskReason}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(v.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start space-x-3 text-xs text-indigo-950">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-indigo-900 mb-1">
                    当前为【文本指令】模式 · 无需填写目标车辆清单
                  </div>
                  <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                    本指令下发后，各接收大队及执勤中队将直接填报综合排查文本、工作文字报告及现场佐证材料（图片或文档），无需指定具体机动车号牌。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Target Units */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                5. 下发接收单位 ({currentRole.level === 'branch' ? '直属交警大队' : '下属执勤中队'})
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {availableTargetUnits.map((u) => {
                const isSelected = selectedUnitIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => handleToggleUnit(u.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.leader}</div>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>时限设置：</span>
            <select
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="6">6 小时 (特急查缉)</option>
              <option value="12">12 小时 (当日闭环)</option>
              <option value="24">24 小时 (1天)</option>
              <option value="72">72 小时 (3天)</option>
              <option value="168">7 天 (专项攻坚)</option>
              <option value="720">30 天 (全量清零)</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/70 border border-slate-200 bg-white transition shadow-xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isEditing ? '确认更正并重新下发指令' : '确认并正式下发指令'}</span>
            </button>
          </div>
        </div>

        {/* Modal: Custom Field Adding */}
        {customFieldModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>添加自定义反馈要素字段</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCustomFieldModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">字段名称</label>
                  <input
                    type="text"
                    placeholder="如：查获酒精含量(mg/100ml)、查封企业名称"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">字段输入类型</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="text">单行文本输入</option>
                    <option value="number">数值输入</option>
                    <option value="select">下拉选项选择</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="new-field-req"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="new-field-req" className="text-slate-700 font-medium cursor-pointer">
                    设为必填项 (下级不填写将无法提交反馈)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCustomFieldModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
