import { LogicNode } from '../LogicNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class MergeNode extends LogicNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    const mergeType = config.merge_type || 'union';
    
    return this.executeLogicOperation((nodeInputs) => {
      // Merge all inputs
      const merged = this.mergeData(inputs);
      
      // Apply merge strategy
      let result = merged;
      
      switch (mergeType) {
        case 'union':
          // Default behavior - already implemented in mergeData
          break;
          
        case 'intersection':
          result = this.findIntersection(inputs);
          break;
          
        case 'deduplicate':
          // Remove duplicates from merged items
          result.items = [...new Set(result.items)];
          result.count = result.items.length;
          break;
          
        case 'flatten':
          // Flatten nested arrays
          result.items = this.flattenArray(result.items);
          result.count = result.items.length;
          break;
      }
      
      this.log('info', `Merged ${inputs ? Object.keys(inputs).length : 0} inputs into ${result.count} items`, {
        mergeType,
        inputCount: inputs ? Object.keys(inputs).length : 0,
        outputCount: result.count
      });
      
      return result;
    });
  }

  private findIntersection(inputs: Record<string, NodeInput>): any {
    const inputArrays: any[][] = [];
    
    for (const [inputName, input] of Object.entries(inputs)) {
      if (input?.data) {
        let items: any[] = [];
        
        if (Array.isArray(input.data)) {
          items = input.data;
        } else if (input.data.subdomains && Array.isArray(input.data.subdomains)) {
          items = input.data.subdomains;
        } else if (input.data.findings && Array.isArray(input.data.findings)) {
          items = input.data.findings;
        } else if (input.data.results && Array.isArray(input.data.results)) {
          items = input.data.results;
        } else if (input.data.items && Array.isArray(input.data.items)) {
          items = input.data.items;
        }
        
        inputArrays.push(items);
      }
    }
    
    if (inputArrays.length === 0) {
      return { items: [], count: 0, sources: [] };
    }
    
    // Find intersection of all arrays
    let intersection = inputArrays[0];
    for (let i = 1; i < inputArrays.length; i++) {
      intersection = intersection.filter(item => 
        inputArrays[i].some(otherItem => 
          JSON.stringify(item) === JSON.stringify(otherItem)
        )
      );
    }
    
    return {
      items: intersection,
      count: intersection.length,
      sources: Object.keys(inputs),
      mergeType: 'intersection'
    };
  }

  private flattenArray(arr: any[]): any[] {
    const flattened: any[] = [];
    
    const flatten = (item: any) => {
      if (Array.isArray(item)) {
        item.forEach(flatten);
      } else {
        flattened.push(item);
      }
    };
    
    arr.forEach(flatten);
    return flattened;
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.MERGE,
      category: NodeCategory.LOGIC,
      name: 'Merge',
      description: 'Combine data from multiple inputs',
      icon: '🔗',
      inputs: [
        {
          name: 'input1',
          type: 'any',
          required: false,
          description: 'First input to merge'
        },
        {
          name: 'input2',
          type: 'any',
          required: false,
          description: 'Second input to merge'
        },
        {
          name: 'input3',
          type: 'any',
          required: false,
          description: 'Third input to merge'
        }
      ],
      outputs: [
        {
          name: 'merged',
          type: 'any',
          required: true,
          description: 'Merged data'
        }
      ],
      configSchema: {
        merge_type: {
          type: 'select',
          label: 'Merge Type',
          description: 'How to combine the inputs',
          default: 'union',
          options: [
            { label: 'Union (combine all)', value: 'union' },
            { label: 'Intersection (common items)', value: 'intersection' },
            { label: 'Deduplicate (remove duplicates)', value: 'deduplicate' },
            { label: 'Flatten (flatten nested arrays)', value: 'flatten' }
          ]
        },
        preserve_structure: {
          type: 'boolean',
          label: 'Preserve Original Structure',
          description: 'Keep original data structure when possible',
          default: true
        }
      },
      defaultConfig: {
        merge_type: 'union',
        preserve_structure: true
      }
    };
  }
}
