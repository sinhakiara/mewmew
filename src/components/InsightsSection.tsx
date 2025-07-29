import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface Task {
    task_id: string;
    command: string;
    status: string;
    output: string;
    created_at: string;
    queue?: string;
}

interface Stats {
    activeWorkers: number;
    activeTasks: number;
    completedTasks: number;
}

interface InsightsSectionProps {
    stats: Stats;
    previousStats: Stats;
    tasks: Task[];
    showTaskDetails: (taskId: string) => void;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ stats, previousStats, tasks, showTaskDetails }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            chartInstance.current = new Chart(chartRef.current, {
                type: 'bar',
                data: {
                    labels: ['Active Workers', 'Active Tasks', 'Completed Tasks'],
                    datasets: [
                        {
                            label: 'Current',
                            data: [stats.activeWorkers, stats.activeTasks, stats.completedTasks],
                            backgroundColor: 'rgba(99, 102, 241, 0.5)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 1,
                        },
                        {
                            label: 'Previous',
                            data: [previousStats.activeWorkers, previousStats.activeTasks, previousStats.completedTasks],
                            backgroundColor: 'rgba(139, 92, 246, 0.5)',
                            borderColor: 'rgb(139, 92, 246)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true },
                    },
                },
            });
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats, previousStats]);

    return (
        <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Active Workers</h3>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeWorkers}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Active Tasks</h3>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Completed Tasks</h3>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Task Statistics</h3>
                <canvas ref={chartRef}></canvas>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 p-4">Recent Tasks</h3>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="p-3">Task ID</th>
                            <th className="p-3">Command</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.slice(0, 5).map((task) => (
                            <tr
                                key={task.task_id}
                                className="border-t text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => showTaskDetails(task.task_id)}
                            >
                                <td className="p-3 font-mono">{task.task_id.substring(0, 8)}...</td>
                                <td className="p-3 font-mono">{task.command.substring(0, 20)}...</td>
                                <td className={`p-3 task-status-${task.status}`}>{task.status}</td>
                                <td className="p-3">{new Date(task.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InsightsSection;
