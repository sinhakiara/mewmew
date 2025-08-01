import React, { useState } from 'react';
import { X, Lightbulb, Copy } from 'lucide-react';

interface AiSuggestModalProps {
  isOpen: boolean;
  onApply: (command: string) => void;
  closeModal: () => void;
}

const AiSuggestModal: React.FC<AiSuggestModalProps> = ({ isOpen, onApply, closeModal }) => {
  const [selectedCommand, setSelectedCommand] = useState('');

  const suggestions = [
    {
      category: 'Reconnaissance',
      commands: [
        { cmd: 'nmap -sS -O target.com', desc: 'TCP SYN scan with OS detection' },
        { cmd: 'subfinder -d target.com', desc: 'Subdomain enumeration' },
        { cmd: 'amass enum -d target.com', desc: 'Attack surface mapping' },
        { cmd: 'dig target.com ANY', desc: 'DNS record enumeration' }
      ]
    },
    {
      category: 'Web Security',
      commands: [
        { cmd: 'ffuf -w /usr/share/wordlists/common.txt -u https://target.com/FUZZ', desc: 'Directory fuzzing' },
        { cmd: 'sqlmap -u "https://target.com/page?id=1" --batch', desc: 'SQL injection testing' },
        { cmd: 'nikto -h https://target.com', desc: 'Web vulnerability scanner' },
        { cmd: 'gobuster dir -u https://target.com -w /usr/share/wordlists/common.txt', desc: 'Directory brute force' }
      ]
    },
    {
      category: 'Vulnerability Scanning',
      commands: [
        { cmd: 'nuclei -u https://target.com', desc: 'Fast vulnerability scanner' },
        { cmd: 'nessus -T4 target.com', desc: 'Comprehensive vulnerability assessment' },
        { cmd: 'openvas-cli -h target.com', desc: 'OpenVAS vulnerability scan' }
      ]
    },
    {
      category: 'Network Security',
      commands: [
        { cmd: 'masscan -p1-65535 target.com --rate=1000', desc: 'High-speed port scanner' },
        { cmd: 'zmap -p 80 10.0.0.0/8', desc: 'Internet-wide network scanner' },
        { cmd: 'hping3 -S -p 80 target.com', desc: 'Custom packet crafting' }
      ]
    }
  ];

  const handleApply = () => {
    if (selectedCommand) {
      onApply(selectedCommand);
      setSelectedCommand('');
    }
  };

  const copyToClipboard = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Command Suggestions</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {suggestions.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.commands.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCommand(suggestion.cmd)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCommand === suggestion.cmd
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {suggestion.cmd}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(suggestion.cmd);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex-1">
            {selectedCommand && (
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selected command:</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  {selectedCommand}
                </code>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedCommand}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Command
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSuggestModal;
