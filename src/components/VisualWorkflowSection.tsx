import React from 'react';
import WorkflowEditor from './WorkflowEditor';

interface VisualWorkflowSectionProps {
  connectionStatus: string;
}

const VisualWorkflowSection: React.FC<VisualWorkflowSectionProps> = ({ connectionStatus }) => {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full">
        <WorkflowEditor />
      </div>
    </div>
  );
};

export default VisualWorkflowSection;
