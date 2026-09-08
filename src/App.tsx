import React, { useState } from 'react';
import { Sidebar, MainNavView } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { BranchHomeView } from './components/BranchHomeView';
import { MyTodoView } from './components/MyTodoView';
import { WorkbenchView } from './components/WorkbenchView';
import { TaskListView } from './components/TaskListView';
import { WarningListView } from './components/WarningListView';
import { StatsDashboard } from './components/StatsDashboard';
import { PunishStatsView } from './components/PunishStatsView';
import { DesignOutlineView } from './components/DesignOutlineView';
import { TaskCreationModal } from './components/TaskCreationModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NotificationToast } from './components/NotificationToast';
import { DispatchTask, UserRoleContext, SystemNotice } from './types';
import { INITIAL_TASKS, INITIAL_SYSTEM_NOTICES } from './data/mockData';

export default function App() {
  const [tasks, setTasks] = useState<DispatchTask[]>(INITIAL_TASKS);
  // Default to workbench or branch_home
  const [activeView, setActiveView] = useState<MainNavView>('branch_home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Real-time System Notices state
  const [systemNotices, setSystemNotices] = useState<SystemNotice[]>(INITIAL_SYSTEM_NOTICES);

  // Current user role context
  const [currentRole, setCurrentRole] = useState<UserRoleContext>({
    unitId: 'branch-01',
    unitName: '市交警支队指挥中心',
    level: 'branch',
    userName: '张志刚 (支队指挥长)',
    policeNo: '030001',
  });

  const [selectedTask, setSelectedTask] = useState<DispatchTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DispatchTask | null>(null);

  // Todo view filter state (for jump from Workbench)
  const [todoFilter, setTodoFilter] = useState<{
    initialTab?: string;
    filterCategory?: string;
    filterUrgency?: string;
  }>({});

  // Handlers for System Notices
  const handleAddNotice = (notice: SystemNotice) => {
    setSystemNotices((prev) => [notice, ...prev]);
  };

  const handleDismissNotice = (noticeId: string) => {
    setSystemNotices((prev) =>
      prev.map((n) => (n.id === noticeId ? { ...n, isDismissedFromToast: true } : n))
    );
  };

  const handleDismissAllForRole = () => {
    setSystemNotices((prev) =>
      prev.map((n) =>
        n.targetUnitId === currentRole.unitId || n.targetLevel === currentRole.level
          ? { ...n, isDismissedFromToast: true }
          : n
      )
    );
  };

  const handleMarkNoticeAsRead = (noticeId: string) => {
    setSystemNotices((prev) =>
      prev.map((n) => (n.id === noticeId ? { ...n, isRead: true } : n))
    );
  };

  // Handlers
  const handleCreateTask = (newTask: DispatchTask) => {
    // If editing/re-dispatching an existing task, update it in place
    const exists = tasks.some((t) => t.id === newTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === newTask.id ? newTask : t)));
    } else {
      setTasks([newTask, ...tasks]);
    }
    setSelectedTask(newTask);
    setEditingTask(null);
  };

  const handleUpdateTask = (updatedTask: DispatchTask) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  const handleReDispatchTask = (task: DispatchTask) => {
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };

  // Jump to Todo from Workbench with presets
  const handleNavigateToTodo = (
    tabKey?: string,
    filter?: { category?: string; urgency?: string }
  ) => {
    setTodoFilter({
      initialTab: tabKey,
      filterCategory: filter?.category,
      filterUrgency: filter?.urgency,
    });
    setActiveView('todo');
  };

  // Compute pending items for current role
  const todoCount = tasks.filter((t) => {
    if (t.overallStatus !== 'PROCESSING') return false;
    const myNode = t.executionNodes.find((n) => n.unitId === currentRole.unitId);
    if (myNode && myNode.status === 'PENDING_SIGN') return true;
    if (myNode && (myNode.status === 'SIGNED' || myNode.status === 'FEEDBACK_SUBMITTED')) {
      if (t.vehicles.some((v) => v.vehicleAuditStatus === 'PENDING' || v.vehicleAuditStatus === 'REJECTED')) {
        return true;
      }
    }
    if (
      t.returnRequest?.status === 'PENDING_CONFIRM' &&
      (t.creatorUnitId === currentRole.unitId || currentRole.level === 'branch')
    ) {
      return true;
    }
    return false;
  }).length;

  const warningCount = 5;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar (Supports expanded Light mode & collapsed Dark Navy mode) */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        todoCount={todoCount}
        taskCount={tasks.length}
        warningCount={warningCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Navigation Bar with Breadcrumb and Tabs */}
        <HeaderBar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          activeView={activeView}
          onViewChange={setActiveView}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenCreateModal={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}
          warningCount={warningCount}
          systemNotices={systemNotices}
          onNavigateToTodo={(tabKey, taskNo) => handleNavigateToTodo(tabKey)}
          onSelectTask={(taskId) => {
            const target = tasks.find((t) => t.id === taskId || t.taskNo === taskId);
            if (target) setSelectedTask(target);
          }}
          onDismissNotice={handleDismissNotice}
          onMarkAsRead={handleMarkNoticeAsRead}
          onDismissAllForRole={handleDismissAllForRole}
        />

        {/* View Router / Content Body (1.支队首页 2.工作台 3.指令管理 4.我的待办 5.指令督办 6.工作量统计 7.违法处罚统计 8.设计大纲与规范) */}
        <main className="flex-1 overflow-y-auto">
          {/* 1. 支队首页 */}
          {activeView === 'branch_home' && (
            <BranchHomeView
              tasks={tasks}
              onSelectTask={setSelectedTask}
              onNavigateToManagement={() => setActiveView('tasks')}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {/* 2. 工作台 (展示各待办指令的统计数、业务类别与紧急程度，支持点击直穿待办) */}
          {activeView === 'workbench' && (
            <WorkbenchView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onNavigateToTodo={handleNavigateToTodo}
              onNavigateToManagement={(filter) => setActiveView('tasks')}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {/* 3. 指令管理 (综合台账、下发、撤销、退单、多维全要素查询) */}
          {activeView === 'tasks' && (
            <TaskListView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
              onUpdateTask={handleUpdateTask}
              onReDispatchTask={handleReDispatchTask}
              onAddNotice={handleAddNotice}
            />
          )}

          {/* 4. 我的待办 (按登录用户权限展示不同待办页签：签收、反馈、审核、退单) */}
          {activeView === 'todo' && (
            <MyTodoView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onUpdateTask={handleUpdateTask}
              onNavigateToManagement={() => setActiveView('tasks')}
              onReDispatchTask={handleReDispatchTask}
              onAddNotice={handleAddNotice}
              initialTab={todoFilter.initialTab}
              filterCategory={todoFilter.filterCategory}
              filterUrgency={todoFilter.filterUrgency}
            />
          )}

          {/* 5. 指令督办 (原指令异常预警) */}
          {activeView === 'warnings' && (
            <WarningListView
              tasks={tasks}
              onSelectTask={setSelectedTask}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {/* 6. 工作量统计 (多周期违法时间筛选、多维条件、大队/中队下钻、Excel导出) */}
          {activeView === 'stats' && (
            <StatsDashboard tasks={tasks} currentRole={currentRole} />
          )}

          {/* 7. 违法处罚统计 (违法时间筛选、违法行为筛选、查处数、处罚数、处罚率、Excel导出) */}
          {activeView === 'punish_stats' && (
            <PunishStatsView tasks={tasks} currentRole={currentRole} />
          )}

          {/* 8. 设计规范与架构大纲 */}
          {activeView === 'outline' && <DesignOutlineView />}
        </main>

        {/* Bottom subtle system watermark */}
        <footer className="border-t border-slate-200 py-3 bg-white text-slate-400 text-center text-[11px] px-6 flex flex-col sm:flex-row items-center justify-between">
          <span>公安交警指令下发与闭环反馈系统 · 市交警支队指挥调度中心</span>
          <span className="font-mono">GA/T 16.7 车辆号牌规范 · 派错纠错与退单重发留痕存证机制已启用</span>
        </footer>
      </div>

      {/* Task Creation Modal */}
      {isCreateModalOpen && (
        <TaskCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTask(null);
          }}
          currentRole={currentRole}
          onCreateTask={handleCreateTask}
          initialTask={editingTask}
          onAddNotice={handleAddNotice}
        />
      )}

      {/* Task 3-Level Detail & Enforcement Feedback Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          currentRole={currentRole}
          onUpdateTask={handleUpdateTask}
          onAddNotice={handleAddNotice}
        />
      )}

      {/* Real-time System Notice Toast Component (Bottom Right) */}
      <NotificationToast
        notices={systemNotices}
        currentRole={currentRole}
        onNavigateToTodo={(tabKey, taskNo) => {
          handleNavigateToTodo(tabKey);
        }}
        onSelectTask={(taskId) => {
          const target = tasks.find((t) => t.id === taskId || t.taskNo === taskId);
          if (target) setSelectedTask(target);
        }}
        onDismissNotice={handleDismissNotice}
        onDismissAllForRole={handleDismissAllForRole}
        onMarkAsRead={handleMarkNoticeAsRead}
      />
    </div>
  );
}
