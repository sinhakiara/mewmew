import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  workerId?: string;
}

interface WebSocketHookReturn {
  logs: LogEntry[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  sendMessage: (message: any) => void;
  clearLogs: () => void;
}

export const useWebSocket = (url: string): WebSocketHookReturn => {
  // Handle cases where backend might not be available
  //const safeUrl = url.includes('localhost') || url.includes('192.168') ? url : 'ws://localhost:8000/ws/logs';
  const safeUrl = url.includes('localhost') || url.includes('192.168') ? url : 'ws://192.168.29.20:8000/ws/logs';
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    try {
      wsRef.current = new WebSocket(safeUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Add connection log
        setLogs(prev => [...prev, {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'success',
          message: 'WebSocket connection established'
        }]);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Convert incoming message to log entry
          const logEntry: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: data.timestamp || new Date().toISOString(),
            level: data.level || 'info',
            message: data.message || event.data,
            workerId: data.worker_id
          };
          
          setLogs(prev => [...prev, logEntry]);
        } catch (error) {
          // If not JSON, treat as plain text message
          const logEntry: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: event.data
          };
          
          setLogs(prev => [...prev, logEntry]);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Add disconnection log
        setLogs(prev => [...prev, {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          message: `WebSocket disconnected: ${event.reason || 'Unknown reason'}`
        }]);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Add error log
        setLogs(prev => [...prev, {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'WebSocket connection error'
        }]);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('disconnected');
      
      setLogs(prev => [...prev, {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Failed to connect to WebSocket: ${error}`
      }]);
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
      setLogs(prev => [...prev, {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'warning',
        message: 'Cannot send message: WebSocket not connected'
      }]);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    // Only try to connect if URL is valid
    if (safeUrl) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [safeUrl]);

  return {
    logs,
    connectionStatus,
    sendMessage,
    clearLogs
  };
};
