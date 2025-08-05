import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  Settings,
  Bell,
  User
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface WorkflowHeaderProps {
  workflow: any;
  connectionStatus: string;
  lastUpdated: Date | null;
}

export function WorkflowHeader({ 
  workflow, 
  connectionStatus, 
  lastUpdated 
}: WorkflowHeaderProps) {
  const { theme, setTheme } = useTheme();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-amber-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex-1 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{workflow.name}</h1>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(workflow.status)} text-white border-0`}
          >
            {workflow.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{workflow.nodes?.length || 0} nodes</span>
          <span>•</span>
          <span>{workflow.connections?.length || 0} connections</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          {getConnectionIcon()}
          <span className={`
            ${connectionStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 
              connectionStatus === 'disconnected' ? 'text-red-600 dark:text-red-400' : 
              'text-amber-600 dark:text-amber-400'}
          `}>
            {getConnectionText()}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Last Updated */}
        {lastUpdated && (
          <span className="text-sm text-muted-foreground">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>

        {/* User */}
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
