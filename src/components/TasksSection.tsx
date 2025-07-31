import React, { useState } from 'react';

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

const TasksSection: React.FC<TasksSectionProps> = ({ tasks, submitTask, showTaskDetails, showAiSuggestModal }) => {
    const [command, setCommand] = useState<string>('');

    const handleSubmit = () => {
        submitTask(command, () => setCommand(''));
    };

    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Submit New Task</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter command (e.g., ping google.com)"
                    />
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow"
                    >
                        Submit
                    </button>
                    <button
                        onClick={showAiSuggestModal}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition shadow"
                    >
                        <i className="fas fa-wand-magic-sparkles mr-2"></i>
                        AI Suggest
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 p-4">Task List</h3>
                <table className="w-full"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase"><th className="p-3">Task ID</th><th className="p-3">Command</th><th className="p-3">Status</th><th className="p-3">Created At</th><th className="p-3">Worker ID</th></tr></thead><tbody>{tasks.map((task) => (<tr key={task.task_id} className="border-t text-sm hover:bg-gray-50 cursor-pointer" onClick={() => showTaskDetails(task.task_id)}><td className="p-3 font-mono">{task.task_id.substring(0, 8)}...</td><td className="p-3 font-mono">{task.command.substring(0, 20)}...</td><td className={`p-3 task-status-${task.status}`}>{task.status}</td><td className="p-3">{new Date(task.created_at).toLocaleString()}</td><td className="p-3 font-mono">{task.worker_id ? task.worker_id.substring(0, 12) + '...' : 'Not assigned'}</td></tr>))}</tbody></table>
            </div>
        </div>
    );
};

export default TasksSection;
