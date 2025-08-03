import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ExecutionPanel } from './ExecutionPanel';
import { NodeOutputModal } from './NodeOutputModal';
import { NodeRemovalDialog } from './NodeRemovalDialog';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowHeader } from './WorkflowHeader';
import { useWorkflowEngine } from '../hooks/useWorkflowEngine';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTaskPolling } from '../hooks/useTaskPolling';
import { useWorkflowFileManager } from './WorkflowFileManager';
import { toast } from 'sonner';

export interface Node {
  id: string;
  type: string;
  title: string;
  category: 'recon' | 'scanning' | 'fuzzing' | 'exploit' | 'logic' | 'data';
  position: { x: number; y: number };
  status: 'idle' | 'pending' | 'running' | 'success' | 'failed';
  config: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  connections: Connection[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface WorkflowEditorProps {
  authToken: string;
  apiBaseUrl: string;
  wsUrl: string;
  connectionStatus: string;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ 
  authToken, 
  apiBaseUrl, 
  wsUrl, 
  connectionStatus: parentConnectionStatus 
}) => {
  // Load workflow from localStorage on mount, or use default
  const [workflow, setWorkflow] = useState<Workflow>(() => {
    const saved = localStorage.getItem('current-workflow');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved workflow:', error);
      }
    }
    return {
      id: 'workflow-1',
      name: 'Security Assessment',
      nodes: [],
      connections: [],
      status: 'idle'
    };
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [executingConnections, setExecutingConnections] = useState<Set<string>>(new Set());
  const [nodeToRemove, setNodeToRemove] = useState<string | null>(null);
  const [outputModalNode, setOutputModalNode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('visual-workflow');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const workflowEngine = useWorkflowEngine({ apiBaseUrl, authToken });
  const { logs, connectionStatus, clearLogs } = useWebSocket(wsUrl);
  const taskPolling = useTaskPolling({ apiBaseUrl, authToken });
  const { saveWorkflowToFile, loadWorkflowFromFile, fileInput } = useWorkflowFileManager({
    onSave: () => {},
    onLoad: (newWorkflow) => setWorkflow(newWorkflow)
  });

  // Add node to workflow
  const addNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    const nodeConfigs = {
      // Discovery nodes
      subfinder: {
        title: 'Subfinder',
        category: 'recon' as const,
        config: { domain: '', threads: 10, timeout: 30 }
      },
      amass: {
        title: 'Amass',
        category: 'recon' as const,
        config: { domain: '', mode: 'passive', timeout: 60 }
      },
      // Analysis nodes
      ffuf: {
        title: 'FFUF',
        category: 'fuzzing' as const,
        config: { url: '', wordlist: '/usr/share/wordlists/common.txt', threads: 40 }
      },
      nuclei: {
        title: 'Nuclei',
        category: 'exploit' as const,
        config: { target: '', templates: 'default', severity: 'info,low,medium,high,critical' }
      },
      httpx: {
        title: 'HTTP Request',
        category: 'scanning' as const,
        config: { url: '', method: 'GET', headers: '{}', bodyType: 'json', timeout: 30 }
      },
      // Logic nodes
      conditional: {
        title: 'Conditional',
        category: 'logic' as const,
        config: { condition: '', description: '' }
      },
      filter: {
        title: 'Filter',
        category: 'logic' as const,
        config: { filterType: 'include', field: '', value: '', operator: 'equals' }
      },
      merge: {
        title: 'Merge',
        category: 'logic' as const,
        config: { mergeStrategy: 'combine', outputFormat: 'array' }
      },
      split: {
        title: 'Iterator',
        category: 'logic' as const,
        config: { sourceType: 'input', inputField: '', batchSize: 10, parallel: false }
      },
      schedule: {
        title: 'Wait',
        category: 'logic' as const,
        config: { waitType: 'fixed', duration: 5, minWait: 0, maxWait: 300 }
      },
      // Data nodes
      transform: {
        title: 'Transform',
        category: 'data' as const,
        config: { transformType: 'map', expression: '', outputField: '' }
      }
    };

    const config = nodeConfigs[nodeType as keyof typeof nodeConfigs];
    if (!config) return;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeType,
      title: config.title,
      category: config.category,
      position,
      status: 'idle',
      config: config.config
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  // Update node position
  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  }, []);

  // Update node config
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
      )
    }));
  }, []);

  // Add connection between nodes
  const addConnection = useCallback((source: string, target: string) => {
    const connectionId = `${source}-${target}`;
    
    // Check if connection already exists
    const exists = workflow.connections.find(conn => 
      conn.source === source && conn.target === target
    );
    
    if (exists) return;

    const newConnection: Connection = {
      id: connectionId,
      source,
      target
    };

    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  }, [workflow.connections]);

  // Remove connection
  const removeConnection = useCallback((connectionId: string) => {
    setWorkflow(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId)
    }));
  }, []);

  // Remove node with confirmation dialog
  const removeNode = useCallback((nodeId: string) => {
    setNodeToRemove(nodeId);
  }, []);

  const confirmRemoveNode = useCallback(() => {
    if (!nodeToRemove) return;
    
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeToRemove),
      connections: prev.connections.filter(conn => 
        conn.source !== nodeToRemove && conn.target !== nodeToRemove
      )
    }));
    
    // Clear selection if the removed node was selected
    if (selectedNode === nodeToRemove) {
      setSelectedNode(null);
    }
    
    setNodeToRemove(null);
  }, [nodeToRemove, selectedNode]);

  // Execute workflow using the workflow engine
  const executeWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) return;

    setWorkflow(prev => ({ ...prev, status: 'running' }));
    setLastUpdated(new Date());
    
    try {
      // Execute workflow using the engine
      await workflowEngine.execute(workflow);
      
      // Update workflow status based on execution result
      const context = workflowEngine.executionContext;
      if (context) {
        if (context.failedNodes.size > 0) {
          setWorkflow(prev => ({ ...prev, status: 'failed' }));
          toast.error(`Workflow failed. ${context.failedNodes.size} nodes failed.`);
        } else {
          setWorkflow(prev => ({ ...prev, status: 'completed' }));
          toast.success('Workflow completed successfully!');
        }

        // Update node statuses and outputs from execution context
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(node => {
            const nodeOutput = context.nodeOutputs[node.id];
            const isCompleted = context.completedNodes.has(node.id);
            const isFailed = context.failedNodes.has(node.id);
            const isRunning = context.currentNodes.has(node.id);
            
            let status = node.status;
            if (isFailed) status = 'failed';
            else if (isCompleted) status = 'success';
            else if (isRunning) status = 'running';
            
            return {
              ...node,
              status,
              outputs: nodeOutput?.data || node.outputs
            };
          })
        }));
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setWorkflow(prev => ({ ...prev, status: 'failed' }));
      toast.error(`Workflow execution failed: ${error.message}`);
      setLastUpdated(new Date());
    }
  }, [workflow, workflowEngine]);

  // Pause workflow execution
  const pauseWorkflow = useCallback(() => {
    workflowEngine.workflowEngine.pauseWorkflow();
    setWorkflow(prev => ({ ...prev, status: 'idle' }));
    toast.info('Workflow paused');
  }, [workflowEngine]);

  // Stop workflow execution
  const stopWorkflow = useCallback(() => {
    workflowEngine.workflowEngine.cancelWorkflow();
    setWorkflow(prev => ({ ...prev, status: 'idle' }));
    toast.info('Workflow stopped');
  }, [workflowEngine]);

  // Get execution order based on connections
  const getExecutionOrder = (workflow: Workflow): string[] => {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Visit dependencies first
      const dependencies = workflow.connections
        .filter(conn => conn.target === nodeId)
        .map(conn => conn.source);
      
      dependencies.forEach(visit);
      order.push(nodeId);
    };
    
    // Start with nodes that have no dependencies
    const rootNodes = workflow.nodes
      .filter(node => !workflow.connections.some(conn => conn.target === node.id))
      .map(node => node.id);
    
    rootNodes.forEach(visit);
    
    // Add any remaining nodes
    workflow.nodes.forEach(node => visit(node.id));
    
    return order;
  };

  // Save workflow as file download
  const saveWorkflow = useCallback(() => {
    saveWorkflowToFile(workflow);
  }, [workflow, saveWorkflowToFile]);

  // Load workflow from file upload
  const loadWorkflow = useCallback(() => {
    loadWorkflowFromFile();
  }, [loadWorkflowFromFile]);

  // View node output
  const viewNodeOutput = useCallback((nodeId: string) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (node) {
      // Get output from execution context if available, otherwise use node data
      const nodeOutput = workflowEngine.executionContext?.nodeOutputs[nodeId];
      const outputData = nodeOutput?.data || node.outputs;
      
      if (outputData) {
        setOutputModalNode(nodeId);
      }
    }
  }, [workflow.nodes, workflowEngine.executionContext]);

  // Auto-save workflow to localStorage whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('current-workflow', JSON.stringify(workflow));
    }, 500); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [workflow]);

  // Update node status based on task polling
  useEffect(() => {
    workflow.nodes.forEach(node => {
      if (node.status === 'running') {
        const taskStatus = taskPolling.getTaskStatus(`task-${node.id}`);
        if (taskStatus) {
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => 
              n.id === node.id ? { ...n, status: taskStatus.status === 'completed' ? 'success' : taskStatus.status } : n
            )
          }));
        }
      }
    });
  }, [taskPolling.activeTasks, workflow.nodes]);

  // Render different sections based on activeSection
  const renderMainContent = () => {
    switch (activeSection) {
      case 'visual-workflow':
        return (
          <div className="relative h-full w-full">
            <NodePalette onAddNode={addNode} />
            <WorkflowCanvas
              workflow={workflow}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onUpdateNodePosition={updateNodePosition}
              onUpdateNodeConfig={updateNodeConfig}
              onAddConnection={addConnection}
              onRemoveConnection={removeConnection}
              onRemoveNode={removeNode}
              onAddNode={addNode}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              dragOffset={dragOffset}
              setDragOffset={setDragOffset}
              canvasOffset={canvasOffset}
              setCanvasOffset={setCanvasOffset}
              executingConnections={executingConnections}
            />
          </div>
        );
      case 'insights':
      case 'tasks':
      case 'workers':
      case 'logs':
      case 'apiDocs':
        return (
          <ExecutionPanel
            workflow={workflow}
            logs={logs}
            selectedNode={selectedNode}
            onUpdateNodeConfig={updateNodeConfig}
            onClearLogs={clearLogs}
            onViewNodeOutput={viewNodeOutput}
            taskPolling={taskPolling}
            executionContext={workflowEngine.executionContext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <WorkflowSidebar
        workflow={workflow}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onExecuteWorkflow={executeWorkflow}
        onPauseWorkflow={pauseWorkflow}
        onStopWorkflow={stopWorkflow}
        onSaveWorkflow={saveWorkflow}
        onLoadWorkflow={loadWorkflow}
        isExecuting={workflow.status === 'running'}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <WorkflowHeader
          workflow={workflow}
          connectionStatus={connectionStatus}
          lastUpdated={lastUpdated}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {/* Hidden file input for workflow loading */}
      {fileInput}

      {/* Node removal confirmation dialog */}
      <NodeRemovalDialog
        open={nodeToRemove !== null}
        onOpenChange={(open) => !open && setNodeToRemove(null)}
        nodeTitle={nodeToRemove ? workflow.nodes.find(n => n.id === nodeToRemove)?.title || '' : ''}
        onConfirm={confirmRemoveNode}
      />

      {/* Node output modal */}
      <NodeOutputModal
        open={outputModalNode !== null}
        onOpenChange={(open) => !open && setOutputModalNode(null)}
        nodeTitle={outputModalNode ? workflow.nodes.find(n => n.id === outputModalNode)?.title || '' : ''}
        nodeOutputs={(() => {
          if (!outputModalNode) return undefined;
          const node = workflow.nodes.find(n => n.id === outputModalNode);
          if (!node) return undefined;
          
          // Get output from execution context if available, otherwise use node data
          const nodeOutput = workflowEngine.executionContext?.nodeOutputs[outputModalNode];
          return nodeOutput?.data || node.outputs;
        })()}
      />
    </div>
  );
};

export default WorkflowEditor;
