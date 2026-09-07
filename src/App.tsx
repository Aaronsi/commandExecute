import React, { useState } from 'react';
import { Sidebar, MainNavView } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { BranchHomeView } from './components/BranchHomeView';
import { MyTodoView } from './components/MyTodoView';
import { WorkbenchView } from './components/WorkbenchView';
import { TaskListView } from './components/TaskListView';
import { WarningListView } from './components/WarningListView';
import { StatsDashboard } from './components/StatsDashboard';
import { DesignOutlineView } from './components/DesignOutlineView';
import { TaskCreationModal } from './components/TaskCreationModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { DispatchTask, UserRoleContext } from './types';
import { INITIAL_TASKS } from './data/mockData';

export default function App() {
  const [tasks, setTasks] = useState<DispatchTask[]>(INITIAL_TASKS);
  // Default to tasks (指令管理) or todo (我的待办)
  const [activeView, setActiveView] = useState<MainNavView>('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
        />

        {/* View Router / Content Body */}
        <main className="flex-1 overflow-y-auto">
          {/* 1. 我的待办 (待签收、待反馈、待审核) */}
          {(activeView === 'todo' || activeView === 'workbench') && (
            <MyTodoView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onUpdateTask={handleUpdateTask}
              onNavigateToManagement={() => setActiveView('tasks')}
            />
          )}

          {/* 2. 指令管理 (综合台账、下发、撤销、退单、多维查询) */}
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
            />
          )}

          {/* 3. 支队首页 */}
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

          {/* 4. 指令异常预警 (Warning Center) */}
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

          {/* 5. 工作量统计 (KPI / Stats Dashboard) */}
          {activeView === 'stats' && <StatsDashboard tasks={tasks} />}

          {/* 6. 设计规范与架构大纲 */}
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
        />
      )}
    </div>
  );
}
