import React, { useState } from 'react';
import { Node } from './WorkflowEditor';

interface WorkflowNodeProps {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  onDragStart: (nodeId: string, event: React.MouseEvent) => void;
  onConnectionStart: (nodeId: string, handle: string, event: React.MouseEvent) => void;
  onConnectionEnd: (nodeId: string, handle: string) => void;
  onConfigChange: (nodeId: string, config: Record<string, any>) => void;
  onRemove: (nodeId: string) => void;
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  node,
  isSelected,
  isDragging,
  onDragStart,
  onConnectionStart,
  onConnectionEnd,
  onConfigChange,
  onRemove
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const getNodeIcon = (type: string) => {
    const icons = {
      subfinder: 'SF',
      amass: 'AM',
      ffuf: 'FF',
      arjun: 'AR',
      nuclei: 'NU'
    };
    return icons[type as keyof typeof icons] || 'N';
  };

  const handleConfigSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const config: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      config[key] = value;
    }
    
    onConfigChange(node.id, config);
    setIsConfigOpen(false);
  };

  return (
    <>
      <div
        className={`workflow-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: node.position.x,
          top: node.position.y
        }}
        onMouseDown={(e) => onDragStart(node.id, e)}
        onDoubleClick={() => setIsConfigOpen(true)}
      >
        {/* Input Connection Point */}
        <div
          className="node-connection input"
          onMouseUp={() => onConnectionEnd(node.id, 'input')}
        />

        {/* Node Header */}
        <div className="node-header">
          <div className={`node-icon ${node.category}`}>
            {getNodeIcon(node.type)}
          </div>
          <div className="node-title">{node.title}</div>
          <div className={`node-status ${node.status}`} />
	  {/* Remove button */}
          <button
            className="node-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remove ${node.title} node?`)) {
                onRemove(node.id);
              }
            }}
            title="Remove node"
          >
            ×
          </button>
        </div>

        {/* Node Content */}
        <div className="node-content">
          {node.type === 'subfinder' && (
            <div>Domain: {node.config.domain || 'Not set'}</div>
          )}
          {node.type === 'amass' && (
            <div>Target: {node.config.domain || 'Not set'}</div>
          )}
          {node.type === 'ffuf' && (
            <div>URL: {node.config.url || 'Not set'}</div>
          )}
          {node.type === 'arjun' && (
            <div>Target: {node.config.url || 'Not set'}</div>
          )}
          {node.type === 'nuclei' && (
            <div>Target: {node.config.target || 'Not set'}</div>
          )}
          
          {node.outputs && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'hsl(var(--status-success))' }}>
              Output: {Array.isArray(node.outputs.data) ? `${node.outputs.data.length} items` : 'Available'}
            </div>
          )}
        </div>

        {/* Output Connection Point */}
        <div
          className="node-connection output"
          onMouseDown={(e) => onConnectionStart(node.id, 'output', e)}
        />
      </div>

      {/* Configuration Modal */}
      {isConfigOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsConfigOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Configure {node.title}</h3>
            
            <form onSubmit={handleConfigSubmit}>
              {node.type === 'subfinder' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Domain</label>
                    <input
                      type="text"
                      name="domain"
                      defaultValue={node.config.domain}
                      placeholder="example.com"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Threads</label>
                    <input
                      type="number"
                      name="threads"
                      defaultValue={node.config.threads}
                      min="1"
                      max="100"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}

              {node.type === 'amass' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Domain</label>
                    <input
                      type="text"
                      name="domain"
                      defaultValue={node.config.domain}
                      placeholder="example.com"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Mode</label>
                    <select
                      name="mode"
                      defaultValue={node.config.mode}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="passive">Passive</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </>
              )}

              {node.type === 'ffuf' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">URL</label>
                    <input
                      type="text"
                      name="url"
                      defaultValue={node.config.url}
                      placeholder="https://example.com/FUZZ"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Wordlist</label>
                    <input
                      type="text"
                      name="wordlist"
                      defaultValue={node.config.wordlist}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}

              {node.type === 'arjun' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">URL</label>
                    <input
                      type="text"
                      name="url"
                      defaultValue={node.config.url}
                      placeholder="https://example.com"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Methods</label>
                    <input
                      type="text"
                      name="methods"
                      defaultValue={node.config.methods?.join(',')}
                      placeholder="GET,POST"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}

              {node.type === 'nuclei' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Target</label>
                    <input
                      type="text"
                      name="target"
                      defaultValue={node.config.target}
                      placeholder="https://example.com"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Severity</label>
                    <select
                      name="severity"
                      defaultValue={node.config.severity}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="info,low,medium,high,critical">All</option>
                      <option value="low,medium,high,critical">Low+</option>
                      <option value="medium,high,critical">Medium+</option>
                      <option value="high,critical">High+</option>
                      <option value="critical">Critical Only</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
