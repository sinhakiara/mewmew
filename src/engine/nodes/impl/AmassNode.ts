import { DiscoveryNode } from '../DiscoveryNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class AmassNode extends DiscoveryNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    
    // Build command template
    const mode = config.mode === 'active' ? 'enum' : 'intel';
    const commandTemplate = `amass ${mode} -d {{input}} -timeout ${config.timeout || 60}`;
    
    // Build final command with input substitution
    const command = this.buildCommand(commandTemplate, inputs);
    
    // Execute using parent class method with subdomain parser
    return this.executeDiscoveryTool(command, (output) => this.parseSubdomainOutput(output));
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.AMASS,
      category: NodeCategory.DISCOVERY,
      name: 'Amass',
      description: 'In-depth attack surface mapping and asset discovery',
      icon: '🌐',
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
          description: 'Domain to enumerate subdomains for',
          required: false
        },
        mode: {
          type: 'select',
          label: 'Enumeration Mode',
          description: 'Active or passive enumeration',
          default: 'passive',
          options: [
            { label: 'Passive (Intel)', value: 'passive' },
            { label: 'Active (Enum)', value: 'active' }
          ]
        },
        timeout: {
          type: 'number',
          label: 'Timeout (minutes)',
          description: 'Maximum execution time',
          default: 60,
          validation: { min: 1, max: 1440 }
        },
        sources: {
          type: 'multiselect',
          label: 'Data Sources',
          description: 'Specific data sources to use',
          options: [
            { label: 'All Sources', value: 'all' },
            { label: 'Certificate Transparency', value: 'cert' },
            { label: 'DNS Records', value: 'dns' },
            { label: 'Scraping', value: 'scrape' },
            { label: 'Archives', value: 'archive' },
            { label: 'API Keys Required', value: 'api' }
          ]
        },
        resolvers: {
          type: 'textarea',
          label: 'Custom Resolvers',
          description: 'Custom DNS resolvers (one per line)'
        }
      },
      defaultConfig: {
        mode: 'passive',
        timeout: 60
      }
    };
  }
}
