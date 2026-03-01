"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);
    const generated = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/auth/login?redirect=/orgs/new");
        return;
      }

      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create organization");
        return;
      }

      router.push(`/orgs/${data.organization?.slug || slug}`);
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
          title="Create a new organization"
          description="Organizations let you collaborate with your team on containers."
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
            <SectionTitle>Organization Details</SectionTitle>

            <div style={{ display: "grid", gap: 20 }}>
              {/* Name */}
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
                  Organization name <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Organization"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: t.canvas,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Slug */}
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
                  URL slug <span style={{ color: "#cf222e" }}>*</span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: t.fgMuted, whiteSpace: "nowrap" }}>
                    gitchain.0711.io/orgs/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    placeholder="my-org"
                    required
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      fontSize: 14,
                      fontFamily: mono,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      backgroundColor: t.canvas,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
                  Lowercase letters, numbers, and hyphens only.
                </p>
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
                  Description{" "}
                  <span style={{ color: t.fgMuted, fontWeight: 400, fontSize: 12 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does your organization do?"
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

            {/* Info box */}
            <div
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: t.canvas,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                display: "flex",
                gap: 12,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill={t.fgMuted}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.777.871.777 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75ZM3.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM7 3.75A.75.75 0 0 1 7.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 3.75ZM7.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM7 9.75A.75.75 0 0 1 7.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 9.75Z" />
              </svg>
              <div style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5 }}>
                <p style={{ margin: "0 0 4px" }}>
                  <strong style={{ color: t.fg }}>You will be the owner</strong> of this
                  organization with full admin access.
                </p>
                <p style={{ margin: 0 }}>
                  You can invite team members and manage permissions after creation.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={loading || !name || !slug}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: !loading && name && slug ? t.accent : "#8b949e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: !loading && name && slug ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Creating..." : "Create organization"}
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
