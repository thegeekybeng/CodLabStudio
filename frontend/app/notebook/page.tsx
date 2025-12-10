"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import CodeEditor from "@/components/Editor/CodeEditor";
import ExecutionPanel from "@/components/Editor/ExecutionPanel";
import DebugPanel from "@/components/Debug/DebugPanel";
import PackageManager from "@/components/PackageManager/PackageManager";
import GitPanel from "@/components/Git/GitPanel";
import CollaborationIndicator from "@/components/Collaboration/CollaborationIndicator";
import SaveAsButton from "@/components/Editor/SaveAsButton";
import DownloadSessionButton from "@/components/Session/DownloadSessionButton";
import { notebooksApi, Notebook } from "@/lib/notebooks";
import { authApi } from "@/lib/auth";
import { getGuestSessionId } from "@/utils/guestSession";

export default function NotebookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notebookId = searchParams.get("id");
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [title, setTitle] = useState("Untitled Notebook");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"execute" | "debug" | "packages" | "git">("execute");
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const collaborationSocketRef = useRef<Socket | null>(null);
  const isApplyingRemoteEditRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      // Check EUA acceptance first (required for all users)
      const euaAccepted = sessionStorage.getItem("euaAccepted") === "true";
      if (!euaAccepted) {
        router.push("/eua");
        return;
      }

      // Check if in guest mode
      const isGuestMode = localStorage.getItem("guestMode") === "true";
      
      if (isGuestMode) {
        // Guest mode - create a guest user object
        // Use actual session ID for guest users (needed for execution tracking)
        const sessionId = getGuestSessionId() || "guest";
        setUser({
          id: `guest_${sessionId}`, // Prepend guest_ to match backend expectation
          email: "Guest User",
          role: "GUEST",
        });
      } else {
        // Authenticated user
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error("Failed to load user:", error);
          router.push("/login");
        }
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    const loadNotebook = async () => {
      if (!notebookId) {
        setLoading(false);
        return;
      }

      try {
        const data = await notebooksApi.getById(notebookId);
        setNotebook(data);
        setCode(data.content);
        setLanguage(data.language);
        setTitle(data.title);
      } catch (error) {
        console.error("Failed to load notebook:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotebook();
  }, [notebookId]);

  // Initialize collaboration socket
  // Note: Collaboration only works for authenticated users with saved notebooks
  // Guest sessions are per-session and don't have persistent notebooks
  useEffect(() => {
    // Skip collaboration for guest users (no saved notebooks, session-based)
    const isGuestMode = localStorage.getItem("guestMode") === "true";
    if (isGuestMode) return;
    
    // Require both notebookId and authenticated user
    if (!notebookId || !user?.id) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const socket = io(WS_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("collaboration:join", {
        notebookId,
        userId: user.id,
        email: user.email,
      });
    });

    socket.on("collaboration:session_state", (data: any) => {
      if (data.content && !isApplyingRemoteEditRef.current) {
        setCode(data.content);
        setLanguage(data.language);
      }
    });

    socket.on("collaboration:content_update", (data: any) => {
      if (data.userId !== user.id && !isApplyingRemoteEditRef.current) {
        isApplyingRemoteEditRef.current = true;
        setCode(data.content);
        setLanguage(data.language);
        setTimeout(() => {
          isApplyingRemoteEditRef.current = false;
        }, 100);
      }
    });

    collaborationSocketRef.current = socket;

    return () => {
      if (socket) {
        socket.emit("collaboration:leave", { notebookId, userId: user.id });
        socket.disconnect();
      }
    };
  }, [notebookId, user]);

  const handleSave = async () => {
    if (!code.trim()) return;

    setSaving(true);
    try {
      if (notebookId && notebook) {
        await notebooksApi.update(notebookId, {
          content: code,
          language,
          title,
        });
      } else {
        const newNotebook = await notebooksApi.create({
          title,
          content: code,
          language,
        });
        window.history.pushState({}, "", `/notebook?id=${newNotebook.id}`);
        setNotebook(newNotebook);
      }
    } catch (error) {
      console.error("Failed to save notebook:", error);
      alert("Failed to save notebook");
    } finally {
      setSaving(false);
    }
  };

  const handleBreakpointToggle = (line: number) => {
    setBreakpoints((prev) => {
      if (prev.includes(line)) {
        return prev.filter((l) => l !== line);
      }
      return [...prev, line];
    });
  };

  const handleCollaborationUpdate = (content: string, lang: string) => {
    // Only collaborate for authenticated users with saved notebooks
    const isGuestMode = localStorage.getItem("guestMode") === "true";
    if (isGuestMode) return;
    
    if (collaborationSocketRef.current && notebookId && user?.id) {
      collaborationSocketRef.current.emit("collaboration:content_update", {
        notebookId,
        userId: user.id,
        content,
        language: lang,
      });
    }
  };

  const handleCursorChange = (cursor: { line: number; column: number }) => {
    // Only collaborate for authenticated users with saved notebooks
    const isGuestMode = localStorage.getItem("guestMode") === "true";
    if (isGuestMode) return;
    
    if (collaborationSocketRef.current && notebookId && user?.id) {
      collaborationSocketRef.current.emit("collaboration:cursor_update", {
        notebookId,
        userId: user.id,
        cursor,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 flex-1"
              placeholder="Untitled Notebook"
            />
            {notebookId && user && user.role !== "GUEST" && (
              <CollaborationIndicator
                notebookId={notebookId}
                userId={user.id}
                userEmail={user.email}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "GUEST" ? (
              <>
                <SaveAsButton
                  content={code}
                  filename={title || "notebook"}
                  language={language}
                  disabled={!code.trim()}
                />
                <DownloadSessionButton className="ml-2" />
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <DownloadSessionButton className="ml-2" />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[calc(100vh-200px)]">
            <CodeEditor
              value={code}
              language={language}
              onChange={(value) => setCode(value || "")}
              onLanguageChange={setLanguage}
              height="100%"
              notebookId={notebookId || undefined}
              userId={user?.id}
              onCollaborationUpdate={handleCollaborationUpdate}
              onCursorChange={handleCursorChange}
            />
          </div>
          <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="flex border-b border-gray-300 mb-2">
              <button
                onClick={() => setActiveTab("execute")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "execute"
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Execution
              </button>
              <button
                onClick={() => setActiveTab("debug")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "debug"
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Debug
              </button>
              <button
                onClick={() => setActiveTab("packages")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "packages"
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Packages
              </button>
              {notebookId && (
                <button
                  onClick={() => setActiveTab("git")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "git"
                      ? "border-b-2 border-primary-600 text-primary-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Git
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {activeTab === "execute" ? (
                <ExecutionPanel
                  code={code}
                  language={language}
                  notebookId={notebookId || undefined}
                  userId={user?.id}
                />
              ) : activeTab === "debug" ? (
                <DebugPanel
                  code={code}
                  language={language}
                  notebookId={notebookId || undefined}
                  userId={user?.id}
                  breakpoints={breakpoints}
                  onBreakpointToggle={handleBreakpointToggle}
                />
              ) : activeTab === "packages" ? (
                <div className="p-4">
                  <PackageManager
                    language={language}
                    notebookId={notebookId || undefined}
                  />
                </div>
              ) : activeTab === "git" && notebookId ? (
                <div className="p-4">
                  <GitPanel notebookId={notebookId} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
