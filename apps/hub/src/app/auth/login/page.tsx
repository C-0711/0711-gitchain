"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const t = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  fg: "#e6edf3",
  fgMuted: "#8b949e",
  accent: "#238636",
  accentHover: "#2ea043",
  link: "#58a6ff",
  error: "#f85149",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push(redirect || "/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: t.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3fb950"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.fg, margin: "16px 0 8px" }}>
            Sign in to GitChain
          </h1>
          <p style={{ fontSize: 14, color: t.fgMuted }}>
            Welcome back! Please sign in to continue.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          {error && (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "rgba(248,81,73,0.1)",
                border: `1px solid ${t.error}`,
                borderRadius: 6,
                color: t.error,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, color: t.fg, marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                backgroundColor: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                color: t.fg,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 14, color: t.fg }}>Password</label>
              <Link
                href="/auth/forgot-password"
                style={{ fontSize: 12, color: t.link, textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                backgroundColor: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                color: t.fg,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: loading ? t.fgMuted : t.accent,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Sign up link */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            textAlign: "center",
            fontSize: 14,
            color: t.fgMuted,
          }}
        >
          New to GitChain?{" "}
          <Link
            href={
              redirect
                ? `/auth/register?redirect=${encodeURIComponent(redirect)}`
                : "/auth/register"
            }
            style={{ color: t.link, textDecoration: "none" }}
          >
            Create an account
          </Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: t.fgMuted }}>
          <Link href="/terms" style={{ color: t.fgMuted, textDecoration: "none", marginRight: 16 }}>
            Terms
          </Link>
          <Link
            href="/privacy"
            style={{ color: t.fgMuted, textDecoration: "none", marginRight: 16 }}
          >
            Privacy
          </Link>
          <Link href="/docs" style={{ color: t.fgMuted, textDecoration: "none" }}>
            Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
