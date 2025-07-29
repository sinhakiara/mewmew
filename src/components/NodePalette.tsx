import React from 'react';

interface NodePaletteProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const nodeTypes = [
    {
      category: 'Reconnaissance',
      nodes: [
        { type: 'subfinder', name: 'Subfinder', description: 'Subdomain discovery', icon: 'SF', color: 'recon' },
        { type: 'amass', name: 'Amass', description: 'Attack surface mapping', icon: 'AM', color: 'recon' }
      ]
    },
    {
      category: 'Scanning',
      nodes: [
        { type: 'arjun', name: 'Arjun', description: 'Parameter discovery', icon: 'AR', color: 'scanning' }
      ]
    },
    {
      category: 'Fuzzing',
      nodes: [
        { type: 'ffuf', name: 'FFUF', description: 'Fast web fuzzer', icon: 'FF', color: 'fuzzing' }
      ]
    },
    {
      category: 'Exploitation',
      nodes: [
        { type: 'nuclei', name: 'Nuclei', description: 'Vulnerability scanner', icon: 'NU', color: 'exploit' }
      ]
    }
  ];

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleNodeClick = (nodeType: string) => {
    // Add node at default position
    onAddNode(nodeType, { x: 100, y: 100 });
  };

  return (
    <div className="node-palette">
      {nodeTypes.map(category => (
        <div key={category.category} className="palette-section">
          <div className="palette-title">{category.category}</div>
          {category.nodes.map(node => (
            <div
              key={node.type}
              className="palette-node"
              draggable
              onDragStart={(e) => handleDragStart(e, node.type)}
              onClick={() => handleNodeClick(node.type)}
            >
              <div className={`node-icon ${node.color}`}>
                {node.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{node.name}</div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                  {node.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
