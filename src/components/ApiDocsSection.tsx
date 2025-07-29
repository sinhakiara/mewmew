import React from 'react';

interface Log {
    level: string;
    message: string;
    timestamp: string;
}

interface LogsSectionProps {
    logs: Log[];
    exportLogs: () => void;
    clearLogs: () => void;
}

const LogsSection: React.FC<LogsSectionProps> = ({ logs, exportLogs, clearLogs }) => {
    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Logs</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500">System Logs</h3>
                    <div className="space-x-2">
                        <button
                            onClick={exportLogs}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition shadow"
                        >
                            <i className="fas fa-download mr-2"></i>
                            Export
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow"
                        >
                            <i className="fas fa-trash mr-2"></i>
                            Clear
                        </button>
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Level</th>
                                <th className="p-3">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index} className="border-t text-sm">
                                    <td className="p-3 font-mono">{log.timestamp}</td>
                                    <td className={`p-3 ${log.level === 'error' ? 'text-red-600' : log.level === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                                        {log.level.toUpperCase()}
                                    </td>
                                    <td className="p-3">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogsSection;
