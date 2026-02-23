"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const containerTypes = [
  { value: "product", label: "Product", desc: "Physical or digital products with specifications" },
  { value: "campaign", label: "Campaign", desc: "Marketing campaigns and advertising materials" },
  { value: "project", label: "Project", desc: "Project documentation and artifacts" },
  { value: "knowledge", label: "Knowledge", desc: "Knowledge bases and documentation" },
  { value: "memory", label: "Memory", desc: "Personal or organizational memories" },
];

export default function NewContainerPage() {
  const router = useRouter();
  const [namespace, setNamespace] = useState("");
  const [type, setType] = useState("product");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ namespace, type, identifier, name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create container");
        return;
      }

      router.push(`/containers/${data.id}`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fullId = namespace && identifier ? `${namespace}:${type}:${identifier}` : "";

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="New Container" description="Create a versioned knowledge container" />

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: "12px 16px", marginBottom: 24,
              backgroundColor: "#ffebe9", border: "1px solid #cf222e",
              borderRadius: 6, color: "#cf222e", fontSize: 14,
            }}>{error}</div>
          )}

          <Card>
            <SectionTitle>Container Details</SectionTitle>

            <div style={{ display: "grid", gap: 20 }}>
              {/* Namespace */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>
                  Namespace <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g., bosch, acme"
                  required
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: mono,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa",
                  }}
                />
                <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>Lowercase letters, numbers, and hyphens only</p>
              </div>

              {/* Type */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 8 }}>
                  Container Type <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <div style={{ display: "grid", gap: 8 }}>
                  {containerTypes.map(ct => (
                    <label
                      key={ct.value}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10, padding: 12,
                        border: `1px solid ${type === ct.value ? "#238636" : t.border}`,
                        borderRadius: 6, cursor: "pointer",
                        backgroundColor: type === ct.value ? "#dafbe1" : "#fff",
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={ct.value}
                        checked={type === ct.value}
                        onChange={(e) => setType(e.target.value)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: t.fg }}>{ct.label}</div>
                        <div style={{ fontSize: 12, color: t.fgMuted }}>{ct.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Identifier */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>
                  Identifier <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                  placeholder="e.g., BCS-VT-36-4"
                  required
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: mono,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa",
                  }}
                />
              </div>

              {/* Preview */}
              {fullId && (
                <div style={{ padding: 12, backgroundColor: "#f6f8fa", borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: t.fgMuted, marginBottom: 4 }}>Container ID</div>
                  <code style={{ fontFamily: mono, fontSize: 14, color: t.fg }}>{fullId}</code>
                </div>
              )}

              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Compress 3000 AWS Heat Pump"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: t.fg, marginBottom: 6 }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description of this container"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 14,
                    border: `1px solid ${t.border}`, borderRadius: 6, backgroundColor: "#f6f8fa", resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={loading || !namespace || !identifier}
                style={{
                  padding: "10px 20px", fontSize: 14, fontWeight: 600,
                  backgroundColor: !loading && namespace && identifier ? "#238636" : "#8b949e",
                  color: "#fff", border: "none", borderRadius: 6,
                  cursor: !loading && namespace && identifier ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Creating..." : "Create container"}
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
