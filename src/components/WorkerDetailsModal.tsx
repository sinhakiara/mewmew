import React from 'react';
import { X, Monitor, CheckCircle, XCircle } from 'lucide-react';

interface Worker {
  id: string;
  is_active: boolean;
  worker_nodename?: string;
  worker_os?: string;
  worker_arch?: string;
  worker_kernel?: string;
  worker_publicip?: string;
  registered_at?: string;
}

interface WorkerDetailsModalProps {
  isOpen: boolean;
  worker: Worker | null;
  closeModal: () => void;
}

const WorkerDetailsModal: React.FC<WorkerDetailsModalProps> = ({ isOpen, worker, closeModal }) => {
  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Worker Details</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status</h3>
              <div className="flex items-center gap-2">
                {worker.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`px-3 py-1 text-sm rounded-full ${
                  worker.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {worker.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Worker ID</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
                {worker.id}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Node Name</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {worker.worker_nodename || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Operating System</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {worker.worker_os || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Architecture</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {worker.worker_arch || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Kernel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {worker.worker_kernel || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Public IP</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {worker.worker_publicip || 'Not available'}
                </p>
              </div>
              
              {worker.registered_at && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Registered At</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(worker.registered_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">About Workers</h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Workers are remote agents that execute tasks submitted to the platform. 
                They automatically register with the master node and report their status regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDetailsModal;
