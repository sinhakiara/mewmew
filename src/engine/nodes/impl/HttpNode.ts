import { AnalysisNode } from '../AnalysisNode';
import { NodeInput, NodeExecutionResult, NodeDefinition, NodeType, NodeCategory } from '../../types/WorkflowTypes';

export class HttpNode extends AnalysisNode {
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
      
      // Build URL with variable replacement
      let url = this.replaceVariables(config.url || '', inputData);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      // Replace variables in headers
      Object.keys(headers).forEach(key => {
        headers[key] = this.replaceVariables(headers[key], inputData);
      });

      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method || 'GET',
        headers
      };

      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase())) {
        if (config.bodyType === 'json' && config.jsonBody) {
          const bodyData = this.replaceVariables(config.jsonBody, inputData);
          try {
            requestOptions.body = JSON.stringify(JSON.parse(bodyData));
          } catch (e) {
            requestOptions.body = bodyData;
          }
        } else if (config.bodyType === 'raw' && config.rawBody) {
          requestOptions.body = this.replaceVariables(config.rawBody, inputData);
        } else if (config.bodyType === 'form' && config.formData) {
          const formData = new FormData();
          Object.entries(config.formData).forEach(([key, value]) => {
            formData.append(key, this.replaceVariables(String(value), inputData));
          });
          requestOptions.body = formData;
          delete headers['Content-Type']; // Let browser set it for FormData
        }
      }

      this.log('info', `Making HTTP ${config.method || 'GET'} request to: ${url}`);

      // Make the HTTP request
      const response = await fetch(url, requestOptions);
      
      // Parse response based on content type
      let responseData: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = await response.text();
        }
      } else {
        responseData = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        url: response.url,
        ok: response.ok
      };

      if (!response.ok && config.failOnError !== false) {
        return this.createErrorResult(`HTTP request failed: ${response.status} ${response.statusText}`);
      }

      this.log('info', `HTTP request completed with status: ${response.status}`);

      const output = this.createOutput(result);
      return this.createSuccessResult(output);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.log('error', `HTTP request failed: ${errorMessage}`);
      return this.createErrorResult(`HTTP request failed: ${errorMessage}`);
    }
  }

  getDefinition(): NodeDefinition {
    return {
      type: NodeType.HTTPX, // Using HTTPX as HTTP type
      category: NodeCategory.ANALYSIS,
      name: 'HTTP Request',
      description: 'Make HTTP requests with custom headers, body, and handle responses',
      icon: '🌐',
      inputs: [
        {
          name: 'main',
          type: 'any',
          required: false,
          description: 'Optional input data to use in URL or body variables'
        }
      ],
      outputs: [
        {
          name: 'main',
          type: 'object',
          required: true,
          description: 'HTTP response data including status, headers, and body'
        }
      ],
      configSchema: {
        url: {
          type: 'string',
          label: 'URL',
          description: 'The URL to send the request to. Use {{variable}} for dynamic values.',
          required: true,
          default: ''
        },
        method: {
          type: 'select',
          label: 'HTTP Method',
          description: 'The HTTP method to use',
          required: true,
          default: 'GET',
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'HEAD', value: 'HEAD' },
            { label: 'OPTIONS', value: 'OPTIONS' }
          ]
        },
        headers: {
          type: 'textarea',
          label: 'Headers (JSON)',
          description: 'Custom headers as JSON object. Example: {"Authorization": "Bearer {{token}}"}',
          required: false,
          default: '{}'
        },
        bodyType: {
          type: 'select',
          label: 'Body Type',
          description: 'Type of request body',
          required: false,
          default: 'json',
          options: [
            { label: 'JSON', value: 'json' },
            { label: 'Raw Text', value: 'raw' },
            { label: 'Form Data', value: 'form' },
            { label: 'None', value: 'none' }
          ]
        },
        jsonBody: {
          type: 'textarea',
          label: 'JSON Body',
          description: 'Request body as JSON. Use {{variable}} for dynamic values.',
          required: false,
          default: ''
        },
        rawBody: {
          type: 'textarea',
          label: 'Raw Body',
          description: 'Request body as raw text. Use {{variable}} for dynamic values.',
          required: false,
          default: ''
        },
        formData: {
          type: 'textarea',
          label: 'Form Data (JSON)',
          description: 'Form data as JSON object. Example: {"key1": "value1", "key2": "{{variable}}"}',
          required: false,
          default: '{}'
        },
        timeout: {
          type: 'number',
          label: 'Timeout (seconds)',
          description: 'Request timeout in seconds',
          required: false,
          default: 30,
          validation: { min: 1, max: 300 }
        },
        followRedirects: {
          type: 'boolean',
          label: 'Follow Redirects',
          description: 'Whether to follow HTTP redirects',
          required: false,
          default: true
        },
        failOnError: {
          type: 'boolean',
          label: 'Fail on HTTP Error',
          description: 'Whether to treat HTTP error status codes as node failures',
          required: false,
          default: true
        }
      },
      defaultConfig: {
        url: '',
        method: 'GET',
        headers: '{}',
        bodyType: 'json',
        jsonBody: '',
        rawBody: '',
        formData: '{}',
        timeout: 30,
        followRedirects: true,
        failOnError: true
      }
    };
  }
}
