"use client";

import { useState } from "react";
import { packagesApi } from "@/lib/packages";

interface PackageManagerProps {
  language: string;
  notebookId?: string;
}

export default function PackageManager({
  language,
  notebookId,
}: PackageManagerProps) {
  const [packages, setPackages] = useState<string>("");
  const [installing, setInstalling] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [installedPackages, setInstalledPackages] = useState<any[]>([]);

  const handleInstall = async () => {
    if (!packages.trim()) {
      alert("Please enter package names");
      return;
    }

    setInstalling(true);
    setOutput("");

    try {
      const packageList = packages
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const result = await packagesApi.install({
        language,
        packages: packageList,
        notebookId,
      });

      setOutput(result.output);
      if (result.success) {
        setPackages("");
        // Refresh installed packages list
        try {
          const installed = await packagesApi.listInstalled(language);
          setInstalledPackages(installed);
        } catch (error) {
          console.error("Failed to list installed packages:", error);
        }
      }
    } catch (error: any) {
      setOutput(
        error.response?.data?.error?.message || "Failed to install packages"
      );
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Install Packages (comma-separated)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={packages}
            onChange={(e) => setPackages(e.target.value)}
            placeholder="e.g., numpy, pandas, matplotlib"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={installing}
          />
          <button
            onClick={handleInstall}
            disabled={installing || !packages.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {installing ? "Installing..." : "Install"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter package names separated by commas
        </p>
      </div>

      {output && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Installation Output
          </div>
          <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {installedPackages.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Installed Packages
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <ul className="space-y-1">
              {installedPackages.map((pkg, idx) => (
                <li key={idx} className="text-sm">
                  {pkg.name}
                  {pkg.version && <span className="text-gray-500">@{pkg.version}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

