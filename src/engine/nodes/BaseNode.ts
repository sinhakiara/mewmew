import { NodeInput, NodeOutput, WorkflowNode, ExecutionContext, NodeExecutionResult, NodeDefinition } from '../types/WorkflowTypes';

export abstract class BaseNode {
  protected node: WorkflowNode;
  protected context: ExecutionContext;

  constructor(node: WorkflowNode, context: ExecutionContext) {
    this.node = node;
    this.context = context;
  }

  // Abstract methods that must be implemented by subclasses
  abstract execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult>;
  abstract getDefinition(): NodeDefinition;

  // Common validation methods
  protected validateInputs(inputs: Record<string, NodeInput>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const definition = this.getDefinition();

    // Check required inputs
    for (const inputDef of definition.inputs) {
      if (inputDef.required && !inputs[inputDef.name]) {
        errors.push(`Required input '${inputDef.name}' is missing`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  protected validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const definition = this.getDefinition();
    const config = this.node.config;

    // Validate configuration fields
    for (const [fieldName, fieldDef] of Object.entries(definition.configSchema)) {
      const value = config[fieldName];

      if (fieldDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required configuration '${fieldDef.label}' is missing`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        switch (fieldDef.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Configuration '${fieldDef.label}' must be a number`);
            } else if (fieldDef.validation) {
              const num = Number(value);
              if (fieldDef.validation.min !== undefined && num < fieldDef.validation.min) {
                errors.push(`Configuration '${fieldDef.label}' must be at least ${fieldDef.validation.min}`);
              }
              if (fieldDef.validation.max !== undefined && num > fieldDef.validation.max) {
                errors.push(`Configuration '${fieldDef.label}' must be at most ${fieldDef.validation.max}`);
              }
            }
            break;

          case 'string':
            if (typeof value !== 'string') {
              errors.push(`Configuration '${fieldDef.label}' must be a string`);
            } else if (fieldDef.validation?.pattern) {
              const regex = new RegExp(fieldDef.validation.pattern);
              if (!regex.test(value)) {
                errors.push(`Configuration '${fieldDef.label}' format is invalid`);
              }
            }
            break;

          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Configuration '${fieldDef.label}' must be a boolean`);
            }
            break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Helper methods for common operations
  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    this.context.logs.push({
      id: `${this.context.executionId}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level,
      nodeId: this.node.id,
      message,
      data
    });
  }

  protected createOutput(data: any, success: boolean = true, error?: string): NodeOutput {
    return {
      data: data || {},
      success,
      error,
      metadata: {
        executionTime: Date.now() - this.context.startTime,
        timestamp: Date.now(),
        nodeId: this.node.id
      }
    };
  }

  protected createSuccessResult(output: NodeOutput, nextNodes?: string[]): NodeExecutionResult {
    return {
      success: true,
      output,
      shouldContinue: true,
      nextNodes
    };
  }

  protected createErrorResult(error: string): NodeExecutionResult {
    this.log('error', error);
    return {
      success: false,
      error,
      shouldContinue: false
    };
  }

  // Utility method to replace variables in strings
  protected replaceVariables(template: string, data: Record<string, any> = {}): string {
    let result = template;
    
    // Replace workflow variables
    for (const [key, value] of Object.entries(this.context.variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    // Replace input data variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  // Method to get input data with fallback
  protected getInputData(inputs: Record<string, NodeInput>, inputName: string, fallback?: any): any {
    const input = inputs[inputName];
    if (input?.data) {
      return input.data;
    }
    return fallback;
  }

  // Method to merge multiple inputs
  protected mergeInputs(inputs: Record<string, NodeInput>): any {
    const merged: any = {};
    
    for (const [name, input] of Object.entries(inputs)) {
      if (input?.data) {
        if (Array.isArray(input.data)) {
          merged[name] = input.data;
        } else if (typeof input.data === 'object') {
          Object.assign(merged, input.data);
        } else {
          merged[name] = input.data;
        }
      }
    }
    
    return merged;
  }
}
