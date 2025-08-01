import React from 'react';
import { Node, Connection } from './WorkflowEditor';

interface ConnectionLayerProps {
  connections: Connection[];
  nodes: Node[];
  connectionStart: { nodeId: string; handle: string } | null;
  isConnecting: boolean;
  mousePosition: { x: number; y: number };
  onRemoveConnection: (connectionId: string) => void;
  executingConnections?: Set<string>;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  connections,
  nodes,
  connectionStart,
  isConnecting,
  mousePosition,
  onRemoveConnection,
  executingConnections = new Set()
}) => {
  const getNodeCenter = (nodeId: string): { x: number; y: number } => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    return {
      x: node.position.x + 100, // Half of node width
      y: node.position.y + 40   // Half of node height
    };
  };

  const createCurvePath = (start: { x: number; y: number }, end: { x: number; y: number }): string => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Control points for bezier curve
    const cp1x = start.x + Math.abs(dx) * 0.5;
    const cp1y = start.y;
    const cp2x = end.x - Math.abs(dx) * 0.5;
    const cp2y = end.y;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  };

  return (
    <svg className="workflow-connections">
      {/* Existing connections */}
      {connections.map(connection => {
        const sourcePos = getNodeCenter(connection.source);
        const targetPos = getNodeCenter(connection.target);
        
        // Adjust for connection points
        sourcePos.x += 90; // Output connection point
        targetPos.x -= 10; // Input connection point
        
        const path = createCurvePath(sourcePos, targetPos);
        
        return (
          <g key={connection.id}>
            <path
              d={path}
              className="connection-path"
              onClick={() => onRemoveConnection(connection.id)}
              style={{ cursor: 'pointer' }}
            />
            {/* Connection label */}
            <text
              x={(sourcePos.x + targetPos.x) / 2}
              y={(sourcePos.y + targetPos.y) / 2 - 10}
              className="connection-label"
              style={{
                fontSize: '10px',
                fill: 'hsl(var(--muted-foreground))',
                textAnchor: 'middle',
                pointerEvents: 'none'
              }}
            >
              data
            </text>
          </g>
        );
      })}
      
      {/* Temporary connection while dragging */}
      {isConnecting && connectionStart && (
        <path
          d={createCurvePath(
            getNodeCenter(connectionStart.nodeId),
            mousePosition
          )}
          className="connection-path"
          style={{
            stroke: 'hsl(var(--connection-active))',
            strokeDasharray: '5,5',
            opacity: 0.7
          }}
        />
      )}
    </svg>
  );
};

