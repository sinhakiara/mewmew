import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ExecutionPanel } from './ExecutionPanel';
import { useWorkflowEngine } from '../hooks/useWorkflowEngine';
import { useWebSocket } from '../hooks/useWebSocket';

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
  const canvasRef = useRef<HTMLDivElement>(null);

  //const workflowEngine = useWorkflowEngine();
  //const { logs, connectionStatus, clearLogs } = useWebSocket('ws://192.168.29.20:8000/ws/logs');
  const workflowEngine = useWorkflowEngine({ apiBaseUrl, authToken });
  const { logs, connectionStatus, clearLogs } = useWebSocket(wsUrl);

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

    // Remove node
  const removeNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn =>
        conn.source !== nodeId && conn.target !== nodeId
      )
    }));

    // Clear selection if the removed node was selected
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) return;

    setWorkflow(prev => ({ ...prev, status: 'running' }));
    
    try {
      await workflowEngine.execute(workflow);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setWorkflow(prev => ({ ...prev, status: 'failed' }));
    }
  }, [workflow, workflowEngine]);

  // Save workflow
  const saveWorkflow = useCallback(() => {
  //  localStorage.setItem(`workflow-${workflow.id}`, JSON.stringify(workflow));
  //}, [workflow]);
  

  // Load workflow
  //const loadWorkflow = useCallback((workflowId: string) => {
   // const saved = localStorage.getItem(`workflow-${workflowId}`);
  //  if (saved) {
  //    setWorkflow(JSON.parse(saved));
  //  }
  //}, []);

  //return (
  //  <div className="workflow-editor">
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

      <WorkflowToolbar
        workflow={workflow}
        onExecute={executeWorkflow}
        onSave={saveWorkflow}
        onLoad={loadWorkflow}
        connectionStatus={connectionStatus}
      />
      
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
      />
      
      <ExecutionPanel
        workflow={workflow}
        logs={logs}
        selectedNode={selectedNode}
        onUpdateNodeConfig={updateNodeConfig}
        onClearLogs={clearLogs}
      />
    </div>
  );
};

export default WorkflowEditor;
