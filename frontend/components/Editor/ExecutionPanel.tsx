'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { executionsApi, ExecuteCodeRequest } from '@/lib/executions';

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number | null;
  status: string;
}

interface ExecutionPanelProps {
  code: string;
  language: string;
  notebookId?: string;
  userId?: string;
}

export default function ExecutionPanel({
  code,
  language,
  notebookId,
  userId,
}: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // Allow execution for both authenticated users and guests
    // Guests have userId="guest", authenticated users have real UUIDs
    if (!userId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const newSocket = io(WS_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join:user', userId);
    });

    newSocket.on('execution:status', (data: any) => {
      setStatus(data.message || data.status);
      if (data.status === 'RUNNING') {
        setIsExecuting(true);
      }
    });

    newSocket.on('execution:complete', (data: any) => {
      setIsExecuting(false);
      setResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode,
        executionTime: data.executionTime,
        status: 'COMPLETED',
      });
      setStatus('Execution completed');
    });

    newSocket.on('execution:error', (data: any) => {
      setIsExecuting(false);
      setResult({
        stdout: '',
        stderr: data.error || 'Execution failed',
        exitCode: null,
        executionTime: null,
        status: 'FAILED',
      });
      setStatus('Execution failed');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave:user', userId);
        newSocket.disconnect();
      }
    };
  }, [userId]);

  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setResult(null);
    setStatus('Starting execution...');

    try {
      const request: ExecuteCodeRequest = {
        code,
        language,
        ...(notebookId && { notebookId }),
      };

      await executionsApi.execute(request);
    } catch (error) {
      setIsExecuting(false);
      setStatus('Failed to start execution');
      console.error('Execution error:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
        <h3 className="text-sm font-semibold text-gray-700">Execution Output</h3>
        <button
          onClick={handleExecute}
          disabled={isExecuting || !code.trim()}
          className="px-4 py-1.5 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {status && (
          <div className="text-sm text-gray-600 mb-2">{status}</div>
        )}

        {result && (
          <>
            {result.stdout && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Stdout</div>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-x-auto">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-red-500 uppercase">Stderr</div>
                <pre className="bg-red-50 p-3 rounded border border-red-200 text-sm text-red-800 overflow-x-auto">
                  {result.stderr}
                </pre>
              </div>
            )}

            <div className="flex gap-4 text-xs text-gray-500">
              {result.exitCode !== null && (
                <span>Exit Code: {result.exitCode}</span>
              )}
              {result.executionTime !== null && (
                <span>Execution Time: {result.executionTime}ms</span>
              )}
            </div>
          </>
        )}

        {!result && !isExecuting && !status && (
          <div className="text-sm text-gray-400 text-center py-8">
            Click &quot;Run Code&quot; to execute your code
          </div>
        )}

        {isExecuting && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-sm text-gray-600">Executing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

