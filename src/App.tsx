import React, { useState, useEffect, useRef } from 'react';
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

interface Task {
    task_id: string;
    command: string;
    status: string;
    output: string;
    created_at: string;
    queue?: string;
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
    //BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`,
    BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : `https://192.168.29.20:8000`,
    REFRESH_INTERVAL: 5000,
    MAX_LOG_ENTRIES: 100,
    TOKEN_KEY: 'dheeraj_token',
    USER_KEY: 'dheeraj_user',
    THEME_KEY: 'dheeraj_theme',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
};

const apiRequest = async (endpoint: string, method: string = 'GET', data: any = null, token: string, retries: number = CONFIG.MAX_RETRIES): Promise<any> => {
    const url = `${CONFIG.BASE_URL}${endpoint}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token && !endpoint.includes('/api/login')) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options: RequestInit = { method, headers, credentials: 'include' };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }
        return await response.json();
    } catch (error) {
        if (retries > 0 && (error as any).status !== 401) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return apiRequest(endpoint, method, data, token, retries - 1);
        }
        throw error;
    }
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string>(localStorage.getItem(CONFIG.TOKEN_KEY) || '');
    const [user, setUser] = useState<{ username?: string }>(JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}'));
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

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem(CONFIG.THEME_KEY, theme);
    }, [theme]);

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

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const [workersData, tasksData, masternodeData, logsData] = await Promise.all([
                    apiRequest('/api/workers', 'GET', null, token),
                    apiRequest('/api/tasks', 'GET', null, token),
                    apiRequest('/api/masternode', 'GET', null, token),
                    apiRequest('/api/logs', 'GET', null, token),
                ]);

                const activeWorkers = Object.values(workersData).filter((w: any) => w.is_active).length;
                const activeTasks = tasksData.filter((t: Task) => ['pending', 'running'].includes(t.status)).length;
                const completedTasks = tasksData.filter((t: Task) => t.status === 'completed').length;

                setStats({ activeWorkers, activeTasks, completedTasks });
                setWorkers(
                    Object.entries(workersData).map(([id, worker]: [string, any]) => ({
                        id,
                        ...worker.worker_details,
                        is_active: worker.is_active,
                    }))
                );
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
                if (error.status === 401) {
                    setIsAuthenticated(false);
                    setToken('');
                    localStorage.removeItem(CONFIG.TOKEN_KEY);
                    localStorage.removeItem(CONFIG.USER_KEY);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        setPreviousStats(stats);
    }, [stats]);

    const handleLogin = async (username: string, password: string) => {
        try {
            const response = await apiRequest('/api/login', 'POST', { username, password }, token);
            setToken(response.token);
            setUser({ username: response.username });
            setIsAuthenticated(true);
            localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({ username: response.username }));
            setLoginError('');
        } catch (error: any) {
            setLoginError(error.message || 'Invalid credentials');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setToken('');
        setUser({});
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        setTasks([]);
        setWorkers([]);
        setMasternode(null);
        setLogs([]);
        setStats({ activeWorkers: 0, activeTasks: 0, completedTasks: 0 });
        setConnectionStatus('connecting');
    };

    const submitTask = async (command: string, resetCommand: () => void) => {
        if (!command.trim()) return;
        try {
            const response = await apiRequest('/tasks', 'POST', { command }, token);
            setTasks(prev => [
                ...prev,
                {
                    task_id: response.task_id,
                    command,
                    status: 'pending',
                    output: '',
                    created_at: new Date().toISOString(),
                },
            ]);
            setLogs(prev => [
                ...prev,
                {
                    level: 'info',
                    message: `Task ${response.task_id.substring(0, 8)}... submitted: ${command}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
            resetCommand();
        } catch (error: any) {
            console.error('Task submission failed:', error);
            setLogs(prev => [
                ...prev,
                {
                    level: 'error',
                    message: `Task submission failed: ${error.message}`,
                    timestamp: new Date().toLocaleString(),
                },
            ].slice(-CONFIG.MAX_LOG_ENTRIES));
        }
    };

    const showTaskDetails = async (taskId: string) => {
        try {
            const task = await apiRequest(`/tasks/${taskId}`, 'GET', null, token);
            setTaskDetails(task);
        } catch (error: any) {
            console.error('Fetch task details failed:', error);
            setLogs(prev => [
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
            const worker = workers.find(w => w.id === workerId);
            if (worker) {
                setWorkerDetails(worker);
            } else {
                throw new Error('Worker not found');
            }
        } catch (error: any) {
            console.error('Fetch worker details failed:', error);
            setLogs(prev => [
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
                    setWorkers(prev => prev.filter(w => w.id !== workerId));
                    setLogs(prev => [
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
                    setLogs(prev => [
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
        const data = logs.map(log => `${log.timestamp} [${log.level.toUpperCase()}]: ${log.message}`).join('\n');
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dheeraj_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setLogs(prev => [
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
                setLogs(prev => [
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
                                <TasksSection tasks={tasks} submitTask={submitTask} showTaskDetails={showTaskDetails} showAiSuggestModal={showAiSuggestModal} />
                            )}
                            {activeSection === 'workers' && (
                                <WorkersSection workers={workers} showWorkerDetails={showWorkerDetails} removeWorker={removeWorker} />
                            )}
                            {activeSection === 'workflow' && <WorkflowSection masternode={masternode} workers={workers} />}
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
