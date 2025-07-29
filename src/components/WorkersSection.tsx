import React from 'react';

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
}

const WorkersSection: React.FC<WorkersSectionProps> = ({ workers, showWorkerDetails, removeWorker }) => {
    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Workers</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 p-4">Worker List</h3>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="p-3">Worker ID</th>
                            <th className="p-3">Nodename</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map((worker) => (
                            <tr key={worker.id} className="border-t text-sm hover:bg-gray-50">
                                <td className="p-3 font-mono">{worker.id.substring(0, 8)}...</td>
                                <td className="p-3">{worker.worker_nodename || '-'}</td>
                                <td className={`p-3 worker-status-${worker.is_active ? 'active' : 'inactive'}`}>
                                    {worker.is_active ? 'Active' : 'Inactive'}
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => showWorkerDetails(worker.id)}
                                        className="text-indigo-600 hover:text-indigo-800 mr-2"
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                    <button
                                        onClick={() => removeWorker(worker.id, worker.worker_nodename || worker.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorkersSection;
