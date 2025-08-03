import { AnalysisNode } from '../AnalysisNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class FfufNode extends AnalysisNode {
  async execute(inputs: Record<string, NodeInput>): Promise<NodeExecutionResult> {
    const config = this.node.config;
    
    // Build command template
    let commandTemplate = `ffuf -u "{{input}}" -w ${config.wordlist || '/usr/share/wordlists/dirb/common.txt'}`;
    commandTemplate += ` -t ${config.threads || 40}`;
    commandTemplate += ` -fc ${config.filter_codes || '404'}`;
    commandTemplate += ` -o /tmp/ffuf_output.json -of json`;
    
    if (config.delay) {
      commandTemplate += ` -p ${config.delay}`;
    }
    
    if (config.extensions) {
      commandTemplate += ` -e ${config.extensions}`;
    }
    
    if (config.filter_size) {
      commandTemplate += ` -fs ${config.filter_size}`;
    }
    
    if (config.match_codes) {
      commandTemplate += ` -mc ${config.match_codes}`;
    }
    
    // Build final command with input substitution
    const command = this.buildCommand(commandTemplate, inputs);
    
    // Execute using parent class method with ffuf parser
    return this.executeAnalysisTool(command, (output) => this.parseFfufOutput(output));
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.FFUF,
      category: NodeCategory.ANALYSIS,
      name: 'FFUF',
      description: 'Fast web fuzzer for directory and file discovery',
      icon: '🔍',
      inputs: [
        {
          name: 'url',
          type: 'string',
          required: false,
          description: 'Target URL with FUZZ keyword (can be provided via connection or config)'
        }
      ],
      outputs: [
        {
          name: 'results',
          type: 'array',
          required: true,
          description: 'Discovered directories and files'
        }
      ],
      configSchema: {
        url: {
          type: 'string',
          label: 'Target URL',
          description: 'URL with FUZZ keyword (e.g., https://example.com/FUZZ)',
          required: false
        },
        wordlist: {
          type: 'string',
          label: 'Wordlist Path',
          description: 'Path to wordlist file',
          default: '/usr/share/wordlists/dirb/common.txt'
        },
        threads: {
          type: 'number',
          label: 'Threads',
          description: 'Number of concurrent threads',
          default: 40,
          validation: { min: 1, max: 200 }
        },
        delay: {
          type: 'number',
          label: 'Delay (seconds)',
          description: 'Delay between requests',
          validation: { min: 0, max: 60 }
        },
        extensions: {
          type: 'string',
          label: 'Extensions',
          description: 'File extensions to append (comma-separated, e.g., .php,.html,.js)'
        },
        filter_codes: {
          type: 'string',
          label: 'Filter Status Codes',
          description: 'HTTP status codes to filter out',
          default: '404'
        },
        match_codes: {
          type: 'string',
          label: 'Match Status Codes',
          description: 'HTTP status codes to match (overrides filter)'
        },
        filter_size: {
          type: 'string',
          label: 'Filter Response Size',
          description: 'Response sizes to filter out (comma-separated)'
        },
        headers: {
          type: 'textarea',
          label: 'Custom Headers',
          description: 'Custom headers (format: Header: Value, one per line)'
        },
        proxy: {
          type: 'string',
          label: 'Proxy',
          description: 'HTTP proxy (e.g., http://127.0.0.1:8080)'
        }
      },
      defaultConfig: {
        wordlist: '/usr/share/wordlists/dirb/common.txt',
        threads: 40,
        filter_codes: '404'
      }
    };
  }
}
