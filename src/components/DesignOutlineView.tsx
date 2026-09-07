import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, GitBranch, AlertTriangle, FileText, 
  Search, ArrowRight, Layers, Eye, Users, RefreshCw, Cpu, 
  Workflow, CheckSquare, Clock, Smartphone, Monitor, ChevronRight,
  RotateCcw, Undo2, BarChart3, HelpCircle, FileCheck, Sparkles, Filter
} from 'lucide-react';

export const DesignOutlineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'pages' | 'workflow' | 'error_correction' | 'verification' | 'stats_qa'>('architecture');

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 text-slate-800">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>公安交管要素平台 · 三级指挥调度令闭环设计大纲 (升级规范版)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            交警支队—大队—中队三级指令下发、路面查缉核验与全闭环管理系统大纲
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-4xl leading-relaxed">
            全面适配交警垂直指挥架构（1 ➔ N ➔ M），无缝覆盖
            <span className="text-amber-700 font-semibold mx-1">【任一完成/全部完成】</span>双收敛规则、
            <span className="text-emerald-700 font-semibold mx-1">“车牌号码+号牌种类”唯一车源</span>、
            <span className="text-indigo-700 font-semibold mx-1">第三方交管六合一系统凭证调证与时间戳硬核验</span>、
            <span className="text-rose-700 font-semibold mx-1">错派件三阶段退回纠错</span>，以及
            <span className="text-cyan-700 font-semibold mx-1">支队/大队/中队穿透式效能与处罚率统计</span>。
          </p>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'architecture', label: '1. 业务架构与模型设计', icon: Layers },
          { id: 'pages', label: '2. 8大系统菜单与核心交互矩阵', icon: Monitor },
          { id: 'workflow', label: '3. 三级流转与双通道拓扑', icon: GitBranch },
          { id: 'error_correction', label: '4. 错件退回/撤回与纠错机制', icon: Undo2 },
          { id: 'verification', label: '5. 车辆查验与凭证高亮核对', icon: CheckSquare },
          { id: 'stats_qa', label: '6. 穿透统计与业务答疑指南', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-blue-700">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">1 ➔ N ➔ M 组织拓扑</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                支队下发至 N 个大队。各大队拥有<strong>“自办处理”</strong>或<strong>“二次下发至 M 个中队”</strong>的自治决策权；大队亦可自主创建下发至中队的指令。
              </p>
              <div className="text-[11px] bg-slate-50 p-2.5 rounded-md border border-slate-200 text-slate-600 space-y-1">
                <div>• <strong className="text-slate-800">支队级 (一级)</strong>：宏观调度、跨区指派、终审裁决、全域报表</div>
                <div>• <strong className="text-slate-800">大队级 (二级)</strong>：承上启下、自办/分发、初审复核、自主发件</div>
                <div>• <strong className="text-slate-800">中队级 (三级)</strong>：路面执勤、拦截核证、单车反馈、整改重报</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-amber-700">
                <GitBranch className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">双收敛模式判定算法</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                创建时指定收敛规则，由系统底层状态机自动评估叶子节点处置完成度：
              </p>
              <div className="text-[11px] bg-slate-50 p-2.5 rounded-md border border-slate-200 text-slate-700 space-y-1.5">
                <div><span className="text-amber-700 font-bold">① 任一完成 (OR)</span>：任一大队或任一中队对所有目标车辆完成处置并审核通过，全单完结。</div>
                <div><span className="text-blue-700 font-bold">② 全部完成 (AND)</span>：所有自办大队 + 所有被下发中队全部完成车辆处置且审核通过。</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">部门级权限与协同</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                遵循公安勤务“部门级授权”规范，同部门警员可无缝流转协同：
              </p>
              <div className="text-[11px] bg-slate-50 p-2.5 rounded-md border border-slate-200 text-slate-700 space-y-1">
                <div>• <strong className="text-slate-800">部门通签通办</strong>：部门下任何值班人员均可签收/反馈/审核。</div>
                <div>• <strong className="text-slate-800">草稿共享提醒</strong>：部门内草稿全局可见，进入时提醒保留或彻底清除。</div>
              </div>
            </div>
          </div>

          {/* Core Architecture Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              交警三级指令闭环状态机流转模型
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="p-3">流程阶段</th>
                    <th className="p-3">支队 ➔ 大队自办流 (Branch ➔ Brigade)</th>
                    <th className="p-3">支队 ➔ 大队 ➔ 中队三级流 (Branch ➔ Brigade ➔ Squadron)</th>
                    <th className="p-3">大队自主发中队流 (Brigade ➔ Squadron)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-blue-700">1. 创建与下发</td>
                    <td className="p-3">支队创建 ➔ 选择责任大队 ➔ 正式下发</td>
                    <td className="p-3">支队创建 ➔ 派发大队 ➔ 大队签收后转派下属中队</td>
                    <td className="p-3">大队指综室创建 ➔ 勾选下属中队 ➔ 派发</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-amber-700">2. 签收与下发</td>
                    <td className="p-3">大队指挥室签收 ➔ 锁定自办责任</td>
                    <td className="p-3">大队签收 ➔ 转派中队 ➔ 中队值班室签收</td>
                    <td className="p-3">中队值班室/路面警员签收</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-purple-700">3. 拦截与查验</td>
                    <td className="p-3">大队警力拦截 ➔ 单车拉取第三方处置凭证 (T≥下发时间)</td>
                    <td className="p-3">中队路面拦截 ➔ 单车拉取第三方处置凭证 (T≥下发时间)</td>
                    <td className="p-3">中队路面拦截 ➔ 单车拉取第三方处置凭证</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-cyan-700">4. 审核与裁定</td>
                    <td className="p-3">大队提交反馈 ➔ 支队审核 ➔ 完结/驳回</td>
                    <td className="p-3">中队提交反馈 ➔ 大队初审 ➔ 支队终审 ➔ 完结</td>
                    <td className="p-3">中队提交反馈 ➔ 大队终审 ➔ 完结/驳回</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-rose-700">5. 驳回与整改</td>
                    <td className="p-3">支队驳回 ➔ 大队重新拦截/补充凭证 ➔ 再次提交</td>
                    <td className="p-3">大队或支队驳回 ➔ 回退中队限时整改 ➔ 重新提交</td>
                    <td className="p-3">大队驳回 ➔ 中队整改后重新提交</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pages & Functions */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="text-sm text-slate-700 font-medium">
            作为公安交管实战子系统，划分为 <span className="text-blue-700 font-bold">6 大核心功能页面</span>，职责分明、流程无断点：
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Page 1 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  页面 1 (控制台)
                </span>
                <span className="text-[11px] text-slate-500">全警种通用门户</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">指挥调度工作台与状态看板 (Command Dashboard)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                全景展示待办与在办指令。按“待签收、处置中、待审核、被驳回、已完结”划分，支持多维度过滤。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">红黄蓝预警池</strong>：超时未签收、超期未反馈动态警示并计入履职考核。</li>
                <li><strong className="text-slate-800">快捷操作列</strong>：一键签收、下发转派、发起退回、催办督导。</li>
                <li><strong className="text-slate-800">规则徽标</strong>：清晰标明【任一完成】或【全部完成】收敛模式。</li>
              </ul>
            </div>

            {/* Page 2 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  页面 2 (新建/下发)
                </span>
                <span className="text-[11px] text-slate-500">支队 / 大队指综部门</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">指令编制与车辆编组向导 (Dispatch Wizard)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                规范化指令录入向导，杜绝传统表格缺漏与格式混乱。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">标准化要素</strong>：调度类别（车辆查缉/违法查处/自定义）、主题、特急/紧急/普通、时限（7天/30天/自定义）。</li>
                <li><strong className="text-slate-800">目标车辆导入</strong>：强制校验“号牌号码+号牌种类”复合主键。</li>
                <li><strong className="text-slate-800">责任单位多选树</strong>：支队多选大队，大队多选中队；支持保存部门共享草稿。</li>
              </ul>
            </div>

            {/* Page 3 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  页面 3 (全息档案)
                </span>
                <span className="text-[11px] text-slate-500">三级穿透监控</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">三级流转拓扑与车辆处置矩阵 (Topology & Matrix)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                直观展示 1 ➔ N ➔ M 组织树与每辆目标车在各单位的拦截反馈进度。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">组织树状态节点</strong>：实时标明自办大队与转派中队节点的签收/反馈状态。</li>
                <li><strong className="text-slate-800">单车流转卡片</strong>：每辆车显示拦截单位、民警、处罚决定书编号及审核状态。</li>
                <li><strong className="text-slate-800">全生命周期轨迹</strong>：包含派发、签收、拦截、初审、终审、驳回等审计日志。</li>
              </ul>
            </div>

            {/* Page 4 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  页面 4 (路面查缉)
                </span>
                <span className="text-[11px] text-slate-500">大队 / 中队执勤民警</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">车辆拦截与第三方系统证据查验台 (Interception Studio)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                一线民警拦截反馈核心界面，集成公安交管六合一/综合应用平台接口。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">一键调取处罚文书</strong>：通过车牌+种类自动拉取最新路面处罚/扣留凭证。</li>
                <li><strong className="text-slate-800">时间倒挂硬阻断</strong>：处置时间早于下发时间直接标红拦截，确保证据链合规。</li>
                <li><strong className="text-slate-800">多条违法高亮选择</strong>：若有多起记录，明确选定本次执勤生成的具体文书。</li>
              </ul>
            </div>

            {/* Page 5 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  页面 5 (联审复核)
                </span>
                <span className="text-[11px] text-slate-500">大队初审 / 支队终审</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">多级联审与精准凭证核验中心 (Multi-tier Audit Hub)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                支撑大队初审与支队终审的双重质量管控。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">反馈文书精准高亮</strong>：多条违法记录并存时，系统自动高亮标出下级反馈选定的那一条。</li>
                <li><strong className="text-slate-800">双向判定</strong>：审核通过（进入下一级或完结归档）/ 予以驳回（填写结构化原因）。</li>
              </ul>
            </div>

            {/* Page 6 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  页面 6 (统计考核)
                </span>
                <span className="text-[11px] text-slate-500">领导决策 / 督察考核</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">全流程穿透效能与查处分析驾驶舱 (Analytics Cockpit)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                全域考核指标统计，彻底替代传统人工表格汇总。
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">多级穿透统计</strong>：支队看各大队，点击大队穿透展开下属中队明细。</li>
                <li><strong className="text-slate-800">违法查处专项分析</strong>：统计查处数、处罚数、处罚率及违法类别分布。</li>
                <li><strong className="text-slate-800">一键 Excel 导出</strong>：支持日/周/月/季/年度考核报表导出。</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Workflow */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              三级流转流程图与双通道流向 (支队 ➔ 大队 ➔ 中队)
            </h3>

            {/* Visual Flow 1 */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>通道一：支队 ➔ 大队自办闭环</span>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">大队不转派中队，自行拦截并反馈</span>
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-white border border-slate-200 text-blue-700 px-2.5 py-1 rounded font-medium shadow-xs">① 支队创建指令</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-indigo-700 px-2.5 py-1 rounded font-medium shadow-xs">② 大队签收 (自办)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-amber-700 px-2.5 py-1 rounded font-medium shadow-xs">③ 拦截车并查验第三方文书</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-purple-700 px-2.5 py-1 rounded font-medium shadow-xs">④ 大队单车提交反馈</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-cyan-700 px-2.5 py-1 rounded font-medium shadow-xs">⑤ 支队审核</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded font-bold">⑥ 完结 (驳回则退回④)</span>
              </div>
            </div>

            {/* Visual Flow 2 */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>通道二：支队 ➔ 大队 ➔ 中队三级闭环</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">大队转派中队，经历中队反馈 ➔ 大队初审 ➔ 支队终审</span>
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-white border border-slate-200 text-blue-700 px-2.5 py-1 rounded font-medium shadow-xs">① 支队下发大队</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-indigo-700 px-2.5 py-1 rounded font-medium shadow-xs">② 大队签收并下发中队</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium shadow-xs">③ 中队签收</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-amber-700 px-2.5 py-1 rounded font-medium shadow-xs">④ 中队拦截+核验证据</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-purple-700 px-2.5 py-1 rounded font-medium shadow-xs">⑤ 中队反馈</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-cyan-700 px-2.5 py-1 rounded font-medium shadow-xs">⑥ 大队初审</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-white border border-slate-200 text-blue-700 px-2.5 py-1 rounded font-medium shadow-xs">⑦ 支队终审</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded font-bold">⑧ 完结</span>
              </div>
              <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-md">
                ⚠️ <strong>驳回流转规则</strong>：大队初审驳回直接退回中队；若大队初审通过但支队终审驳回，退回至中队重新办理，同时通知大队。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Error Correction Lifecycle */}
      {activeTab === 'error_correction' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center space-x-2 text-rose-700">
              <Undo2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                派错件“退回 / 撤回 / 协商纠错”全生命周期规范
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              解决人工派错责任单位、指令内容失误或重复发件痛点，覆盖指令流转全生命周期的三个阶段：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Stage 1 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">阶段一：未签收状态</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">即发即撤</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  下级单位<strong>尚未签收</strong>时，上级调度员发现派错，可直接执行<strong>“错件撤回 / 作废”</strong>。
                </p>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
                  <div>• 工单状态变更为：<code className="text-rose-700 font-bold">派件错误-已撤回</code></div>
                  <div>• 不纳入有效工单与考核统计</div>
                  <div>• 系统完整留存撤回人与时间日志</div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">阶段二：已签收未反馈</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">协商退回</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  下级已签收但<strong>未提交路面反馈</strong>。支持双向退单协商：
                </p>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
                  <div>• <strong>上级主动退单</strong>：直接退回并附原因说明</div>
                  <div>• <strong>下级申请退回</strong>：下级发起“错派申请退单”，上级确认后退回草稿箱修改重发</div>
                </div>
              </div>

              {/* Stage 3 (Answering user question) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">阶段三：已反馈流转中</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">业务答疑核心</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>问：如果大队或中队已签收并提交了反馈，还能继续申请退回吗？</strong>
                </p>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
                  <div>• <strong className="text-indigo-700">待审核期间</strong>：下级可发起<strong>“撤回反馈”</strong>（撤回至待反馈状态修改凭证重新提交）；</div>
                  <div>• <strong className="text-rose-700">上级审核阶段</strong>：上级可通过<strong>“驳回整改”</strong>或<strong>“作废错件”</strong>将工单打回；</div>
                  <div>• <strong className="text-emerald-700">终审办结后</strong>：全单已归档，不可随意退回，确需纠错须走特批撤销流程。</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Verification & Rules */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule 1: Plate Number + Plate Type */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                车牌号码 + 车牌种类 唯一主键识别
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                在公安交管标准中，同一号牌可能并存于<strong>【小型汽车（蓝牌）】</strong>、<strong>【大型汽车（黄牌）】</strong>、<strong>【新能源车（绿牌）】</strong>中。
              </p>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 text-xs">
                <div className="text-blue-700 font-mono font-semibold">
                  VehicleKey = SHA256(plate_number.trim().toUpperCase() + "_" + plate_type)
                </div>
                <div className="text-slate-500 text-[11px]">
                  导入、派发、查验、归档全流程均以此复合主键锁定目标车辆，杜绝同号牌不同车种串台。
                </div>
              </div>
            </div>

            {/* Rule 2: Multi-violation Highlight Matching */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-600" />
                多条违法处置记录主动高亮匹配
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                针对问答亮点：当车辆在路面有多条查处记录（如一大队处置生成文书1，二大队又处置生成文书2）：
              </p>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 text-xs">
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>审核端自动锁定并高亮反馈凭证</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  审核员在审核一大队反馈时，系统在多条六合一记录中<strong>精准高亮高亮标出文书1</strong>，审核官一眼即知下级提交的具体证据，防止审错。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Stats & QA */}
      {activeTab === 'stats_qa' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              全流程多维穿透统计与业务答疑闭环
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Stats Dimension */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>穿透式效能与查处分析报表</span>
                </h4>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>支队 ➔ 大队 ➔ 中队穿透</strong>：支队查看各大队宏观指标，点击大队自动展开下属各中队履职排行。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>违法与处罚专项</strong>：违法类别分布、查处数、处罚数、处罚率及撤控率统计。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>多时段筛选与导出</strong>：支持日、周、月、季度、年度及自定义时间段一键导出 Excel 考核台账。</span>
                  </li>
                </ul>
              </div>

              {/* QA Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>关键业务规则答疑备忘</span>
                </h4>
                <div className="text-xs space-y-2 text-slate-600">
                  <div><strong>Q1：大队下发给中队后，大队自己还需要反馈吗？</strong><br /><span className="text-slate-500">A：无需。转派中队后由中队负责路面查缉与反馈，大队承担初审复核职责。</span></div>
                  <div><strong>Q2：已签收并反馈的工单还能退回吗？</strong><br /><span className="text-slate-500">A：审核前可撤回反馈；审核中由上级驳回打回；归档后不可直接退回。</span></div>
                  <div><strong>Q3：草稿是否全员共享？</strong><br /><span className="text-slate-500">A：同部门警员共享草稿箱，进入时提示继续保留或彻底移除。</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
