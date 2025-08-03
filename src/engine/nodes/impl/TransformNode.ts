import { BaseNode } from '../BaseNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class TransformNode extends BaseNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    const transformType = config.transform_type || 'map';
    
    try {
      this.log('info', `Executing transform: ${transformType}`);
      
      const inputData = this.mergeInputs(inputs);
      let result: any;
      
      switch (transformType) {
        case 'map':
          result = this.mapTransform(inputData, config.map_expression || 'item');
          break;
          
        case 'extract':
          result = this.extractFields(inputData, config.extract_fields || '');
          break;
          
        case 'format':
          result = this.formatData(inputData, config.format_template || '{{item}}');
          break;
          
        case 'aggregate':
          result = this.aggregateData(inputData, config.aggregate_by || 'count');
          break;
          
        case 'sort':
          result = this.sortData(inputData, config.sort_by || 'value', config.sort_order || 'asc');
          break;
          
        case 'limit':
          result = this.limitData(inputData, config.limit_count || 10);
          break;
          
        default:
          throw new Error(`Unknown transform type: ${transformType}`);
      }
      
      this.log('info', `Transform completed successfully`, { 
        transformType,
        inputSize: Array.isArray(inputData) ? inputData.length : 1,
        outputSize: Array.isArray(result) ? result.length : 1
      });
      
      const output = this.createOutput(result);
      return this.createSuccessResult(output);
      
    } catch (error) {
      const errorMessage = `Transform failed: ${error}`;
      this.log('error', errorMessage);
      return this.createErrorResult(errorMessage);
    }
  }

  private mapTransform(data: any, expression: string): any {
    // Simple expression evaluation - can be extended
    const items = this.extractArrayFromData(data);
    
    return items.map(item => {
      try {
        // Replace placeholders in expression
        let result = expression
          .replace(/{{item}}/g, JSON.stringify(item))
          .replace(/{{item\.(\w+)}}/g, (match, prop) => {
            return item && typeof item === 'object' ? item[prop] : '';
          });
        
        // Try to parse as JSON if it looks like an object
        if (result.startsWith('{') || result.startsWith('[')) {
          try {
            return JSON.parse(result);
          } catch {
            return result;
          }
        }
        
        return result;
      } catch {
        return item;
      }
    });
  }

  private extractFields(data: any, fields: string): any {
    const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean);
    const items = this.extractArrayFromData(data);
    
    return items.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }
      
      const extracted: any = {};
      for (const field of fieldList) {
        if (field in item) {
          extracted[field] = item[field];
        }
      }
      
      return extracted;
    });
  }

  private formatData(data: any, template: string): any {
    const items = this.extractArrayFromData(data);
    
    return items.map(item => {
      let formatted = template;
      
      // Replace simple placeholders
      formatted = formatted.replace(/{{item}}/g, String(item));
      
      // Replace object property placeholders
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          const regex = new RegExp(`{{item\\.${key}}}`, 'g');
          formatted = formatted.replace(regex, String(value));
        }
      }
      
      return formatted;
    });
  }

  private aggregateData(data: any, aggregateBy: string): any {
    const items = this.extractArrayFromData(data);
    
    switch (aggregateBy) {
      case 'count':
        return { count: items.length, items };
        
      case 'unique':
        const unique = [...new Set(items.map(item => JSON.stringify(item)))].map(s => JSON.parse(s));
        return { count: unique.length, unique, total: items.length };
        
      case 'group':
        const groups: Record<string, any[]> = {};
        items.forEach(item => {
          const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        return { groups, groupCount: Object.keys(groups).length };
        
      default:
        return { count: items.length, items };
    }
  }

  private sortData(data: any, sortBy: string, order: 'asc' | 'desc'): any {
    const items = this.extractArrayFromData(data);
    
    const sorted = items.slice().sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy === 'value') {
        aVal = a;
        bVal = b;
      } else if (typeof a === 'object' && a !== null && sortBy in a) {
        aVal = a[sortBy];
        bVal = b && typeof b === 'object' && sortBy in b ? b[sortBy] : '';
      } else {
        return 0;
      }
      
      // Convert to strings for comparison
      aVal = String(aVal);
      bVal = String(bVal);
      
      if (order === 'desc') {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
    
    return sorted;
  }

  private limitData(data: any, limit: number): any {
    const items = this.extractArrayFromData(data);
    return items.slice(0, Math.max(0, limit));
  }

  private extractArrayFromData(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if (data.subdomains && Array.isArray(data.subdomains)) {
        return data.subdomains;
      } else if (data.findings && Array.isArray(data.findings)) {
        return data.findings;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
    }
    
    return [data];
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.TRANSFORM,
      category: NodeCategory.DATA,
      name: 'Transform',
      description: 'Transform and manipulate data',
      icon: '🔄',
      inputs: [
        {
          name: 'data',
          type: 'any',
          required: true,
          description: 'Data to transform'
        }
      ],
      outputs: [
        {
          name: 'transformed',
          type: 'any',
          required: true,
          description: 'Transformed data'
        }
      ],
      configSchema: {
        transform_type: {
          type: 'select',
          label: 'Transform Type',
          description: 'Type of transformation to apply',
          default: 'map',
          options: [
            { label: 'Map (apply expression)', value: 'map' },
            { label: 'Extract Fields', value: 'extract' },
            { label: 'Format Template', value: 'format' },
            { label: 'Aggregate', value: 'aggregate' },
            { label: 'Sort', value: 'sort' },
            { label: 'Limit', value: 'limit' }
          ]
        },
        map_expression: {
          type: 'textarea',
          label: 'Map Expression',
          description: 'Expression to apply to each item (use {{item}} for value, {{item.field}} for properties)'
        },
        extract_fields: {
          type: 'string',
          label: 'Fields to Extract',
          description: 'Comma-separated list of fields to extract from objects'
        },
        format_template: {
          type: 'textarea',
          label: 'Format Template',
          description: 'Template for formatting items (use {{item}} and {{item.field}} placeholders)'
        },
        aggregate_by: {
          type: 'select',
          label: 'Aggregate By',
          description: 'How to aggregate the data',
          options: [
            { label: 'Count', value: 'count' },
            { label: 'Unique', value: 'unique' },
            { label: 'Group', value: 'group' }
          ]
        },
        sort_by: {
          type: 'string',
          label: 'Sort By',
          description: 'Field to sort by (use "value" for primitive values)'
        },
        sort_order: {
          type: 'select',
          label: 'Sort Order',
          description: 'Ascending or descending order',
          options: [
            { label: 'Ascending', value: 'asc' },
            { label: 'Descending', value: 'desc' }
          ]
        },
        limit_count: {
          type: 'number',
          label: 'Limit Count',
          description: 'Maximum number of items to keep',
          validation: { min: 1, max: 10000 }
        }
      },
      defaultConfig: {
        transform_type: 'map'
      }
    };
  }

  getCategory(): NodeCategory {
    return NodeCategory.DATA;
  }
}
