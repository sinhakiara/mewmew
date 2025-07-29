import React from 'react';
import { Workflow } from './WorkflowEditor';
import { Button } from '@/components/ui/button';
import { Play, Square, Save, FolderOpen, Wifi, WifiOff } from 'lucide-react';

interface WorkflowToolbarProps {
  workflow: Workflow;
  onExecute: () => void;
  onSave: () => void;
  onLoad: (workflowId: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflow,
  onExecute,
  onSave,
  onLoad,
  connectionStatus
}) => {
  const isRunning = workflow.status === 'running';

  return (
    <div className="workflow-toolbar">
      <Button
        onClick={onExecute}
        disabled={isRunning || workflow.nodes.length === 0}
        size="sm"
        className="gap-2"
      >
        {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isRunning ? 'Stop' : 'Execute'}
      </Button>

      <Button
        onClick={onSave}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save
      </Button>

      <Button
        onClick={() => onLoad('workflow-1')}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        Load
      </Button>

      <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded bg-muted text-sm">
        {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-600" />}
        {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-600" />}
        {connectionStatus === 'connecting' && <Wifi className="w-4 h-4 text-yellow-600 animate-pulse" />}
        WebSocket: {connectionStatus}
      </div>

      <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded bg-muted text-sm">
        Status: {workflow.status}
      </div>

      <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded bg-muted text-sm">
        Nodes: {workflow.nodes.length}
      </div>
    </div>
  );
};
