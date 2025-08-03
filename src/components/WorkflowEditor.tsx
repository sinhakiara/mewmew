
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ExecutionPanel } from './ExecutionPanel';
import { NodeOutputModal } from './NodeOutputModal';
import { NodeRemovalDialog } from './NodeRemovalDialog';
import { useWorkflowEngine } from '../hooks/useWorkflowEngine';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTaskPolling } from '../hooks/useTaskPolling';
import { useWorkflowFileManager } from './WorkflowFileManager';



export interface Node {
  id: string;
  type: string;
  title: string;
  category: 'recon' | 'scanning' | 'fuzzing' | 'exploit';
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

//const WorkflowEditor: React.FC = () => {
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
  const [workflow, setWorkflow] = useState<Workflow>({
    id: 'workflow-1',
    name: 'Security Assessment',
    nodes: [],
    connections: [],
    status: 'idle'
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [executingConnections, setExecutingConnections] = useState<Set<string>>(new Set());
  const [nodeToRemove, setNodeToRemove] = useState<string | null>(null);
  const [outputModalNode, setOutputModalNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  //const workflowEngine = useWorkflowEngine();
  //const { logs, connectionStatus, clearLogs } = useWebSocket('ws://192.168.29.20:8000/ws/logs');
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
      ffuf: {
        title: 'FFUF',
        category: 'fuzzing' as const,
        config: { url: '', wordlist: '/usr/share/wordlists/common.txt', threads: 40 }
      },
      arjun: {
        title: 'Arjun',
        category: 'scanning' as const,
        config: { url: '', methods: ['GET', 'POST'], delay: 2 }
      },
      nuclei: {
        title: 'Nuclei',
        category: 'exploit' as const,
        config: { target: '', templates: 'default', severity: 'info,low,medium,high,critical' }
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

  // Execute workflow with visual updates
  const executeWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) return;

    setWorkflow(prev => ({ ...prev, status: 'running' }));

    try {
// --------------------------
            {/*
      await workflowEngine.execute(workflow);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setWorkflow(prev => ({ ...prev, status: 'failed' }));
    }
  }, [workflow, workflowEngine]);

  // Save workflow
  const saveWorkflow = useCallback(() => {
  try {
      const workflowData = {
        ...workflow,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`workflow-${workflow.id}`, JSON.stringify(workflowData));
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow. Please try again.');
    }
  }, [workflow]);

  // Load workflow
  const loadWorkflow = useCallback(() => {
    try {
      const workflowList = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('workflow-')) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const workflowData = JSON.parse(saved);
            workflowList.push({
              id: workflowData.id,
              name: workflowData.name,
              savedAt: workflowData.savedAt || 'Unknown'
            });
          }
        }
      }

      if (workflowList.length === 0) {
        alert('No saved workflows found.');
        return;
      }

      // Simple workflow selector - in a real app, you'd use a proper modal
      const workflowName = prompt(`Available workflows:\n${workflowList.map((w, i) => `${i + 1}. ${w.name} (${new Date(w.savedAt).toLocaleString()})`).join('\n')}\n\nEnter the number of the workflow to load:`);

      if (workflowName) {
        const index = parseInt(workflowName) - 1;
        if (index >= 0 && index < workflowList.length) {
          const selectedWorkflow = workflowList[index];
          const saved = localStorage.getItem(`workflow-${selectedWorkflow.id}`);
          if (saved) {
            setWorkflow(JSON.parse(saved));
            alert('Workflow loaded successfully!');
          }
        } else {
          alert('Invalid selection.');
        }
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert('Failed to load workflow. Please try again.');
    }
  }, []);
*/} //_______________

  // Get execution order
      const executionOrder = getExecutionOrder(workflow);

      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Update node status to running
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(n =>
            n.id === nodeId ? { ...n, status: 'running' } : n
          )
        }));

        // Show connection animation
        const inputConnection = workflow.connections.find(conn => conn.target === nodeId);
        if (inputConnection) {
          setExecutingConnections(prev => new Set(prev).add(inputConnection.id));
          await new Promise(resolve => setTimeout(resolve, 1000)); // Animation delay
        }

        try {
          // Add task to polling
          const taskId = `task-${nodeId}-${Date.now()}`;
          taskPolling.addTask(taskId);

          // Execute node (simplified - you'll need to integrate with actual execution)
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution

          // Update node status to success
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n =>
              n.id === nodeId ? { ...n, status: 'success', outputs: { data: `Output from ${n.title}` } } : n
            )
          }));

        } catch (error) {
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n =>
              n.id === nodeId ? { ...n, status: 'failed' } : n
            )
          }));
        }

        // Clear connection animation
        if (inputConnection) {
          setExecutingConnections(prev => {
            const newSet = new Set(prev);
            newSet.delete(inputConnection.id);
            return newSet;
          });
        }
      }

      setWorkflow(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setWorkflow(prev => ({ ...prev, status: 'failed' }));
    }
  }, [workflow, taskPolling]);

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
    setOutputModalNode(nodeId);
  }, []);

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

  return (
    <div className="workflow-editor">
      {/* Hover trigger areas */}
      <div
        className="toolbar-trigger"
        onMouseEnter={() => document.querySelector('.workflow-toolbar')?.classList.add('toolbar-hover')}
        onMouseLeave={() => document.querySelector('.workflow-toolbar')?.classList.remove('toolbar-hover')}
      />
      <div
        className="palette-trigger"
        onMouseEnter={() => document.querySelector('.node-palette')?.classList.add('palette-hover')}
        onMouseLeave={() => document.querySelector('.node-palette')?.classList.remove('palette-hover')}
      />
      <div
        className="execution-trigger"
        onMouseEnter={() => document.querySelector('.execution-panel')?.classList.add('panel-hover')}
        onMouseLeave={() => document.querySelector('.execution-panel')?.classList.remove('panel-hover')}
      />

      <WorkflowToolbar
        workflow={workflow}
        onExecute={executeWorkflow}
        onSave={saveWorkflow}
        onLoad={loadWorkflow}
        connectionStatus={connectionStatus}
      />

      {/*      <NodePalette onAddNode={addNode} />  */}
       <NodePalette onAddNode={addNode} />
       {/*  <NodePalette onAddNode={addNode} nodeRegistry={nodeRegistry} /> */}

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

      <ExecutionPanel
        workflow={workflow}
        logs={logs}
        selectedNode={selectedNode}
        onUpdateNodeConfig={updateNodeConfig}
        onClearLogs={clearLogs}
        onViewNodeOutput={viewNodeOutput}
        taskPolling={taskPolling}
      />

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
        nodeOutputs={outputModalNode ? workflow.nodes.find(n => n.id === outputModalNode)?.outputs : undefined}
      />
    </div>
  );
};

export default WorkflowEditor;
