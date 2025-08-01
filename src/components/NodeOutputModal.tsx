import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Copy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NodeOutputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeTitle: string;
  nodeOutputs?: Record<string, any>;
}

export const NodeOutputModal: React.FC<NodeOutputModalProps> = ({
  open,
  onOpenChange,
  nodeTitle,
  nodeOutputs
}) => {
  const { toast } = useToast();

  const jsonOutput = JSON.stringify(nodeOutputs || {}, null, 2);
  const textOutput = nodeOutputs ? convertToText(nodeOutputs) : '';

  function convertToText(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.join('\n');
      }
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n');
    }
    return String(data);
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Output has been copied to your clipboard.",
    });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `${filename} has been downloaded.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            {nodeTitle} - Output
            <DialogClose className="p-2 hover:bg-muted rounded-sm">
              <X className="w-4 h-4" />
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="json" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="json">JSON Format</TabsTrigger>
            <TabsTrigger value="text">Text Format</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="flex-1 flex flex-col">
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(jsonOutput)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(jsonOutput, `${nodeTitle.toLowerCase().replace(/\s+/g, '-')}-output.json`)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <pre className="p-4 text-sm font-mono bg-muted/50">
                {jsonOutput || 'No output available'}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="text" className="flex-1 flex flex-col">
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(textOutput)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(textOutput, `${nodeTitle.toLowerCase().replace(/\s+/g, '-')}-output.txt`)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Text
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <pre className="p-4 text-sm whitespace-pre-wrap bg-muted/50">
                {textOutput || 'No output available'}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
