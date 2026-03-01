"use client";

import Link from "next/link";
import { useState } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const Ic = {
  Shield: ({ s = 12 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#1a7f37">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#cf222e">
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={t.fgMuted}>
      <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM11.78 4.72a.749.749 0 1 1-1.06 1.06L8.75 3.811V9.5a.75.75 0 0 1-1.5 0V3.811L5.28 5.78a.749.749 0 1 1-1.06-1.06l3.25-3.25a.749.749 0 0 1 1.06 0l3.25 3.25Z" />
    </svg>
  ),
};

interface BatchResult {
  id: string;
  status: "success" | "error";
  error?: string;
  name?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  containers: BatchResult[];
}

type Step = "input" | "preview" | "importing" | "done";

const stepLabels = ["Input", "Preview", "Import", "Results"];

export default function BatchPage() {
  const [step, setStep] = useState<Step>("input");
  const [jsonInput, setJsonInput] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const parseCount = (() => {
    try {
      const d = JSON.parse(jsonInput);
      return Array.isArray(d) ? d.length : 1;
    } catch {
      return 0;
    }
  })();

  const handleParse = () => {
    setError("");
    try {
      const data = JSON.parse(jsonInput);
      const containers = Array.isArray(data) ? data : [data];
      if (containers.length === 0) {
        setError("JSON array is empty. Provide at least one container.");
        return;
      }
      setPreview(containers);
      setStep("preview");
    } catch {
      setError("Invalid JSON format. Please provide a valid JSON array of containers.");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setError("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("You must be logged in to import containers.");
        setStep("preview");
        return;
      }

      const res = await fetch("/api/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ containers: preview }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Batch import failed");
        setStep("preview");
        return;
      }

      setResult({
        total: data.total ?? preview.length,
        success: data.success ?? 0,
        failed: data.failed ?? 0,
        containers:
          data.containers ||
          data.results ||
          preview.map((c, i) => ({
            id: ((c as Record<string, unknown>).identifier as string) || `item-${i + 1}`,
            status: "success" as const,
            name: ((c as Record<string, unknown>).name as string) || undefined,
          })),
      });
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("input");
    setJsonInput("");
    setPreview([]);
    setResult(null);
    setError("");
  };

  const stepIndex = ["input", "preview", "importing", "done"].indexOf(step);

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader
          title="Batch Import"
          description="Import multiple containers at once from a JSON array"
        />

        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
          {stepLabels.map((label, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: mono,
                      backgroundColor: isDone ? "#dafbe1" : isActive ? t.accent : t.canvas,
                      color: isDone ? "#1a7f37" : isActive ? "#fff" : t.fgMuted,
                      border: isDone
                        ? "1px solid #aceebb"
                        : isActive
                          ? "none"
                          : `1px solid ${t.border}`,
                    }}
                  >
                    {isDone ? <Ic.Check /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: isActive ? t.fg : t.fgMuted,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    style={{
                      width: 64,
                      height: 2,
                      margin: "0 8px",
                      marginBottom: 18,
                      backgroundColor: isDone ? "#aceebb" : t.border,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

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

        {/* Step 1: Input */}
        {step === "input" && (
          <div style={{ display: "grid", gap: 20 }}>
            <Card>
              <SectionTitle>Paste JSON data</SectionTitle>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "type": "product",\n    "namespace": "acme",\n    "identifier": "widget-001",\n    "name": "Smart Widget",\n    "description": "A smart widget for IoT",\n    "data": { ... }\n  },\n  ...\n]`}
                rows={14}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 13,
                  fontFamily: mono,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  backgroundColor: t.canvas,
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
              />
              {jsonInput.trim() && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: parseCount > 0 ? "#1a7f37" : t.fgMuted,
                  }}
                >
                  {parseCount > 0
                    ? `Detected ${parseCount} container${parseCount !== 1 ? "s" : ""} in JSON`
                    : "Could not parse JSON"}
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Or upload a file</SectionTitle>
              <label
                style={{
                  display: "block",
                  padding: 32,
                  textAlign: "center",
                  border: `2px dashed ${t.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setJsonInput(ev.target?.result as string);
                      reader.readAsText(file);
                    }
                  }}
                />
                <Ic.Upload />
                <div style={{ fontSize: 14, color: t.fgMuted, marginTop: 8 }}>
                  Drop a JSON file here or click to browse
                </div>
              </label>
            </Card>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleParse}
                disabled={!jsonInput.trim()}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: jsonInput.trim() ? t.accent : "#8b949e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: jsonInput.trim() ? "pointer" : "not-allowed",
                }}
              >
                Parse & Preview
              </button>
              <Link
                href="/containers"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 20px",
                  backgroundColor: "#fff",
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Cancel
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div style={{ display: "grid", gap: 20 }}>
            <Card padding={0}>
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${t.border}`,
                  backgroundColor: t.canvas,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>
                  {preview.length} container{preview.length !== 1 ? "s" : ""} to import
                </span>
                <button
                  onClick={() => setStep("input")}
                  style={{
                    padding: "4px 10px",
                    fontSize: 13,
                    backgroundColor: "transparent",
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    color: t.fg,
                  }}
                >
                  Edit
                </button>
              </div>
              <div style={{ maxHeight: 400, overflow: "auto" }}>
                {preview.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: i < preview.length - 1 ? `1px solid ${t.border}` : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: t.fg }}>
                        {(item.name as string) || (item.identifier as string) || `Item ${i + 1}`}
                      </div>
                      <code style={{ fontSize: 12, color: t.fgMuted, fontFamily: mono }}>
                        0711:{(item.type as string) || "product"}:
                        {(item.namespace as string) || "demo"}:
                        {(item.identifier as string) || `item-${i}`}:v1
                      </code>
                    </div>
                    <span
                      style={{
                        padding: "0 8px",
                        fontSize: 11,
                        fontFamily: mono,
                        lineHeight: "22px",
                        borderRadius: 12,
                        backgroundColor: t.canvas,
                        border: `1px solid ${t.border}`,
                        color: t.fgMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {(item.type as string) || "product"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleImport}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Import {preview.length} Container{preview.length !== 1 ? "s" : ""}
              </button>
              <button
                onClick={() => setStep("input")}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#fff",
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `3px solid ${t.border}`,
                borderTopColor: t.accent,
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
              Importing containers...
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted }}>This may take a few moments</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "done" && result && (
          <div style={{ display: "grid", gap: 20 }}>
            {/* Summary Banner */}
            <div
              style={{
                padding: 20,
                borderRadius: 8,
                backgroundColor: result.failed === 0 ? "#dafbe1" : "#fff8c5",
                border: `1px solid ${result.failed === 0 ? "#aceebb" : "#f5e0a0"}`,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 32 }}>{result.failed === 0 ? "\u2705" : "\u26A0\uFE0F"}</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 4px" }}>
                  Import Complete
                </h3>
                <p style={{ fontSize: 14, color: t.fgMuted, margin: 0 }}>
                  {result.success} of {result.total} container{result.total !== 1 ? "s" : ""}{" "}
                  imported successfully
                  {result.failed > 0 && ` (${result.failed} failed)`}
                </p>
              </div>
            </div>

            {/* Results List */}
            <Card padding={0}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${t.border}`,
                  backgroundColor: t.canvas,
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.fg,
                }}
              >
                Results
              </div>
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {result.containers.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom:
                        i < result.containers.length - 1 ? `1px solid ${t.border}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {c.name && (
                        <div
                          style={{ fontSize: 13, fontWeight: 500, color: t.fg, marginBottom: 2 }}
                        >
                          {c.name}
                        </div>
                      )}
                      <code style={{ fontSize: 12, color: t.fgMuted, fontFamily: mono }}>
                        {c.id}
                      </code>
                      {c.error && (
                        <div style={{ fontSize: 12, color: "#cf222e", marginTop: 4 }}>
                          {c.error}
                        </div>
                      )}
                    </div>
                    {c.status === "success" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "0 8px",
                          fontSize: 11,
                          fontFamily: mono,
                          lineHeight: "22px",
                          borderRadius: 12,
                          backgroundColor: "#dafbe1",
                          border: "1px solid #aceebb",
                          color: "#1a7f37",
                        }}
                      >
                        <Ic.Check /> success
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "0 8px",
                          fontSize: 11,
                          fontFamily: mono,
                          lineHeight: "22px",
                          borderRadius: 12,
                          backgroundColor: "#ffebe9",
                          border: "1px solid #cf222e",
                          color: "#cf222e",
                        }}
                      >
                        <Ic.X /> error
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "flex", gap: 12 }}>
              <Link
                href="/containers"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 20px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Containers
              </Link>
              <button
                onClick={handleReset}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#fff",
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
