"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const namespaceTypes = [
  {
    value: "product",
    label: "Product",
    desc: "Physical or digital products with specs and data sheets",
  },
  { value: "knowledge", label: "Knowledge", desc: "Documentation, guides, and reference material" },
  { value: "project", label: "Project", desc: "Project-scoped containers for team collaboration" },
  { value: "campaign", label: "Campaign", desc: "Marketing campaigns and content collections" },
  { value: "memory", label: "Memory", desc: "AI memory and context containers" },
];

export default function NewNamespacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("product");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/namespaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, type, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create namespace");
        return;
      }

      router.push(`/namespaces/${data.name || name}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader
          title="New Namespace"
          description="Create a namespace to organize your containers"
        />

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: 24,
                backgroundColor: "#ffebe9",
                border: "1px solid #cf222e",
                borderRadius: 6,
                color: "#cf222e",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <Card>
            <SectionTitle>Namespace Details</SectionTitle>

            <div style={{ display: "grid", gap: 20 }}>
              {/* Name (slug) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 6,
                  }}
                >
                  Name <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g., bosch, acme-corp"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    fontFamily: mono,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: t.canvas,
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
                  Lowercase letters, numbers, and hyphens only. This will be used as the slug in
                  container IDs.
                </p>
              </div>

              {/* Type */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 8,
                  }}
                >
                  Type <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <div style={{ display: "grid", gap: 8 }}>
                  {namespaceTypes.map((nt) => (
                    <label
                      key={nt.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: 12,
                        border: `1px solid ${type === nt.value ? t.accent : t.border}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        backgroundColor: type === nt.value ? "#dafbe1" : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={nt.value}
                        checked={type === nt.value}
                        onChange={(e) => setType(e.target.value)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: t.fg }}>{nt.label}</div>
                        <div style={{ fontSize: 12, color: t.fgMuted }}>{nt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this namespace for?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: t.canvas,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={loading || !name}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: !loading && name ? t.accent : "#8b949e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: !loading && name ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Creating..." : "Create namespace"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: "#fff",
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
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
