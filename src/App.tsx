import React, { useState } from 'react';
import { Sidebar, MainNavView } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { BranchHomeView } from './components/BranchHomeView';
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
  // Default to branch_home as in Design 1, or easily switchable to workbench as in Design 2
  const [activeView, setActiveView] = useState<MainNavView>('branch_home');
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

  // Handlers
  const handleCreateTask = (newTask: DispatchTask) => {
    setTasks([newTask, ...tasks]);
    setSelectedTask(newTask);
  };

  const handleUpdateTask = (updatedTask: DispatchTask) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  const processingCount = tasks.filter((t) => t.overallStatus === 'PROCESSING').length;
  const warningCount = 5;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar (Supports expanded Light mode & collapsed Dark Navy mode) */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          warningCount={warningCount}
        />

        {/* View Router / Content Body */}
        <main className="flex-1 overflow-y-auto">
          {/* 1. 支队首页 (Design 1) */}
          {activeView === 'branch_home' && (
            <BranchHomeView
              tasks={tasks}
              onSelectTask={setSelectedTask}
              onNavigateToManagement={() => setActiveView('tasks')}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* 2. 工作台 (Design 2) */}
          {activeView === 'workbench' && (
            <WorkbenchView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onNavigateToManagement={() => setActiveView('tasks')}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* 3. 指令管理 (Full Task List & Multi-filter) */}
          {activeView === 'tasks' && (
            <TaskListView
              tasks={tasks}
              currentRole={currentRole}
              onSelectTask={setSelectedTask}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* 4. 指令异常预警 (Warning Center) */}
          {activeView === 'warnings' && (
            <WarningListView
              tasks={tasks}
              onSelectTask={setSelectedTask}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
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
          <span className="font-mono">GA/T 16.7 车辆号牌规范 · 综合应用平台接口联动已就绪</span>
        </footer>
      </div>

      {/* Task Creation Modal */}
      {isCreateModalOpen && (
        <TaskCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          currentRole={currentRole}
          onCreateTask={handleCreateTask}
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
