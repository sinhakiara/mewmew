import React from 'react';
import { X, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Task {
  task_id: string;
  command: string;
  status: string;
  output: string;
  created_at: string;
  queue?: string;
  worker_id?: string | null;
}

interface TaskDetailsModalProps {
  isOpen: boolean;
  task: Task | null;
  closeModal: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, task, closeModal }) => {
  if (!isOpen || !task) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Details</h2>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Task ID</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
                {task.task_id}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Command</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
                {task.command}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Created At</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
              
              {task.worker_id && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Worker ID</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {task.worker_id.substring(0, 8)}...
                  </p>
                </div>
              )}
              
              {task.queue && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Queue</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {task.queue}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Output</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                {task.output ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                    {task.output}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No output available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
