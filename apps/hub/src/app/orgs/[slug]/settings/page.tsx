"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
}

export default function OrgSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  function getHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const h: HeadersInit = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  useEffect(() => {
    async function fetchOrg() {
      try {
        const headers = getHeaders();
        const res = await fetch(`/api/organizations/${slug}`, { headers });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Organization not found");
          throw new Error("Failed to fetch organization");
        }
        const data = await res.json();
        setOrg(data.organization);
        setRole(data.role || null);
        setName(data.organization.name);
        setDescription(data.organization.description || "");
        setWebsite(data.organization.website || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading organization");
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [slug]);

  const isAdmin = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    try {
      const res = await fetch(`/api/organizations/${slug}`, {
        method: "PATCH",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name !== org?.name ? name : undefined,
          description: description !== (org?.description || "") ? description : undefined,
          website: website !== (org?.website || "") ? website : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveMsg({ type: "error", text: data.error || "Failed to save" });
        return;
      }

      setOrg(data.organization);
      setSaveMsg({ type: "success", text: "Settings saved" });
    } catch {
      setSaveMsg({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== org?.slug) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/organizations/${slug}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete organization");
        return;
      }

      router.push("/dashboard");
    } catch {
      alert("Network error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading settings...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !org) {
    return (
      <AppShell>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
          <Card>
            <div style={{ textAlign: "center", padding: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                Error
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>{error}</p>
              <Link
                href={`/orgs/${slug}`}
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to Organization
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
          <Card>
            <div style={{ textAlign: "center", padding: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                Access Denied
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>
                You need admin permissions to access organization settings.
              </p>
              <Link
                href={`/orgs/${slug}`}
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to Organization
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Organization Settings" />

        {/* Profile Settings */}
        <Card>
          <SectionTitle>General</SectionTitle>
          <form onSubmit={handleSave} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  color: t.fg,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Organization name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  backgroundColor: t.canvas,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.fg,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  color: t.fg,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does your organization do?"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  backgroundColor: t.canvas,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.fg,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  color: t.fg,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  backgroundColor: t.canvas,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.fg,
                  outline: "none",
                }}
              />
            </div>

            {saveMsg && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  backgroundColor:
                    saveMsg.type === "success" ? "rgba(35,134,54,0.1)" : "rgba(248,81,73,0.1)",
                  border: `1px solid ${saveMsg.type === "success" ? "#238636" : "#f85149"}`,
                  color: saveMsg.type === "success" ? "#3fb950" : "#f85149",
                }}
              >
                {saveMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: saving ? t.fgMuted : t.accent,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <div style={{ marginTop: 24 }}>
            <Card>
              <SectionTitle>Danger Zone</SectionTitle>
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  border: "1px solid #f85149",
                  borderRadius: 8,
                  backgroundColor: "rgba(248,81,73,0.04)",
                }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "#f85149", margin: "0 0 8px" }}>
                  Delete this organization
                </h4>
                <p style={{ fontSize: 13, color: t.fgMuted, margin: "0 0 12px" }}>
                  Once you delete an organization, there is no going back. All containers, members,
                  and data will be permanently removed.
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{ display: "block", fontSize: 12, color: t.fgMuted, marginBottom: 4 }}
                    >
                      Type <strong style={{ color: t.fg }}>{org.slug}</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={org.slug}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: 14,
                        backgroundColor: t.canvas,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.fg,
                        outline: "none",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== org.slug || deleting}
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      fontWeight: 600,
                      backgroundColor:
                        deleteConfirm === org.slug && !deleting ? "#da3633" : t.fgMuted,
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: deleteConfirm === org.slug && !deleting ? "pointer" : "not-allowed",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {deleting ? "Deleting..." : "Delete Organization"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
