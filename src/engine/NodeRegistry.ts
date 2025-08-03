import { WorkflowNode, ExecutionContext, NodeDefinition, NodeType } from './types/WorkflowTypes';
import { BaseNode } from './nodes/BaseNode';

// Import specific node implementations
import { SubfinderNode } from './nodes/impl/SubfinderNode';
import { AmassNode } from './nodes/impl/AmassNode';
import { NucleiNode } from './nodes/impl/NucleiNode';
import { FfufNode } from './nodes/impl/FfufNode';
import { ConditionalNode } from './nodes/impl/ConditionalNode';
import { FilterNode } from './nodes/impl/FilterNode';
import { MergeNode } from './nodes/impl/MergeNode';
import { TransformNode } from './nodes/impl/TransformNode';

export class NodeRegistry {
  private nodeClasses: Map<NodeType, typeof BaseNode> = new Map();
  private nodeDefinitions: Map<NodeType, NodeDefinition> = new Map();

  constructor() {
    this.registerDefaultNodes();
  }

  // Register all default node types
  private registerDefaultNodes(): void {
    // Discovery nodes
    this.register(NodeType.SUBFINDER, SubfinderNode);
    this.register(NodeType.AMASS, AmassNode);
    
    // Analysis nodes  
    this.register(NodeType.NUCLEI, NucleiNode);
    this.register(NodeType.FFUF, FfufNode);
    
    // Logic nodes
    this.register(NodeType.CONDITIONAL, ConditionalNode);
    this.register(NodeType.FILTER, FilterNode);
    this.register(NodeType.MERGE, MergeNode);
    
    // Data nodes
    this.register(NodeType.TRANSFORM, TransformNode);

    // TODO: Add more node implementations as needed
    // this.register(NodeType.ARJUN, ArjunNode);
    // this.register(NodeType.HTTPX, HttpxNode);
    // this.register(NodeType.EXPORT, ExportNode);
  }

  // Register a node type
  register(type: NodeType, nodeClass: typeof BaseNode): void {
    this.nodeClasses.set(type, nodeClass);
    
    // Get definition from a temporary instance
    try {
      // Create a dummy node and context for getting the definition
      const dummyNode: WorkflowNode = {
        id: 'temp',
        type: type,
        title: 'temp',
        position: { x: 0, y: 0 },
        config: {},
        status: 'idle',
        inputs: [],
        outputs: []
      };
      
      const dummyContext: ExecutionContext = {
        workflowId: 'temp',
        executionId: 'temp',
        variables: {},
        nodeOutputs: {},
        startTime: Date.now(),
        currentNodes: new Set(),
        completedNodes: new Set(),
        failedNodes: new Set(),
        logs: []
      };

      {/*      const instance = new nodeClass(dummyNode, dummyContext); */}
      const instance = new (nodeClass as any)(dummyNode, dummyContext);
      const definition = instance.getDefinition();
      this.nodeDefinitions.set(type, definition);
      
    } catch (error) {
      console.warn(`Failed to get definition for node type ${type}:`, error);
    }
  }

  // Create a node instance
  createNode(node: WorkflowNode, context: ExecutionContext): BaseNode {
    const nodeClass = this.nodeClasses.get(node.type as NodeType);
    
    if (!nodeClass) {
      throw new Error(`Unknown node type: ${node.type}`);
    }

    {/*    return new nodeClass(node, context); */}
    return new (nodeClass as any)(node, context);
  }

  // Get all available node types
  getAvailableTypes(): NodeType[] {
    return Array.from(this.nodeClasses.keys());
  }

  // Get node definition
  getDefinition(type: NodeType): NodeDefinition | undefined {
    return this.nodeDefinitions.get(type);
  }

  // Get all definitions
  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  // Get definitions by category
  getDefinitionsByCategory(category: string): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values())
      .filter(def => def.category === category);
  }

  // Check if node type is registered
  isRegistered(type: NodeType): boolean {
    return this.nodeClasses.has(type);
  }

  // Validate node configuration against its definition
  validateNodeConfig(node: WorkflowNode): { valid: boolean; errors: string[] } {
    const definition = this.getDefinition(node.type as NodeType);
    if (!definition) {
      return { valid: false, errors: [`Unknown node type: ${node.type}`] };
    }

    const errors: string[] = [];
    const config = node.config || {};

    // Validate each configuration field
    for (const [fieldName, fieldDef] of Object.entries(definition.configSchema)) {
      const value = config[fieldName];

      // Check required fields
      if (fieldDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required field '${fieldDef.label}' is missing`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type-specific validation
      switch (fieldDef.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`Field '${fieldDef.label}' must be a number`);
          } else if (fieldDef.validation) {
            const num = Number(value);
            if (fieldDef.validation.min !== undefined && num < fieldDef.validation.min) {
              errors.push(`Field '${fieldDef.label}' must be at least ${fieldDef.validation.min}`);
            }
            if (fieldDef.validation.max !== undefined && num > fieldDef.validation.max) {
              errors.push(`Field '${fieldDef.label}' must be at most ${fieldDef.validation.max}`);
            }
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${fieldDef.label}' must be a string`);
          } else if (fieldDef.validation?.pattern) {
            const regex = new RegExp(fieldDef.validation.pattern);
            if (!regex.test(value)) {
              errors.push(`Field '${fieldDef.label}' format is invalid`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${fieldDef.label}' must be a boolean`);
          }
          break;

        case 'select':
          if (fieldDef.options) {
            const validValues = fieldDef.options.map(opt => opt.value);
            if (!validValues.includes(value)) {
              errors.push(`Field '${fieldDef.label}' must be one of: ${validValues.join(', ')}`);
            }
          }
          break;

        case 'multiselect':
          if (!Array.isArray(value)) {
            errors.push(`Field '${fieldDef.label}' must be an array`);
          } else if (fieldDef.options) {
            const validValues = fieldDef.options.map(opt => opt.value);
            const invalidValues = value.filter(v => !validValues.includes(v));
            if (invalidValues.length > 0) {
              errors.push(`Field '${fieldDef.label}' contains invalid values: ${invalidValues.join(', ')}`);
            }
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
