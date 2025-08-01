import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Node, Connection, Workflow } from './WorkflowEditor';
import { WorkflowNode } from './WorkflowNode';
import { ConnectionLayer } from './ConnectionLayer';

interface WorkflowCanvasProps {
  workflow: Workflow;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  onUpdateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  onAddConnection: (source: string, target: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragOffset: { x: number; y: number };
  setDragOffset: (offset: { x: number; y: number }) => void;
  canvasOffset: { x: number; y: number };
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  executingConnections?: Set<string>;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  selectedNode,
  onSelectNode,
  onUpdateNodePosition,
  onUpdateNodeConfig,
  onAddConnection,
  onRemoveConnection,
  onRemoveNode,
  onAddNode,
  isDragging,
  setIsDragging,
  dragOffset,
  setDragOffset,
  canvasOffset,
  setCanvasOffset,
  executingConnections = new Set()
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Helper functions for temporary connection
  const getNodeCenter = (nodeId: string): { x: number; y: number } => {
    const node = workflow.nodes.find(n => n.id === nodeId);
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

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsDragging(true);
    onSelectNode(nodeId);
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - node.position.x,
      y: event.clientY - node.position.y
    });
  }, [workflow.nodes, setIsDragging, onSelectNode, setDragOffset]);

  // Handle node drag
  const handleNodeDrag = useCallback((event: MouseEvent) => {
    if (!isDragging || !selectedNode) return;

    const newPosition = {
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y
    };

    onUpdateNodePosition(selectedNode, newPosition);
  }, [isDragging, selectedNode, dragOffset, onUpdateNodePosition]);

  // Handle node drag end
  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Handle connection start
  const handleConnectionStart = useCallback((nodeId: string, handle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConnectionStart({ nodeId, handle });
    setIsConnecting(true);
  }, []);

  // Handle connection end
  const handleConnectionEnd = useCallback((nodeId: string, handle: string) => {
    if (!connectionStart || connectionStart.nodeId === nodeId) {
      setConnectionStart(null);
      setIsConnecting(false);
      return;
    }

    if (connectionStart.handle === 'output' && handle === 'input') {
      onAddConnection(connectionStart.nodeId, nodeId);
    }

    setConnectionStart(null);
    setIsConnecting(false);
  }, [connectionStart, onAddConnection]);

  // Handle canvas pan
  const handleCanvasPanStart = useCallback((event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: event.clientX - canvasOffset.x, y: event.clientY - canvasOffset.y });
      onSelectNode(null);
    }
  }, [canvasOffset, onSelectNode]);

  const handleCanvasPan = useCallback((event: MouseEvent) => {
    if (!isPanning) return;

    setCanvasOffset({
      x: event.clientX - panStart.x,
      y: event.clientY - panStart.y
    });
  }, [isPanning, panStart, setCanvasOffset]);

  const handleCanvasPanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    if (isDragging) {
      handleNodeDrag(event);
    } else if (isPanning) {
      handleCanvasPan(event);
    }
  }, [isDragging, isPanning, handleNodeDrag, handleCanvasPan]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      handleNodeDragEnd();
    } else if (isPanning) {
      handleCanvasPanEnd();
    } else if (isConnecting) {
      setConnectionStart(null);
      setIsConnecting(false);
    }
  }, [isDragging, isPanning, isConnecting, handleNodeDragEnd, handleCanvasPanEnd]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle drop of palette nodes
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('text/plain');
    
    if (nodeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left - canvasOffset.x,
        y: event.clientY - rect.top - canvasOffset.y
      };
      
      onAddNode(nodeType, position);
    }
  }, [canvasOffset]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      ref={canvasRef}
      className="workflow-canvas"
      style={{
        width: '100vw',
        height: '100vh'
      }}
      onMouseDown={handleCanvasPanStart}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
      {/* Connection Layer */}
      <ConnectionLayer
        connections={workflow.connections}
        nodes={workflow.nodes}
        connectionStart={connectionStart}
        isConnecting={isConnecting}
        mousePosition={mousePosition}
        onRemoveConnection={onRemoveConnection}
	executingConnections={executingConnections}
      />

      {/* Nodes */}
      {workflow.nodes.map(node => (
        <WorkflowNode
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          isDragging={isDragging && selectedNode === node.id}
          onDragStart={handleNodeDragStart}
          onConnectionStart={handleConnectionStart}
          onConnectionEnd={handleConnectionEnd}
          onConfigChange={onUpdateNodeConfig}
	  onRemove={onRemoveNode}
        />
      ))}

      {/* Temporary connection line */}
      {isConnecting && connectionStart && (
        <svg
          className="workflow-connections"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <path
            d={createCurvePath(
              getNodeCenter(connectionStart.nodeId),
              { x: mousePosition.x - canvasOffset.x, y: mousePosition.y - canvasOffset.y }
            )}
            className="connection-path"
            style={{ stroke: 'hsl(var(--connection-active))', strokeDasharray: '5,5' }}
          />
        </svg>
      )}
      </div>
    </div>
  );
};
