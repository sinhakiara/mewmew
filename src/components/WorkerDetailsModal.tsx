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

interface WorkerDetailsModalProps {
    isOpen: boolean;
    worker: Worker | null;
    closeModal: () => void;
}

const WorkerDetailsModal: React.FC<WorkerDetailsModalProps> = ({ isOpen, worker, closeModal }) => {
    if (!isOpen || !worker) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm modal-overlay">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Worker Details</h3>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Worker ID</h4>
                        <p className="font-mono text-sm break-all text-gray-800">{worker.id}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                        <p className={`inline-block px-2 py-1 rounded-full text-xs worker-status-${worker.is_active ? 'active' : 'inactive'}`}>
                            {worker.is_active ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Nodename</h4>
                        <p className="text-sm text-gray-800">{worker.worker_nodename || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">OS</h4>
                        <p className="text-sm text-gray-800">{worker.worker_os || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Architecture</h4>
                        <p className="text-sm text-gray-800">{worker.worker_arch || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Kernel</h4>
                        <p className="text-sm text-gray-800">{worker.worker_kernel || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Public IP</h4>
                        <p className="text-sm text-gray-800">{worker.worker_publicip || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Registered At</h4>
                        <p className="text-sm text-gray-800">{worker.registered_at ? new Date(worker.registered_at).toLocaleString() : '-'}</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition shadow"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkerDetailsModal;
