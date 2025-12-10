"use client";

import { useState } from "react";
import { sessionApi } from "@/lib/session";

interface DownloadSessionButtonProps {
  className?: string;
}

export default function DownloadSessionButton({
  className = "",
}: DownloadSessionButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const blob = await sessionApi.downloadSessionZip();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `session_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download session zip:", err);
      setError(err.response?.data?.error?.message || "Failed to download session data");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        title="Download all session data as ZIP file"
      >
        {downloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download Session</span>
          </>
        )}
      </button>
      <p className="mt-1 text-xs text-gray-500">
        Download all code, executions, debug logs, and outputs as ZIP
      </p>
    </div>
  );
}

