import { LogicNode } from '../LogicNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class WaitNode extends LogicNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const inputValidation = this.validateInputs(inputs);
    if (!inputValidation.valid) {
      return this.createErrorResult(`Input validation failed: ${inputValidation.errors.join(', ')}`);
    }

    const configValidation = this.validateConfig();
    if (!configValidation.valid) {
      return this.createErrorResult(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
    }

    try {
      const config = this.node.config;
      const inputData = this.mergeInputs(inputs);
      
      // Calculate wait time
      let waitTime = 0;
      
      if (config.waitType === 'fixed') {
        waitTime = Number(config.duration) * 1000; // Convert to milliseconds
      } else if (config.waitType === 'random') {
        const min = Number(config.minDuration) * 1000;
        const max = Number(config.maxDuration) * 1000;
        waitTime = Math.random() * (max - min) + min;
      } else if (config.waitType === 'variable') {
        const variableValue = this.replaceVariables(config.variableName || '', inputData);
        waitTime = Number(variableValue) * 1000;
        if (isNaN(waitTime)) {
          return this.createErrorResult(`Invalid wait time from variable: ${variableValue}`);
        }
      }

      // Ensure minimum and maximum bounds
      const minWait = (config.minWait || 0) * 1000;
      const maxWait = (config.maxWait || 300) * 1000; // Default max 5 minutes
      
      waitTime = Math.max(minWait, Math.min(maxWait, waitTime));

      this.log('info', `Waiting for ${Math.round(waitTime / 1000)} seconds...`);

      // Perform the wait
      await new Promise(resolve => setTimeout(resolve, waitTime));

      this.log('info', `Wait completed after ${Math.round(waitTime / 1000)} seconds`);

      // Pass through input data
      const outputData = {
        waitTime: Math.round(waitTime / 1000),
        timestamp: new Date().toISOString(),
        ...inputData
      };

      const output = this.createOutput(outputData);
      return this.createSuccessResult(output);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.log('error', `Wait node failed: ${errorMessage}`);
      return this.createErrorResult(`Wait node failed: ${errorMessage}`);
    }
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.SCHEDULE, // Using SCHEDULE as closest type for wait
      category: NodeCategory.LOGIC,
      name: 'Wait/Delay',
      description: 'Add time-based delays to workflow execution',
      icon: '⏱️',
      inputs: [
        {
          name: 'main',
          type: 'any',
          required: false,
          description: 'Optional input data to pass through after delay'
        }
      ],
      outputs: [
        {
          name: 'main',
          type: 'any',
          required: true,
          description: 'Input data passed through with timing information'
        }
      ],
      configSchema: {
        waitType: {
          type: 'select',
          label: 'Wait Type',
          description: 'How to determine the wait duration',
          required: true,
          default: 'fixed',
          options: [
            { label: 'Fixed Duration', value: 'fixed' },
            { label: 'Random Duration', value: 'random' },
            { label: 'From Variable', value: 'variable' }
          ]
        },
        duration: {
          type: 'number',
          label: 'Duration (seconds)',
          description: 'Fixed wait duration in seconds',
          required: false,
          default: 5,
          validation: { min: 0.1, max: 3600 }
        },
        minDuration: {
          type: 'number',
          label: 'Min Duration (seconds)',
          description: 'Minimum wait duration for random wait',
          required: false,
          default: 1,
          validation: { min: 0.1, max: 3600 }
        },
        maxDuration: {
          type: 'number',
          label: 'Max Duration (seconds)',
          description: 'Maximum wait duration for random wait',
          required: false,
          default: 10,
          validation: { min: 0.1, max: 3600 }
        },
        variableName: {
          type: 'string',
          label: 'Variable Name',
          description: 'Name of variable containing wait duration (use without {{}})',
          required: false,
          default: ''
        },
        minWait: {
          type: 'number',
          label: 'Minimum Wait (seconds)',
          description: 'Absolute minimum wait time (safety limit)',
          required: false,
          default: 0,
          validation: { min: 0, max: 60 }
        },
        maxWait: {
          type: 'number',
          label: 'Maximum Wait (seconds)',
          description: 'Absolute maximum wait time (safety limit)',
          required: false,
          default: 300,
          validation: { min: 1, max: 3600 }
        }
      },
      defaultConfig: {
        waitType: 'fixed',
        duration: 5,
        minDuration: 1,
        maxDuration: 10,
        variableName: '',
        minWait: 0,
        maxWait: 300
      }
    };
  }
}
