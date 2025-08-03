import { LogicNode } from '../LogicNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class IteratorNode extends LogicNode {
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
      
      // Get the data to iterate over
      let itemsToIterate: any[] = [];
      
      if (config.sourceType === 'input' && config.inputField) {
        const fieldPath = config.inputField.split('.');
        let data = inputData;
        
        for (const path of fieldPath) {
          if (data && typeof data === 'object' && path in data) {
            data = data[path];
          } else {
            data = undefined;
            break;
          }
        }
        
        if (Array.isArray(data)) {
          itemsToIterate = data;
        } else if (data !== undefined && data !== null) {
          itemsToIterate = [data];
        }
      } else if (config.sourceType === 'variable' && config.variableName) {
        const variableData = this.context.variables[config.variableName];
        if (Array.isArray(variableData)) {
          itemsToIterate = variableData;
        } else if (variableData !== undefined && variableData !== null) {
          itemsToIterate = [variableData];
        }
      } else if (config.sourceType === 'static' && config.staticItems) {
        try {
          itemsToIterate = JSON.parse(config.staticItems);
          if (!Array.isArray(itemsToIterate)) {
            itemsToIterate = [itemsToIterate];
          }
        } catch (e) {
          return this.createErrorResult(`Invalid static items JSON: ${e.message}`);
        }
      }

      if (itemsToIterate.length === 0) {
        this.log('warn', 'No items to iterate over');
        const output = this.createOutput({
          items: [],
          totalItems: 0,
          processedItems: 0
        });
        return this.createSuccessResult(output);
      }

      // Apply filters if configured
      if (config.filterCondition) {
        itemsToIterate = itemsToIterate.filter((item, index) => {
          try {
            // Simple condition evaluation
            const condition = config.filterCondition
              .replace(/\{\{item\}\}/g, JSON.stringify(item))
              .replace(/\{\{index\}\}/g, String(index));
            
            // This is a simplified evaluator - in production, use a proper expression evaluator
            return eval(condition);
          } catch (e) {
            this.log('warn', `Filter condition failed for item ${index}: ${e.message}`);
            return true; // Include item if filter fails
          }
        });
      }

      // Apply batch processing if configured
      const batchSize = config.batchSize || itemsToIterate.length;
      const batches: any[][] = [];
      
      for (let i = 0; i < itemsToIterate.length; i += batchSize) {
        batches.push(itemsToIterate.slice(i, i + batchSize));
      }

      this.log('info', `Processing ${itemsToIterate.length} items in ${batches.length} batch(es)`);

      const results: any[] = [];
      let processedCount = 0;

      // Process batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        if (config.batchDelay && batchIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, config.batchDelay * 1000));
        }

        // Process items in batch
        if (config.parallel) {
          // Process batch items in parallel
          const batchPromises = batch.map(async (item, itemIndex) => {
            const globalIndex = batchIndex * batchSize + itemIndex;
            return this.processItem(item, globalIndex, inputData);
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach((result, itemIndex) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              const globalIndex = batchIndex * batchSize + itemIndex;
              this.log('error', `Failed to process item ${globalIndex}: ${result.reason}`);
              results.push({ error: result.reason?.message || 'Unknown error', item: batch[itemIndex] });
            }
          });
        } else {
          // Process batch items sequentially
          for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
            const item = batch[itemIndex];
            const globalIndex = batchIndex * batchSize + itemIndex;
            
            try {
              const result = await this.processItem(item, globalIndex, inputData);
              results.push(result);
              
              if (config.itemDelay && itemIndex < batch.length - 1) {
                await new Promise(resolve => setTimeout(resolve, config.itemDelay * 1000));
              }
            } catch (error) {
              this.log('error', `Failed to process item ${globalIndex}: ${error}`);
              results.push({ error: error.message || 'Unknown error', item });
            }
          }
        }
        
        processedCount += batch.length;
        this.log('info', `Processed batch ${batchIndex + 1}/${batches.length} (${processedCount}/${itemsToIterate.length} items)`);
      }

      this.log('info', `Iterator completed: processed ${processedCount} items`);

      const outputData = {
        items: results,
        totalItems: itemsToIterate.length,
        processedItems: processedCount,
        batches: batches.length,
        metadata: {
          batchSize: batchSize,
          parallel: config.parallel || false,
          filtered: itemsToIterate.length !== (inputs.main?.data?.length || 0)
        }
      };

      const output = this.createOutput(outputData);
      return this.createSuccessResult(output);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.log('error', `Iterator node failed: ${errorMessage}`);
      return this.createErrorResult(`Iterator node failed: ${errorMessage}`);
    }
  }

  private async processItem(item: any, index: number, contextData: any): Promise<any> {
    // This method processes individual items
    // In a full implementation, this would trigger sub-workflow execution
    // For now, we'll just return the item with additional metadata
    
    return {
      index,
      item,
      processed: true,
      timestamp: new Date().toISOString(),
      context: contextData
    };
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.SPLIT, // Using SPLIT as closest type for iterator
      category: NodeCategory.LOGIC,
      name: 'Iterator/Loop',
      description: 'Iterate over collections of data with batch processing and filtering',
      icon: '🔄',
      inputs: [
        {
          name: 'main',
          type: 'any',
          required: false,
          description: 'Input data containing items to iterate over'
        }
      ],
      outputs: [
        {
          name: 'main',
          type: 'array',
          required: true,
          description: 'Array of processed items with metadata'
        }
      ],
      configSchema: {
        sourceType: {
          type: 'select',
          label: 'Data Source',
          description: 'Where to get the data to iterate over',
          required: true,
          default: 'input',
          options: [
            { label: 'Input Field', value: 'input' },
            { label: 'Variable', value: 'variable' },
            { label: 'Static Data', value: 'static' }
          ]
        },
        inputField: {
          type: 'string',
          label: 'Input Field Path',
          description: 'Path to the field containing array data (e.g., "results" or "data.items")',
          required: false,
          default: ''
        },
        variableName: {
          type: 'string',
          label: 'Variable Name',
          description: 'Name of workflow variable containing array data',
          required: false,
          default: ''
        },
        staticItems: {
          type: 'textarea',
          label: 'Static Items (JSON)',
          description: 'Static array of items as JSON',
          required: false,
          default: '[]'
        },
        batchSize: {
          type: 'number',
          label: 'Batch Size',
          description: 'Number of items to process in each batch (0 = all at once)',
          required: false,
          default: 10,
          validation: { min: 0, max: 1000 }
        },
        parallel: {
          type: 'boolean',
          label: 'Parallel Processing',
          description: 'Process items in batch simultaneously',
          required: false,
          default: false
        },
        batchDelay: {
          type: 'number',
          label: 'Batch Delay (seconds)',
          description: 'Delay between batches',
          required: false,
          default: 0,
          validation: { min: 0, max: 60 }
        },
        itemDelay: {
          type: 'number',
          label: 'Item Delay (seconds)',
          description: 'Delay between items (sequential processing only)',
          required: false,
          default: 0,
          validation: { min: 0, max: 60 }
        },
        filterCondition: {
          type: 'string',
          label: 'Filter Condition',
          description: 'JavaScript condition to filter items (use {{item}} and {{index}})',
          required: false,
          default: ''
        },
        maxItems: {
          type: 'number',
          label: 'Max Items',
          description: 'Maximum number of items to process (0 = unlimited)',
          required: false,
          default: 0,
          validation: { min: 0, max: 10000 }
        }
      },
      defaultConfig: {
        sourceType: 'input',
        inputField: '',
        variableName: '',
        staticItems: '[]',
        batchSize: 10,
        parallel: false,
        batchDelay: 0,
        itemDelay: 0,
        filterCondition: '',
        maxItems: 0
      }
    };
  }
}
