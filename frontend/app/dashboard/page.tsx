"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notebooksApi, Notebook } from "@/lib/notebooks";
import { executionsApi } from "@/lib/executions";
import { authApi, User } from "@/lib/auth";
import DownloadSessionButton from "@/components/Session/DownloadSessionButton";
import { getGuestSessionId } from "@/utils/guestSession";
import Logo from "@/components/Brand/Logo";

export default function DashboardPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalNotebooks: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    languages: new Set<string>(),
  });

  useEffect(() => {
    const loadData = async () => {
      // Check EUA acceptance first (required for all users)
      const euaAccepted = sessionStorage.getItem("euaAccepted") === "true";
      if (!euaAccepted) {
        router.push("/eua");
        return;
      }

      try {
        // Check if in guest mode
        const isGuestMode = localStorage.getItem("guestMode") === "true";
        
        if (isGuestMode) {
          // Guest mode - create a guest user object
          // Use actual session ID for guest users
          const sessionId = getGuestSessionId() || "guest";
          setUser({
            id: sessionId, // Use session ID instead of "guest"
            email: "Guest User",
            role: "GUEST",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          // Guest mode: no notebooks or executions
          setNotebooks([]);
          setStats({
            totalNotebooks: 0,
            totalExecutions: 0,
            successfulExecutions: 0,
            languages: new Set<string>(),
          });
        } else {
          // Authenticated user
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);

          const [notebooksData, executionsData] = await Promise.all([
            notebooksApi.getAll(),
            executionsApi.getAll(50).catch(() => []),
          ]);

          setNotebooks(notebooksData);

          // Calculate statistics
          const languages = new Set(notebooksData.map((n) => n.language));
          const successfulExecutions = executionsData.filter(
            (e) => e.status === "COMPLETED"
          ).length;

          setStats({
            totalNotebooks: notebooksData.length,
            totalExecutions: executionsData.length,
            successfulExecutions,
            languages,
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        // Only redirect if not in guest mode
        const isGuestMode = localStorage.getItem("guestMode") === "true";
        if (!isGuestMode) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notebook?")) {
      return;
    }

    try {
      await notebooksApi.delete(id);
      setNotebooks(notebooks.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notebook:", error);
      alert("Failed to delete notebook");
    }
  };

  const handleLogout = () => {
    const isGuestMode = localStorage.getItem("guestMode") === "true";
    if (isGuestMode) {
      localStorage.removeItem("guestMode");
    } else {
      authApi.logout();
    }
    router.push("/login");
  };

  const filteredNotebooks = notebooks.filter(
    (notebook) =>
      notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                CodLabStudio
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Code. Lab. Collaborate.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Welcome, {user?.email || "Guest"}
              </p>
              {localStorage.getItem("guestMode") === "true" && (
                <p className="text-xs text-orange-600 mt-1">
                  Guest Mode - Temporary access
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user?.role !== "GUEST" && (
                <Link
                  href="/notebook"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  New Notebook
                </Link>
              )}
              <DownloadSessionButton />
              {user?.role !== "GUEST" && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Total Notebooks
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalNotebooks}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Total Executions
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalExecutions}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Success Rate
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalExecutions > 0
                ? Math.round(
                    (stats.successfulExecutions / stats.totalExecutions) * 100
                  )
                : 0}
              %
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Languages Used
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.languages.size}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/executions"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            View Execution History
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search notebooks by title or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {filteredNotebooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {notebooks.length === 0
                ? "No notebooks yet"
                : "No notebooks found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {notebooks.length === 0
                ? "Create your first notebook to get started"
                : "Try adjusting your search query"}
            </p>
            {notebooks.length === 0 && (
              <Link
                href="/notebook"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Create Notebook
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/notebook?id=${notebook.id}`} className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {notebook.title}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleDelete(notebook.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete notebook"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      {notebook.language}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notebook.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notebook.content.substring(0, 100)}
                    {notebook.content.length > 100 ? "..." : ""}
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/notebook?id=${notebook.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
