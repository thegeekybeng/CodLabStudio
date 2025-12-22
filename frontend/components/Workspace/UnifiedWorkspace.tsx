'use client';

import React, { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import CodeEditor from '@/components/Editor/CodeEditor';
import { Terminal } from '@/components/Terminal/Terminal';
import DebugPanel from '@/components/Debug/DebugPanel';
import DebugToolbar from '@/components/Debug/DebugToolbar';
import PackageManager from '@/components/PackageManager/PackageManager';
import ExecutionPanel from '@/components/Editor/ExecutionPanel';
import Logo from '@/components/Brand/Logo';
import { useSocket } from '@/hooks/useSocket';

interface UnifiedWorkspaceProps {
    initialCode?: string;
    initialLanguage?: string;
    notebookTitle?: string;
    onCodeChange?: (code: string) => void;
    onTitleChange?: (title: string) => void;
    onSave?: () => void;
    isNotebook?: boolean;
    onBack?: () => void;
}

export default function UnifiedWorkspace({ 
    initialCode = '', 
    initialLanguage = 'python',
    notebookTitle = '',
    onCodeChange,
    onTitleChange,
    onSave,
    isNotebook = false,
    onBack
}: UnifiedWorkspaceProps) {
    const { 
        sessionId, 
        language, 
        status, 
        supportedLanguages,
        createSession, 
        stopSession, 
        fetchSupportedLanguages, 
        checkSession,
        downloadAndStop,
        toggleOutput,
        isOutputOpen
    } = useSessionStore();

    // Initialize Socket
    useSocket();

    const [activeTab, setActiveTab] = useState<'explorer' | 'packages' | 'settings'>('explorer');
    const [rightPanelTab, setRightPanelTab] = useState<'terminal' | 'debug'>('terminal');
    const [code, setCode] = useState<string>(initialCode);
    const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [breakpoints, setBreakpoints] = useState<number[]>([]);

    const handleBreakpointToggle = (line: number) => {
        setBreakpoints(prev => {
            if (prev.includes(line)) return prev.filter(l => l !== line);
            return [...prev, line];
        });
    };

    // Handle Start Session
    const handleStartSession = () => {
        createSession(selectedLanguage);
    };

    // ... (effects)

    return (
        <div className="flex flex-col h-screen bg-gray-950 text-gray-200">
            {/* Top Bar */}
            <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between shrink-0">
                {/* ... existing top bar content ... */}
                <div className="flex items-center gap-4">
                    {isNotebook && onBack ? (
                        <button onClick={onBack} className="text-gray-400 hover:text-white mr-2">
                            ← Back
                        </button>
                    ) : null}
                    
                    {isNotebook ? (
                        <input 
                            value={notebookTitle}
                            onChange={(e) => onTitleChange?.(e.target.value)}
                            className="bg-transparent text-white font-bold text-lg border-none focus:ring-0 placeholder-gray-500"
                            placeholder="Untitled Notebook"
                        />
                    ) : (
                        <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                             <span className="text-primary-500">⚡</span> CodLabStudio
                        </div>
                    )}
                </div>

                <div className="flex-1" /> {/* Spacer to push controls to right */}

                <div className="flex items-center gap-4">
                    {/* Session Controls */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded p-1">
                        <select 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            disabled={!!sessionId}
                            className="bg-transparent text-sm px-2 py-1 outline-none cursor-pointer disabled:text-gray-500"
                        >
                            {supportedLanguages.length > 0 ? (
                                supportedLanguages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))
                            ) : (
                                <option value="python">Python (Default)</option>
                            )}
                        </select>
                        
                        {!sessionId ? (
                            <button 
                                onClick={handleStartSession}
                                disabled={status === 'connecting'}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase rounded transition-colors disabled:opacity-50"
                            >
                                {status === 'connecting' ? 'Starting...' : 'Start Session'}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs uppercase font-mono text-green-400">Active</span>
                                <button 
                                    onClick={() => stopSession()}
                                    className="ml-2 text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    Stop
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Download & End Button */}
                    {sessionId && (
                        <button 
                            onClick={downloadAndStop}
                            className="flex items-center gap-2 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase rounded transition-colors"
                            title="Download session as ZIP and end session"
                        >
                            <span>⬇️</span> Download & End
                        </button>
                    )}

                    {/* User Profile */}
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-700">
                        JS
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar (Left Thin Strip) */}
                <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4 shrink-0">
                    <ActivityIcon icon="📄" label="Explorer" active={activeTab === 'explorer'} onClick={() => { setActiveTab('explorer'); setSidebarOpen(true); }} />
                    <ActivityIcon icon="📦" label="Packages" active={activeTab === 'packages'} onClick={() => { setActiveTab('packages'); setSidebarOpen(true); }} />
                    <div className="flex-1" />
                    <ActivityIcon icon="⚙️" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </div>

                {/* Sidebar Panel (Collapsible) */}
                {sidebarOpen && (
                    <div className="w-64 bg-gray-850 border-r border-gray-800 flex flex-col shrink-0">
                        <div className="h-10 border-b border-gray-800 flex items-center px-4 justify-between">
                            <span className="text-xs font-bold uppercase text-gray-400">{activeTab}</span>
                            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-white">«</button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'explorer' && (
                                <div className="p-4 text-sm text-gray-400">
                                    <p className="mb-2">File Explorer not implemented yet.</p>
                                    <p className="text-xs">Current file is in-memory only.</p>
                                </div>
                            )}
                            {activeTab === 'packages' && (
                                <PackageManager language={language || 'python'} />
                            )}
                            {activeTab === 'settings' && (
                                <div className="p-4 text-sm text-gray-400">
                                    Settings placeholder
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Editor Area (Center Column) */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-950 border-r border-gray-800">
                     {/* Editor Toolbar */}
                    <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
                         <div className="flex items-center gap-2">
                             <span className="text-sm text-gray-300">main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language || 'txt'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <DebugToolbar code={code} language={language || 'python'} breakpoints={breakpoints} />
                             <ExecutionPanel code={code} />
                         </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative">
                        <CodeEditor 
                            value={code} 
                            language={selectedLanguage}
                            onChange={(val) => setCode(val || '')}
                            height="100%"
                            hideToolbar={true}
                            breakpoints={breakpoints}
                            onBreakpointToggle={handleBreakpointToggle}
                        />
                    </div>
                </div>

                {/* Right Panel (Terminal + Debug) */}
                {isOutputOpen && (
                    <div className="w-[400px] shrink-0 flex flex-col bg-gray-900 border-l border-gray-800">
                        {/* Right Panel Tabs */}
                        <div className="flex items-center border-b border-gray-800 bg-gray-900">
                            <button 
                                onClick={() => setRightPanelTab('terminal')}
                                className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${rightPanelTab === 'terminal' ? 'text-white border-b-2 border-primary-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Terminal
                            </button>
                            <button 
                                onClick={() => setRightPanelTab('debug')}
                                className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${rightPanelTab === 'debug' ? 'text-white border-b-2 border-primary-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Debugger
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative">
                             <div className={`absolute inset-0 flex flex-col ${rightPanelTab === 'terminal' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
                                <Terminal />
                             </div>
                             {rightPanelTab === 'debug' && (
                                 <div className="absolute inset-0 flex flex-col overflow-y-auto bg-gray-900 p-2">
                                     <DebugPanel 
                                        code={code} 
                                        language={language || 'python'}
                                        breakpoints={breakpoints}
                                        onBreakpointToggle={handleBreakpointToggle}
                                     />
                                 </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityIcon({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            title={label}
            className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-gray-800 transition-colors ${active ? 'bg-gray-800 text-white border-l-2 border-primary-500' : 'text-gray-500'}`}
        >
            {icon}
        </button>
    );
}
