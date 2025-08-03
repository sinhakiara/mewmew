import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface NodePaletteProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const nodeTypes = [
    {
      category: 'Discovery',
      nodes: [
        { type: 'subfinder', name: 'Subfinder', description: 'Subdomain discovery', icon: 'SF', color: 'recon' },
        { type: 'amass', name: 'Amass', description: 'Attack surface mapping', icon: 'AM', color: 'recon' }
      ]
    },
    {
      category: 'Analysis',
      nodes: [
        { type: 'nuclei', name: 'Nuclei', description: 'Vulnerability scanner', icon: 'NU', color: 'exploit' },
        { type: 'ffuf', name: 'FFUF', description: 'Fast web fuzzer', icon: 'FF', color: 'fuzzing' },
        { type: 'httpx', name: 'HTTP Request', description: 'Make HTTP requests', icon: 'HT', color: 'scanning' }
      ]
    },
    {
      category: 'Logic',
      nodes: [
        { type: 'conditional', name: 'Conditional', description: 'Branch execution based on conditions', icon: 'IF', color: 'logic' },
        { type: 'filter', name: 'Filter', description: 'Filter data based on criteria', icon: 'FL', color: 'logic' },
        { type: 'merge', name: 'Merge', description: 'Combine data from multiple inputs', icon: 'MG', color: 'logic' },
        { type: 'split', name: 'Iterator', description: 'Loop over data collections', icon: 'LP', color: 'logic' },
        { type: 'schedule', name: 'Wait', description: 'Add time delays', icon: 'WT', color: 'logic' }
      ]
    },
    {
      category: 'Data',
      nodes: [
        { type: 'transform', name: 'Transform', description: 'Transform and manipulate data', icon: 'TR', color: 'data' }
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

  const filteredNodes = nodeTypes.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  return (
    <>
      {/* Floating Add Node Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
        size="icon"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Node Palette Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed top-16 right-6 w-80 max-h-[80vh] bg-background border rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Node</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Node Categories */}
            <ScrollArea className="max-h-[60vh]">
              <div className="p-4 space-y-6">
                {filteredNodes.map(category => (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        {category.category}
                      </h4>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {category.nodes.length}
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {category.nodes.map(node => (
                        <div
                          key={node.type}
                          className="group flex items-center gap-3 p-4 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/5 cursor-pointer transition-all duration-200 hover:shadow-sm"
                          draggable
                          onDragStart={(e) => handleDragStart(e, node.type)}
                          onClick={() => {
                            handleNodeClick(node.type);
                            setIsOpen(false);
                          }}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105 node-icon-${node.color}`}>
                            {node.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {node.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {node.description}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredNodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-lg mb-2">🔍</div>
                    <div className="text-sm">No nodes found</div>
                    <div className="text-xs mt-1">Try a different search term</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
};
