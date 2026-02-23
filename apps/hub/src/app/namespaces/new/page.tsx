"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

export default function NewNamespacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/namespaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, displayName, description, visibility }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create namespace");
        return;
      }

      router.push(`/namespaces/${data.name}`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="New Namespace" description="Create a namespace to organize your containers" />

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: "12px 16px", marginBottom: 24,
              backgroundColor: "#ffebe9", border: "1px solid #cf222e",
              borderRadius: 6, color: "#cf222e", fontSize: 14,
            }}>{error}</div>
          )}

          <Card>
            <SectionTitle>Namespace Details</SectionTitle>

            <div style={{ display: "grid", gap: 20 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>
                  Namespace Name <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g., bosch, acme-corp"
                  required
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: mono,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa",
                  }}
                />
                <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
                  Lowercase letters, numbers, and hyphens only. This will be used in container IDs.
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Bosch Thermotechnology"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this namespace for?"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa", resize: "vertical",
                  }}
                />
              </div>

              {/* Visibility */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 8 }}>
                  Visibility
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { value: "public", label: "Public", desc: "Anyone can view containers" },
                    { value: "private", label: "Private", desc: "Only members can view" },
                  ].map(v => (
                    <label
                      key={v.value}
                      style={{
                        flex: 1, display: "flex", alignItems: "flex-start", gap: 10, padding: 12,
                        border: `1px solid ${visibility === v.value ? "#238636" : t.border}`,
                        borderRadius: 6, cursor: "pointer",
                        backgroundColor: visibility === v.value ? "#dafbe1" : "#fff",
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={v.value}
                        checked={visibility === v.value}
                        onChange={(e) => setVisibility(e.target.value)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: t.fg }}>{v.label}</div>
                        <div style={{ fontSize: 12, color: t.fgMuted }}>{v.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={loading || !name}
                style={{
                  padding: "10px 20px", fontSize: 14, fontWeight: 600,
                  backgroundColor: !loading && name ? "#238636" : "#8b949e",
                  color: "#fff", border: "none", borderRadius: 6,
                  cursor: !loading && name ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Creating..." : "Create namespace"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: "10px 20px", fontSize: 14, fontWeight: 500,
                  backgroundColor: "#fff", color: t.fg, border: `1px solid ${t.border}`,
                  borderRadius: 6, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
