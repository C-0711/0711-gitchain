"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const t = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  fg: "#e6edf3",
  fgMuted: "#8b949e",
  accent: "#238636",
  link: "#58a6ff",
  error: "#f85149",
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: t.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.fg, margin: "16px 0 8px" }}>Create your account</h1>
          <p style={{ fontSize: 14, color: t.fgMuted }}>Join GitChain to build trustworthy AI.</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: 20,
        }}>
          {error && (
            <div style={{
              padding: "10px 12px",
              backgroundColor: "rgba(248,81,73,0.1)",
              border: `1px solid ${t.error}`,
              borderRadius: 6,
              color: t.error,
              fontSize: 13,
              marginBottom: 16,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, color: t.fg, marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label style={{ display: "block", fontSize: 14, color: t.fg, marginBottom: 6 }}>Email address</label>
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
            <label style={{ display: "block", fontSize: 14, color: t.fg, marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
            <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>Minimum 8 characters</p>
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
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 12, lineHeight: 1.5 }}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: t.link, textDecoration: "none" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: t.link, textDecoration: "none" }}>Privacy Policy</Link>.
          </p>
        </form>

        <div style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          textAlign: "center",
          fontSize: 14,
          color: t.fgMuted,
        }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: t.link, textDecoration: "none" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
