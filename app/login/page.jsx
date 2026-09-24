
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form before we hit the auth API so the error is obvious.
    if (loading) return;

    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(username, password);

      localStorage.setItem("token", data.accessToken);

      router.push("/products");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Sign In
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Login to your product dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <p className="font-medium text-gray-700">
            Demo Credentials
          </p>

          <p className="mt-1">
            Username: <strong>emilys</strong>
          </p>

          <p>
            Password: <strong>emilyspass</strong>
          </p>
        </div>

      </div>
    </main>
  );
}

