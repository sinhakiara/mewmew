import { useState, useCallback } from 'react';
import { Workflow, Node } from '../components/WorkflowEditor';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { WorkflowGraph, ExecutionContext } from '../engine/types/WorkflowTypes';

interface WorkflowEngineConfig {
  apiBaseUrl: string;
  authToken?: string;
}

export const useWorkflowEngine = (config?: WorkflowEngineConfig) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionContext, setExecutionContext] = useState<ExecutionContext | null>(null);
  const [workflowEngine] = useState(() => new WorkflowEngine());
  
  interface ExecutionRecord {
    id: string;
    workflowId: string;
    startTime: string;
    endTime?: string;
    status: 'running' | 'completed' | 'failed';
    logs: string[];
  }

  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);

  const baseUrl = config?.apiBaseUrl || 'https://192.168.29.20:8000';
  const authToken = config?.authToken || localStorage.getItem('dheeraj_token');

  // API call helper aligned with OpenAPI spec
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Execute a single node
  const executeNode = async (node: Node, inputData?: any): Promise<any> => {
    const command = buildCommand(node, inputData);
    
    try {
      // Submit task to the distributed system
      const taskResponse = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({ command }),
      });

      const taskId = taskResponse.task_id;
      
      if (!taskId) {
        throw new Error('No task_id received from server');
      }
      
      // Poll for task completion using GET /api/tasks (returns all tasks)
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            // GET /api/tasks returns all tasks, filter by our task_id
            const allTasks = await apiCall('/api/tasks');
            const task = allTasks.find((t: any) => t.task_id === taskId);
            
            if (task && task.status === 'completed') {
              clearInterval(pollInterval);
              resolve(parseOutput(node.type, task.output || task.result));
            } else if (task && task.status === 'failed') {
              clearInterval(pollInterval);
              reject(new Error(`Task failed: ${task.output || task.error}`));
            }
            // Continue polling for running/pending tasks
          } catch (error) {
            clearInterval(pollInterval);
            reject(error);
          }
        }, 2000);
        
        // Set timeout for polling (max 5 minutes)
        setTimeout(() => {
          clearInterval(pollInterval);
          reject(new Error('Task execution timeout'));
        }, 300000);
      });
    } catch (error) {
      throw new Error(`Failed to execute node ${node.id}: ${error}`);
    }
  };

  // Build command string for each tool aligned with backend capabilities
  const buildCommand = (node: Node, inputData?: any): string => {
    const config = node.config;
    
    switch (node.type) {
      case 'subfinder':
        return `subfinder -d ${config.domain || '{{input}}'} -t ${config.threads || 10} -timeout ${config.timeout || 30} -silent`;
        
      case 'amass':
        const mode = config.mode === 'active' ? 'enum' : 'intel';
        return `amass ${mode} -d ${config.domain || '{{input}}'} -timeout ${config.timeout || 60}`;
        
      case 'ffuf':
        return `ffuf -u "${config.url || '{{input}}'}" -w ${config.wordlist} -t ${config.threads || 40} -fc 404 -o /tmp/ffuf_output.json -of json`;
        
      case 'arjun':
        const methods = Array.isArray(config.methods) ? config.methods.join(',') : 'GET,POST';
        return `arjun -u "${config.url || '{{input}}'}" -m ${methods} --delay ${config.delay || 2}`;
        
      case 'nuclei':
        return `nuclei -u "${config.target || '{{input}}'}" -severity ${config.severity || 'info,low,medium,high,critical'} -json`;
        
      case 'httpx':
        const headers = config.headers ? `-H '${config.headers}'` : '';
        const data = config.bodyType === 'json' && config.body ? `-d '${config.body}'` : '';
        return `curl -X ${config.method || 'GET'} ${headers} ${data} "${config.url || '{{input}}'}" --max-time ${config.timeout || 30}`;
      
      // Logic nodes - these will be processed by the workflow engine rather than executed as shell commands
      case 'conditional':
        return `# Conditional node: ${config.condition || 'true'}`;
      
      case 'filter':
        return `# Filter node: ${config.filterType || 'include'} ${config.field || 'field'} ${config.operator || 'equals'} ${config.value || 'value'}`;
      
      case 'merge':
        return `# Merge node: strategy=${config.mergeStrategy || 'combine'} format=${config.outputFormat || 'array'}`;
      
      case 'split':
        return `# Iterator node: source=${config.sourceType || 'input'} field=${config.inputField || 'data'} batch=${config.batchSize || 10}`;
      
      case 'schedule':
        return `# Wait node: type=${config.waitType || 'fixed'} duration=${config.duration || 5}s`;
      
      case 'transform':
        return `# Transform node: type=${config.transformType || 'map'} expression="${config.expression || 'item => item'}"`;
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  };

  // Parse output based on tool type
  const parseOutput = (nodeType: string, rawOutput: string): any => {
    try {
      switch (nodeType) {
        case 'subfinder':
        case 'amass':
          // Return list of subdomains
          return {
            subdomains: rawOutput.split('\n').filter(line => line.trim()),
            count: rawOutput.split('\n').filter(line => line.trim()).length
          };
          
        case 'ffuf':
          // Try to parse JSON output
          try {
            const parsed = JSON.parse(rawOutput);
            return {
              results: parsed.results || [],
              count: parsed.results?.length || 0
            };
          } catch {
            return { results: [], count: 0, raw: rawOutput };
          }
          
        case 'arjun':
          // Parse parameter discovery results
          const params = rawOutput.split('\n')
            .filter(line => line.includes('Parameter discovered:'))
            .map(line => line.split('Parameter discovered:')[1]?.trim())
            .filter(Boolean);
          return { parameters: params, count: params.length };
          
        case 'nuclei':
          // Parse nuclei JSON output
          const findings = rawOutput.split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          return { findings, count: findings.length };
          
        case 'httpx':
          // Parse HTTP response
          try {
            const parsed = JSON.parse(rawOutput);
            return { response: parsed, status: 'success' };
          } catch {
            return { response: rawOutput, status: 'success', raw: rawOutput };
          }
          
        // Logic nodes return processed data
        case 'conditional':
        case 'filter':
        case 'merge':
        case 'split':
        case 'schedule':
        case 'transform':
          return { processed: true, raw: rawOutput };
          
        default:
          return { raw: rawOutput };
      }
    } catch (error) {
      return { raw: rawOutput, parseError: error.message };
    }
  };

  // Replace {{input}} placeholders with actual data
  const replaceInputPlaceholders = (command: string, inputData: any): string => {
    if (!inputData) return command;
    
    let replacedCommand = command;
    
    if (typeof inputData === 'object') {
      if (inputData.subdomains && Array.isArray(inputData.subdomains)) {
        // For subdomain lists, use the first subdomain or join them
        replacedCommand = replacedCommand.replace('{{input}}', inputData.subdomains[0] || '');
      } else if (inputData.results && Array.isArray(inputData.results)) {
        // For ffuf results, extract URLs
        const urls = inputData.results.map((r: any) => r.url).filter(Boolean);
        replacedCommand = replacedCommand.replace('{{input}}', urls[0] || '');
      } else if (inputData.raw) {
        replacedCommand = replacedCommand.replace('{{input}}', inputData.raw);
      }
    } else if (typeof inputData === 'string') {
      replacedCommand = replacedCommand.replace('{{input}}', inputData);
    }
    
    return replacedCommand;
  };

  // Convert legacy workflow to new format
  const convertWorkflow = (legacyWorkflow: Workflow): WorkflowGraph => {
    return {
      id: legacyWorkflow.id,
      name: legacyWorkflow.name || 'Untitled Workflow',
      nodes: legacyWorkflow.nodes.map(node => ({
        id: node.id,
        type: node.type,
        title: node.title,
        position: node.position,
        config: node.config || {},
        status: (node.status === 'success' ? 'completed' : node.status) as any || 'idle',
        inputs: ['main'], // Default input
        outputs: ['main'], // Default output
        data: (node as any).data,
        error: (node as any).error
      })),
      connections: legacyWorkflow.connections.map(conn => ({
        id: `${conn.source}-${conn.target}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: 'main',
        targetHandle: 'main'
      })),
      variables: {
        apiBaseUrl: baseUrl,
        authToken
      },
      status: 'idle'
    };
  };

  // Execute entire workflow using new engine
  const execute = useCallback(async (workflow: Workflow) => {
    setIsExecuting(true);
    
    try {
      // Convert to new workflow format
      const workflowGraph = convertWorkflow(workflow);
      
      // Execute with progress tracking
      const context = await workflowEngine.executeWorkflow(
        workflowGraph,
        { apiBaseUrl: baseUrl, authToken },
        (progressContext) => {
          setExecutionContext({ ...progressContext });
        }
      );
      
      // Create execution record for compatibility
      const execution: ExecutionRecord = {
        id: context.executionId,
        workflowId: context.workflowId,
        startTime: new Date(context.startTime).toISOString(),
        endTime: new Date().toISOString(),
        status: context.failedNodes.size > 0 ? 'failed' : 'completed',
        logs: context.logs.map(log => `${log.level.toUpperCase()}: ${log.message}`)
      };
      
      setExecutionHistory(prev => [...prev, execution]);
      setExecutionContext(context);
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      const execution: ExecutionRecord = {
        id: `exec-${Date.now()}`,
        workflowId: workflow.id,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'failed',
        logs: [`❌ Workflow failed: ${error}`]
      };
      
      setExecutionHistory(prev => [...prev, execution]);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [workflowEngine, baseUrl, authToken]);

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

  return {
    execute,
    executeNode,
    isExecuting,
    executionHistory,
    executionContext,
    workflowEngine
  };
};
