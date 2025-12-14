'use client';

import { useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { executionsApi } from '@/lib/executions';

interface ExecutionPanelProps {
  code: string;
}

export default function ExecutionPanel({ code }: ExecutionPanelProps) {
  const { sessionId, addOutput, status, setStatus, language } = useSessionStore();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!sessionId || !language) {
      addOutput('[System] No active session. Start a session first.');
      return;
    }
    if (!code.trim()) return;

    setIsExecuting(true);
    setStatus('running');
    addOutput(`[System] Executing code...`);

    try {
      await executionsApi.execute({
        code,
        sessionId,
        language
      });
      // The socket in useSessionStore (to be implemented) or the backend will stream output?
      // For now, we assume the backend streams output to the session.
      // Wait, we need to LISTEN to the output. useSessionStore should handle that globally.
    } catch (error: any) {
      addOutput(`[Error] Execution failed: ${error.message}`);
      setStatus('idle');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExecute}
        disabled={isExecuting || !sessionId || !code.trim()}
        title={!sessionId ? "Start a session to run code" : "Run Code"}
        className="p-1 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 text-xs h-7"
      >
        {isExecuting ? (
           <>
             <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
             Running
           </>
        ) : (
           <>
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Run
           </>
        )}
      </button>
      {!sessionId && <span className="text-xs text-yellow-500 hidden sm:inline">⚠️ Start session to run</span>}
    </div>
  );
}
