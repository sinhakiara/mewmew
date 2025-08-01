import { useState, useEffect, useCallback, useRef } from 'react';

interface TaskStatus {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  progress?: number;
}

interface UseTaskPollingOptions {
  apiBaseUrl: string;
  authToken?: string;
  pollInterval?: number;
}

export const useTaskPolling = (options: UseTaskPollingOptions) => {
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskStatus>>(new Map());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const { apiBaseUrl, authToken, pollInterval = 2000 } = options;

  const apiCall = useCallback(async (endpoint: string, init?: RequestInit) => {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }, [apiBaseUrl, authToken]);

  const addTask = useCallback((taskId: string) => {
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      newMap.set(taskId, {
        task_id: taskId,
        status: 'pending'
      });
      return newMap;
    });
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  }, []);

  const pollTasks = useCallback(async () => {
    if (isPollingRef.current || activeTasks.size === 0) return;
    
    isPollingRef.current = true;

    try {
      const taskIds = Array.from(activeTasks.keys());
      const promises = taskIds.map(async (taskId) => {
        try {
          const status = await apiCall(`/tasks/${taskId}`);
          return { taskId, status };
        } catch (error) {
          console.error(`Failed to poll task ${taskId}:`, error);
          return { taskId, status: { task_id: taskId, status: 'failed' as const, error: 'Failed to poll status' } };
        }
      });

      const results = await Promise.all(promises);
      
      setActiveTasks(prev => {
        const newMap = new Map(prev);
        results.forEach(({ taskId, status }) => {
          if (newMap.has(taskId)) {
            newMap.set(taskId, status);
          }
        });
        return newMap;
      });

      // Remove completed or failed tasks after a delay
      setTimeout(() => {
        setActiveTasks(prev => {
          const newMap = new Map(prev);
          results.forEach(({ taskId, status }) => {
            if (status.status === 'completed' || status.status === 'failed') {
              newMap.delete(taskId);
            }
          });
          return newMap;
        });
      }, 5000); // Keep completed tasks visible for 5 seconds

    } catch (error) {
      console.error('Failed to poll tasks:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [activeTasks, apiCall]);

  // Start/stop polling based on active tasks
  useEffect(() => {
    if (activeTasks.size > 0) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(pollTasks, pollInterval);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeTasks.size, pollTasks, pollInterval]);

  const getTaskStatus = useCallback((taskId: string): TaskStatus | undefined => {
    return activeTasks.get(taskId);
  }, [activeTasks]);

  const clearAllTasks = useCallback(() => {
    setActiveTasks(new Map());
  }, []);

  return {
    addTask,
    removeTask,
    getTaskStatus,
    clearAllTasks,
    activeTasks: Array.from(activeTasks.values()),
    isPolling: activeTasks.size > 0
  };
};
