import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Workflow, 
  Play, 
  Pause, 
  Square, 
  Save, 
  FolderOpen, 
  Settings, 
  FileText,
  Activity,
  Users,
  BarChart3,
  Book
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface WorkflowSidebarProps {
  workflow: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onExecuteWorkflow: () => void;
  onPauseWorkflow: () => void;
  onStopWorkflow: () => void;
  onSaveWorkflow: () => void;
  onLoadWorkflow: () => void;
  isExecuting: boolean;
}

export function WorkflowSidebar({
  workflow,
  activeSection,
  setActiveSection,
  onExecuteWorkflow,
  onPauseWorkflow,
  onStopWorkflow,
  onSaveWorkflow,
  onLoadWorkflow,
  isExecuting,
}: WorkflowSidebarProps) {
  const { state } = useSidebar();

  const workflowControls = [
    {
      id: 'execute',
      label: 'Execute',
      icon: Play,
      action: onExecuteWorkflow,
      disabled: isExecuting,
      variant: 'default' as const,
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: Pause,
      action: onPauseWorkflow,
      disabled: !isExecuting,
      variant: 'outline' as const,
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: Square,
      action: onStopWorkflow,
      disabled: !isExecuting,
      variant: 'outline' as const,
    },
  ];

  const fileOperations = [
    {
      id: 'save',
      label: 'Save Workflow',
      icon: Save,
      action: onSaveWorkflow,
    },
    {
      id: 'load',
      label: 'Load Workflow',
      icon: FolderOpen,
      action: onLoadWorkflow,
    },
  ];

  const navigationItems = [
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: FileText },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'apiDocs', label: 'API Docs', icon: Book },
  ];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Workflow className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Security Flow</span>
        </div>
        <div className="px-4 py-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              {state === "expanded" && "Back to Home"}
            </Button>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Workflow Controls */}
        <SidebarGroup>
          <SidebarGroupLabel>Workflow Controls</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-1 gap-2 px-2">
              {workflowControls.map((control) => {
                const Icon = control.icon;
                return (
                  <Button
                    key={control.id}
                    variant={control.variant}
                    size="sm"
                    onClick={control.action}
                    disabled={control.disabled}
                    className="justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {state === "expanded" && control.label}
                  </Button>
                );
              })}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* File Operations */}
        <SidebarGroup>
          <SidebarGroupLabel>File Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fileOperations.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={item.action}>
                      <Icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
                      isActive={isActive}
                    >
                      <Icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-2">
          <div className="text-xs text-muted-foreground">
            {state === "expanded" && (
              <>
                <div>Workflow: {workflow.name}</div>
                <div>Nodes: {workflow.nodes?.length || 0}</div>
                <div>Status: {workflow.status}</div>
              </>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
