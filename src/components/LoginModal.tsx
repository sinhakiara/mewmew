import React, { useState } from 'react';

interface LoginModalProps {
    isOpen: boolean;
    onLogin: (username: string, password: string) => void;
    error: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin, error }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSubmit = () => {
        onLogin(username, password);
        setUsername('');
        setPassword('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Login to Dheeraj Dashboard</h3>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter username"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-500 mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter password"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
