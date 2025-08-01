import WorkflowEditor from '../components/WorkflowEditor';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const Workflow = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Workflow Editor</h1>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <WorkflowEditor
        authToken={localStorage.getItem('dheeraj_token') || ''}
        apiBaseUrl={window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://192.168.29.20:8000'}
        wsUrl={`${window.location.hostname === 'localhost' ? 'ws://localhost:80000' : 'wss://192.168.29.20:8000'}/ws/logs?token=${localStorage.getItem('dheeraj_token') || ''}`}
        connectionStatus="connected"
      />
    </div>
  );
};

export default Workflow;
