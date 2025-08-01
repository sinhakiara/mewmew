import React from 'react';
import { Book, ExternalLink } from 'lucide-react';

const ApiDocsSection: React.FC = () => {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/workers',
      description: 'Get all registered workers',
      response: 'Returns worker details and status'
    },
    {
      method: 'POST',
      path: '/tasks',
      description: 'Submit a new task',
      body: '{ "command": "string" }',
      response: 'Returns task ID and assigned worker'
    },
    {
      method: 'GET',
      path: '/api/tasks',
      description: 'Get all tasks',
      response: 'Returns list of tasks with status and output'
    },
    {
      method: 'GET',
      path: '/tasks/{task_id}',
      description: 'Get specific task details',
      response: 'Returns detailed task information'
    },
    {
      method: 'DELETE',
      path: '/workers/{worker_id}',
      description: 'Remove a worker',
      response: 'Confirmation of worker removal'
    },
    {
      method: 'GET',
      path: '/api/logs',
      description: 'Get system logs',
      response: 'Returns recent log entries'
    },
    {
      method: 'GET',
      path: '/api/masternode',
      description: 'Get master node information',
      response: 'Returns master node details'
    },
    {
      method: 'POST',
      path: '/api/login',
      description: 'Authenticate user',
      body: '{ "username": "string", "password": "string" }',
      response: 'Returns access token and user details'
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Book className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h2>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Base URL</h3>
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
          {window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://192.168.29.20:8000'}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Endpoints</h3>
        </div>
        
        <div className="divide-y dark:divide-gray-700">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {endpoint.path}
                </code>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3">{endpoint.description}</p>
              
              {endpoint.body && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Request Body:</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
                    {endpoint.body}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Response:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Authentication</h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Most endpoints require authentication. Include the Bearer token in the Authorization header:
        </p>
        <div className="bg-blue-100 dark:bg-blue-800 rounded p-3 font-mono text-sm mt-2">
          Authorization: Bearer &lt;your-token&gt;
        </div>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">WebSocket</h3>
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          Real-time logs are available via WebSocket connection:
        </p>
        <div className="bg-yellow-100 dark:bg-yellow-800 rounded p-3 font-mono text-sm mt-2">
          {window.location.hostname === 'localhost' ? 'ws://localhost:5000' : 'wss://192.168.29.20:8000'}/ws/logs?token=&lt;your-token&gt;
        </div>
      </div>
    </div>
  );
};

export default ApiDocsSection;
