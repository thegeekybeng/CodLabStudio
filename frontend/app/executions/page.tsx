"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { executionsApi, Execution } from "@/lib/executions";
import { authApi } from "@/lib/auth";

export default function ExecutionsPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "failed">("all");

  useEffect(() => {
    const loadExecutions = async () => {
      try {
        await authApi.getCurrentUser();
        const data = await executionsApi.getAll(100);
        setExecutions(data);
      } catch (error) {
        console.error("Failed to load executions:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadExecutions();
  }, [router]);

  const filteredExecutions = executions.filter((exec) => {
    if (filter === "all") return true;
    if (filter === "completed") return exec.status === "COMPLETED";
    if (filter === "failed") return exec.status === "FAILED";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Execution History
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View all your code executions
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All ({executions.length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "completed"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Completed (
            {executions.filter((e) => e.status === "COMPLETED").length})
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "failed"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Failed ({executions.filter((e) => e.status === "FAILED").length})
          </button>
        </div>

        {filteredExecutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No executions found
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === "all"
                ? "Start executing code to see your execution history"
                : `No ${filter} executions found`}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExecutions.map((execution) => (
              <div
                key={execution.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {execution.status}
                      </span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                        {execution.language}
                      </span>
                      {execution.executionTimeMs && (
                        <span className="text-xs text-gray-500">
                          {execution.executionTimeMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(execution.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Code Preview
                  </div>
                  <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {execution.code.substring(0, 200)}
                    {execution.code.length > 200 ? "..." : ""}
                  </pre>
                </div>

                {execution.stdout && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">
                      Output
                    </div>
                    <pre className="bg-green-50 p-3 rounded border border-green-200 text-xs overflow-x-auto whitespace-pre-wrap">
                      {execution.stdout}
                    </pre>
                  </div>
                )}

                {execution.stderr && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-red-700 uppercase mb-1">
                      Error
                    </div>
                    <pre className="bg-red-50 p-3 rounded border border-red-200 text-xs overflow-x-auto whitespace-pre-wrap text-red-800">
                      {execution.stderr}
                    </pre>
                  </div>
                )}

                {execution.exitCode !== null && (
                  <div className="text-xs text-gray-500">
                    Exit Code: {execution.exitCode}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
