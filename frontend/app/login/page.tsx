"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth";
import Logo from "@/components/Brand/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.login(email, password);
      // Admin users also need to accept EUA (one-time, can be stored in localStorage)
      const adminEUAAccepted = localStorage.getItem("adminEUAAccepted") === "true";
      if (!adminEUAAccepted) {
        // Store in sessionStorage for this session
        sessionStorage.setItem("euaAccepted", "true");
        sessionStorage.setItem("euaAcceptedAt", new Date().toISOString());
        // Mark as accepted for admin (persistent)
        localStorage.setItem("adminEUAAccepted", "true");
      } else {
        // Already accepted, just set session
        sessionStorage.setItem("euaAccepted", "true");
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center mb-4">
            Admin login only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mb-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            For guest access, please start from the main entry point where you will be required to accept the End User Agreement.
          </p>
        </div>
      </div>
    </div>
  );
}
