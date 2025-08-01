import React, { useState } from 'react';
import { Play, Plus, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Task {
  task_id: string;
  command: string;
  status: string;
  output: string;
  created_at: string;
  queue?: string;
  worker_id?: string | null;
}

interface TasksSectionProps {
  tasks: Task[];
  submitTask: (command: string, resetCommand: () => void) => void;
  showTaskDetails: (taskId: string) => void;
  showAiSuggestModal: () => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ 
  tasks, 
  submitTask, 
  showTaskDetails, 
  showAiSuggestModal 
}) => {
  const [newCommand, setNewCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommand.trim()) {
      submitTask(newCommand, () => setNewCommand(''));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
        <button
          onClick={showAiSuggestModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          AI Suggestions
        </button>
      </div>
      
      {/* New Task Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submit New Task</h3>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Submit
          </button>
        </form>
      </div>
      
      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task History</h3>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.task_id}
                onClick={() => showTaskDetails(task.task_id)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.command}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>ID: {task.task_id.substring(0, 8)}...</span>
                      <span>{new Date(task.created_at).toLocaleString()}</span>
                      {task.worker_id && <span>Worker: {task.worker_id.substring(0, 8)}...</span>}
                    </div>
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
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No tasks yet. Submit a command to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksSection;
