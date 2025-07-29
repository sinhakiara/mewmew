import React from 'react';

interface HeaderProps {
    connectionStatus: string;
    lastUpdated: Date | null;
    toggleTheme: () => void;
    theme: string;
    toggleSidebar: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus, lastUpdated, toggleTheme, theme, toggleSidebar }) => {
    return (
        <header className="bg-white shadow p-4 flex items-center justify-between">
            <div className="flex items-center">
                <button
                    className="md:hidden text-gray-500 mr-4"
                    onClick={() => toggleSidebar(true)}
                >
                    <i className="fas fa-bars"></i>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm">
                    <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    ></span>
                    <span className="text-gray-600">
                        {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                <div className="text-sm text-gray-600">
                    Last Updated:{' '}
                    {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                    <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
                </button>
            </div>
        </header>
    );
};

export default Header;
