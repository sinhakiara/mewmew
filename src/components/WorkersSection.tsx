import React from 'react';
import { apiRequest } from '../App';

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

const WorkersSection: React.FC<WorkersSectionProps> = ({ workers, showWorkerDetails, removeWorker, token }) => {
    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Workers</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 p-4">Worker List</h3>
                <table className="w-full"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase"><th className="p-3">Worker ID</th><th className="p-3">Nodename</th><th className="p-3">Status</th><th className="p-3">Registered At</th><th className="p-3">Actions</th></tr></thead><tbody>{workers.map((worker) => {
                    console.log('Worker data:', worker); // Debug log for registered_at
                    const registeredAt = worker.registered_at && !isNaN(new Date(worker.registered_at).getTime()) 
                        ? new Date(worker.registered_at).toLocaleString() 
                        : 'N/A';
                    return (
                        <tr
                            key={worker.id}
                            className="border-t text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={() => showWorkerDetails(worker.id)}
                        ><td className="p-3 font-mono">{worker.id.substring(0, 8)}...</td><td className="p-3">{worker.worker_nodename || 'N/A'}</td><td className="p-3">{worker.is_active ? 'Active' : 'Inactive'}</td><td className="p-3">{registeredAt}</td><td className="p-3"><button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeWorker(worker.id, worker.worker_nodename || worker.id);
                                }}
                                className="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button></td></tr>
                    );
                })}</tbody></table>
            </div>
        </div>
    );
};

export default WorkersSection;
