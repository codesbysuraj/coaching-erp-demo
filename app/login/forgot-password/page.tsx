"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Mail, ExternalLink } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLink("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bright Future Academy</h1>
          <p className="text-gray-500 mt-1 text-sm">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset your password</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email address and we&apos;ll generate a password reset link.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              ⚠ {error}
            </div>
          )}

          {/* Reset Link Result */}
          {resetLink ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ Reset link generated!</p>
                <p className="text-xs text-green-700 mb-3">
                  Copy the link below to reset your password. This link is valid for 1 hour.
                </p>
                <div className="bg-white border border-green-200 rounded-lg p-3 break-all text-xs text-gray-600 font-mono">
                  {resetLink}
                </div>
                <a
                  href={resetLink}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink size={14} /> Open reset link
                </a>
              </div>
              <button
                onClick={() => { setResetLink(""); setEmail(""); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Generate another link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@brightfuture.example"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {loading ? "Generating..." : "Generate Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
