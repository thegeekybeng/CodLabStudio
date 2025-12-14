'use client';

import { useSessionStore } from '@/store/useSessionStore';
import { useDebugStore } from '@/store/useDebugStore';
import { debugApi } from '@/lib/debug';

interface DebugToolbarProps {
    code: string;
    language: string;
    breakpoints?: number[];
}

export default function DebugToolbar({ code, language, breakpoints = [] }: DebugToolbarProps) {
    const { sessionId, addOutput, setStatus } = useSessionStore();
    const { isActive, setIsActive, setIsPaused } = useDebugStore();

    const handleStart = async () => {
        if (!sessionId) {
            addOutput('[System] No active session.');
            return;
        }

        try {
            addOutput('[Debug] Starting debugger...');
            setIsActive(true);
            setStatus('debugging');
            await debugApi.startDebugSession({
                sessionId,
                code,
                language,
                breakpoints
            });
        } catch (e: any) {
            addOutput(`[Error] Failed to start debug: ${e.message}`);
            setIsActive(false);
            setStatus('idle');
        }
    };

    const handleStop = async () => {
        if (!sessionId) return;
        await debugApi.stopDebugSession(sessionId);
        setIsActive(false);
        setStatus('idle');
    };

    const handleCommand = async (type: 'step_over' | 'step_into' | 'step_out' | 'continue') => {
        if (!sessionId) return;
        setIsPaused(false); 

        // Optimistic UI could go here
        
        const apiMethodMap: Record<string, keyof typeof debugApi> = {
            'step_over': 'stepOver',
            'step_into': 'stepInto',
            'step_out': 'stepOut',
            'continue': 'continue'
        };

        const method = apiMethodMap[type];
        // @ts-ignore
        await debugApi[method](sessionId);
    };

    if (!sessionId) return null;

    if (!isActive) {
        return (
            <button 
                onClick={handleStart} 
                className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 text-xs transition-colors"
                title="Start Debug Session"
            >
                <span className="text-green-500">🐞</span> Start Debug
            </button>
        );
    }

    return (
        <div className="flex items-center bg-gray-800 rounded border border-gray-700 p-0.5">
            <button onClick={() => handleCommand('continue')} className="p-1.5 hover:bg-gray-700 rounded text-green-400" title="Continue (F5)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <button onClick={() => handleCommand('step_over')} className="p-1.5 hover:bg-gray-700 rounded text-blue-400" title="Step Over (F10)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> 
                {/* Simplified icon for step over, typically an arrow over a dot */}
            </button>
            <button onClick={() => handleCommand('step_into')} className="p-1.5 hover:bg-gray-700 rounded text-blue-400" title="Step Into (F11)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </button>
            <button onClick={() => handleCommand('step_out')} className="p-1.5 hover:bg-gray-700 rounded text-blue-400" title="Step Out (Shift+F11)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22l7.5-18.29-.71-.71L12 6 5.21 3 4.5 3.71z"/></svg>
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <button onClick={handleStop} className="p-1.5 hover:bg-red-900/50 rounded text-red-500" title="Stop Debugging (Shift+F5)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
            </button>
        </div>
    );
}
