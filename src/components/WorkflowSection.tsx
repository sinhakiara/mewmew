import React, { useEffect, useRef } from 'react';
import { jsPlumbInstance } from 'jsplumb';

interface Worker {
    id: string;
    is_active: boolean;
    worker_nodename?: string;
}

interface WorkflowSectionProps {
    masternode: any;
    workers: Worker[];
}

const WorkflowSection: React.FC<WorkflowSectionProps> = ({ masternode, workers }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const jsPlumbRef = useRef<jsPlumbInstance | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            jsPlumbRef.current = jsPlumb.getInstance({
                Container: containerRef.current,
                Connector: ['Bezier', { curviness: 50 }],
                Endpoint: ['Dot', { radius: 5 }],
                PaintStyle: { stroke: '#6366f1', strokeWidth: 2 },
                HoverPaintStyle: { stroke: '#4b5563', strokeWidth: 3 },
            });

            const jsPlumbInstance = jsPlumbRef.current;

            if (masternode) {
                workers.forEach((worker) => {
                    if (worker.is_active) {
                        jsPlumbInstance.connect({
                            source: 'masternode',
                            target: `worker-${worker.id}`,
                            anchors: ['Bottom', 'Top'],
                            overlays: [
                                ['Arrow', { width: 10, length: 10, location: 1 }],
                            ],
                        });
                    }
                });
            }

            return () => {
                jsPlumbInstance.reset();
            };
        }
    }, [masternode, workers]);

    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Workflow</h2>
            <div ref={containerRef} className="relative min-h-[400px] bg-white rounded-lg shadow p-4">
                {masternode && (
                    <div
                        id="masternode"
                        className="absolute top-10 left-1/2 transform -translate-x-1/2 p-4 bg-indigo-100 rounded-lg shadow"
                    >
                        <h3 className="text-sm font-medium text-indigo-600">Masternode</h3>
                        <p className="text-xs">{masternode.masternode_nodename || 'Masternode'}</p>
                    </div>
                )}
                {workers.map((worker, index) => (
                    <div
                        key={worker.id}
                        id={`worker-${worker.id}`}
                        className={`absolute bottom-10 left-${index + 1}/${
                            workers.length + 1
                        } p-4 bg-white rounded-lg shadow ${worker.is_active ? 'border-green-500' : 'border-red-500'} border-2`}
                    >
                        <h3 className="text-sm font-medium text-gray-600">{worker.worker_nodename || worker.id}</h3>
                        <p className="text-xs">{worker.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkflowSection;
