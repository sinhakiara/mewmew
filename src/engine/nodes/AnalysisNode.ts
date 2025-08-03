import { BaseNode } from './BaseNode';
import { NodeInput, NodeExecutionResult, NodeCategory } from '../types/WorkflowTypes';

export abstract class AnalysisNode extends BaseNode {
  // Common method for executing analysis tools
  protected async executeAnalysisTool(command: string, parseOutput?: (output: string) => any): Promise<NodeExecutionResult> {
    const validation = this.validateInputs({});
    if (!validation.valid) {
      return this.createErrorResult(`Input validation failed: ${validation.errors.join(', ')}`);
    }

    const configValidation = this.validateConfig();
    if (!configValidation.valid) {
      return this.createErrorResult(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
    }

    try {
      this.log('info', `Starting analysis with command: ${command}`);
      
      // Execute the tool via API
      const result = await this.executeCommand(command);
      
      // Parse the output if parser provided
      const parsedData = parseOutput ? parseOutput(result) : { raw: result };
      
      this.log('info', `Analysis completed successfully`, { 
        resultCount: Array.isArray(parsedData.findings) ? parsedData.findings.length : 
                    Array.isArray(parsedData.results) ? parsedData.results.length : 'unknown'
      });

      const output = this.createOutput(parsedData);
      return this.createSuccessResult(output);

    } catch (error) {
      const errorMessage = `Analysis tool execution failed: ${error}`;
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

      // Timeout after 10 minutes for analysis tools
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Task timeout'));
      }, 600000);
    });
  }

  // Common parser for nuclei findings
  protected parseNucleiOutput(rawOutput: string): any {
    const lines = rawOutput.split('\n').filter(line => line.trim());
    const findings: any[] = [];

    lines.forEach(line => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.info && parsed.matched) {
          findings.push({
            template: parsed.info.name,
            severity: parsed.info.severity,
            target: parsed.matched,
            description: parsed.info.description,
            reference: parsed.info.reference,
            tags: parsed.info.tags
          });
        }
      } catch {
        // Skip invalid JSON lines
      }
    });

    return {
      findings,
      count: findings.length,
      severityCounts: this.countBySeverity(findings),
      raw: rawOutput
    };
  }

  // Common parser for ffuf results
  protected parseFfufOutput(rawOutput: string): any {
    try {
      const parsed = JSON.parse(rawOutput);
      const results = parsed.results || [];

      return {
        results: results.map((r: any) => ({
          url: r.url,
          status: r.status,
          length: r.length,
          words: r.words,
          lines: r.lines
        })),
        count: results.length,
        statusCounts: this.countByStatus(results),
        raw: rawOutput
      };
    } catch {
      // Fallback to text parsing
      const lines = rawOutput.split('\n').filter(line => line.includes('Status:'));
      return {
        results: lines.map(line => ({ raw: line })),
        count: lines.length,
        raw: rawOutput
      };
    }
  }

  // Common parser for parameter discovery (Arjun)
  protected parseParameterOutput(rawOutput: string): any {
    const lines = rawOutput.split('\n');
    const parameters: string[] = [];

    lines.forEach(line => {
      if (line.includes('Parameter discovered:')) {
        const param = line.split('Parameter discovered:')[1]?.trim();
        if (param) {
          parameters.push(param);
        }
      }
    });

    return {
      parameters,
      count: parameters.length,
      raw: rawOutput
    };
  }

  // Helper method to count findings by severity
  private countBySeverity(findings: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    findings.forEach(finding => {
      const severity = finding.severity || 'unknown';
      counts[severity] = (counts[severity] || 0) + 1;
    });
    return counts;
  }

  // Helper method to count results by status
  private countByStatus(results: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    results.forEach(result => {
      const status = String(result.status || 'unknown');
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }

  // Common method to build command with input substitution
  protected buildCommand(template: string, inputs: Record<string, NodeInput>): string {
    let command = template;

    // Replace {{input}} with data from connected inputs
    const mergedInputs = this.mergeInputs(inputs);
    
    if (mergedInputs.subdomains && Array.isArray(mergedInputs.subdomains)) {
      // For analysis tools, might want to process multiple targets
      const target = mergedInputs.subdomains[0] || '';
      command = command.replace(/\{\{input\}\}/g, target);
    } else if (mergedInputs.urls && Array.isArray(mergedInputs.urls)) {
      const target = mergedInputs.urls[0] || '';
      command = command.replace(/\{\{input\}\}/g, target);
    } else if (mergedInputs.target) {
      command = command.replace(/\{\{input\}\}/g, mergedInputs.target);
    } else if (typeof mergedInputs === 'string') {
      command = command.replace(/\{\{input\}\}/g, mergedInputs);
    }

    // Replace other configuration variables
    command = this.replaceVariables(command, this.node.config);

    return command;
  }

  // Method to get category
  getCategory(): NodeCategory {
    return NodeCategory.ANALYSIS;
  }
}
