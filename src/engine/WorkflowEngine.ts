import { WorkflowGraph, WorkflowNode, ExecutionContext, NodeExecutionResult, ExecutionLog } from './types/WorkflowTypes';
import { NodeRegistry } from './NodeRegistry';
import { GraphResolver } from './GraphResolver';

export class WorkflowEngine {
  private nodeRegistry: NodeRegistry;
  private graphResolver: GraphResolver;
  private executionContext: ExecutionContext | null = null;

  constructor() {
    this.nodeRegistry = new NodeRegistry();
    this.graphResolver = new GraphResolver();
  }

  // Execute a complete workflow
  async executeWorkflow(
    workflow: WorkflowGraph, 
    variables: Record<string, any> = {},
    onProgress?: (context: ExecutionContext) => void
  ): Promise<ExecutionContext> {
    // Create execution context
    this.executionContext = {
      workflowId: workflow.id,
      executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      variables: { ...variables },
      nodeOutputs: {},
      startTime: Date.now(),
      currentNodes: new Set(),
      completedNodes: new Set(),
      failedNodes: new Set(),
      logs: []
    };

    this.log('info', `Starting workflow execution: ${workflow.name}`);

    try {
      // Update workflow status
      workflow.status = 'running';

      // Resolve execution order
      const executionPlan = this.graphResolver.resolveExecutionOrder(workflow);
      this.log('info', `Execution plan created with ${executionPlan.length} phases`);

      // Execute nodes in phases (supports parallel execution)
      for (let phaseIndex = 0; phaseIndex < executionPlan.length; phaseIndex++) {
        const phase = executionPlan[phaseIndex];
        
        this.log('info', `Starting execution phase ${phaseIndex + 1} with ${phase.length} nodes`);

        // Execute all nodes in this phase in parallel
        const phasePromises = phase.map(nodeId => this.executeNode(workflow, nodeId));
        const phaseResults = await Promise.allSettled(phasePromises);

        // Process results
        for (let i = 0; i < phaseResults.length; i++) {
          const result = phaseResults[i];
          const nodeId = phase[i];
          const node = workflow.nodes.find(n => n.id === nodeId);

          if (result.status === 'fulfilled') {
            const execResult = result.value;
            if (execResult.success) {
              this.executionContext.completedNodes.add(nodeId);
              if (node) node.status = 'completed';
              
              if (execResult.output) {
                this.executionContext.nodeOutputs[nodeId] = execResult.output;
              }
            } else {
              this.executionContext.failedNodes.add(nodeId);
              if (node) {
                node.status = 'failed';
                node.error = execResult.error;
              }
              
              // Check if this is a critical failure
              if (node?.config?.stopOnError !== false) {
                this.log('error', `Critical node failure: ${nodeId}, stopping workflow`);
                throw new Error(`Node ${nodeId} failed: ${execResult.error}`);
              }
            }
          } else {
            this.executionContext.failedNodes.add(nodeId);
            if (node) {
              node.status = 'failed';
              node.error = result.reason?.message || 'Unknown error';
            }
            
            this.log('error', `Node execution promise rejected: ${nodeId}`, result.reason);
          }
        }

        // Update current nodes
        this.executionContext.currentNodes.clear();
        
        // Report progress
        if (onProgress) {
          onProgress(this.executionContext);
        }

        // Check for conditional routing
        await this.handleConditionalRouting(workflow, phase);
      }

      workflow.status = 'completed';
      this.log('info', `Workflow execution completed successfully`);

    } catch (error) {
      workflow.status = 'failed';
      this.log('error', `Workflow execution failed: ${error}`);
      
      // Mark remaining nodes as skipped
      workflow.nodes.forEach(node => {
        if (node.status === 'idle' || node.status === 'running') {
          node.status = 'skipped';
        }
      });
    }

    // Final progress update
    if (onProgress) {
      onProgress(this.executionContext);
    }

    return this.executionContext;
  }

  // Execute a single node
  private async executeNode(workflow: WorkflowGraph, nodeId: string): Promise<NodeExecutionResult> {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (!this.executionContext) {
      throw new Error('No execution context available');
    }

    this.log('info', `Executing node: ${node.title} (${node.type})`);
    
    try {
      // Update node status
      node.status = 'running';
      this.executionContext.currentNodes.add(nodeId);

      // Get node inputs from connected outputs
      const inputs = this.collectNodeInputs(workflow, nodeId);

      // Create node instance and execute
      const nodeInstance = this.nodeRegistry.createNode(node, this.executionContext);
      const result = await nodeInstance.execute(inputs);

      // Update node data
      if (result.output) {
        node.data = result.output.data;
      }

      this.log('info', `Node execution completed: ${node.title}`, { 
        success: result.success,
        hasOutput: !!result.output 
      });

      return result;

    } catch (error) {
      const errorMessage = `Node execution failed: ${error}`;
      this.log('error', errorMessage, { nodeId, nodeType: node.type });
      
      return {
        success: false,
        error: errorMessage,
        shouldContinue: false
      };
    } finally {
      this.executionContext.currentNodes.delete(nodeId);
    }
  }

  // Collect inputs for a node from connected node outputs
  private collectNodeInputs(workflow: WorkflowGraph, nodeId: string): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // Find all connections that target this node
    const incomingConnections = workflow.connections.filter(conn => conn.target === nodeId);
    
    for (const connection of incomingConnections) {
      const sourceOutput = this.executionContext?.nodeOutputs[connection.source];
      if (sourceOutput) {
        const inputName = connection.targetHandle || 'main';
        inputs[inputName] = {
          data: sourceOutput.data,
          metadata: sourceOutput.metadata
        };
      }
    }

    return inputs;
  }

  // Handle conditional routing after node execution
  private async handleConditionalRouting(workflow: WorkflowGraph, completedPhase: string[]): Promise<void> {
    // Find conditional nodes that just completed
    const conditionalNodes = completedPhase.filter(nodeId => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      return node?.type === 'conditional';
    });

    for (const nodeId of conditionalNodes) {
      const output = this.executionContext?.nodeOutputs[nodeId];
      if (output?.data?.passedCondition !== undefined) {
        const conditionPassed = output.data.passedCondition;
        
        // Update connections based on condition result
        workflow.connections.forEach(conn => {
          if (conn.source === nodeId) {
            // Mark connection as active/inactive based on condition and handle
            if (conn.sourceHandle === 'true' && !conditionPassed) {
              // This path should not be taken
              const targetNode = workflow.nodes.find(n => n.id === conn.target);
              if (targetNode && targetNode.status === 'idle') {
                targetNode.status = 'skipped';
              }
            } else if (conn.sourceHandle === 'false' && conditionPassed) {
              // This path should not be taken
              const targetNode = workflow.nodes.find(n => n.id === conn.target);
              if (targetNode && targetNode.status === 'idle') {
                targetNode.status = 'skipped';
              }
            }
          }
        });
      }
    }
  }

  // Pause workflow execution
  pauseWorkflow(): void {
    if (this.executionContext) {
      this.log('info', 'Workflow execution paused');
    }
  }

  // Resume workflow execution
  resumeWorkflow(): void {
    if (this.executionContext) {
      this.log('info', 'Workflow execution resumed');
    }
  }

  // Cancel workflow execution
  cancelWorkflow(): void {
    if (this.executionContext) {
      this.log('info', 'Workflow execution cancelled');
      this.executionContext = null;
    }
  }

  // Get current execution context
  getExecutionContext(): ExecutionContext | null {
    return this.executionContext;
  }

  // Get node registry for node management
  getNodeRegistry(): NodeRegistry {
    return this.nodeRegistry;
  }

  // Logging helper
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    if (this.executionContext) {
      this.executionContext.logs.push({
        id: `${this.executionContext.executionId}-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        message,
        data
      });
    }
    
    // Also log to console for debugging
    console[level](`[WorkflowEngine] ${message}`, data || '');
  }
}
