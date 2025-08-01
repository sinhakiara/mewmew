import React from 'react';
import WorkflowEditor from './WorkflowEditor';

interface VisualWorkflowSectionProps {
  connectionStatus: string;
}

const VisualWorkflowSection: React.FC<VisualWorkflowSectionProps> = ({ connectionStatus }) => {
	  // Get authentication token from localStorage (passed from parent App)
  const token = localStorage.getItem('dheeraj_token') || '';
  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://192.168.29.20:8000';
  const wsUrl = window.location.hostname === 'localhost' ? 'ws://localhost:8000' : 'wss://192.168.29.20:8000';

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full">
	<WorkflowEditor 
          authToken={token}
          apiBaseUrl={baseUrl}
          wsUrl={`${wsUrl}/ws/logs?token=${token}`}
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  );
};

export default VisualWorkflowSection;
