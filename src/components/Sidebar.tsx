import React from 'react';
import { X, Menu, BarChart3, CheckSquare, Users, GitBranch, FileText, Book, Workflow } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: (isOpen: boolean) => void;
  activeSection: string;
  setSection: (section: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  activeSection,
  setSection,
  onLogout
}) => {
  const navigationItems = [
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'workflow', label: 'Workflow', icon: GitBranch },
    { id: 'visual-workflow', label: 'Visual Workflow', icon: Workflow },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'apiDocs', label: 'API Docs', icon: Book },
  ];

  const handleSectionClick = (sectionId: string) => {
    setSection(sectionId);
    window.location.hash = `#${sectionId}`;
    toggleSidebar(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none
      `}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={() => toggleSidebar(false)}
            className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleSectionClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={onLogout}
            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
