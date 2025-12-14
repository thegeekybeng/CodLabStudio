import React, { useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';

const LANGUAGES = [
  { id: 'python', name: 'Python 3.11' },
  { id: 'go', name: 'Go 1.21' },
];

export const SessionManager: React.FC = () => {
  const { sessionId, language, status, createSession, stopSession } = useSessionStore();
  const [selectedLang, setSelectedLang] = useState('python');

  if (sessionId) {
      return (
          <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-700">
              <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status === 'idle' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                  <span className="text-white font-medium">Session Active: {language}</span>
                  <span className="text-xs text-gray-400 font-mono">({sessionId.slice(0, 8)})</span>
              </div>
              <button 
                  onClick={() => stopSession()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
              >
                  Stop Session
              </button>
          </div>
      );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-2">
          <span className="text-white">New Session:</span>
          <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-gray-800 text-white rounded px-2 py-1 border border-gray-600"
          >
              {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
              ))}
          </select>
          <button 
              onClick={() => createSession(selectedLang)}
              disabled={status === 'connecting'}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition"
          >
              {status === 'connecting' ? 'Starting...' : 'Start Coding'}
          </button>
      </div>
    </div>
  );
};
