'use client';

import { useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { packagesApi } from '@/lib/packages';

interface PackageManagerProps {
  language: string;
  notebookId?: string;
}

export default function PackageManager({ language }: PackageManagerProps) {
  const { sessionId, addOutput } = useSessionStore();
  const [pkgName, setPkgName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!sessionId) {
        addOutput('[System] No active session.');
        return;
    }
    if (!pkgName.trim()) return;

    setIsInstalling(true);
    addOutput(`[System] Installing package: ${pkgName}...`);

    try {
      const result = await packagesApi.install({
        sessionId,
        packages: [pkgName],
        language
      });
      
      if (result.success) {
         addOutput(`[System] Successfully installed ${pkgName}`);
         addOutput(result.output);
         setPkgName('');
      } else {
         addOutput(`[Error] Failed to install ${pkgName}`);
         addOutput(result.output);
      }
    } catch (error: any) {
      addOutput(`[Error] Installation error: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Package Manager ({language})</h3>
      
      <div className="flex gap-2 mb-4">
        <input 
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
            placeholder="Package name (e.g. requests)"
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={isInstalling || !sessionId}
            onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
        />
        <button 
            onClick={handleInstall}
            disabled={isInstalling || !pkgName.trim() || !sessionId}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
            {isInstalling ? 'Installing...' : 'Install'}
        </button>
      </div>

      {!sessionId && (
         <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
             Start a session to install packages.
         </div>
      )}
      
      <div className="text-xs text-gray-500">
          Note: Packages are installed into the active session environment.
      </div>
    </div>
  );
}
