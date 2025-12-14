import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/useSessionStore';

export const Terminal: React.FC = () => {
    const { output, isOutputOpen, toggleOutput, clearOutput } = useSessionStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output, isOutputOpen]);

    if (!isOutputOpen) {
        return (
            <div className="bg-gray-900 text-gray-400 p-2 border-t border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-800" onClick={toggleOutput}>
                <span className="text-xs font-mono ml-2">Terminal / Console</span>
                <span className="text-xs mr-2">▲</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black text-white border-l border-gray-800 font-mono text-sm">
            <div className="flex justify-between items-center bg-gray-900 px-4 py-1 text-xs text-gray-400 select-none shrink-0 h-10 border-b border-gray-800">
                <div className="flex gap-4 items-center">
                    <span className="font-bold text-gray-300">Terminal</span>
                    <span className="cursor-pointer hover:text-white" onClick={clearOutput} title="Clear Output">🚫</span>
                </div>
                <div className="cursor-pointer hover:text-white" onClick={toggleOutput} title="Close Terminal">✕</div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-1" ref={scrollRef}>
                {output.length === 0 && <span className="text-gray-600 italic">No output yet...</span>}
                {output.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all border-b border-gray-900/50 pb-0.5">{line}</div>
                ))}
            </div>
        </div>
    );
};
