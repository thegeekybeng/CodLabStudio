"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { debugApi, DebugSession, DebugCommand } from "@/lib/debug";

interface DebugPanelProps {
  code: string;
  language: string;
  notebookId?: string;
  userId?: string;
  onBreakpointToggle?: (line: number) => void;
  breakpoints?: number[];
}

export default function DebugPanel({
  code,
  language,
  notebookId,
  userId,
  onBreakpointToggle,
  breakpoints = [],
}: DebugPanelProps) {
  const [session, setSession] = useState<DebugSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const newSocket = io(WS_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      newSocket.emit("join:user", userId);
    });

    newSocket.on("debug:status", (data: any) => {
      setStatus(data.message || data.status);
    });

    newSocket.on("debug:ready", (data: any) => {
      setIsActive(true);
      setSessionEnded(false);
      setOutput(""); // Clear output on new session
      setStatus("Debug session ready");
      if (data.sessionId) {
        loadSession(data.sessionId);
      }
    });

    newSocket.on("debug:event", (data: any) => {
      if (data.sessionId && session?.id === data.sessionId) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                currentLine: data.currentLine,
                variables: data.variables || {},
                callStack: data.callStack || [],
              }
            : null
        );
      }
    });

    newSocket.on("debug:output", (data: any) => {
      if (data.sessionId && session?.id === data.sessionId) {
        setOutput((prev) => prev + data.content);
      }
    });

    newSocket.on("debug:stopped", () => {
      setIsActive(false);
      setSession(null);
      setSessionEnded(true);
      setStatus("Debug session stopped");
    });

    newSocket.on("debug:error", (data: any) => {
      setStatus(`Error: ${data.error || "Unknown error"}`);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit("leave:user", userId);
        newSocket.disconnect();
      }
    };
  }, [userId, session]); // Add session dependency for ID check

  const loadSession = async (sessionId: string) => {
    try {
      const data = await debugApi.getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error("Failed to load debug session:", error);
    }
  };

  const handleStartDebug = async () => {
    if (!code.trim()) {
      alert("Please enter some code to debug");
      return;
    }

    setSessionEnded(false);
    setOutput("");

    try {
      const result = await debugApi.startSession({
        code,
        language,
        breakpoints,
        notebookId,
      });
      setStatus("Starting debug session...");
    } catch (error: any) {
      setStatus(
        `Failed to start debug: ${
          error.response?.data?.error?.message || "Unknown error"
        }`
      );
      console.error("Debug start error:", error);
    }
  };

  const handleStopDebug = async () => {
    if (!session) return;

    try {
      await debugApi.stopSession(session.id);
      setIsActive(false);
      setSession(null);
      setSessionEnded(true);
    } catch (error) {
      console.error("Failed to stop debug session:", error);
    }
  };

  const handleDebugCommand = async (command: DebugCommand) => {
    if (!session) return;

    try {
      await debugApi.executeCommand(session.id, command);
    } catch (error) {
      console.error("Debug command error:", error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
        <h3 className="text-sm font-semibold text-gray-700">Debug Panel</h3>
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button
              onClick={handleStartDebug}
              disabled={!code.trim()}
              className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Start Debug
            </button>
          ) : (
            <button
              onClick={handleStopDebug}
              className="px-4 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {status && <div className="text-sm text-gray-600 mb-2">{status}</div>}

        {sessionEnded && !isActive && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Session Ended.</strong>
                <span className="block sm:inline"> The debug session has completed.</span>
            </div>
        )}

        {isActive && session && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Debug Controls
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleDebugCommand({ type: "continue" })}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Continue
                </button>
                <button
                  onClick={() => handleDebugCommand({ type: "step_over" })}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Step Over
                </button>
                <button
                  onClick={() => handleDebugCommand({ type: "step_into" })}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Step Into
                </button>
                <button
                  onClick={() => handleDebugCommand({ type: "step_out" })}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Step Out
                </button>
                <button
                  onClick={() => handleDebugCommand({ type: "pause" })}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                >
                  Pause
                </button>
              </div>
            </div>

            {session.currentLine !== null && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Current Line
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-200 text-sm">
                  Line {session.currentLine}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Variables
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm min-h-[60px]">
                {Object.keys(session.variables || {}).length > 0 ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(session.variables, null, 2)}
                    </pre>
                ) : (
                    <span className="text-gray-400 italic">No local variables</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Call Stack
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm min-h-[60px]">
                {session.callStack && session.callStack.length > 0 ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(session.callStack, null, 2)}
                  </pre>
                ) : (
                   <span className="text-gray-400 italic">Call stack empty</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Console Output
              </div>
              <div className="bg-black text-white p-3 rounded border border-gray-700 text-sm font-mono h-40 overflow-auto">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <span className="text-gray-500 italic">Program output will appear here...</span>
                )}
              </div>
            </div>
          </>
        )}

        {!isActive && !status && !sessionEnded && (
          <div className="text-sm text-gray-400 text-center py-8">
            Click &quot;Start Debug&quot; to begin debugging
          </div>
        )}
      </div>
    </div>
  );
}
