import React from 'react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: (open: boolean) => void;
    activeSection: string;
    setSection: (section: string) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activeSection, setSection, onLogout }) => {
    const navItems = [
        { id: 'insights', label: 'Insights', icon: 'fas fa-chart-line' },
        { id: 'tasks', label: 'Tasks', icon: 'fas fa-tasks' },
        { id: 'workers', label: 'Workers', icon: 'fas fa-server' },
        { id: 'workflow', label: 'Workflow', icon: 'fas fa-diagram-project' },
        { id: 'logs', label: 'Logs', icon: 'fas fa-file-alt' },
        { id: 'apiDocs', label: 'API Docs', icon: 'fas fa-book' },
    ];

    return (
        <div
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } md:static md:translate-x-0 md:w-64 flex flex-col`}
        >
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Dheeraj Dashboard</h2>
            </div>
            <nav className="flex-1 p-4">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.id} className="mb-2">
                            <a
                                href={`#${item.id}`}
                                onClick={() => setSection(item.id)}
                                className={`flex items-center p-2 rounded-lg text-gray-700 hover:bg-indigo-50 transition ${
                                    activeSection === item.id ? 'bg-indigo-100 text-indigo-600' : ''
                                }`}
                            >
                                <i className={`${item.icon} mr-3`}></i>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-2 text-gray-700 hover:bg-red-50 rounded-lg transition"
                >
                    <i className="fas fa-sign-out-alt mr-3"></i>
                    Logout
                </button>
            </div>
            <button
                className="md:hidden absolute top-4 right-4 text-gray-500"
                onClick={() => toggleSidebar(false)}
            >
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default Sidebar;
