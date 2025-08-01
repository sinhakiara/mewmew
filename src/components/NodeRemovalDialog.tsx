import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface NodeRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeTitle: string;
  onConfirm: () => void;
}

export const NodeRemovalDialog: React.FC<NodeRemovalDialogProps> = ({
  open,
  onOpenChange,
  nodeTitle,
  onConfirm
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            Remove Node
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to remove the <strong>"{nodeTitle}"</strong> node?
            <div className="flex items-center gap-2 mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-md border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                This action will also remove all connections to and from this node. This cannot be undone.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Node
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
