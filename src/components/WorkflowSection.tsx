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

interface WorkflowSectionProps {
  masternode: any;
  workers: Worker[];
}

const WorkflowSection: React.FC<WorkflowSectionProps> = ({ masternode, workers }) => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Overview</h2>
      
      {/* Master Node Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Master Node
        </h3>
        {masternode ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Node Name:</span> {masternode.masternode_nodename}</p>
            <p><span className="font-medium">OS:</span> {masternode.masternode_os}</p>
            <p><span className="font-medium">Architecture:</span> {masternode.masternode_arch}</p>
            <p><span className="font-medium">Kernel:</span> {masternode.masternode_kernel}</p>
            <p><span className="font-medium">Public IP:</span> {masternode.masternode_publicip}</p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Master node information not available</p>
        )}
      </div>
      
      {/* Workers Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Workers Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Workers</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{workers.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Workers</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {workers.filter(w => w.is_active).length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Inactive Workers</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {workers.filter(w => !w.is_active).length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Use the new "Visual Workflow" section to create and execute automated security workflows with a drag-and-drop interface.
        </p>
      </div>
    </div>
  );
};

export default WorkflowSection;
