import { BaseNode } from './BaseNode';
import { NodeInput, NodeExecutionResult, NodeCategory } from '../types/WorkflowTypes';

export abstract class DiscoveryNode extends BaseNode {
  // Common method for executing discovery tools
  protected async executeDiscoveryTool(command: string, parseOutput?: (output: string) => any): Promise<NodeExecutionResult> {
    const validation = this.validateInputs({});
    if (!validation.valid) {
      return this.createErrorResult(`Input validation failed: ${validation.errors.join(', ')}`);
    }

    const configValidation = this.validateConfig();
    if (!configValidation.valid) {
      return this.createErrorResult(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
    }

    try {
      this.log('info', `Starting discovery with command: ${command}`);
      
      // Execute the tool via API
      const result = await this.executeCommand(command);
      
      // Parse the output if parser provided
      const parsedData = parseOutput ? parseOutput(result) : { raw: result };
      
      this.log('info', `Discovery completed successfully`, { 
        resultCount: Array.isArray(parsedData.items) ? parsedData.items.length : 'unknown'
      });

      const output = this.createOutput(parsedData);
      return this.createSuccessResult(output);

    } catch (error) {
      const errorMessage = `Discovery tool execution failed: ${error}`;
      this.log('error', errorMessage);
      return this.createErrorResult(errorMessage);
    }
  }

  // Common method to execute commands via the API
  private async executeCommand(command: string): Promise<string> {
    const baseUrl = this.context.variables.apiBaseUrl || 'https://192.168.29.20:8000';
    const authToken = this.context.variables.authToken || localStorage.getItem('dheeraj_token');

    // Submit task
    const taskResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ command }),
    });

    if (!taskResponse.ok) {
      throw new Error(`API call failed: ${taskResponse.statusText}`);
    }

    const taskData = await taskResponse.json();
    const taskId = taskData.task_id;

    // Poll for completion
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/tasks/${taskId}`, {
            headers: {
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          });

          if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${statusResponse.statusText}`);
          }

          const status = await statusResponse.json();

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            resolve(status.output);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(`Task failed: ${status.output}`));
          }
          // Continue polling if still running
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Task timeout'));
      }, 300000);
    });
  }

  // Common parser for subdomain discovery tools
  protected parseSubdomainOutput(rawOutput: string): any {
    const lines = rawOutput.split('\n').filter(line => line.trim());
    const subdomains = lines.filter(line => {
      // Basic domain validation
      return /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\./.test(line.trim());
    });

    return {
      subdomains: subdomains.map(s => s.trim()),
      count: subdomains.length,
      raw: rawOutput
    };
  }

  // Common method to build command with input substitution
  protected buildCommand(template: string, inputs: Record<string, NodeInput>): string {
    let command = template;

    // Replace {{input}} with data from connected inputs
    const mergedInputs = this.mergeInputs(inputs);
    
    if (mergedInputs.subdomains && Array.isArray(mergedInputs.subdomains)) {
      // Use first subdomain or domain
      command = command.replace(/\{\{input\}\}/g, mergedInputs.subdomains[0] || '');
    } else if (mergedInputs.domain) {
      command = command.replace(/\{\{input\}\}/g, mergedInputs.domain);
    } else if (typeof mergedInputs === 'string') {
      command = command.replace(/\{\{input\}\}/g, mergedInputs);
    }

    // Replace other configuration variables
    command = this.replaceVariables(command, this.node.config);

    return command;
  }

  // Method to get category
  getCategory(): NodeCategory {
    return NodeCategory.DISCOVERY;
  }
}
