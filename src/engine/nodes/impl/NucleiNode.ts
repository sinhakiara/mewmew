import { AnalysisNode } from '../AnalysisNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class NucleiNode extends AnalysisNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    
    // Build command template
    const severities = Array.isArray(config.severity) ? config.severity.join(',') : config.severity || 'info,low,medium,high,critical';
    let commandTemplate = `nuclei -u "{{input}}" -severity ${severities} -json`;
    
    // Add additional options
    if (config.templates) {
      commandTemplate += ` -t ${config.templates}`;
    }
    
    if (config.tags) {
      commandTemplate += ` -tags ${config.tags}`;
    }
    
    if (config.exclude_tags) {
      commandTemplate += ` -exclude-tags ${config.exclude_tags}`;
    }
    
    if (config.rate_limit) {
      commandTemplate += ` -rate-limit ${config.rate_limit}`;
    }
    
    if (config.timeout) {
      commandTemplate += ` -timeout ${config.timeout}`;
    }
    
    // Build final command with input substitution
    const command = this.buildCommand(commandTemplate, inputs);
    
    // Execute using parent class method with nuclei parser
    return this.executeAnalysisTool(command, (output) => this.parseNucleiOutput(output));
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.NUCLEI,
      category: NodeCategory.ANALYSIS,
      name: 'Nuclei',
      description: 'Fast and customizable vulnerability scanner',
      icon: '🎯',
      inputs: [
        {
          name: 'target',
          type: 'string',
          required: false,
          description: 'Target URL or domain (can be provided via connection or config)'
        }
      ],
      outputs: [
        {
          name: 'findings',
          type: 'array',
          required: true,
          description: 'Security findings and vulnerabilities'
        }
      ],
      configSchema: {
        target: {
          type: 'string',
          label: 'Target URL/Domain',
          description: 'Target to scan (e.g., https://example.com or example.com)',
          required: false
        },
        severity: {
          type: 'multiselect',
          label: 'Severity Levels',
          description: 'Severity levels to include in scan',
          default: ['info', 'low', 'medium', 'high', 'critical'],
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' }
          ]
        },
        templates: {
          type: 'string',
          label: 'Templates',
          description: 'Specific templates to use (e.g., cves/, exposures/)'
        },
        tags: {
          type: 'string',
          label: 'Include Tags',
          description: 'Tags to include (comma-separated, e.g., sqli,xss)'
        },
        exclude_tags: {
          type: 'string',
          label: 'Exclude Tags',
          description: 'Tags to exclude (comma-separated)'
        },
        rate_limit: {
          type: 'number',
          label: 'Rate Limit',
          description: 'Maximum requests per second',
          default: 150,
          validation: { min: 1, max: 1000 }
        },
        timeout: {
          type: 'number',
          label: 'Timeout (seconds)',
          description: 'Request timeout',
          default: 5,
          validation: { min: 1, max: 60 }
        },
        headers: {
          type: 'textarea',
          label: 'Custom Headers',
          description: 'Custom headers (one per line, format: Header: Value)'
        },
        proxy: {
          type: 'string',
          label: 'Proxy',
          description: 'HTTP proxy (e.g., http://127.0.0.1:8080)'
        }
      },
      defaultConfig: {
        severity: ['info', 'low', 'medium', 'high', 'critical'],
        rate_limit: 150,
        timeout: 5
      }
    };
  }
}
