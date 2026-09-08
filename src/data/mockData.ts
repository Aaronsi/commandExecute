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
    vehicles: [
      {
        id: 'v-701',
        plateNo: '浙A·E6682',
        plateType: '普通摩托车',
        riskReason: '多次逆行闯红灯未处理',
        isIntercepted: false,
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
        status: 'SIGNED',
        signedTime: '2026-09-04 07:30:00',
        signedBy: '陈勇',
        vehiclesStatus: [],
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
    id: 'notice-dd-05',
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

