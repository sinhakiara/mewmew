//import React from 'react';
import React, { useEffect, useRef } from 'react';
import { Workflow, Node } from './WorkflowEditor';
import { ExecutionContext } from '../engine/types/WorkflowTypes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

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
  onViewNodeOutput?: (nodeId: string) => void;
  taskPolling?: any;
  executionContext?: ExecutionContext | null;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  workflow,
  logs,
  selectedNode,
  onUpdateNodeConfig,
  onClearLogs,
  onViewNodeOutput,
  taskPolling,
  executionContext
}) => {
  const selectedNodeData = selectedNode ? workflow.nodes.find(n => n.id === selectedNode) : null;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (scrollAreaRef.current && logs.length > 0) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'pending':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⚪';
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
	{workflow.nodes.map(node => {
            // Get real-time status from execution context if available
            const nodeOutput = executionContext?.nodeOutputs[node.id];
            const isCompleted = executionContext?.completedNodes.has(node.id);
            const isFailed = executionContext?.failedNodes.has(node.id);
            const isRunning = executionContext?.currentNodes.has(node.id);

            let realTimeStatus = node.status;
            if (isFailed) realTimeStatus = 'failed';
            else if (isCompleted) realTimeStatus = 'success';
            else if (isRunning) realTimeStatus = 'running';

            const hasOutput = nodeOutput?.data || node.outputs;

            return (
              <div key={node.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getNodeStatusIcon(realTimeStatus)}</span>
                  <span className="truncate">{node.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasOutput && onViewNodeOutput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewNodeOutput(node.id)}
                      className="h-6 w-6 p-0"
                      title="View output"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                  <Badge variant={getStatusBadgeVariant(realTimeStatus)} className="text-xs">
                    {realTimeStatus}
                  </Badge>
                </div>
              </div>
            );
          })}
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
	    {/* Show real-time output from execution context or node data */}
            {(() => {
              const nodeOutput = executionContext?.nodeOutputs[selectedNodeData.id];
              const outputData = nodeOutput?.data || selectedNodeData.outputs;

              if (outputData) {
                return (
                  <>
                    <div><strong>Outputs:</strong></div>
                    <div className="ml-2 text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                      {JSON.stringify(outputData, null, 2)}
                    </div>
                  </>
                );
              }

              return null;
            })()}

            {/* Show execution error if any */}
            {(() => {
              const nodeOutput = executionContext?.nodeOutputs[selectedNodeData.id];
              if (nodeOutput?.error) {
                return (
                  <>
                    <div><strong>Error:</strong></div>
                    <div className="ml-2 text-xs font-mono bg-destructive/10 text-destructive p-2 rounded">
                      {nodeOutput.error}
                    </div>
                  </>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      <div className="execution-header">
        Real-time Logs
      </div>
     <div className="relative">
        <ScrollArea ref={scrollAreaRef} className="execution-logs h-64">
	{(() => {
            // Combine execution context logs with WebSocket logs
            const contextLogs = executionContext?.logs || [];
            const allLogs = [
              ...logs,
              ...contextLogs.map(log => ({
                id: log.id,
                timestamp: new Date(log.timestamp).toISOString(),
                level: log.level as 'info' | 'success' | 'warning' | 'error',
                message: log.message,
                workerId: log.nodeId
              }))
            ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (allLogs.length === 0) {
              return (
                <div className="text-center text-muted-foreground py-8">
                  No logs yet. Execute a workflow to see real-time updates.
                </div>
              );
            }

            return (
              <div className="space-y-1">
                {allLogs.slice(-50).map(log => (
                  <div key={log.id} className={`log-entry ${log.level}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs">{getLogIcon(log.level)}</span>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          {log.workerId && ` • Node: ${log.workerId.slice(0, 8)}`}
                        </div>
                        <div className="text-sm">{log.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </ScrollArea>
        {(logs.length > 0 || (executionContext?.logs.length || 0) > 0) && (
          <div className="auto-scroll-indicator visible">
            Auto-scroll enabled
          </div>
        )}
      </div>

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
