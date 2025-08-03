import { BaseNode } from './BaseNode';
import { NodeInput, NodeExecutionResult, NodeCategory } from '../types/WorkflowTypes';

export abstract class LogicNode extends BaseNode {
  // Execute logical operations without external API calls
  protected async executeLogicOperation(operation: (inputs: Record<string, NodeInput>) => any): Promise<NodeExecutionResult> {
    try {
      this.log('info', `Executing logic operation: ${this.node.type}`);
      
      const result = operation({});
      
      this.log('info', `Logic operation completed successfully`);
      
      const output = this.createOutput(result);
      return this.createSuccessResult(output);
      
    } catch (error) {
      const errorMessage = `Logic operation failed: ${error}`;
      this.log('error', errorMessage);
      return this.createErrorResult(errorMessage);
    }
  }

  // Common method for conditional evaluation
  protected evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation - can be extended with a proper expression parser
      const operators = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith'];
      
      for (const op of operators) {
        if (condition.includes(op)) {
          const [left, right] = condition.split(op).map(s => s.trim());
          const leftValue = this.getValue(left, data);
          const rightValue = this.getValue(right, data);
          
          switch (op) {
            case '==':
              return leftValue == rightValue;
            case '!=':
              return leftValue != rightValue;
            case '>':
              return Number(leftValue) > Number(rightValue);
            case '<':
              return Number(leftValue) < Number(rightValue);
            case '>=':
              return Number(leftValue) >= Number(rightValue);
            case '<=':
              return Number(leftValue) <= Number(rightValue);
            case 'contains':
              return String(leftValue).includes(String(rightValue));
            case 'startsWith':
              return String(leftValue).startsWith(String(rightValue));
            case 'endsWith':
              return String(leftValue).endsWith(String(rightValue));
          }
        }
      }
      
      // If no operator found, evaluate as boolean
      return Boolean(this.getValue(condition, data));
      
    } catch (error) {
      this.log('warn', `Condition evaluation failed: ${error}, returning false`);
      return false;
    }
  }

  // Helper to get value from data using dot notation
  private getValue(path: string, data: any): any {
    // Remove quotes if present
    path = path.replace(/^['"]|['"]$/g, '');
    
    // If it's a literal value (starts with quotes), return as-is
    if (/^['"]/.test(path)) {
      return path.slice(1, -1);
    }
    
    // If it's a number, return as number
    if (!isNaN(Number(path))) {
      return Number(path);
    }
    
    // Otherwise, treat as property path
    const parts = path.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Common filter operation
  protected filterData(data: any[], condition: string): any[] {
    if (!Array.isArray(data)) {
      this.log('warn', 'Filter input is not an array, wrapping in array');
      data = [data];
    }
    
    return data.filter(item => this.evaluateCondition(condition, item));
  }

  // Common merge operation
  protected mergeData(inputs: Record<string, NodeInput>): any {
    const merged: any = {
      items: [],
      sources: []
    };
    
    for (const [inputName, input] of Object.entries(inputs)) {
      if (input?.data) {
        merged.sources.push(inputName);
        
        if (Array.isArray(input.data)) {
          merged.items.push(...input.data);
        } else if (input.data.subdomains && Array.isArray(input.data.subdomains)) {
          merged.items.push(...input.data.subdomains);
        } else if (input.data.findings && Array.isArray(input.data.findings)) {
          merged.items.push(...input.data.findings);
        } else if (input.data.results && Array.isArray(input.data.results)) {
          merged.items.push(...input.data.results);
        } else {
          merged.items.push(input.data);
        }
      }
    }
    
    // Remove duplicates
    merged.items = [...new Set(merged.items)];
    merged.count = merged.items.length;
    
    return merged;
  }

  // Common split operation
  protected splitData(data: any, splitBy: string, splitValue?: string): { true: any[], false: any[] } {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    const result = { true: [] as any[], false: [] as any[] };
    
    data.forEach(item => {
      let condition = false;
      
      if (splitBy === 'severity' && item.severity) {
        condition = splitValue ? item.severity === splitValue : ['high', 'critical'].includes(item.severity);
      } else if (splitBy === 'status' && item.status) {
        condition = splitValue ? String(item.status) === splitValue : [200, 201, 202].includes(item.status);
      } else if (splitBy === 'length' && item.length) {
        condition = splitValue ? item.length > Number(splitValue) : item.length > 1000;
      } else if (splitBy === 'custom' && splitValue) {
        condition = this.evaluateCondition(splitValue, item);
      }
      
      result[condition ? 'true' : 'false'].push(item);
    });
    
    return result;
  }

  // Method to get category
  getCategory(): NodeCategory {
    return NodeCategory.LOGIC;
  }
}
