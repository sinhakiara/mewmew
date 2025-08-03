// Core workflow engine types
export interface NodeData {
  [key: string]: any;
}

export interface NodeInput {
  data: NodeData;
  metadata?: {
    sourceNode?: string;
    timestamp?: number;
    executionId?: string;
  };
}

export interface NodeOutput {
  data: NodeData;
  success: boolean;
  error?: string;
  metadata?: {
    executionTime?: number;
    timestamp?: number;
    nodeId?: string;
  };
}

export interface WorkflowNode {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  inputs: string[]; // Input port names
  outputs: string[]; // Output port names
  data?: NodeData;
  error?: string;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string; // Optional condition for conditional connections
}

export interface WorkflowGraph {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables?: Record<string, any>;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  nodeOutputs: Record<string, NodeOutput>;
  startTime: number;
  currentNodes: Set<string>;
  completedNodes: Set<string>;
  failedNodes: Set<string>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  nodeId?: string;
  message: string;
  data?: any;
}

export interface NodeExecutionResult {
  success: boolean;
  output?: NodeOutput;
  error?: string;
  shouldContinue: boolean;
  nextNodes?: string[];
}

// Node type categories
export enum NodeCategory {
  DISCOVERY = 'discovery',
  ANALYSIS = 'analysis',
  LOGIC = 'logic',
  DATA = 'data',
  OUTPUT = 'output'
}

// Predefined node types
export enum NodeType {
  // Discovery nodes
  SUBFINDER = 'subfinder',
  AMASS = 'amass',
  ASSETFINDER = 'assetfinder',
  
  // Analysis nodes
  FFUF = 'ffuf',
  NUCLEI = 'nuclei',
  ARJUN = 'arjun',
  HTTPX = 'httpx',
  
  // Logic nodes
  CONDITIONAL = 'conditional',
  FILTER = 'filter',
  MERGE = 'merge',
  SPLIT = 'split',
  
  // Data nodes
  TRANSFORM = 'transform',
  VALIDATE = 'validate',
  EXPORT = 'export',
  
  // Trigger nodes
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule'
}

export interface NodeDefinition {
  type: NodeType;
  category: NodeCategory;
  name: string;
  description: string;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: Record<string, ConfigField>;
  defaultConfig: Record<string, any>;
}

export interface PortDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
