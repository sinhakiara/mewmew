    //BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`,
import React, { useState, useEffect } from 'react';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InsightsSection from './components/InsightsSection';
import TasksSection from './components/TasksSection';
import WorkersSection from './components/WorkersSection';
import WorkflowSection from './components/WorkflowSection';
import LogsSection from './components/LogsSection';
import ApiDocsSection from './components/ApiDocsSection';
import TaskDetailsModal from './components/TaskDetailsModal';
import WorkerDetailsModal from './components/WorkerDetailsModal';
import AiSuggestModal from './components/AiSuggestModal';
import ConfirmationModal from './components/ConfirmationModal';

import VisualWorkflowSection from './components/VisualWorkflowSection';

interface Task {
    task_id: string;
    command: string;
    status: string;
    output: string;
    created_at: string;
    queue?: string;
    worker_id?: string | null;
}

interface Worker {
    id: string;
    is_active: boolean;
    worker_nodename?: string;
    worker_os?: string;
    worker_arch?: string;
    worker_kernel?: string;
    worker_publicip?: string;
    registered_at?: string;
}

interface Stats {
    activeWorkers: number;
    activeTasks: number;
    completedTasks: number;
}

interface Log {
    level: string;
    message: string;
    timestamp: string;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://192.168.29.20:8000',
    WS_URL: window.location.hostname === 'localhost' ? 'ws://localhost:5000' : 'wss://192.168.29.20:8000',
    REFRESH_INTERVAL: 2000,
    MAX_LOG_ENTRIES: 100,
    TOKEN_KEY: 'dheeraj_token',
    REFRESH_TOKEN_KEY: 'dheeraj_refresh_token',
    USER_KEY: 'dheeraj_user',
    THEME_KEY: 'dheeraj_theme',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    HEARTBEAT_TIMEOUT: 60000,
    WS_RECONNECT_INTERVAL: 5000,
    WS_MAX_RECONNECT_ATTEMPTS: 5,
};

export const apiRequest = async (
    endpoint: string,
    method: string = 'GET',
    data: any = null,
    token: string,
    retries: number = CONFIG.MAX_RETRIES
): Promise<any> => {
    const url = `${CONFIG.BASE_URL}${endpoint}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token && !endpoint.includes('/api/login') && !endpoint.includes('/api/refresh')) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options: RequestInit = { method, headers, credentials: 'include' };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (method === 'POST' && endpoint === '/tasks' && response.status >= 300 && response.status < 400) {
                return await response.json();
            }
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }
        return await response.json();
    } catch (error) {
        if (retries > 0 && (error as any).status !== 401) {
            await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return apiRequest(endpoint, method, data, token, retries - 1);
        }
        throw error;
    }
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string>(localStorage.getItem(CONFIG.TOKEN_KEY) || '');
    const [refreshToken, setRefreshToken] = useState<string>(localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY) || '');
    const [user, setUser] = useState<{ username?: string }>(
        JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}')
    );
    const [theme, setTheme] = useState<string>(localStorage.getItem(CONFIG.THEME_KEY) || 'light');
    const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [activeSection, setActiveSection] = useState<string>(window.location.hash.slice(1) || 'insights');
    const [stats, setStats] = useState<Stats>({ activeWorkers: 0, activeTasks: 0, completedTasks: 0 });
    const [previousStats, setPreviousStats] = useState<Stats>({ activeWorkers: 0, activeTasks: 0, completedTasks: 0 });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [masternode, setMasternode] = useState<any>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loginError, setLoginError] = useState<string>('');
    const [taskDetails, setTaskDetails] = useState<Task | null>(null);
    const [workerDetails, setWorkerDetails] = useState<Worker | null>(null);
    const [isAiSuggestOpen, setIsAiSuggestOpen] = useState<boolean>(false);
    const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalProps>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });
    const [workerLastHeartbeat, setWorkerLastHeartbeat] = useState<Record<string, number>>({});

    // Check token validity on mount using /api/refresh
    useEffect(() => {
        const checkAuth = async () => {
            const savedRefreshToken = localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
            if (savedRefreshToken) {
                try {
                    const response = await apiRequest('/api/refresh', 'POST', { refresh_token: savedRefreshToken }, '');
                    setToken(response.access_token);
                    setRefreshToken(savedRefreshToken);
                    setIsAuthenticated(true);
                    setUser(JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}'));
                    localStorage.setItem(CONFIG.TOKEN_KEY, response.access_token);
                } catch (error: any) {
                    console.error('Token refresh failed:', error);
                    setIsAuthenticated(false);
                    setToken('');
                    setRefreshToken('');
                    setUser({});
                    localStorage.removeItem(CONFIG.TOKEN_KEY);
                    localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
                    localStorage.removeItem(CONFIG.USER_KEY);
                }
            } else {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    // Theme management
    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem(CONFIG.THEME_KEY, theme);
    }, [theme]);

    // Hash change for section navigation
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) setActiveSection(hash);

        const handleHashChange = () => {
            setActiveSection(window.location.hash.slice(1) || 'insights');
            setIsSidebarOpen(false);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // WebSocket for real-time logs and worker status
    useEffect(() => {
        if (!isAuthenticated || !token) return;

        let ws: WebSocket | null = null;
        let reconnectAttempts = 0;

        const connectWebSocket = () => {
            ws = new WebSocket(`${CONFIG.WS_URL}/ws/logs?token=${token}`);

            ws.onopen = () => {
                console.log('WebSocket connected to /ws/logs');
                setConnectionStatus('connected');
                reconnectAttempts = 0;
            };

            ws.onmessage = (event) => {
                console.log('WebSocket raw message:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket parsed message:', data);

                    // Handle WorkerLog messages
                    if (data.worker_id && data.message && data.level) {
                        setLogs((prev) => [
                            ...prev,
                            {
                                level: data.level,
                                message: `${data.worker_id.substring(0, 8)}...: ${data.message}`,
                                timestamp: new Date().toLocaleString(),
                            },
                        ].slice(-CONFIG.MAX_LOG_ENTRIES));

                        // Update worker status for heartbeats or task activity
                        if (data.message.includes('completed') || data.message.includes('Heartbeat')) {
                            const workerId = data.worker_id;
                            console.log(`Heartbeat received for worker ${workerId.substring(0, 8)}...`);
                            setWorkerLastHeartbeat((prev) => ({
                                ...prev,
                                [workerId]: Date.now(),
                            }));
                            setWorkers((prev) =>
                                prev.map((w) =>
                                    w.id === workerId ? { ...w, is_active: true } : w
                                )
                            );
                        }
                    } else if (data.type === 'ping') {
                        ws?.send(JSON.stringify({ type: 'pong' }));
                    }
                } catch (error) {
                    console.error('WebSocket message parse error:', error, 'Raw message:', event.data);
                    setLogs((prev) => [
                        ...prev,
                        {
                            level: 'warning',
                            message: `Invalid WebSocket message: ${event.data}`,
                            timestamp: new Date().toLocaleString(),
                        },
                    ].slice(-CONFIG.MAX_LOG_ENTRIES));
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('disconnected');
                setLogs((prev) => [
                    ...prev,
                    {
                        level: 'error',
                        message: `WebSocket error: ${JSON.stringify(error)}`,
                        timestamp: new Date().toLocaleString(),
                    },
                ].slice(-CONFIG.MAX_LOG_ENTRIES));
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setConnectionStatus('disconnected');
                if (reconnectAttempts < CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
                    const delay = Math.min(CONFIG.WS_RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts), 30000);
                    console.log(`Reconnecting WebSocket in ${delay/1000}s... Attempt ${reconnectAttempts + 1}`);
                    setTimeout(connectWebSocket, delay);
                    reconnectAttempts++;
                } else {
                    console.error('Max WebSocket reconnect attempts reached');
                    setLogs((prev) => [
                        ...prev,
                        {
                            level: 'error',
                            message: 'Failed to reconnect WebSocket after max attempts',
                            timestamp: new Date().toLocaleString(),
                        },
                    ].slice(-CONFIG.MAX_LOG_ENTRIES));
                }
            };
        };

        connectWebSocket();

        return () => {
            ws?.close();
        };
    }, [isAuthenticated, token]);

    // Data fetching with polling as fallback
    useEffect(() => {
        if (!isAuthenticated || !token) return;

        const fetchData = async () => {
            try {
                const [workersData, workerStatusData, tasksData, masternodeData, logsData] = await Promise.all([
                    apiRequest('/api/workers', 'GET', null, token),
                    apiRequest('/api/workers/status', 'GET', null, token),
                    apiRequest('/api/tasks', 'GET', null, token),
                    apiRequest('/api/masternode', 'GET', null, token),
                    apiRequest('/api/logs', 'GET', null, token),
                ]);

                console.log('Raw /api/workers response:', workersData);
                console.log('Raw /api/workers/status response:', workerStatusData);

                // Merge workers data with status
                const processedWorkers = Object.entries(workersData).map(([id, worker]: [string, any]) => ({
                    id,
                    ...worker.worker_details,
                    is_active: workerStatusData[id]?.is_active ?? false,
                    registered_at: worker.worker_details?.registered_at || undefined,
                }));

                // Update is_active based on recent heartbeats
                const now = Date.now();
                const updatedWorkers = processedWorkers.map((worker) => ({
                    ...worker,
                    is_active: workerLastHeartbeat[worker.id] && (now - workerLastHeartbeat[worker.id] < CONFIG.HEARTBEAT_TIMEOUT) ? true : worker.is_active,
                }));

                const activeWorkers = updatedWorkers.filter((w) => w.is_active).length;
                const activeTasks = tasksData.filter((t: Task) => ['pending', 'running'].includes(t.status)).length;
                const completedTasks = tasksData.filter((t: Task) => t.status === 'completed').length;

                setStats({ activeWorkers, activeTasks, completedTasks });
                setWorkers(updatedWorkers);
                setTasks(tasksData);
                setMasternode(Object.values(masternodeData)[0]?.masternode_details || null);
                setLogs(
                    logsData.slice(-CONFIG.MAX_LOG_ENTRIES).map((log: any) => ({
                        ...log,
                        timestamp: new Date(log.timestamp).toLocaleString(),
                    }))
                );
                setConnectionStatus('connected');
                setLastUpdated(new Date());
            } catch (error: any) {
                console.error('Data fetch failed:', error);
                setConnectionStatus('disconnected');
                setLogs((prev) => [
                    ...prev,
                    {
                        level: 'error',
                        message: `Data fetch failed: ${error.message}`,
                        timestamp: new Date().toLocaleString(),
                    },
                ].slice(-CONFIG.MAX_LOG_ENTRIES));
                if (error.status === 401) {
                    try {
                        const response = await apiRequest('/api/refresh', 'POST', { refresh_token: refreshToken }, '');
                        setToken(response.access_token);
                        localStorage.setItem(CONFIG.TOKEN_KEY, response.access_token);
                    } catch (refreshError: any) {
                        console.error('Token refresh failed:', refreshError);
                        setIsAuthenticated(false);
                        setToken('');
                        setRefreshToken('');
                        setUser({});
                        localStorage.removeItem(CONFIG.TOKEN_KEY);
                        localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
                        localStorage.removeItem(CONFIG.USER_KEY);
                    }
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [isAuthenticated, token, refreshToken, workerLastHeartbeat]);

    // Update worker status based on heartbeat timeout
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setWorkers((prev) =>
                prev.map((worker) => {
                    const isActive = workerLastHeartbeat[worker.id] && (now - workerLastHeartbeat[worker.id] < CONFIG.HEARTBEAT_TIMEOUT);
                    console.log(`Worker ${worker.id.substring(0, 8)}... is_active: ${isActive}, Last heartbeat: ${workerLastHeartbeat[worker.id] || 'none'}`);
                    return {
                        ...worker,
                        is_active: isActive ? true : false,
                    };
                })
            );
            setStats((prev) => ({
                ...prev,
                activeWorkers: workers.filter((w) => workerLastHeartbeat[w.id] && (now - workerLastHeartbeat[w.id] < CONFIG.HEARTBEAT_TIMEOUT)).length,
            }));
        }, CONFIG.HEARTBEAT_TIMEOUT / 2);
        return () => clearInterval(interval);
    }, [workerLastHeartbeat, workers]);

    useEffect(() => {
        setPreviousStats(stats);
    }, [stats]);

    const handleLogin = async (username: string, password: string) => {
        try {
            const response = await apiRequest('/api/login', 'POST', { username, password }, '');
            setToken(response.access_token);
            setRefreshToken(response.refresh_token || '');
            setUser({ username: response.username });
            setIsAuthenticated(true);
            localStorage.setItem(CONFIG.TOKEN_KEY, response.access_token);
            localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, response.refresh_token || '');
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({ username: response.username }));
            setLoginError('');
        } catch (error: any) {
            setLoginError(error.message || 'Invalid credentials');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setToken('');
        setRefreshToken('');
        setUser({});
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        setTasks([]);
        setWorkers([]);
        setMasternode(null);
        setLogs([]);
        setStats({ activeWorkers: 0, activeTasks: 0, completedTasks: 0 });
        setConnectionStatus('connecting');
        setWorkerLastHeartbeat({});
    };

    const submitTask = async (command: string, resetCommand: () => void) => {
        if (!command.trim()) return;
        try {
            const response = await apiRequest('/tasks', 'POST', { command }, token);
            setTasks((prev) => [
                ...prev,
                {
                    task_id: response.task_id,
                    command,
                    status: 'pending',
                    output: '',
                    created_at: new Date().toISOString(),
                    worker_id: response.worker_id,
                },
            ]);
            setLogs((prev) => [
                ...prev,
                {
                    level: 'info',
                    message: `Task ${response.task_id.substring(0, 8)}... submitted: ${command}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
            resetCommand();
            setActiveSection('tasks');
            window.location.hash = '#tasks';
        } catch (error: any) {
            console.error('Task submission failed:', error);
            setLogs((prev) => [
                ...prev,
                {
                    level: 'error',
                    message: `Task submission failed: ${error.message}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
            setActiveSection('tasks');
            window.location.hash = '#tasks';
        }
    };

    const showTaskDetails = async (taskId: string) => {
        try {
            const task = await apiRequest(`/tasks/${taskId}`, 'GET', null, token);
            setTaskDetails(task);
        } catch (error: any) {
            console.error('Fetch task details failed:', error);
            setLogs((prev) => [
                ...prev,
                {
                    level: 'error',
                    message: `Failed to fetch task ${taskId.substring(0, 8)}... details: ${error.message}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
        }
    };

    const showWorkerDetails = async (workerId: string) => {
        try {
            const worker = workers.find((w) => w.id === workerId);
            if (worker) {
                setWorkerDetails(worker);
            } else {
                throw new Error('Worker not found');
            }
        } catch (error: any) {
            console.error('Fetch worker details failed:', error);
            setLogs((prev) => [
                ...prev,
                {
                    level: 'error',
                    message: `Failed to fetch worker ${workerId.substring(0, 8)}... details: ${error.message}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
        }
    };







    const removeWorker = (workerId: string, workerName: string) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Confirm Worker Removal',
            message: `Are you sure you want to remove worker ${workerName}?`,
            onConfirm: async () => {
                try {
                    await apiRequest(`/workers/${workerId}`, 'DELETE', null, token);
                    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
                    setWorkerLastHeartbeat((prev) => {
                        const newHeartbeats = { ...prev };
                        delete newHeartbeats[workerId];
                        return newHeartbeats;
                    });
                    setLogs((prev) => [
                        ...prev,
                        {
                            level: 'success',
                            message: `Worker ${workerName} removed successfully`,
                            timestamp: new Date().toLocaleString(),
                        },
                    ].slice(-CONFIG.MAX_LOG_ENTRIES));
                    setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
                } catch (error: any) {
                    console.error('Worker removal failed:', error);
                    setLogs((prev) => [
                        ...prev,
                        {
                            level: 'error',
                            message: `Failed to remove worker ${workerName}: ${error.message}`,
                            timestamp: new Date().toLocaleString(),
                        },
                    ].slice(-CONFIG.MAX_LOG_ENTRIES));
                    setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
                }
            },
            onCancel: () => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} }),
        });
    };

    const exportLogs = () => {
        const data = logs.map((log) => `${log.timestamp} [${log.level.toUpperCase()}]: ${log.message}`).join('\n');
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dheeraj_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setLogs((prev) => [
            ...prev,
            {
                level: 'success',
                message: 'Logs exported successfully',
                timestamp: new Date().toLocaleString(),
            },
        ].slice(-CONFIG.MAX_LOG_ENTRIES));
    };

    const clearLogs = () => {
        setConfirmationModal({
            isOpen: true,
            title: 'Confirm Clear Logs',
            message: 'Are you sure you want to clear all logs? This action cannot be undone.',
            onConfirm: () => {
                setLogs([]);
                setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
                setLogs((prev) => [
                    ...prev,
                    {
                        level: 'success',
                        message: 'Logs cleared successfully',
                        timestamp: new Date().toLocaleString(),
                    },
                ].slice(-CONFIG.MAX_LOG_ENTRIES));
            },
            onCancel: () => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} }),
        });
    };

    const showAiSuggestModal = () => {
        setIsAiSuggestOpen(true);
    };

    const applyAiCommand = (command: string) => {
        setIsAiSuggestOpen(false);
        submitTask(command, () => {});
    };

    return (
        <div className="min-h-screen flex flex-col">
            <LoginModal isOpen={!isAuthenticated} onLogin={handleLogin} error={loginError} />
            {isAuthenticated && (
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar
                        isOpen={isSidebarOpen}
                        toggleSidebar={setIsSidebarOpen}
                        activeSection={activeSection}
                        setSection={setActiveSection}
                        onLogout={handleLogout}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header
                            connectionStatus={connectionStatus}
                            lastUpdated={lastUpdated}
                            toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            theme={theme}
                            toggleSidebar={setIsSidebarOpen}
                        />
                        <main className="flex-1 overflow-y-auto bg-gray-50">
                            {activeSection === 'insights' && (
                                <InsightsSection stats={stats} previousStats={previousStats} tasks={tasks} showTaskDetails={showTaskDetails} />
                            )}
                            {activeSection === 'tasks' && (
                                <TasksSection
                                    tasks={tasks}
                                    submitTask={submitTask}
                                    showTaskDetails={showTaskDetails}
                                    showAiSuggestModal={showAiSuggestModal}
                                />
                            )}
                            {activeSection === 'workers' && (
                                <WorkersSection workers={workers} showWorkerDetails={showWorkerDetails} removeWorker={removeWorker} token={token} />
                            )}
                            {activeSection === 'workflow' && <WorkflowSection masternode={masternode} workers={workers} />
                            }
			    {activeSection === 'visual-workflow' && <VisualWorkflowSection connectionStatus={connectionStatus} />}
                            {activeSection === 'logs' && <LogsSection logs={logs} exportLogs={exportLogs} clearLogs={clearLogs} />}
                            {activeSection === 'apiDocs' && <ApiDocsSection />}
                        </main>
                    </div>
                    <TaskDetailsModal isOpen={!!taskDetails} task={taskDetails} closeModal={() => setTaskDetails(null)} />
                    <WorkerDetailsModal isOpen={!!workerDetails} worker={workerDetails} closeModal={() => setWorkerDetails(null)} />
                    <AiSuggestModal isOpen={isAiSuggestOpen} onApply={applyAiCommand} closeModal={() => setIsAiSuggestOpen(false)} />
                    <ConfirmationModal
                        isOpen={confirmationModal.isOpen}
                        title={confirmationModal.title}
                        message={confirmationModal.message}
                        onConfirm={confirmationModal.onConfirm}
                        onCancel={confirmationModal.onCancel}
                    />
                </div>
            )}
        </div>
    );
};

export default App;
