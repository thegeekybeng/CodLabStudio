"use client";

import { useState, useEffect } from "react";
import { gitApi, GitStatus, GitCommit } from "@/lib/git";

interface GitPanelProps {
  notebookId: string;
}

export default function GitPanel({ notebookId }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [log, setLog] = useState<GitCommit[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadGitData();
  }, [notebookId]);

  const loadGitData = async () => {
    try {
      const [statusData, logData] = await Promise.all([
        gitApi.getStatus(notebookId),
        gitApi.getLog(notebookId, 10),
      ]);
      setStatus(statusData);
      setLog(logData);
    } catch (error) {
      console.error("Failed to load git data:", error);
    }
  };

  const handleInit = async () => {
    setLoading(true);
    try {
      const result = await gitApi.init(notebookId);
      setMessage(result.message);
      await loadGitData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "Failed to initialize repository"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert("Please enter a commit message");
      return;
    }

    setLoading(true);
    try {
      const result = await gitApi.commit(notebookId, commitMessage);
      setMessage(`Committed: ${result.commitHash.substring(0, 7)}`);
      setCommitMessage("");
      await loadGitData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "Failed to commit changes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      const result = await gitApi.push(notebookId);
      setMessage(result.message);
      await loadGitData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "Failed to push changes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const result = await gitApi.pull(notebookId);
      setMessage(result.message);
      await loadGitData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error?.message || "Failed to pull changes"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
          {message}
        </div>
      )}

      {!status ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Repository not initialized</p>
          <button
            onClick={handleInit}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
          >
            Initialize Repository
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Branch: {status.branch}
                </div>
                {status.ahead > 0 && (
                  <div className="text-xs text-blue-600">
                    {status.ahead} ahead
                  </div>
                )}
                {status.behind > 0 && (
                  <div className="text-xs text-orange-600">
                    {status.behind} behind
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePull}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:bg-gray-300 transition-colors"
                >
                  Pull
                </button>
                <button
                  onClick={handlePush}
                  disabled={loading || status.ahead === 0}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  Push
                </button>
              </div>
            </div>

            {status.changes.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Changes
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  {status.changes.map((change, idx) => (
                    <div key={idx}>{change}</div>
                  ))}
                </div>
              </div>
            )}

            {status.untracked.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Untracked
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  {status.untracked.map((file, idx) => (
                    <div key={idx}>{file}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={handleCommit}
                disabled={loading || !commitMessage.trim() || status.changes.length === 0}
                className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Commit Changes
              </button>
            </div>
          </div>

          {log.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                Recent Commits
              </div>
              <div className="space-y-2">
                {log.map((commit, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">
                        {commit.hash.substring(0, 7)}
                      </span>
                      <span className="text-xs text-gray-700">
                        {commit.message}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {commit.author} • {new Date(commit.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

