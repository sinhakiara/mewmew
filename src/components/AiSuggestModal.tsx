import React, { useState } from 'react';

interface AiSuggestModalProps {
    isOpen: boolean;
    onApply: (command: string) => void;
    closeModal: () => void;
}

const AiSuggestModal: React.FC<AiSuggestModalProps> = ({ isOpen, onApply, closeModal }) => {
    const [aiCommand, setAiCommand] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSuggest = async () => {
        setIsLoading(true);
        try {
            // Simulate AI suggestion (replace with actual AI API call if available)
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAiCommand('curl -I https://example.com');
        } catch (error) {
            console.error('AI suggestion failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm modal-overlay">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">AI Command Suggestion</h3>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Generate an AI-suggested command for your task.</p>
                    <button
                        onClick={handleSuggest}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-center shadow"
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Generating...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-wand-magic-sparkles mr-2"></i>
                                Suggest Command
                            </>
                        )}
                    </button>
                </div>
                {aiCommand && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested Command</h4>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-gray-800">
                            {aiCommand}
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition shadow"
                    >
                        Cancel
                    </button>
                    {aiCommand && (
                        <button
                            onClick={() => onApply(aiCommand)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiSuggestModal;
