"use client";

import { useState } from "react";
import { downloadFile, getFileTypeForLanguage, FILE_TYPES, type FileType } from "@/utils/fileDownload";

interface SaveAsButtonProps {
  content: string;
  filename: string;
  language: string;
  disabled?: boolean;
}

export default function SaveAsButton({
  content,
  filename,
  language,
  disabled = false,
}: SaveAsButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const defaultFileType = getFileTypeForLanguage(language);

  const handleSaveAs = (fileType: FileType) => {
    downloadFile(content, filename, fileType);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || !content.trim()}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        title="Save as file"
      >
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Save As
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                Select File Type
              </div>
              <div className="space-y-1">
                {FILE_TYPES.map((fileType) => (
                  <button
                    key={fileType.extension}
                    onClick={() => handleSaveAs(fileType)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                      fileType.extension === defaultFileType.extension
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {fileType.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

