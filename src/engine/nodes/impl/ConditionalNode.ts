import { LogicNode } from '../LogicNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class ConditionalNode extends LogicNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    const condition = config.condition || 'true';
    
    return this.executeLogicOperation((nodeInputs) => {
      // Get the main input data
      const inputData = this.mergeInputs(inputs);
      
      // Evaluate the condition
      const conditionResult = this.evaluateCondition(condition, inputData);
      
      this.log('info', `Condition "${condition}" evaluated to: ${conditionResult}`, { inputData });
      
      // Determine which output to send data to
      const output = {
        condition: conditionResult,
        data: inputData,
        passedCondition: conditionResult,
        metadata: {
          originalCondition: condition,
          evaluatedAt: new Date().toISOString()
        }
      };
      
      return output;
    });
  }

  // Override to determine next nodes based on condition result
  async execute2(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const result = await this.execute(inputs);
    
    if (result.success && result.output) {
      const conditionPassed = result.output.data.passedCondition;
      
      // Find connections for this node
      const connections = this.context.variables.connections || [];
      const nextNodes: string[] = [];
      
      // Route to appropriate next nodes based on condition
      connections.forEach((conn: any) => {
        if (conn.source === this.node.id) {
          // Route based on sourceHandle (true/false outputs)
          if (conditionPassed && conn.sourceHandle === 'true') {
            nextNodes.push(conn.target);
          } else if (!conditionPassed && conn.sourceHandle === 'false') {
            nextNodes.push(conn.target);
          }
        }
      });
      
      return {
        ...result,
        nextNodes
      };
    }
    
    return result;
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.CONDITIONAL,
      category: NodeCategory.LOGIC,
      name: 'Conditional',
      description: 'Route data based on conditions',
      icon: '🔀',
      inputs: [
        {
          name: 'data',
          type: 'any',
          required: true,
          description: 'Input data to evaluate'
        }
      ],
      outputs: [
        {
          name: 'true',
          type: 'any',
          required: false,
          description: 'Data when condition is true'
        },
        {
          name: 'false',
          type: 'any',
          required: false,
          description: 'Data when condition is false'
        }
      ],
      configSchema: {
        condition: {
          type: 'string',
          label: 'Condition',
          description: 'Condition to evaluate (e.g., "count > 10", "severity == high")',
          required: true,
          default: 'count > 0'
        },
        description: {
          type: 'textarea',
          label: 'Description',
          description: 'Description of what this condition checks'
        }
      },
      defaultConfig: {
        condition: 'count > 0'
      }
    };
  }
}
