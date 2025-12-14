import { useEffect } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { useDebugStore } from '@/store/useDebugStore';
import { useSocket } from '@/hooks/useSocket';

interface DebugPanelProps {
  code: string;
  language: string;
  breakpoints?: number[];
  onBreakpointToggle?: (line: number) => void;
}

export default function DebugPanel({ code, language, breakpoints = [], onBreakpointToggle }: DebugPanelProps) {
  const { addOutput, setStatus } = useSessionStore();
  const { 
    isActive, isPaused, currentLine, variables, 
    setIsActive, setIsPaused, setCurrentLine, setVariables, reset 
  } = useDebugStore();
  
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const onPaused = (data: any) => {
        setIsPaused(true);
        setCurrentLine(data.line);
        setVariables(data.variables || {});
        addOutput(`[Debug] Paused at line ${data.line}`);
        setStatus('debugging');
    };

    const onOutput = (data: any) => {
        addOutput(`[Debug] ${data.content}`);
    };

    const onTerminated = () => {
        reset();
        addOutput('[Debug] Session terminated');
        setStatus('idle');
    };
    
    socket.on('debug:paused', onPaused);
    socket.on('debug:output', onOutput);
    socket.on('debug:terminated', onTerminated);
    
    return () => {
        socket.off('debug:paused', onPaused);
        socket.off('debug:output', onOutput);
        socket.off('debug:terminated', onTerminated);
    }
  }, [socket, addOutput, setStatus, setIsPaused, setCurrentLine, setVariables, reset]);

  return (
    <div className="p-4 h-full flex flex-col">
      {!isActive ? (
          <DebugGuide />
      ) : (
          <div className="flex-1 overflow-y-auto">
             {isPaused && (
                 <div className="mb-4 p-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-sm rounded">
                    <strong>Paused at Line {currentLine}</strong>
                 </div>
             )}
             
             <div className="text-xs font-mono">
                 <h4 className="font-bold border-b border-gray-700 mb-2 pb-1 text-gray-400 uppercase tracking-wider">Variables</h4>
                 <div className="space-y-1">
                     {Object.entries(variables).map(([k, v]) => (
                         <div key={k} className="flex gap-2 font-mono">
                             <span className="text-blue-400">{k}:</span>
                             <span className="text-gray-300">{String(v)}</span>
                         </div>
                     ))}
                     {Object.keys(variables).length === 0 && <span className="text-gray-500 italic">No variables in scope</span>}
                 </div>
             </div>
          </div>
      )}
    </div>
  );
}

function DebugGuide() {
    return (
        <div className="text-sm text-gray-400 space-y-4">
            <h3 className="font-bold text-gray-200 border-b border-gray-700 pb-2">How to Debug</h3>
            
            <div className="space-y-2">
                <div className="flex gap-3">
                    <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                    <p>Click the gutter (line numbers) in the editor to set a <span className="text-red-400">breakpoint</span>.</p>
                </div>
                
                <div className="flex gap-3">
                    <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                    <p>Click the <span className="text-green-400">Start Debug</span> button in the toolbar above.</p>
                </div>
                
                <div className="flex gap-3">
                    <span className="bg-gray-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                    <p>Use the controls to step through your code:</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <span className="text-blue-400 font-bold">Step Over</span>
                    <p className="opacity-70">Next line</p>
                </div>
                <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <span className="text-blue-400 font-bold">Step Into</span>
                    <p className="opacity-70">Enter function</p>
                </div>
                <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <span className="text-blue-400 font-bold">Step Out</span>
                    <p className="opacity-70">Exit function</p>
                </div>
                <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <span className="text-green-400 font-bold">Continue</span>
                    <p className="opacity-70">Resume</p>
                </div>
            </div>
        </div>
    )
}
