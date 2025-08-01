import React from 'react';
import { BarChart3, Users, CheckSquare, Clock } from 'lucide-react';

interface Task {
  task_id: string;
  command: string;
  status: string;
  output: string;
  created_at: string;
  queue?: string;
  worker_id?: string | null;
}

interface Stats {
  activeWorkers: number;
  activeTasks: number;
  completedTasks: number;
}

interface InsightsSectionProps {
  stats: Stats;
  previousStats: Stats;
  tasks: Task[];
  showTaskDetails: (taskId: string) => void;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ stats, previousStats, tasks, showTaskDetails }) => {
  const recentTasks = tasks.slice(-5);

  const StatCard = ({ icon: Icon, title, value, previousValue }: any) => {
    const change = value - previousValue;
    const isPositive = change > 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change !== 0 && (
              <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change} from last update
              </p>
            )}
          </div>
          <Icon className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="Active Workers"
          value={stats.activeWorkers}
          previousValue={previousStats.activeWorkers}
        />
        <StatCard
          icon={Clock}
          title="Active Tasks"
          value={stats.activeTasks}
          previousValue={previousStats.activeTasks}
        />
        <StatCard
          icon={CheckSquare}
          title="Completed Tasks"
          value={stats.completedTasks}
          previousValue={previousStats.completedTasks}
        />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Tasks</h3>
        <div className="space-y-2">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div
                key={task.task_id}
                onClick={() => showTaskDetails(task.task_id)}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {task.command}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(task.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  task.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  task.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {task.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent tasks</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;
