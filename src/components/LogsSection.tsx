import React from 'react';
import { Download, Trash2, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

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
  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <AlertCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logs</h2>
        <div className="flex gap-2">
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-time Logs ({logs.length} entries)
          </h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {logs.length > 0 ? (
            <div className="divide-y dark:divide-gray-700">
              {logs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium uppercase ${getLogColor(log.level)}`}>
                          {log.level}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">
                        {log.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No logs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsSection;
