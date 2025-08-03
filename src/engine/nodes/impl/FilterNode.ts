import { LogicNode } from '../LogicNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class FilterNode extends LogicNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    const filterCondition = config.condition || 'true';
    const mode = config.mode || 'include'; // 'include' or 'exclude'
    
    return this.executeLogicOperation((nodeInputs) => {
      // Get the input data
      const inputData = this.mergeInputs(inputs);
      
      let dataToFilter: any[] = [];
      
      // Extract array data from various possible structures
      if (Array.isArray(inputData)) {
        dataToFilter = inputData;
      } else if (inputData.subdomains && Array.isArray(inputData.subdomains)) {
        dataToFilter = inputData.subdomains.map((sub: string) => ({ subdomain: sub }));
      } else if (inputData.findings && Array.isArray(inputData.findings)) {
        dataToFilter = inputData.findings;
      } else if (inputData.results && Array.isArray(inputData.results)) {
        dataToFilter = inputData.results;
      } else if (inputData.items && Array.isArray(inputData.items)) {
        dataToFilter = inputData.items;
      } else {
        dataToFilter = [inputData];
      }
      
      // Apply filter
      const filtered = this.applyFilter(dataToFilter, filterCondition, mode);
      
      this.log('info', `Filtered ${dataToFilter.length} items to ${filtered.length} items`, {
        condition: filterCondition,
        mode,
        originalCount: dataToFilter.length,
        filteredCount: filtered.length
      });
      
      // Return filtered data in appropriate structure
      {/*      const output = { */}
      const output: any = {
        items: filtered,
        count: filtered.length,
        originalCount: dataToFilter.length,
        filter: {
          condition: filterCondition,
          mode
        }
      };
      
      // Preserve original structure if it was subdomains/findings/results
      if (inputData.subdomains) {
        output.subdomains = filtered.map(item => item.subdomain || item);
      } else if (inputData.findings) {
        output.findings = filtered;
      } else if (inputData.results) {
        output.results = filtered;
      }
      
      return output;
    });
  }

  private applyFilter(data: any[], condition: string, mode: 'include' | 'exclude'): any[] {
    try {
      const filtered = data.filter(item => {
        const matches = this.evaluateCondition(condition, item);
        return mode === 'include' ? matches : !matches;
      });
      
      return filtered;
    } catch (error) {
      this.log('warn', `Filter condition failed: ${error}, returning original data`);
      return data;
    }
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.FILTER,
      category: NodeCategory.LOGIC,
      name: 'Filter',
      description: 'Filter data based on conditions',
      icon: '🔽',
      inputs: [
        {
          name: 'data',
          type: 'array',
          required: true,
          description: 'Data to filter'
        }
      ],
      outputs: [
        {
          name: 'filtered',
          type: 'array',
          required: true,
          description: 'Filtered data'
        }
      ],
      configSchema: {
        condition: {
          type: 'string',
          label: 'Filter Condition',
          description: 'Condition to filter by (e.g., "severity == high", "status == 200")',
          required: true,
          default: 'length > 0'
        },
        mode: {
          type: 'select',
          label: 'Filter Mode',
          description: 'Whether to include or exclude items matching the condition',
          default: 'include',
          options: [
            { label: 'Include matching items', value: 'include' },
            { label: 'Exclude matching items', value: 'exclude' }
          ]
        },
        description: {
          type: 'textarea',
          label: 'Description',
          description: 'Description of what this filter does'
        }
      },
      defaultConfig: {
        condition: 'length > 0',
        mode: 'include'
      }
    };
  }
}
