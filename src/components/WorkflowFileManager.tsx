import React, { useRef } from 'react';
import { Workflow } from './WorkflowEditor';
import { useToast } from '@/hooks/use-toast';

interface WorkflowFileManagerProps {
  onSave: (workflow: Workflow) => void;
  onLoad: (workflow: Workflow) => void;
}

export const useWorkflowFileManager = ({
  onSave,
  onLoad
}: WorkflowFileManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const saveWorkflowToFile = (workflow: Workflow) => {
    try {
      const workflowData = {
        ...workflow,
        version: '1.0',
        exportedAt: new Date().toISOString(),
        metadata: {
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          categories: Array.from(new Set(workflow.nodes.map(n => n.category)))
        }
      };

      const jsonString = JSON.stringify(workflowData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name.toLowerCase().replace(/\s+/g, '-')}-workflow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Workflow saved",
        description: `${workflow.name} has been downloaded as a JSON file.`,
      });

      onSave(workflow);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadWorkflowFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid JSON file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workflowData = JSON.parse(content);

        // Validate workflow structure
        if (!workflowData.id || !workflowData.name || !Array.isArray(workflowData.nodes) || !Array.isArray(workflowData.connections)) {
          throw new Error('Invalid workflow format');
        }

        // Ensure required properties exist
        const validatedWorkflow: Workflow = {
          id: workflowData.id,
          name: workflowData.name,
          nodes: workflowData.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            title: node.title,
            category: node.category || 'recon',
            position: node.position || { x: 100, y: 100 },
            status: 'idle',
            config: node.config || {},
            outputs: node.outputs
          })),
          connections: workflowData.connections.map((conn: any) => ({
            id: conn.id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle
          })),
          status: 'idle'
        };

        onLoad(validatedWorkflow);
        toast({
          title: "Workflow loaded",
          description: `Successfully loaded ${validatedWorkflow.name} with ${validatedWorkflow.nodes.length} nodes.`,
        });

      } catch (error) {
        toast({
          title: "Load failed",
          description: "Invalid workflow file format. Please check the file and try again.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  return {
    saveWorkflowToFile,
    loadWorkflowFromFile,
    fileInput: (
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    )
  };
};
