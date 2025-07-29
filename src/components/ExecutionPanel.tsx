import React from 'react';
import { Workflow, Node } from './WorkflowEditor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  workerId?: string;
}

interface ExecutionPanelProps {
  workflow: Workflow;
  logs: LogEntry[];
  selectedNode: string | null;
  onUpdateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  onClearLogs: () => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  workflow,
  logs,
  selectedNode,
  onUpdateNodeConfig,
  onClearLogs
}) => {
  const selectedNodeData = selectedNode ? workflow.nodes.find(n => n.id === selectedNode) : null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  return (
    <div className="execution-panel">
      <div className="execution-header">
        Execution Panel
      </div>

      {/* Workflow Status */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Workflow Status</span>
          <Badge variant={getStatusBadgeVariant(workflow.status)}>
            {workflow.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {workflow.nodes.length} nodes, {workflow.connections.length} connections
        </div>
      </div>

      {/* Node Status Overview */}
      <div className="p-4 border-b border-border">
        <div className="font-medium mb-2">Node Status</div>
        <div className="space-y-2">
          {workflow.nodes.map(node => (
            <div key={node.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{node.title}</span>
              <Badge variant={getStatusBadgeVariant(node.status)} className="text-xs">
                {node.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNodeData && (
        <div className="p-4 border-b border-border">
          <div className="font-medium mb-2">Selected Node</div>
          <div className="space-y-2 text-sm">
            <div><strong>Type:</strong> {selectedNodeData.type}</div>
            <div><strong>Status:</strong> {selectedNodeData.status}</div>
            <div><strong>Config:</strong></div>
            <div className="ml-2 text-xs font-mono bg-muted p-2 rounded">
              {JSON.stringify(selectedNodeData.config, null, 2)}
            </div>
            {selectedNodeData.outputs && (
              <>
                <div><strong>Outputs:</strong></div>
                <div className="ml-2 text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                  {JSON.stringify(selectedNodeData.outputs, null, 2)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      <div className="execution-header">
        Real-time Logs
      </div>
      <ScrollArea className="execution-logs h-64">
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No logs yet. Execute a workflow to see real-time updates.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.slice(-50).map(log => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xs">{getLogIcon(log.level)}</span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      {log.workerId && ` • Worker: ${log.workerId.slice(0, 8)}`}
                    </div>
                    <div className="text-sm">{log.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClearLogs}
        >
          Clear Logs
        </Button>
      </div>
    </div>
  );
};
