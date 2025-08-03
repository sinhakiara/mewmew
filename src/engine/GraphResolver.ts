import { WorkflowGraph, WorkflowNode, WorkflowConnection } from './types/WorkflowTypes';

export class GraphResolver {
  // Resolve execution order with support for parallel execution
  resolveExecutionOrder(workflow: WorkflowGraph): string[][] {
    const phases: string[][] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    // Build adjacency lists
    const dependencies = new Map<string, string[]>(); // node -> its dependencies
    const dependents = new Map<string, string[]>(); // node -> nodes that depend on it
    
    // Initialize maps
    workflow.nodes.forEach(node => {
      dependencies.set(node.id, []);
      dependents.set(node.id, []);
    });
    
    // Build dependency graph
    workflow.connections.forEach(connection => {
      const source = connection.source;
      const target = connection.target;
      
      // Target depends on source
      const targetDeps = dependencies.get(target) || [];
      targetDeps.push(source);
      dependencies.set(target, targetDeps);
      
      // Source has target as dependent
      const sourceDeps = dependents.get(source) || [];
      sourceDeps.push(target);
      dependents.set(source, sourceDeps);
    });
    
    // Detect cycles
    const hasCycle = this.detectCycles(workflow.nodes, dependencies, new Set(), new Set());
    if (hasCycle) {
      throw new Error('Workflow contains cycles, cannot execute');
    }
    
    // Find nodes with no dependencies (starting nodes)
    const readyNodes = new Set<string>();
    workflow.nodes.forEach(node => {
      if (node.status !== 'skipped' && dependencies.get(node.id)?.length === 0) {
        readyNodes.add(node.id);
      }
    });
    
    // Process nodes level by level
    while (readyNodes.size > 0 && visited.size < workflow.nodes.length) {
      // Current phase contains all ready nodes
      const currentPhase = Array.from(readyNodes);
      phases.push(currentPhase);
      
      // Mark current phase nodes as visited
      currentPhase.forEach(nodeId => {
        visited.add(nodeId);
        readyNodes.delete(nodeId);
      });
      
      // Find next ready nodes
      currentPhase.forEach(completedNodeId => {
        const nodesDependingOnThis = dependents.get(completedNodeId) || [];
        
        nodesDependingOnThis.forEach(dependentNodeId => {
          if (visited.has(dependentNodeId)) return;
          
          // Check if all dependencies of this node are satisfied
          const nodeDependencies = dependencies.get(dependentNodeId) || [];
          const allDepsSatisfied = nodeDependencies.every(depId => visited.has(depId));
          
          if (allDepsSatisfied) {
            const node = workflow.nodes.find(n => n.id === dependentNodeId);
            if (node && node.status !== 'skipped') {
              readyNodes.add(dependentNodeId);
            }
          }
        });
      });
    }
    
    // Verify all nodes are included (except skipped ones)
    const nonSkippedNodes = workflow.nodes.filter(n => n.status !== 'skipped');
    const totalNodesInPhases = phases.flat().length;
    
    if (totalNodesInPhases !== nonSkippedNodes.length) {
      const missingNodes = nonSkippedNodes
        .filter(n => !phases.flat().includes(n.id))
        .map(n => n.id);
      throw new Error(`Some nodes could not be scheduled for execution: ${missingNodes.join(', ')}`);
    }
    
    return phases;
  }
  
  // Detect cycles in the dependency graph
  private detectCycles(
    nodes: WorkflowNode[], 
    dependencies: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (this.detectCyclesDFS(node.id, dependencies, visited, recursionStack)) {
          return true;
        }
      }
    }
    return false;
  }
  
  // DFS-based cycle detection
  private detectCyclesDFS(
    nodeId: string,
    dependencies: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const deps = dependencies.get(nodeId) || [];
    for (const depId of deps) {
      if (!visited.has(depId)) {
        if (this.detectCyclesDFS(depId, dependencies, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true; // Back edge found, cycle detected
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  // Get immediate dependencies of a node
  getNodeDependencies(workflow: WorkflowGraph, nodeId: string): string[] {
    return workflow.connections
      .filter(conn => conn.target === nodeId)
      .map(conn => conn.source);
  }
  
  // Get nodes that depend on a given node
  getNodeDependents(workflow: WorkflowGraph, nodeId: string): string[] {
    return workflow.connections
      .filter(conn => conn.source === nodeId)
      .map(conn => conn.target);
  }
  
  // Check if adding a connection would create a cycle
  wouldCreateCycle(workflow: WorkflowGraph, newConnection: WorkflowConnection): boolean {
    // Temporarily add the connection
    const tempConnections = [...workflow.connections, newConnection];
    const tempWorkflow = { ...workflow, connections: tempConnections };
    
    try {
      this.resolveExecutionOrder(tempWorkflow);
      return false;
    } catch (error) {
      if (error.message.includes('cycle')) {
        return true;
      }
      throw error;
    }
  }
  
  // Find all possible paths between two nodes
  findPaths(workflow: WorkflowGraph, startNodeId: string, endNodeId: string): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    
    const dfs = (currentNodeId: string, currentPath: string[]) => {
      if (currentNodeId === endNodeId) {
        paths.push([...currentPath]);
        return;
      }
      
      if (visited.has(currentNodeId)) {
        return; // Avoid cycles
      }
      
      visited.add(currentNodeId);
      
      const nextNodes = workflow.connections
        .filter(conn => conn.source === currentNodeId)
        .map(conn => conn.target);
      
      for (const nextNodeId of nextNodes) {
        dfs(nextNodeId, [...currentPath, nextNodeId]);
      }
      
      visited.delete(currentNodeId);
    };
    
    dfs(startNodeId, [startNodeId]);
    return paths;
  }
  
  // Get execution statistics
  getExecutionStats(workflow: WorkflowGraph): {
    totalNodes: number;
    phases: number;
    maxParallelism: number;
    avgParallelism: number;
    criticalPath: string[];
  } {
    const phases = this.resolveExecutionOrder(workflow);
    const totalNodes = workflow.nodes.length;
    const phaseCount = phases.length;
    const maxParallelism = Math.max(...phases.map(phase => phase.length));
    const avgParallelism = totalNodes / phaseCount;
    
    // Find critical path (longest path through the graph)
    const criticalPath = this.findCriticalPath(workflow);
    
    return {
      totalNodes,
      phases: phaseCount,
      maxParallelism,
      avgParallelism: Math.round(avgParallelism * 100) / 100,
      criticalPath
    };
  }
  
  // Find the critical path (longest path) through the workflow
  private findCriticalPath(workflow: WorkflowGraph): string[] {
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();
    
    // Build maps
    workflow.nodes.forEach(node => {
      dependencies.set(node.id, []);
      dependents.set(node.id, []);
    });
    
    workflow.connections.forEach(connection => {
      const targetDeps = dependencies.get(connection.target) || [];
      targetDeps.push(connection.source);
      dependencies.set(connection.target, targetDeps);
      
      const sourceDeps = dependents.get(connection.source) || [];
      sourceDeps.push(connection.target);
      dependents.set(connection.source, sourceDeps);
    });
    
    // Find start nodes (no dependencies)
    const startNodes = workflow.nodes
      .filter(node => dependencies.get(node.id)?.length === 0)
      .map(node => node.id);
    
    let longestPath: string[] = [];
    
    // DFS from each start node to find longest path
    const findLongestPath = (nodeId: string, currentPath: string[], visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      currentPath.push(nodeId);
      
      const nextNodes = dependents.get(nodeId) || [];
      
      if (nextNodes.length === 0) {
        // End node reached
        if (currentPath.length > longestPath.length) {
          longestPath = [...currentPath];
        }
      } else {
        for (const nextNodeId of nextNodes) {
          findLongestPath(nextNodeId, currentPath, new Set(visited));
        }
      }
      
      currentPath.pop();
      visited.delete(nodeId);
    };
    
    for (const startNodeId of startNodes) {
      findLongestPath(startNodeId, [], new Set());
    }
    
    return longestPath;
  }
}
