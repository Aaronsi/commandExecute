import { OrgUnit, DispatchTask, ThirdPartyDisposalRecord, PlateType, SystemNotice } from '../types';

export const MOCK_ORG_UNITS: OrgUnit[] = [
  // 支队
  {
    id: 'branch-01',
    name: '市交警支队指挥中心',
    code: 'ZD01',
    level: 'branch',
    leader: '张志刚 (支队长)',
    phone: '0571-88880110',
  },
  // 直属一大队
  {
    id: 'brigade-01',
    name: '直属一大队 (市中心城区)',
    code: 'DD01',
    level: 'brigade',
    parentId: 'branch-01',
    leader: '李卫民 (大队长)',
    phone: '0571-88880121',
  },
  {
    id: 'squadron-01-01',
    name: '一大队·城东一中队',
    code: 'ZD0101',
    level: 'squadron',
    parentId: 'brigade-01',
    leader: '陈勇 (中队长)',
    phone: '0571-88880122',
  },
  {
    id: 'squadron-01-02',
    name: '一大队·城西二中队',
    code: 'ZD0102',
    level: 'squadron',
    parentId: 'brigade-01',
    leader: '王强 (中队长)',
    phone: '0571-88880123',
  },
  {
    id: 'squadron-01-03',
    name: '一大队·机动铁骑中队',
    code: 'ZD0103',
    level: 'squadron',
    parentId: 'brigade-01',
    leader: '林峰 (中队长)',
    phone: '0571-88880124',
  },
  // 直属二大队
  {
    id: 'brigade-02',
    name: '直属二大队 (工业园区)',
    code: 'DD02',
    level: 'brigade',
    parentId: 'branch-01',
    leader: '赵建军 (大队长)',
    phone: '0571-88880131',
  },
  {
    id: 'squadron-02-01',
    name: '二大队·园区一中队',
    code: 'ZD0201',
    level: 'squadron',
    parentId: 'brigade-02',
    leader: '孙明 (中队长)',
    phone: '0571-88880132',
  },
  {
    id: 'squadron-02-02',
    name: '二大队·港口二中队',
    code: 'ZD0202',
    level: 'squadron',
    parentId: 'brigade-02',
    leader: '周涛 (中队长)',
    phone: '0571-88880133',
  },
  // 高速公路交警大队
  {
    id: 'brigade-03',
    name: '高速公路一大队',
    code: 'DD03',
    level: 'brigade',
    parentId: 'branch-01',
    leader: '吴建宏 (大队长)',
    phone: '0571-88880141',
  },
  {
    id: 'squadron-03-01',
    name: '高速大队·收费站中队',
    code: 'ZD0301',
    level: 'squadron',
    parentId: 'brigade-03',
    leader: '钱超 (中队长)',
    phone: '0571-88880142',
  }
];

// 模拟第三方公安交管综合应用平台/六合一系统的拦截与处置记录库
export const MOCK_THIRD_PARTY_RECORDS: ThirdPartyDisposalRecord[] = [
  {
    recordId: 'TP-REC-20260901-8812',
    plateNo: '浙A9988G',
    plateType: '小型汽车',
    disposalTime: '2026-09-01 10:15:30',
    policeName: '陈勇',
    policeId: '034981',
    location: '延安路与凤起路交叉口东侧50米执勤卡点',
    punishmentType: '现场处罚',
    punishmentCode: '3301001928374615',
    illegalBehavior: '代码1039: 机动车违反规定停放且驾驶人不在现场/逾期未年检上路行驶',
    verified: true,
    notes: '执勤民警现场拦截，当事人已签字确认，现场开具简易程序处罚决定书。',
  },
  {
    recordId: 'TP-REC-20260901-8930',
    plateNo: '浙A6632B',
    plateType: '大型汽车',
    disposalTime: '2026-09-01 11:42:00',
    policeName: '周涛',
    policeId: '035102',
    location: '临港大道与金海路南口检查站',
    punishmentType: '扣留机动车',
    punishmentCode: '3301003847291048',
    illegalBehavior: '代码1603: 驾驶拼装/达到报废标准的机动车上道路行驶',
    verified: true,
    notes: '车辆已依法扣留至直属二大队指定停车场，强制措施凭证已录入系统。',
  },
  {
    recordId: 'TP-REC-20260901-7021',
    plateNo: '浙AD88392',
    plateType: '新能源小车',
    disposalTime: '2026-09-01 14:20:10',
    policeName: '林峰',
    policeId: '034771',
    location: '西湖大道湖滨卡口',
    punishmentType: '现场处罚',
    punishmentCode: '3301009182736450',
    illegalBehavior: '代码1344: 机动车违反禁止标线指示及多起违章未处理',
    verified: true,
    notes: '铁骑机动中队巡逻拦截，已督促当场处理历史违法。',
  },
  {
    recordId: 'TP-REC-20260901-6601',
    plateNo: '浙E33981',
    plateType: '大型汽车',
    disposalTime: '2026-09-01 09:30:00', // 处置时间可能在某些指令下发之前
    policeName: '吴浩',
    policeId: '039822',
    location: '杭甬高速彭埠收费站出口',
    punishmentType: '现场处罚',
    punishmentCode: '3301004918273641',
    illegalBehavior: '代码1231: 载物行驶时遗撒、飘散载运物',
    verified: true,
    notes: '收费站中队早高峰拦查。',
  }
];

export const INITIAL_TASKS: DispatchTask[] = [
  {
    id: 'task-001',
    taskNo: 'ZD-20260901-001',
    title: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    category: '车辆缉查',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队长)',
    createdAt: '2026-09-01 08:30:00',
    dispatchTime: '2026-09-01 08:35:00',
    deadline: '2026-09-01 18:00:00',
    urgency: '特急',
    completionRule: 'ANY_COMPLETE', // 任一完成
    content: '情报研判发现车辆【浙A9988G】、【浙A6632B】涉嫌套牌及多次严重违法，请各相关大队组织路面警力进行布控拦截，只要任一执勤单位查获并处置完成即算本指令达成。',
    targetArea: '主城区各进出城主要通道、高架立交及枢纽卡口',
    feedbackElements: [
      { key: 'third_party_doc', name: '第三方交管处罚凭证/文书号', enabled: true, required: true, type: 'third_party_doc', description: '六合一系统或综合应用平台有效文书' },
      { key: 'punish_result', name: '处罚结果与强制措施', enabled: true, required: true, type: 'select', options: ['现场处罚', '扣留机动车', '警告教育', '移交办案', '检验排查'] },
      { key: 'location', name: '拦截执勤卡点/路段', enabled: true, required: true, type: 'text', placeholder: '请输入具体路段或卡点' },
      { key: 'driver_info', name: '驾驶人姓名及联系电话', enabled: true, required: false, type: 'text', placeholder: '驾驶人身份信息核实' },
      { key: 'site_photo', name: '现场执法与拦截照片', enabled: true, required: true, type: 'image', description: '现场查验及处罚照片' },
      { key: 'detail_notes', name: '处置情况与后续说明', enabled: true, required: true, type: 'text', placeholder: '简述处置过程' },
    ],
    attachments: [
      {
        id: 'att-001',
        name: '涉案嫌疑车辆智能研判轨迹与卡口抓拍清单.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadedAt: '2026-09-01 08:32:00',
        uploadedBy: '支队指挥中心情报研判专班',
      },
      {
        id: 'att-002',
        name: '套牌嫌疑车辆特征对比照片组.zip',
        size: '5.8 MB',
        type: 'application/zip',
        uploadedAt: '2026-09-01 08:34:00',
        uploadedBy: '支队指挥中心',
      }
    ],
    vehicles: [
      {
        id: 'v-01',
        plateNo: '浙A9988G',
        plateType: '小型汽车',
        ownerName: '王*发',
        vehicleModel: '大众迈腾 黑色',
        riskReason: '轨迹异常，疑似假牌套牌，关联3起拒不接受处理记录',
        isIntercepted: true,
        interceptedByUnitId: 'squadron-01-01',
        interceptedByUnitName: '一大队·城东一中队',
        interceptedTime: '2026-09-01 10:15:30',
        disposalRecord: MOCK_THIRD_PARTY_RECORDS[0],
        feedbackRemarks: '城东一中队民警陈勇于凤起路执勤点拦截该车，驾驶人已现场处罚，当事人配合处理。',
        vehicleAuditStatus: 'BRIGADE_PASSED',
        brigadeAuditRemarks: '大队核验无误，文书编号与时间有效，转呈支队终审。',
      },
      {
        id: 'v-02',
        plateNo: '浙A6632B',
        plateType: '大型汽车',
        ownerName: '杭州顺达物流',
        vehicleModel: '东风重型半挂牵引车 红色',
        riskReason: '多次超载、报废隐患未排查',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-01', 'brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-b01',
        taskId: 'task-001',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'DISPATCHED_DOWN',
        signedTime: '2026-09-01 08:40:12',
        signedBy: '李卫民',
        dispatchedDownTime: '2026-09-01 08:45:00',
        dispatchedToSquadronIds: ['squadron-01-01', 'squadron-01-02'],
        vehiclesStatus: [],
      },
      {
        id: 'node-s0101',
        taskId: 'task-001',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'node-b01',
        status: 'FEEDBACK_SUBMITTED',
        signedTime: '2026-09-01 08:48:30',
        signedBy: '陈勇',
        feedbackTime: '2026-09-01 10:20:00',
        feedbackBy: '陈勇',
        feedbackSummary: '已成功拦截浙A9988G，并通过综合应用平台开具现场处罚文书（单号：3301001928374615）。',
        vehiclesStatus: [
          {
            vehicleId: 'v-01',
            plateNo: '浙A9988G',
            plateType: '小型汽车',
            isIntercepted: true,
            disposalRecord: MOCK_THIRD_PARTY_RECORDS[0],
            feedbackRemarks: '路口执勤发现后拦截，经核对证件并当场开具处罚决定书。',
            auditStatus: 'SUBMITTED',
          },
          {
            vehicleId: 'v-02',
            plateNo: '浙A6632B',
            plateType: '大型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ],
        brigadeAudit: {
          auditor: '李卫民 (大队长)',
          auditTime: '2026-09-01 10:35:00',
          result: 'PASS',
          remarks: '大队核验无误，文书编号与时间有效，转呈支队终审。',
        }
      },
      {
        id: 'node-s0102',
        taskId: 'task-001',
        unitId: 'squadron-01-02',
        unitName: '一大队·城西二中队',
        unitLevel: 'squadron',
        parentId: 'node-b01',
        status: 'SIGNED',
        signedTime: '2026-09-01 08:50:00',
        signedBy: '王强',
        vehiclesStatus: [
          {
            vehicleId: 'v-01',
            plateNo: '浙A9988G',
            plateType: '小型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          },
          {
            vehicleId: 'v-02',
            plateNo: '浙A6632B',
            plateType: '大型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ]
      },
      {
        id: 'node-b02',
        taskId: 'task-001',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'SIGNED', // 二大队选择自办，未下发中队
        signedTime: '2026-09-01 08:42:00',
        signedBy: '赵建军',
        vehiclesStatus: [
          {
            vehicleId: 'v-01',
            plateNo: '浙A9988G',
            plateType: '小型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          },
          {
            vehicleId: 'v-02',
            plateNo: '浙A6632B',
            plateType: '大型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ]
      }
    ],
    actionLogs: [
      {
        id: 'log-01',
        timestamp: '2026-09-01 08:35:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发指令至直属一大队、直属二大队，完成规则：任一完成。',
      },
      {
        id: 'log-02',
        timestamp: '2026-09-01 08:40:12',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队签收',
        details: '直属一大队已成功签收指令。',
      },
      {
        id: 'log-03',
        timestamp: '2026-09-01 08:45:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队下发中队',
        details: '直属一大队转派指令至：城东一中队、城西二中队。',
      },
      {
        id: 'log-04',
        timestamp: '2026-09-01 10:20:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队提交反馈',
        details: '已成功拦截车辆【浙A9988G 小型汽车】，关联第三方处罚凭证 3301001928374615。',
      },
      {
        id: 'log-05',
        timestamp: '2026-09-01 10:35:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队审核通过',
        details: '大队已初审通过城东一中队提交的处置凭证，提交支队终审。',
      }
    ]
  },
  {
    id: 'task-002',
    taskNo: 'ZD-20260901-002',
    title: '【高排放/失格排查】重点隐患营运客货运车辆全量清零排查',
    category: '隐患治理',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队长)',
    createdAt: '2026-09-01 07:00:00',
    dispatchTime: '2026-09-01 07:10:00',
    deadline: '2026-09-01 20:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE', // 全部完成
    content: '为确保重点隐患车辆全部受控，清单内所列车辆必须全部完成路面核查与处罚处置。所有被下发大队及中队需对本辖区承担车辆进行逐一闭环排查。',
    targetArea: '全市重点货运物流通道及高速出口',
    feedbackElements: [
      { key: 'third_party_doc', name: '第三方交管处罚凭证/文书号', enabled: true, required: true, type: 'third_party_doc', description: '六合一系统凭证' },
      { key: 'punish_result', name: '处罚结果与强制措施', enabled: true, required: true, type: 'select', options: ['扣留机动车', '现场处罚', '检验排查', '警告教育'] },
      { key: 'location', name: '排查拦截卡点/路段', enabled: true, required: true, type: 'text', placeholder: '请输入具体路段' },
      { key: 'hidden_danger_type', name: '隐患排除与整改结果', enabled: true, required: true, type: 'select', options: ['已消除安全隐患', '已依法扣留车辆', '责令限期检验', '移交运管部门'] },
      { key: 'site_photo', name: '现场核查佐证照片', enabled: true, required: true, type: 'image' },
      { key: 'detail_notes', name: '处置情况与后续说明', enabled: true, required: false, type: 'text' },
    ],
    attachments: [
      {
        id: 'att-003',
        name: '重点营运客货运车辆未年检及逾期未报废底册.xlsx',
        size: '1.2 MB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: '2026-09-01 07:05:00',
        uploadedBy: '支队车辆管理所',
      }
    ],
    vehicles: [
      {
        id: 'v-201',
        plateNo: '浙AD88392',
        plateType: '新能源小车',
        ownerName: '滴滴出行承运商',
        vehicleModel: '比亚迪秦PLUS 白',
        riskReason: '涉嫌非法营运及高频违章未检',
        isIntercepted: true,
        interceptedByUnitId: 'squadron-01-03',
        interceptedByUnitName: '一大队·机动铁骑中队',
        interceptedTime: '2026-09-01 14:20:10',
        disposalRecord: MOCK_THIRD_PARTY_RECORDS[2],
        feedbackRemarks: '铁骑中队民警林峰在湖滨卡口拦截，已处警并录入处罚决定书。',
        vehicleAuditStatus: 'PASSED',
      },
      {
        id: 'v-202',
        plateNo: '浙E33981',
        plateType: '大型汽车',
        ownerName: '湖州安吉长途客运',
        vehicleModel: '宇通客车 金色',
        riskReason: '疲劳驾驶预警，逾期未进行安全技术检验',
        isIntercepted: false,
        vehicleAuditStatus: 'PENDING',
      }
    ],
    targetBrigadeIds: ['brigade-01', 'brigade-03'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-b201',
        taskId: 'task-002',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'DISPATCHED_DOWN',
        signedTime: '2026-09-01 07:20:00',
        signedBy: '李卫民',
        dispatchedDownTime: '2026-09-01 07:30:00',
        dispatchedToSquadronIds: ['squadron-01-03'],
        vehiclesStatus: [],
      },
      {
        id: 'node-s20103',
        taskId: 'task-002',
        unitId: 'squadron-01-03',
        unitName: '一大队·机动铁骑中队',
        unitLevel: 'squadron',
        parentId: 'node-b201',
        status: 'AUDITED_PASS',
        signedTime: '2026-09-01 07:35:00',
        signedBy: '林峰',
        feedbackTime: '2026-09-01 14:25:00',
        feedbackBy: '林峰',
        feedbackSummary: '已拦截浙AD88392，处警文书3301009182736450，初审与终审均已通过。',
        vehiclesStatus: [
          {
            vehicleId: 'v-201',
            plateNo: '浙AD88392',
            plateType: '新能源小车',
            isIntercepted: true,
            disposalRecord: MOCK_THIRD_PARTY_RECORDS[2],
            feedbackRemarks: '已拦截并处理。',
            auditStatus: 'PASSED',
          },
          {
            vehicleId: 'v-202',
            plateNo: '浙E33981',
            plateType: '大型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ],
        brigadeAudit: {
          auditor: '李卫民',
          auditTime: '2026-09-01 14:40:00',
          result: 'PASS',
          remarks: '大队核实无误。',
        },
        branchAudit: {
          auditor: '张志刚',
          auditTime: '2026-09-01 14:55:00',
          result: 'PASS',
          remarks: '支队审核通过。',
        }
      },
      {
        id: 'node-b203',
        taskId: 'task-002',
        unitId: 'brigade-03',
        unitName: '高速公路一大队',
        unitLevel: 'brigade',
        status: 'SIGNED', // 高速大队自办
        signedTime: '2026-09-01 07:25:00',
        signedBy: '吴建宏',
        vehiclesStatus: [
          {
            vehicleId: 'v-201',
            plateNo: '浙AD88392',
            plateType: '新能源小车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          },
          {
            vehicleId: 'v-202',
            plateNo: '浙E33981',
            plateType: '大型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ]
      }
    ],
    actionLogs: [
      {
        id: 'log-201',
        timestamp: '2026-09-01 07:10:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '全部完成模式，派发给直属一大队、高速一大队。',
      },
      {
        id: 'log-202',
        timestamp: '2026-09-01 07:20:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队签收',
        details: '直属一大队签收，后下派给铁骑中队。',
      },
      {
        id: 'log-203',
        timestamp: '2026-09-01 14:55:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '支队审核通过',
        details: '审核通过车辆【浙AD88392】，尚有【浙E33981】未完成处置。',
      }
    ]
  },
  {
    id: 'task-003',
    taskNo: 'DD-20260902-105',
    title: '【大队自发】辖区核心商业街区多次违法未处理高危车精准查处',
    category: '违法查处',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-01',
    creatorUnitName: '直属一大队 (市中心城区)',
    creatorName: '李卫民 (大队长)',
    createdAt: '2026-09-02 09:00:00',
    dispatchTime: '2026-09-02 09:10:00',
    deadline: '2026-09-02 18:00:00',
    urgency: '常规',
    completionRule: 'ANY_COMPLETE',
    content: '直属一大队自发专项指令：对延安路、武林广场商圈频繁违停且关联5起以上非现场违法机动车【浙A8821C】进行巡查拦截。',
    targetArea: '延安路、武林商圈周边支路',
    feedbackElements: [
      { key: 'third_party_doc', name: '六合一/综合应用平台处置凭证文书号', enabled: true, required: true, type: 'third_party_doc', description: '处罚决定书编号' },
      { key: 'punish_result', name: '现场处置结果与行政强制措施', enabled: true, required: true, type: 'select', options: ['现场处罚', '扣留机动车', '警告教育'] },
      { key: 'location', name: '拦截执勤卡点或具体路段', enabled: true, required: true, type: 'text' },
      { key: 'site_photo', name: '现场核查佐证照片', enabled: true, required: true, type: 'image' },
    ],
    vehicles: [
      {
        id: 'v-301',
        plateNo: '浙A8821C',
        plateType: '小型汽车',
        ownerName: '朱*国',
        vehicleModel: '宝马3系 白色',
        riskReason: '违停拒不纠正，累计6起违法未处理',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['squadron-01-01', 'squadron-01-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-s301',
        taskId: 'task-003',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'PENDING_SIGN',
        vehiclesStatus: [
          {
            vehicleId: 'v-301',
            plateNo: '浙A8821C',
            plateType: '小型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ]
      },
      {
        id: 'node-s302',
        taskId: 'task-003',
        unitId: 'squadron-01-02',
        unitName: '一大队·城西二中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'PENDING_SIGN',
        vehiclesStatus: [
          {
            vehicleId: 'v-301',
            plateNo: '浙A8821C',
            plateType: '小型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING',
          }
        ]
      }
    ],
    actionLogs: [
      {
        id: 'log-301',
        timestamp: '2026-09-02 09:10:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队下发指令',
        details: '直属一大队自发指令下达至城东一中队、城西二中队，要求限时完成拦截。',
      }
    ]
  },
  {
    id: 'task-004',
    taskNo: 'ZD-20260903-018',
    title: '【涉案嫌疑】号牌录入存疑重点机动车排查（下级已提退回修改申请）',
    category: '重点管控',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-03 10:00:00',
    dispatchTime: '2026-09-03 10:05:00',
    deadline: '2026-09-03 18:00:00',
    urgency: '紧急',
    completionRule: 'ANY_COMPLETE',
    content: '收到市局反诈中心通报，重点机动车【浙A55829】疑似跨辖区涉案，请直属一大队及下辖城东一中队迅速拦截。',
    targetArea: '环城北路、莫干山路沿线',
    feedbackElements: [
      { key: 'third_party_doc', name: '六合一/综合应用平台处置凭证号', enabled: true, required: true, type: 'third_party_doc' },
      { key: 'punish_result', name: '处置强制措施', enabled: true, required: true, type: 'select', options: ['现场处罚', '扣留机动车', '移交办案'] },
      { key: 'location', name: '拦截执勤卡点', enabled: true, required: true, type: 'text' },
      { key: 'site_photo', name: '查验核实照片', enabled: true, required: true, type: 'image' }
    ],
    vehicles: [
      {
        id: 'v-401',
        plateNo: '浙A55829',
        plateType: '小型汽车',
        ownerName: '周*良',
        vehicleModel: '奥迪A6L 黑色',
        riskReason: '反诈专班关联嫌疑车辆',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    returnRequest: {
      requestedByUnitId: 'squadron-01-01',
      requestedByUnitName: '一大队·城东一中队',
      requestedByName: '陈勇 (034981)',
      requestedTime: '2026-09-03 10:25:30',
      reason: '【非本辖区/车辆已驶离】卡口高清抓拍证实该车已于09:40由中河高架南向北驶入直属三大队辖区，且下发登记的号牌疑似与反诈通报最后一位字母不符，申请退回修改并重新更正派发。',
      status: 'PENDING_CONFIRM'
    },
    executionNodes: [
      {
        id: 'node-b401',
        taskId: 'task-004',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'DISPATCHED_DOWN',
        signedTime: '2026-09-03 10:10:00',
        signedBy: '李卫民',
        dispatchedDownTime: '2026-09-03 10:12:00',
        dispatchedToSquadronIds: ['squadron-01-01'],
        vehiclesStatus: []
      },
      {
        id: 'node-s401',
        taskId: 'task-004',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'node-b401',
        status: 'RETURN_PENDING',
        signedTime: '2026-09-03 10:15:00',
        signedBy: '陈勇',
        vehiclesStatus: [
          {
            vehicleId: 'v-401',
            plateNo: '浙A55829',
            plateType: '小型汽车',
            isIntercepted: false,
            auditStatus: 'PENDING'
          }
        ]
      }
    ],
    actionLogs: [
      {
        id: 'log-401',
        timestamp: '2026-09-03 10:05:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '支队向直属一大队下发【浙A55829】拦截指令。'
      },
      {
        id: 'log-402',
        timestamp: '2026-09-03 10:15:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '节点签收',
        details: '城东一中队执勤民警签收指令。'
      },
      {
        id: 'log-403',
        timestamp: '2026-09-03 10:25:30',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '提起退回修改申请',
        details: '下级提出退单协商：车辆已驶离本辖区，号牌可能存在录入偏差，申请退回修改。'
      }
    ]
  },
  {
    id: 'task-005',
    taskNo: 'ZD-20260902-009',
    title: '【错件撤销存证】原派发直属二大队危化品未报备排查指令（已作废）',
    category: '重点管控',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-02 11:00:00',
    dispatchTime: '2026-09-02 11:05:00',
    deadline: '2026-09-02 16:00:00',
    urgency: '特急',
    completionRule: 'ANY_COMPLETE',
    content: '危化品运输车排查（因派发责任大队选错，且下级未签收，支队已按规定执行错件撤销，工单作废不计考核）。',
    targetArea: '临空物流园区',
    vehicles: [
      {
        id: 'v-501',
        plateNo: '浙B88910',
        plateType: '大型汽车',
        riskReason: '危化品罐车误派',
        isIntercepted: false
      }
    ],
    targetBrigadeIds: ['brigade-02'],
    overallStatus: 'CANCELLED_ERROR',
    cancelRecord: {
      cancelledByUnitId: 'branch-01',
      cancelledByUnitName: '市交警支队指挥中心',
      cancelledByName: '张志刚 (030001)',
      cancelledTime: '2026-09-02 11:15:00',
      reason: '【派发单位错误】该危化品车辆实际申报路线位于跨区高速公路，误选为直属二大队。在下级未签收状态下执行错件撤销作废。'
    },
    executionNodes: [
      {
        id: 'node-b501',
        taskId: 'task-005',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'CANCELLED',
        vehiclesStatus: []
      }
    ],
    actionLogs: [
      {
        id: 'log-501',
        timestamp: '2026-09-02 11:05:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '支队指挥中心误下发至直属二大队。'
      },
      {
        id: 'log-502',
        timestamp: '2026-09-02 11:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '错件撤销（未签收）',
        details: '在下级直属二大队未签收状态下发起错件撤销，工单标记【派件错误 - 已撤销】，剔除有效考核基数。'
      }
    ]
  },
  {
    id: 'task-006',
    taskNo: 'ZD-20260903-022',
    title: '【已退回待更正】校车未年检上路排查指令（上级已确认退回·待修改重发）',
    category: '隐患治理',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-03 08:30:00',
    dispatchTime: '2026-09-03 08:35:00',
    deadline: '2026-09-03 17:00:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '原指令排查校车【浙A1102校】，经直属一大队核实该车所属校区已搬迁至二大队辖区，已协商退回，现处于待更正重发草稿状态。',
    targetArea: '开发区各中小学周边道路',
    vehicles: [
      {
        id: 'v-601',
        plateNo: '浙A1102校',
        plateType: '大型汽车',
        riskReason: '校车逾期未检验',
        isIntercepted: false
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'RETURNED_DRAFT',
    returnRequest: {
      requestedByUnitId: 'brigade-01',
      requestedByUnitName: '直属一大队 (市中心城区)',
      requestedByName: '李卫民 (031001)',
      requestedTime: '2026-09-03 09:00:00',
      reason: '校区已于上月搬迁至二大队辖区，责任单位应变更为直属二大队。',
      status: 'CONFIRMED',
      confirmedBy: '张志刚 (030001)',
      confirmedTime: '2026-09-03 09:15:00',
      confirmRemarks: '同意退回，待指挥中心更正目标大队后重新下发。'
    },
    executionNodes: [],
    actionLogs: [
      {
        id: 'log-601',
        timestamp: '2026-09-03 08:35:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发给直属一大队。'
      },
      {
        id: 'log-602',
        timestamp: '2026-09-03 09:00:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '申请退回修改',
        details: '大队已签收但未核查，提出责任校区已搬迁，申请退回修改。'
      },
      {
        id: 'log-603',
        timestamp: '2026-09-03 09:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '确认退回修改',
        details: '支队确认同意退回，工单返回初始待更正下发状态。'
      }
    ]
  },
  {
    id: 'task-007',
    taskNo: 'ZD-20260904-001',
    title: '早高峰重点路口电动自行车违法集中查处指令',
    category: '违法查处',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-04 07:00:00',
    dispatchTime: '2026-09-04 07:10:00',
    deadline: '2026-09-04 11:30:00',
    urgency: '常规',
    completionRule: 'ANY_COMPLETE',
    content: '针对早高峰非机动车闯红灯、逆行、未佩戴头盔等违法行为开展现场联合执法与文书开具。',
    targetArea: '市中心重点商圈与学校周边主要交叉路口',
    directiveType: 'VEHICLE',
    vehicles: [
      {
        id: 'v-701',
        plateNo: '浙A·E6682',
        plateType: '普通摩托车',
        riskReason: '多次逆行闯红灯未处理',
        isIntercepted: true,
        vehicleAuditStatus: 'REJECTED',
        interceptedTime: '2026-09-04 07:50:00',
        interceptedByUnitId: 'squadron-01-01',
        interceptedByUnitName: '一大队·城东一中队',
        rejectionDept: '直属一大队指挥室',
        rejectionReason: '上传的简易程序处罚决定书编号不清晰，且未附带驾驶人现场核验证件照片，缺少处罚决定书当事人签字页，请执勤民警补齐佐证后重新上报。',
        rejectionTime: '2026-09-04 08:30:00',
        previousFeedback: {
          punishmentCode: '3301062026090401',
          punishmentType: '现场处罚',
          location: '延安路与平海路交叉口执勤卡点',
          disposalTime: '2026-09-04 07:50:00',
          remarks: '早高峰执勤发现当事人逆行且未佩戴安全头盔，已拦停并开具简易处罚文书。',
          policeOfficer: '陈勇 (034981)',
          images: [
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
          ],
        },
        disposalRecord: {
          punishmentCode: '3301062026090401',
          punishmentType: '现场处罚',
          disposalTime: '2026-09-04 07:50:00',
          location: '延安路与平海路交叉口执勤卡点',
          policeOfficer: '陈勇 (034981)',
          notes: '早高峰执勤发现当事人逆行且未佩戴安全头盔，已拦停并开具简易处罚文书。',
          images: [
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
          ],
        },
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-701',
        taskId: 'task-007',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-04 07:25:00',
        signedBy: '李卫民',
        vehiclesStatus: [],
      },
      {
        id: 'node-702',
        taskId: 'task-007',
        parentId: 'node-701',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        status: 'REJECTED',
        signedTime: '2026-09-04 07:30:00',
        signedBy: '陈勇',
        vehiclesStatus: [
          {
            vehicleId: 'v-701',
            plateNo: '浙A·E6682',
            plateType: '普通摩托车',
            isIntercepted: true,
            auditStatus: 'REJECTED',
            rejectionDept: '直属一大队指挥室',
            rejectionReason: '上传的简易程序处罚决定书编号不清晰，且未附带驾驶人现场核验证件照片，缺少处罚决定书当事人签字页，请执勤民警补齐佐证后重新上报。',
            rejectionTime: '2026-09-04 08:30:00',
            feedbackRemarks: '早高峰执勤发现当事人逆行且未佩戴安全头盔，已拦停并开具简易处罚文书。',
          }
        ],
        brigadeAudit: {
          auditor: '李卫民 (大队长)',
          auditTime: '2026-09-04 08:30:00',
          result: 'REJECT',
          remarks: '上传的简易程序处罚决定书编号不清晰，且未附带驾驶人现场核验证件照片，缺少处罚决定书当事人签字页，请执勤民警补齐佐证后重新上报。',
        }
      }
    ],
    actionLogs: [
      {
        id: 'log-701',
        timestamp: '2026-09-04 07:10:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发给直属一大队。'
      }
    ]
  },
  {
    id: 'task-008',
    taskNo: 'ZD-20260904-002',
    title: '高架快速路违规变道与实线压线车辆协查拦截',
    category: '车辆缉查',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-04 08:30:00',
    dispatchTime: '2026-09-04 08:40:00',
    deadline: '2026-09-04 18:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE',
    content: '监控发现该车多次在秋石高架桥恶意变道压实线引发追尾险情，立即布控查处。',
    targetArea: '秋石高架南向北出口匝道',
    vehicles: [
      {
        id: 'v-801',
        plateNo: '浙A·559T2',
        plateType: '小型汽车',
        riskReason: '恶意变道且存在套牌嫌疑',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-01', 'brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-801',
        taskId: 'task-008',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      },
      {
        id: 'node-802',
        taskId: 'task-008',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-801',
        timestamp: '2026-09-04 08:40:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '联合下发给一大队、二大队'
      }
    ]
  },
  {
    id: 'task-009',
    taskNo: 'ZD-20260904-003',
    title: '工业园区大型物流货运车辆超载漏撒专项整治',
    category: '专项整治',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-02',
    creatorUnitName: '直属二大队 (工业园区)',
    creatorName: '赵建军 (大队长)',
    createdAt: '2026-09-04 09:00:00',
    dispatchTime: '2026-09-04 09:15:00',
    deadline: '2026-09-04 22:00:00',
    urgency: '常规',
    completionRule: 'ANY_COMPLETE',
    content: '联合路政部门在园区货运主通道设立固定与流动超载称重点，严查百吨王。',
    targetArea: '物流港一号路与经二路交叉口',
    vehicles: [
      {
        id: 'v-901',
        plateNo: '鲁H·98822挂',
        plateType: '挂车',
        riskReason: '疑似超载 100% 以上',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-901',
        taskId: 'task-009',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-04 09:20:00',
        signedBy: '赵建军',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-901',
        timestamp: '2026-09-04 09:15:00',
        operatorName: '赵建军',
        operatorUnit: '直属二大队',
        action: '指令下发',
        details: '大队自主发起专项整治指令'
      }
    ]
  },
  {
    id: 'task-010',
    taskNo: 'ZD-20260904-004',
    title: '国省道沿线连续下坡事故多发路段警示与隐患排查',
    category: '隐患治理',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-04 10:00:00',
    dispatchTime: '2026-09-04 10:10:00',
    deadline: '2026-09-05 18:00:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '对 104 国道临水临崖路段减速标线模糊、波形护栏受损情况进行现场摸排登记并出具整改建议书。',
    targetArea: '104国道K122+500至K128+200处',
    vehicles: [],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-1001',
        taskId: 'task-010',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-04 10:20:00',
        signedBy: '李卫民',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1001',
        timestamp: '2026-09-04 10:10:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发给直属一大队'
      }
    ]
  },
  {
    id: 'task-011',
    taskNo: 'ZD-20260904-005',
    title: '涉毒失格人员仍驾驶营运客车跨辖区严控查扣',
    category: '重点管控',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-04 11:00:00',
    dispatchTime: '2026-09-04 11:15:00',
    deadline: '2026-09-04 15:00:00',
    urgency: '特急',
    completionRule: 'ALL_COMPLETE',
    content: '公安情报推送驾驶人周某因涉毒被注销机动车驾驶证，仍驾驶营运大巴从事长途客运，存在重特大公共安全隐患。',
    targetArea: '东客运站出城口卡口',
    vehicles: [
      {
        id: 'v-1101',
        plateNo: '浙A·8899K',
        plateType: '大型汽车',
        riskReason: '失格驾驶人员上路',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-1101',
        taskId: 'task-011',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1101',
        timestamp: '2026-09-04 11:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '特急指令下发',
        details: '特急红色指令下发至直属一大队'
      }
    ]
  },
  {
    id: 'task-012',
    taskNo: 'ZD-20260905-001',
    title: '涉嫌假套牌玛莎拉蒂越野车卡口报警查缉指令',
    category: '车辆缉查',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-05 09:30:00',
    dispatchTime: '2026-09-05 09:45:00',
    deadline: '2026-09-05 14:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE',
    content: '卡口系统比对发现该车车牌登记车型与实际通过车型严重不符，请路面巡逻警力注意截停核验。',
    targetArea: '滨江路沿线卡点',
    vehicles: [
      {
        id: 'v-1201',
        plateNo: '京A·88902',
        plateType: '小型汽车',
        riskReason: '车型库比对不一致，涉嫌套牌',
        isIntercepted: true,
        vehicleAuditStatus: 'PASSED',
        interceptedTime: '2026-09-05 11:20:00',
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'COMPLETED',
    executionNodes: [
      {
        id: 'node-1201',
        taskId: 'task-012',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'AUDITED_PASS',
        signedTime: '2026-09-05 09:50:00',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1201',
        timestamp: '2026-09-05 09:45:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发给一大队铁骑中队'
      },
      {
        id: 'log-1202',
        timestamp: '2026-09-05 11:50:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '终审归档',
        details: '文书录入合规，指令办结归档'
      }
    ]
  },
  {
    id: 'task-013',
    taskNo: 'ZD-20260905-002',
    title: '涉嫌非法改装排气扰民“炸街车”夜间布控查处',
    category: '专项整治',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-05 15:00:00',
    dispatchTime: '2026-09-05 15:20:00',
    deadline: '2026-09-05 23:59:00',
    urgency: '常规',
    completionRule: 'ANY_COMPLETE',
    content: '市民热线多次投诉某改装轿车夜间在居民区周边大油门飙车扰民，请机动铁骑部署伏击查扣。',
    targetArea: '文三路及学院路周边',
    vehicles: [
      {
        id: 'v-1301',
        plateNo: '浙A·998GT',
        plateType: '小型汽车',
        riskReason: '非法加装涡轮与直通排气管',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-1301',
        taskId: 'task-013',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-05 15:30:00',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1301',
        timestamp: '2026-09-05 15:20:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发一大队'
      }
    ]
  },
  {
    id: 'task-014',
    taskNo: 'ZD-20260906-001',
    title: '雨雪恶劣天气高架桥梁结冰预警与管控指令',
    category: '重点管控',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 06:00:00',
    dispatchTime: '2026-09-06 06:10:00',
    deadline: '2026-09-06 12:00:00',
    urgency: '特急',
    completionRule: 'ALL_COMPLETE',
    content: '气象台发布寒潮大风黄色预警，气温骤降至零下，各高架桥梁风口易结冰，立即撒盐除冰并控制车速。',
    targetArea: '全市各主干高架桥梁',
    vehicles: [],
    targetBrigadeIds: ['brigade-01', 'brigade-02'],
    overallStatus: 'COMPLETED',
    executionNodes: [
      {
        id: 'node-1401',
        taskId: 'task-014',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'AUDITED_PASS',
        vehiclesStatus: [],
      },
      {
        id: 'node-1402',
        taskId: 'task-014',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'AUDITED_PASS',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1401',
        timestamp: '2026-09-06 06:10:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '特急指令下发',
        details: '全域撒盐除冰调度'
      }
    ]
  },
  {
    id: 'task-015',
    taskNo: 'ZD-20260906-002',
    title: '外省注销重型半挂牵引车上路行驶协查',
    category: '车辆缉查',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 14:00:00',
    dispatchTime: '2026-09-06 14:15:00',
    deadline: '2026-09-06 20:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE',
    content: '公安部交管局下发报废及注销机动车清零专项名单，目标重型货车被系统识别进入开发区物流基地。',
    targetArea: '经五路物流集散中心',
    vehicles: [
      {
        id: 'v-1501',
        plateNo: '鲁Q·67123',
        plateType: '大型汽车',
        riskReason: '已达到强制报废标准逾期未注销',
        isIntercepted: false,
      }
    ],
    targetBrigadeIds: ['brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-1501',
        taskId: 'task-015',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-06 14:25:00',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1501',
        timestamp: '2026-09-06 14:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '指令下发',
        details: '下发直属二大队'
      }
    ]
  },
  {
    id: 'task-016',
    taskNo: 'ZD-20260906-003',
    title: '【综合勤务】国庆假期主要进出城通道道路交通安全综合隐患排查与疏导专项指令',
    directiveType: 'TEXT',
    category: '隐患治理',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 08:30:00',
    dispatchTime: '2026-09-06 08:45:00',
    deadline: '2026-09-06 18:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE',
    content: '国庆长假将至，针对秋石高架、德胜快速路、东客运站枢纽及景区周边重点道路开展道路通行安全隐患拉网式排查。排查重点包括施工围挡合规性、交安设施反光完好率、早晚高峰易拥堵节点警力布设。各责任单位排查后需汇总图文并茂的处置报告上报。',
    targetArea: '秋石高架、德胜快速路互通立交及枢纽周边道路',
    attachments: [
      {
        id: 'att-16-1',
        name: '2026年国庆重点保障路段与交安隐患排查清单及技术指引.pdf',
        size: '3.4 MB',
        type: 'application/pdf',
        uploadedAt: '2026-09-06 08:30:00',
        uploadedBy: '张志刚 (支队指挥长)',
      },
      {
        id: 'att-16-2',
        name: '市区主要进出城通道易拥堵节点警力配置预案示意图.png',
        size: '1.2 MB',
        type: 'image/png',
        uploadedAt: '2026-09-06 08:32:00',
        uploadedBy: '张志刚 (支队指挥长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['brigade-01', 'brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-b1601',
        taskId: 'task-016',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'DISPATCHED_DOWN',
        signedTime: '2026-09-06 09:00:00',
        signedBy: '李卫民',
        dispatchedDownTime: '2026-09-06 09:10:00',
        dispatchedToSquadronIds: ['squadron-01-01'],
        vehiclesStatus: [],
      },
      {
        id: 'node-s1601',
        taskId: 'task-016',
        parentId: 'node-b1601',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        status: 'FEEDBACK_SUBMITTED',
        signedTime: '2026-09-06 09:15:00',
        signedBy: '陈勇',
        feedbackTime: '2026-09-06 14:30:00',
        feedbackOfficer: '陈勇 (034981)',
        feedbackText: '城东一中队已完成辖区秋石高架、德胜快速路互通立交及东站枢纽周边等6处重点施工路段安全隐患现场拉网式排查。排查发现警示反光标识破损2处、临时围挡底座松动1处，已现场下发《隐患限期整改通知书》，督促施工单位当场完成加固与标牌更换；增派早晚高峰铁骑定点巡逻警力4组，设立临时交通疏导点2处，目前道路通行秩序井然。',
        feedbackAttachments: [
          {
            id: 'att-fb-1601',
            name: '秋石高架施工隐患现场加固照片.jpg',
            size: '1.8 MB',
            type: 'image/jpeg',
            uploadedAt: '2026-09-06 14:28:00',
            uploadedBy: '陈勇 (034981)',
            url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'att-fb-1602',
            name: '德胜立交隐患整改告知书签字件.jpg',
            size: '2.1 MB',
            type: 'image/jpeg',
            uploadedAt: '2026-09-06 14:29:00',
            uploadedBy: '陈勇 (034981)',
            url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80',
          },
        ],
        vehiclesStatus: [],
        brigadeAudit: {
          auditor: '李卫民 (大队长)',
          auditTime: '2026-09-06 15:10:00',
          result: 'PASS',
          remarks: '大队核实该中队现场佐证充分，隐患整改及定点勤务落实到位，初审合格，报送市支队终审。',
        }
      },
      {
        id: 'node-b1602',
        taskId: 'task-016',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-06 09:20:00',
        signedBy: '赵建军',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1601',
        timestamp: '2026-09-06 08:45:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '文本指令下发',
        details: '市交警支队向直属一大队、直属二大队下发隐患排查综合勤务文本指令。'
      },
      {
        id: 'log-1602',
        timestamp: '2026-09-06 14:30:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队提交反馈',
        details: '城东一中队录入隐患排查报告并上传2张现场佐证照片，提交大队初审。'
      },
      {
        id: 'log-1603',
        timestamp: '2026-09-06 15:10:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队初审通过',
        details: '直属一大队完成城东一中队处置报告初审，审核结果【合格】，转呈支队终审。'
      }
    ]
  },
  {
    id: 'task-017',
    taskNo: 'DD-20260906-004',
    title: '【专项整治】物流园区周边货车占道装卸及违停综合排查指令（审核驳回·待整改）',
    directiveType: 'TEXT',
    category: '专项整治',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-01',
    creatorUnitName: '直属一大队 (市中心城区)',
    creatorName: '李卫民 (大队长)',
    createdAt: '2026-09-06 10:00:00',
    dispatchTime: '2026-09-06 10:15:00',
    deadline: '2026-09-06 17:30:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '近期群众反映园区周边物流主通道夜间重型车辆占道装卸货物严重阻碍消防通道，请各中队巡查取证，责令整改并依法从严处罚，形成整改汇总清单。',
    targetArea: '物流园主路、仓储大道沿线',
    attachments: [
      {
        id: 'att-17-1',
        name: '市民热线反映物流园区占道违停点位汇编.docx',
        size: '850 KB',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedAt: '2026-09-06 10:00:00',
        uploadedBy: '李卫民 (大队长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['squadron-01-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-s1701',
        taskId: 'task-017',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'REJECTED',
        signedTime: '2026-09-06 10:30:00',
        signedBy: '陈勇',
        feedbackTime: '2026-09-06 11:20:00',
        feedbackOfficer: '陈勇 (034981)',
        feedbackText: '我中队已巡查了物流园外围道路，现场发现3起违章占道装卸行为，执勤人员已口头告知并进行劝离。',
        feedbackAttachments: [
          {
            id: 'att-fb-1701',
            name: '物流园外围巡查违章照片.jpg',
            size: '980 KB',
            type: 'image/jpeg',
            uploadedAt: '2026-09-06 11:18:00',
            uploadedBy: '陈勇 (034981)',
            url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
          }
        ],
        vehiclesStatus: [],
        brigadeAudit: {
          auditor: '李卫民 (大队长)',
          auditTime: '2026-09-06 13:40:00',
          result: 'REJECT',
          remarks: '反馈内容过于简略，缺少具体违停车辆车牌号、现场开具的《违法停车告知单》文书凭证及复查取证照片；请补充详细整治文书及点位整改佐证材料后重新报送。',
        }
      }
    ],
    actionLogs: [
      {
        id: 'log-1701',
        timestamp: '2026-09-06 10:15:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '指令下发',
        details: '大队下发物流园区货车专项整治文本指令至城东一中队。'
      },
      {
        id: 'log-1702',
        timestamp: '2026-09-06 11:20:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '提交初次反馈',
        details: '城东一中队提交口头劝离反馈。'
      },
      {
        id: 'log-1703',
        timestamp: '2026-09-06 13:40:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '初审驳回整改',
        details: '审核驳回，意见：缺少具体车牌登记与执法文书照片，退回中队补充佐证重报。'
      }
    ]
  },
  {
    id: 'task-018',
    taskNo: 'ZD-20260906-005',
    title: '【交通组织】中秋灯会期间景区周边单行循环组织与分流预案实地勘验',
    directiveType: 'TEXT',
    category: '勤务调度',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 09:00:00',
    dispatchTime: '2026-09-06 09:15:00',
    deadline: '2026-09-06 16:00:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '为保障中秋大型民俗灯会期间景区周边道路畅通，各中队对景区周边南山路、杨公堤及北山街单向循环微循环组织线路进行实地步行勘验，核实交通诱导标牌清晰度、应急掉头车道开口位置及备用停车场饱和度，并形成勘验文字反馈与现场实景图片。',
    targetArea: '西湖景区环湖主支干道',
    attachments: [
      {
        id: 'att-18-1',
        name: '中秋灯会期间环湖微循环交通管制与诱导组织总图.pdf',
        size: '4.8 MB',
        type: 'application/pdf',
        uploadedAt: '2026-09-06 09:00:00',
        uploadedBy: '张志刚 (支队指挥长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-s1801',
        taskId: 'task-018',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'SIGNED',
        signedTime: '2026-09-06 09:30:00',
        signedBy: '陈勇',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1801',
        timestamp: '2026-09-06 09:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '文本指令下发',
        details: '下发单向循环组织勘验文本指令。'
      },
      {
        id: 'log-1802',
        timestamp: '2026-09-06 09:30:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队签收指令',
        details: '城东一中队已签收，正在安排民警现场勘验。'
      }
    ]
  },
  {
    id: 'task-019',
    taskNo: 'DD-20260906-006',
    title: '【护学安保】秋季开学季重点中小学幼儿园周边“护学岗”勤务与交通标志标线排查指令（中队待签收）',
    directiveType: 'TEXT',
    category: '勤务调度',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-01',
    creatorUnitName: '直属一大队 (市中心城区)',
    creatorName: '李卫民 (大队长)',
    createdAt: '2026-09-06 11:00:00',
    dispatchTime: '2026-09-06 11:10:00',
    deadline: '2026-09-06 18:00:00',
    urgency: '紧急',
    completionRule: 'ALL_COMPLETE',
    content: '秋季开学在即，请城东一中队、机动铁骑中队于开学前对辖区实验小学、第二中学及周边幼儿园门前交通标志标线、减速带、防冲撞隔离设施开展全面安全体检，落实早晚“高峰护学岗”执勤警力编组，确保学生出入平安。排查情况请形成文字报告并附整改照片上传大队。',
    targetArea: '城区各重点中小学及幼儿园周边道路',
    attachments: [
      {
        id: 'att-19-1',
        name: '2026年秋季重点中小学校园护学岗点位表及勤务规范.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadedAt: '2026-09-06 11:00:00',
        uploadedBy: '李卫民 (大队长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['squadron-01-01', 'squadron-01-03'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-s1901',
        taskId: 'task-019',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      },
      {
        id: 'node-s1902',
        taskId: 'task-019',
        unitId: 'squadron-01-03',
        unitName: '一大队·机动铁骑中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-1901',
        timestamp: '2026-09-06 11:10:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队指令下发',
        details: '直属一大队下发秋季开学季护学岗文本指令至辖区城东一中队、机动铁骑中队，等待中队签收。'
      }
    ]
  },
  {
    id: 'task-020',
    taskNo: 'DD-20260906-007',
    title: '【隐患整治】国省道沿线平交路口减速震荡标线磨损及视距遮挡隐患专项整治指令（待大队初审）',
    directiveType: 'TEXT',
    category: '隐患治理',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-01',
    creatorUnitName: '直属一大队 (市中心城区)',
    creatorName: '李卫民 (大队长)',
    createdAt: '2026-09-06 08:30:00',
    dispatchTime: '2026-09-06 08:45:00',
    deadline: '2026-09-06 17:00:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '国省道沿线平交路口为交通事故多发区域。城东一中队对辖区平交路口视线盲区、震荡标线磨损情况进行拉网式摸排，形成整改汇总台账送大队初审。',
    targetArea: 'G320国道、S101省道平交路口',
    attachments: [
      {
        id: 'att-20-1',
        name: '国省道平交路口安全设施摸排工作指引.doc',
        size: '1.1 MB',
        type: 'application/msword',
        uploadedAt: '2026-09-06 08:30:00',
        uploadedBy: '李卫民 (大队长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['squadron-01-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-s2001',
        taskId: 'task-020',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'FEEDBACK_SUBMITTED',
        signedTime: '2026-09-06 09:00:00',
        signedBy: '陈勇',
        feedbackTime: '2026-09-06 14:15:00',
        feedbackOfficer: '陈勇 (034981)',
        feedbackText: '我中队已完成辖区G320国道平交路口全覆盖实地排查，共摸排路口6处，发现减速震荡标线磨损2处、绿化灌木视线遮挡隐患1处。已现场开具《隐患整改移交建议函》送达公路事业发展中心，并加装临时警示爆闪灯2组。整改台账与现场隐患整改前后对比照片已上传，请大队予以初审。',
        feedbackAttachments: [
          {
            id: 'att-fb-2001',
            name: '平交路口减速标线与视距隐患整改台账.xlsx',
            size: '420 KB',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            uploadedAt: '2026-09-06 14:10:00',
            uploadedBy: '陈勇 (034981)',
          },
          {
            id: 'att-fb-2002',
            name: '平交路口绿化视线遮挡现场照片.jpg',
            size: '2.4 MB',
            type: 'image/jpeg',
            uploadedAt: '2026-09-06 14:12:00',
            uploadedBy: '陈勇 (034981)',
            url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
          }
        ],
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-2001',
        timestamp: '2026-09-06 08:45:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队指令下发',
        details: '下发平交路口视距遮挡隐患排查文本指令。'
      },
      {
        id: 'log-2002',
        timestamp: '2026-09-06 09:00:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队签收指令',
        details: '城东一中队陈勇已签收，开始组织实地摸排。'
      },
      {
        id: 'log-2003',
        timestamp: '2026-09-06 14:15:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队提交反馈',
        details: '城东一中队完成实地排查，录入反馈报告并上传2份佐证凭证，等待直属一大队初审。'
      }
    ]
  },
  {
    id: 'task-021',
    taskNo: 'ZD-20260906-008',
    title: '【安全监管】危险化学品道路运输重点源头企业动态监控与充装合规性联合检查指令（待大队签收/转派）',
    directiveType: 'TEXT',
    category: '重点管控',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 10:30:00',
    dispatchTime: '2026-09-06 10:45:00',
    deadline: '2026-09-06 18:30:00',
    urgency: '特急',
    completionRule: 'ALL_COMPLETE',
    content: '市支队联合交通应急部门开展危化品运输企业安全督导专项行动。各大队对辖区危化品运输企业GPS动态监控制度落实、危化品罐车电子运单填报及罐体检验合格有效性进行突击上门检查，并对驾驶人及押运员开展安全警示教育，排查记录与整改情况统一报送支队。',
    targetArea: '全市危化品仓储与运输企业',
    attachments: [
      {
        id: 'att-21-1',
        name: '危化品道路运输企业源头动态监管联合检查操作要点.pdf',
        size: '3.6 MB',
        type: 'application/pdf',
        uploadedAt: '2026-09-06 10:30:00',
        uploadedBy: '张志刚 (支队指挥长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['brigade-01', 'brigade-02'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-b2101',
        taskId: 'task-021',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      },
      {
        id: 'node-b2102',
        taskId: 'task-021',
        unitId: 'brigade-02',
        unitName: '直属二大队 (工业园区)',
        unitLevel: 'brigade',
        status: 'PENDING_SIGN',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-2101',
        timestamp: '2026-09-06 10:45:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '支队文本指令下发',
        details: '市交警支队指挥中心向直属一大队、直属二大队下发危化品重点源头企业联合检查文本指令。'
      }
    ]
  },
  {
    id: 'task-022',
    taskNo: 'ZD-20260906-009',
    title: '【重要勤务】高级别重要政要过境车队城区骨干过境通道一级交通安保实地踏勘指令（大队自办直办）',
    directiveType: 'TEXT',
    category: '专项整治',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-06 08:00:00',
    dispatchTime: '2026-09-06 08:15:00',
    deadline: '2026-09-06 16:30:00',
    urgency: '特急',
    completionRule: 'ALL_COMPLETE',
    content: '重要政要车队拟于近期过境本市，请直属一大队大队长带班组织大队专班对过境快速路主线及关键立交匝道进行实地步行踏勘，重点核查应急掉头缺口、视频盲区分布、信号绿波带保障方案及备用分流线路，由大队综合科直接编制踏勘文字报告并回传支队指挥中心。',
    targetArea: '中河高架、复兴立交、江南大道过境段',
    attachments: [
      {
        id: 'att-22-1',
        name: '一级交通安保骨干通道踏勘要素检查表.docx',
        size: '1.5 MB',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedAt: '2026-09-06 08:00:00',
        uploadedBy: '张志刚 (支队指挥长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'PROCESSING',
    executionNodes: [
      {
        id: 'node-b2201',
        taskId: 'task-022',
        unitId: 'brigade-01',
        unitName: '直属一大队 (市中心城区)',
        unitLevel: 'brigade',
        status: 'SIGNED',
        signedTime: '2026-09-06 08:30:00',
        signedBy: '李卫民 (大队长)',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-2201',
        timestamp: '2026-09-06 08:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '支队指令下发',
        details: '市交警支队下发重要政要过境车队通道安保踏勘指令至直属一大队。'
      },
      {
        id: 'log-2202',
        timestamp: '2026-09-06 08:30:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队签收自办',
        details: '直属一大队李卫民已签收，大队专班自办执行，正在组织沿线实地踏勘。'
      }
    ]
  },
  {
    id: 'task-023',
    taskNo: 'DD-20260906-010',
    title: '【错件退回】高新科技产业园区施工临时通道占道开挖交通疏导核验指令（中队退单·待大队审批）',
    directiveType: 'TEXT',
    category: '隐患治理',
    creatorLevel: 'brigade',
    creatorUnitId: 'brigade-01',
    creatorUnitName: '直属一大队 (市中心城区)',
    creatorName: '李卫民 (大队长)',
    createdAt: '2026-09-06 09:30:00',
    dispatchTime: '2026-09-06 09:45:00',
    deadline: '2026-09-06 17:00:00',
    urgency: '常规',
    completionRule: 'ALL_COMPLETE',
    content: '请城东一中队对高新科技产业园区施工占道开挖手续及夜间反光警示围挡设置情况进行核实，督促落实高峰疏导警力。',
    targetArea: '高新技术产业园区临时道路',
    attachments: [
      {
        id: 'att-23-1',
        name: '涉路占道施工审批登记表.pdf',
        size: '890 KB',
        type: 'application/pdf',
        uploadedAt: '2026-09-06 09:30:00',
        uploadedBy: '李卫民 (大队长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['squadron-01-01'],
    overallStatus: 'PROCESSING',
    returnRequest: {
      status: 'PENDING_CONFIRM',
      requestedByUnitId: 'squadron-01-01',
      requestedByUnitName: '一大队·城东一中队',
      requestedByName: '陈勇 (中队长)',
      requestedTime: '2026-09-06 11:30:00',
      reason: '【非本辖区】经执勤民警现场查勘，该施工临时通道开挖位置位于江南大道与东信路南侧，属于滨江开发区大队管界，超出城东一中队管辖红线，特申请退单改派。'
    },
    executionNodes: [
      {
        id: 'node-s2301',
        taskId: 'task-023',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'SIGNED',
        signedTime: '2026-09-06 10:00:00',
        signedBy: '陈勇',
        vehiclesStatus: [],
      }
    ],
    actionLogs: [
      {
        id: 'log-2301',
        timestamp: '2026-09-06 09:45:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队指令下发',
        details: '下发高新园区施工通道核查指令至城东一中队。'
      },
      {
        id: 'log-2302',
        timestamp: '2026-09-06 10:00:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队签收指令',
        details: '城东一中队已签收。'
      },
      {
        id: 'log-2303',
        timestamp: '2026-09-06 11:30:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队发起退单申请',
        details: '现场查勘核实施工点位于二大队辖区，提起错件退回申请，等待直属一大队李卫民审批。'
      }
    ]
  },
  {
    id: 'task-024',
    taskNo: 'ZD-20260906-011',
    title: '【闭环办结】极端强降雨期间易积水下穿隧道及低洼涵洞安全隐患排查整治指令（全流程已结案）',
    directiveType: 'TEXT',
    category: '隐患治理',
    creatorLevel: 'branch',
    creatorUnitId: 'branch-01',
    creatorUnitName: '市交警支队指挥中心',
    creatorName: '张志刚 (支队指挥长)',
    createdAt: '2026-09-05 08:00:00',
    dispatchTime: '2026-09-05 08:15:00',
    deadline: '2026-09-05 18:00:00',
    urgency: '特急',
    completionRule: 'ALL_COMPLETE',
    content: '气象预警显示近期有特大暴雨，请直属一大队组织中队对辖区所有下穿隧道、低洼立交桥下积水点开展逐点拉网式排查，备足应急抽水泵、警示标志与防汛沙袋，确保汛期极端天气下不发生车辆被淹死伤事故。',
    targetArea: '秋涛路下穿隧道、复兴立交桥下低洼处',
    attachments: [
      {
        id: 'att-24-1',
        name: '全市易积水道路与立交桥下穿涵洞重点部位清册.xlsx',
        size: '1.9 MB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: '2026-09-05 08:00:00',
        uploadedBy: '张志刚 (支队指挥长)',
      }
    ],
    vehicles: [],
    targetBrigadeIds: ['brigade-01'],
    overallStatus: 'COMPLETED',
    executionNodes: [
      {
        id: 'node-s2401',
        taskId: 'task-024',
        unitId: 'squadron-01-01',
        unitName: '一大队·城东一中队',
        unitLevel: 'squadron',
        parentId: 'brigade-01',
        status: 'AUDITED_PASS',
        signedTime: '2026-09-05 08:30:00',
        signedBy: '陈勇',
        feedbackTime: '2026-09-05 11:30:00',
        feedbackOfficer: '陈勇 (034981)',
        feedbackText: '中队对辖区秋涛南路下穿隧道、复兴立交桥下低洼涵洞等3处易涝隐患点进行了拉网式排查。已联合市政排水部门完成泵站试运行，备齐防汛沙袋80袋、挡水板4组，设置“积水警戒线”警示标牌3面。排查整治落实到位。',
        feedbackAttachments: [
          {
            id: 'att-fb-2401',
            name: '下穿隧道积水标尺与警示标牌安装照片.jpg',
            size: '1.5 MB',
            type: 'image/jpeg',
            uploadedAt: '2026-09-05 11:28:00',
            uploadedBy: '陈勇 (034981)',
            url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
          }
        ],
        vehiclesStatus: [],
        brigadeAudit: {
          auditor: '李卫民 (大队长)',
          auditorName: '李卫民 (大队长)',
          auditTime: '2026-09-05 14:00:00',
          result: 'PASS',
          remarks: '大队核实该中队现场佐证充分，防汛排涝应急物资准备到位，初审合格。',
          opinion: '大队核实该中队现场佐证充分，防汛排涝应急物资准备到位，初审合格。'
        },
        branchAudit: {
          auditor: '张志刚 (支队指挥长)',
          auditorName: '张志刚 (支队指挥长)',
          auditTime: '2026-09-05 15:30:00',
          result: 'PASS',
          remarks: '支队指挥中心终审核验通过，防汛隐患整改闭环，准予办结归档。',
          opinion: '支队指挥中心终审核验通过，防汛隐患整改闭环，准予办结归档。'
        }
      }
    ],
    actionLogs: [
      {
        id: 'log-2401',
        timestamp: '2026-09-05 08:15:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '支队指令下发',
        details: '市交警支队下发易积水点排查文本指令至直属一大队。'
      },
      {
        id: 'log-2402',
        timestamp: '2026-09-05 08:30:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队签收指令',
        details: '城东一中队已签收，组织民警现场巡查。'
      },
      {
        id: 'log-2403',
        timestamp: '2026-09-05 11:30:00',
        operatorName: '陈勇',
        operatorUnit: '一大队·城东一中队',
        action: '中队提交反馈',
        details: '城东一中队录入易积水点防汛应急排查报告并上传佐证材料。'
      },
      {
        id: 'log-2404',
        timestamp: '2026-09-05 14:00:00',
        operatorName: '李卫民',
        operatorUnit: '直属一大队',
        action: '大队初审通过',
        details: '直属一大队李卫民完成初审，审核结论【通过】，报送市支队终审。'
      },
      {
        id: 'log-2405',
        timestamp: '2026-09-05 15:30:00',
        operatorName: '张志刚',
        operatorUnit: '市交警支队指挥中心',
        action: '支队终审通过',
        details: '市交警支队指挥中心张志刚终审核验通过，准予办结归档。'
      },
      {
        id: 'log-2406',
        timestamp: '2026-09-05 15:31:00',
        operatorName: '系统',
        operatorUnit: '调度系统核心',
        action: '全单自动闭环',
        details: '全单各节点终审通过，指令全流程办结归档。'
      }
    ]
  }
];

export const INITIAL_SYSTEM_NOTICES: SystemNotice[] = [
  // ================= 大队角色通知 (直属一大队 brigade-01) =================
  {
    id: 'notice-dd-05',
    type: 'SQUADRON_RETURN_REQUEST',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-005',
    taskNo: 'ZD-20260902-005',
    taskTitle: '【专项整治】涉酒涉毒机动车重点布控与查扣拦截',
    title: '中队错件申请退单待大队审批',
    content: '文晖中队就指令【ZD-20260902-005】提交错件退回申请，理由：【非本辖区】车辆常驻地与行驶卡口均属直属三大队。请大队指挥员及时审批退单。',
    urgency: '特急',
    timestamp: '5分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'RETURN_CONFIRM',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-dd-06',
    type: 'SQUADRON_FEEDBACK_SUBMITTED',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-001',
    taskNo: 'ZD-20260901-001',
    taskTitle: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    title: '中队提交处置凭证待大队初审',
    content: '武林中队执勤民警已对指令目标车辆【浙A6632B】完成路面拦截与现场处罚（强制措施凭证：33010319882910），现提交大队初审报送。',
    urgency: '紧急',
    timestamp: '8分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'BRIGADE_AUDIT',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-dd-01',
    type: 'DISPATCH_NEW',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-008',
    taskNo: 'ZD-20260904-002',
    taskTitle: '高架快速路违规变道与实线压线车辆协查拦截',
    title: '支队新下发重点车辆指令待大队签收',
    content: '市交警支队向直属一大队派发高架变道抓拍协查指令，涉及 1 辆嫌疑车【浙A·559T2】，请在时限内核验并在线签收。',
    urgency: '紧急',
    timestamp: '10分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'PENDING_SIGN',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-dd-02',
    type: 'AUDIT_REJECTED',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-001',
    taskNo: 'ZD-20260901-001',
    taskTitle: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    title: '支队终审驳回车辆反馈通知',
    content: '市交警支队对直属一大队反馈的车辆【浙A6632B】处置凭证予以驳回：未达到指令明确的强制排查处置标准，请重新补充查验材料后补报。',
    urgency: '特急',
    timestamp: '25分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'PENDING_FEEDBACK',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-dd-03',
    type: 'RETURN_APPROVED',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-006',
    taskNo: 'ZD-20260903-022',
    taskTitle: '【已退回待更正】校车未年检上路排查指令',
    title: '大队申请回退支队已核准通过',
    content: '直属一大队就指令【ZD-20260903-022】提出的退回修改申请已获市交警支队确认同意，本大队执行待办与时效考核已自动撤销解除。',
    urgency: '常规',
    timestamp: '1小时前',
    isRead: false,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },
  {
    id: 'notice-dd-04',
    type: 'UPPER_DIRECT_RETURN',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-001',
    taskNo: 'ZD-20260901-001',
    taskTitle: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    title: '支队发令上级主动退回修改通知',
    content: '市交警支队在已签收状态下对指令发起召回退回更正，直属一大队各节点执行待办已由系统自动撤销，不计入考核及超时时效。',
    urgency: '特急',
    timestamp: '2小时前',
    isRead: false,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },
  {
    id: 'notice-dd-07',
    type: 'TASK_CANCELLED',
    targetUnitId: 'brigade-01',
    targetUnitName: '直属一大队 (市中心城区)',
    targetLevel: 'brigade',
    taskId: 'task-005',
    taskNo: 'ZD-20260902-009',
    taskTitle: '【错件撤销存证】原派发危化品未报备排查指令',
    title: '支队发令上级已执行错件撤销',
    content: '市交警支队已按规定将指令【ZD-20260902-009】执行错件作废撤销（派发责任单位有误），工单已终止，大队无需继续处置。',
    urgency: '特急',
    timestamp: '昨天 15:30',
    isRead: true,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },

  // ================= 中队角色通知 (城东一中队 squadron-01-01) =================
  {
    id: 'notice-zd-01',
    type: 'DISPATCH_NEW',
    targetUnitId: 'squadron-01-01',
    targetUnitName: '一大队·城东一中队',
    targetLevel: 'squadron',
    taskId: 'task-003',
    taskNo: 'DD-20260902-105',
    taskTitle: '【大队自发】辖区核心商业街区多次违法未处理高危车精准查处',
    title: '大队下发重点车辆查处指令待签收',
    content: '直属一大队向城东一中队转派下发指令【DD-20260902-105】，涉及嫌疑车辆【浙A8821C】，请执勤警力立即签收并组织路面拦截。',
    urgency: '常规',
    timestamp: '5分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'PENDING_SIGN',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-zd-02',
    type: 'AUDIT_REJECTED',
    targetUnitId: 'squadron-01-01',
    targetUnitName: '一大队·城东一中队',
    targetLevel: 'squadron',
    taskId: 'task-001',
    taskNo: 'ZD-20260901-001',
    taskTitle: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    title: '上级初审驳回车辆反馈待整改',
    content: '直属一大队初审驳回了城东一中队提交的车辆【浙A9988G】处置凭证：现场查验证明缺少当事人签字确认照片，请在待办中补齐重报。',
    urgency: '特急',
    timestamp: '18分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionTab: 'REJECTED_FIX',
    actionType: 'GOTO_TODO',
  },
  {
    id: 'notice-zd-03',
    type: 'RETURN_APPROVED',
    targetUnitId: 'squadron-01-01',
    targetUnitName: '一大队·城东一中队',
    targetLevel: 'squadron',
    taskId: 'task-004',
    taskNo: 'ZD-20260903-018',
    taskTitle: '【涉案嫌疑】号牌录入存疑重点机动车排查',
    title: '中队申请回退上级已核准通过',
    content: '城东一中队就指令【ZD-20260903-018】提起的非本辖区退回申请已被上级指挥长核准同意，中队待办与考核时效已成功解除。',
    urgency: '紧急',
    timestamp: '40分钟前',
    isRead: false,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },
  {
    id: 'notice-zd-04',
    type: 'UPPER_DIRECT_RETURN',
    targetUnitId: 'squadron-01-01',
    targetUnitName: '一大队·城东一中队',
    targetLevel: 'squadron',
    taskId: 'task-001',
    taskNo: 'ZD-20260901-001',
    taskTitle: '【专项缉查】涉嫌伪造变造号牌高危嫌疑车辆路面查缉',
    title: '支队/大队主动退回修改召回通知',
    content: '发令上级在下级已签收状态下对指令发起召回更正，中队路面执勤待办已自动撤销清除，无需继续开展路面核验。',
    urgency: '特急',
    timestamp: '1小时前',
    isRead: false,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },
  {
    id: 'notice-zd-05',
    type: 'TASK_CANCELLED',
    targetUnitId: 'squadron-01-01',
    targetUnitName: '一大队·城东一中队',
    targetLevel: 'squadron',
    taskId: 'task-005',
    taskNo: 'ZD-20260902-009',
    taskTitle: '【错件撤销存证】原派发危化品未报备排查指令',
    title: '支队/大队已撤销该指令通知',
    content: '发令上级已撤销作废该错误下发的危化品指令，中队无需出警或布控拦截。',
    urgency: '特急',
    timestamp: '昨天 16:00',
    isRead: true,
    isDismissedFromToast: false,
    actionType: 'VIEW_TASK',
  },
];

