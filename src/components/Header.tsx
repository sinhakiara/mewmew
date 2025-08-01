import React from 'react';
import { Menu, Sun, Moon, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  connectionStatus: string;
  lastUpdated: Date | null;
  toggleTheme: () => void;
  theme: string;
  toggleSidebar: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  lastUpdated,
  toggleTheme,
  theme,
  toggleSidebar
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-yellow-500" />;
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

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => toggleSidebar(true)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Security Workflow Platform
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            {getConnectionIcon()}
            <span className={`
              ${connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 
                connectionStatus === 'disconnected' ? 'text-red-600 dark:text-red-400' : 
                'text-yellow-600 dark:text-yellow-400'}
            `}>
              {getConnectionText()}
            </span>
          </div>
          
          {lastUpdated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
