import { DiscoveryNode } from '../DiscoveryNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class SubfinderNode extends DiscoveryNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    
    // Build command template
    const commandTemplate = `subfinder -d {{input}} -t ${config.threads || 10} -timeout ${config.timeout || 30} -silent`;
    
    // Build final command with input substitution
    const command = this.buildCommand(commandTemplate, inputs);
    
    // Execute using parent class method with subdomain parser
    return this.executeDiscoveryTool(command, (output) => this.parseSubdomainOutput(output));
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.SUBFINDER,
      category: NodeCategory.DISCOVERY,
      name: 'Subfinder',
      description: 'Fast passive subdomain enumeration tool',
      icon: '🔍',
      inputs: [
        {
          name: 'domain',
          type: 'string',
          required: false,
          description: 'Target domain (can be provided via connection or config)'
        }
      ],
      outputs: [
        {
          name: 'subdomains',
          type: 'array',
          required: true,
          description: 'Discovered subdomains'
        }
      ],
      configSchema: {
        domain: {
          type: 'string',
          label: 'Target Domain',
          description: 'Domain to enumerate subdomains for (e.g., example.com)',
          required: false
        },
        threads: {
          type: 'number',
          label: 'Threads',
          description: 'Number of concurrent threads',
          default: 10,
          validation: { min: 1, max: 100 }
        },
        timeout: {
          type: 'number',
          label: 'Timeout (seconds)',
          description: 'Timeout for each thread',
          default: 30,
          validation: { min: 1, max: 300 }
        },
        sources: {
          type: 'multiselect',
          label: 'Sources',
          description: 'Specific sources to use',
          options: [
            { label: 'All Sources', value: 'all' },
            { label: 'Certificate Transparency', value: 'certspotter' },
            { label: 'DNS Dumpster', value: 'dnsdumpster' },
            { label: 'Hackertarget', value: 'hackertarget' },
            { label: 'Shodan', value: 'shodan' },
            { label: 'Virustotal', value: 'virustotal' }
          ]
        },
        resolvers: {
          type: 'textarea',
          label: 'Custom Resolvers',
          description: 'Custom DNS resolvers (one per line)'
        }
      },
      defaultConfig: {
        threads: 10,
        timeout: 30,
        sources: ['all']
      }
    };
  }
}
