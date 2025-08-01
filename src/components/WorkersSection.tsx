import React from 'react';
import { Users, Monitor, Trash2, Eye } from 'lucide-react';

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

interface WorkersSectionProps {
  workers: Worker[];
  showWorkerDetails: (workerId: string) => void;
  removeWorker: (workerId: string, workerName: string) => void;
  token: string;
}

const WorkersSection: React.FC<WorkersSectionProps> = ({ 
  workers, 
  showWorkerDetails, 
  removeWorker, 
  token 
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workers</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{workers.filter(w => w.is_active).length} active / {workers.length} total</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {workers.length > 0 ? (
          <div className="divide-y dark:divide-gray-700">
            {workers.map((worker) => (
              <div key={worker.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      worker.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {worker.worker_nodename || `Worker ${worker.id.substring(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID: {worker.id.substring(0, 8)}...</span>
                        {worker.worker_os && <span>OS: {worker.worker_os}</span>}
                        {worker.worker_arch && <span>Arch: {worker.worker_arch}</span>}
                        {worker.worker_publicip && <span>IP: {worker.worker_publicip}</span>}
                      </div>
                      {worker.registered_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Registered: {new Date(worker.registered_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      worker.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => showWorkerDetails(worker.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => removeWorker(worker.id, worker.worker_nodename || worker.id)}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No workers registered</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkersSection;
