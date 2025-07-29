import React from 'react';

interface Task {
    task_id: string;
    command: string;
    status: string;
    output: string;
    created_at: string;
    queue?: string;
}

interface TaskDetailsModalProps {
    isOpen: boolean;
    task: Task | null;
    closeModal: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, task, closeModal }) => {
    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm modal-overlay">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Task ID</h4>
                        <p className="font-mono text-sm break-all text-gray-800">{task.task_id}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                        <p className={`inline-block px-2 py-1 rounded-full text-xs task-status-${task.status}`}>
                            {task.status}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Created At</h4>
                        <p className="text-sm text-gray-800">{new Date(task.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Queue</h4>
                        <p className="text-sm text-gray-800">{task.queue || 'default'}</p>
                    </div>
                </div>
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Command</h4>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-gray-800 overflow-x-auto">
                        {task.command}
                    </div>
                </div>
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Output</h4>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-gray-800 overflow-x-auto">
                        {task.output || 'No output available'}
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

export default TaskDetailsModal;
