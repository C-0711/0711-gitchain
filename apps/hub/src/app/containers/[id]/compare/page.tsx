"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  unchanged: number;
  total: number;
}

interface DiffItem {
  field: string;
  name: string | null;
  value?: unknown;
  unit?: string | null;
  trust?: string;
  from?: { value: unknown; unit: string | null; trust: string };
  to?: { value: unknown; unit: string | null; trust: string };
}

interface DiffData {
  from: string;
  to: string;
  stats: DiffStats;
  diff: {
    additions: DiffItem[];
    deletions: DiffItem[];
    modifications: DiffItem[];
  };
}

interface Layer {
  id: string;
  name: string;
  type: string;
  contributor: string;
  atomCount: number;
  createdAt: string;
}

// Icons
const Ic = {
  Diff: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.75 1.75V5H12a.75.75 0 0 1 0 1.5H8.75v3.25a.75.75 0 0 1-1.5 0V6.5H4a.75.75 0 0 1 0-1.5h3.25V1.75a.75.75 0 0 1 1.5 0ZM4 13h8a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5Z" />
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
    </svg>
  ),
  Swap: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.22 14.78a.75.75 0 0 0 1.06-1.06L4.56 12h8.69a.75.75 0 0 0 0-1.5H4.56l1.72-1.72a.75.75 0 0 0-1.06-1.06l-3 3a.75.75 0 0 0 0 1.06l3 3Zm5.56-6.56a.75.75 0 1 0 1.06-1.06l1.72-1.72H4.75a.75.75 0 0 1 0-1.5h8.69l-1.72-1.72a.75.75 0 0 1 1.06-1.06l3 3a.75.75 0 0 1 0 1.06l-3 3Z" />
    </svg>
  ),
};

const selectStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  fontFamily: mono,
  color: t.fg,
  backgroundColor: "#fff",
  border: `1px solid ${t.border}`,
  borderRadius: 6,
  cursor: "pointer",
  minWidth: 220,
  outline: "none",
};

export default function ComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const containerId = decodeURIComponent(id);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromLayer, setFromLayer] = useState(searchParams.get("from") || "");
  const [toLayer, setToLayer] = useState(searchParams.get("to") || "");

  // Fetch available versions/layers
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/containers/${encodeURIComponent(containerId)}/versions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load versions (${r.status})`);
        return r.json();
      })
      .then((data) => {
        const l = data.layers || [];
        setLayers(l);
        // Auto-select first two if available and none selected
        if (l.length >= 2 && !fromLayer && !toLayer) {
          setFromLayer(l[1]?.id || "");
          setToLayer(l[0]?.id || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [containerId]);

  // Fetch diff when layers change
  useEffect(() => {
    if (!fromLayer || !toLayer || fromLayer === toLayer) {
      setDiffData(null);
      return;
    }

    setDiffLoading(true);
    const token = localStorage.getItem("token");
    fetch(
      `/api/containers/${encodeURIComponent(containerId)}/diff?from=${encodeURIComponent(fromLayer)}&to=${encodeURIComponent(toLayer)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to calculate diff");
        return r.json();
      })
      .then((data) => {
        setDiffData(data);
        setDiffLoading(false);
      })
      .catch(() => {
        setDiffData(null);
        setDiffLoading(false);
      });
  }, [containerId, fromLayer, toLayer]);

  const handleSwap = () => {
    const tmp = fromLayer;
    setFromLayer(toLayer);
    setToLayer(tmp);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14 }}
        >
          <Link
            href={`/containers/${encodeURIComponent(containerId)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: t.link,
              textDecoration: "none",
            }}
          >
            <Ic.Back /> {containerId}
          </Link>
          <span style={{ color: t.fgMuted }}>/</span>
          <span style={{ color: t.fg, fontWeight: 600 }}>Compare</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ color: t.fgMuted }}>
            <Ic.Diff />
          </span>
          <PageHeader
            title="Compare Layers"
            description="Compare two versions of this container to see what changed"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div style={{ textAlign: "center", padding: 48, color: t.fgMuted, fontSize: 14 }}>
              Loading versions...
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 14, color: "#cf222e", marginBottom: 12 }}>{error}</div>
              <Link
                href={`/containers/${encodeURIComponent(containerId)}`}
                style={{ fontSize: 14, color: t.link, textDecoration: "none" }}
              >
                Back to container
              </Link>
            </div>
          </Card>
        )}

        {/* Layer Selectors */}
        {!loading && !error && (
          <>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {/* Base selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>Base:</span>
                  <select
                    value={fromLayer}
                    onChange={(e) => setFromLayer(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select layer...</option>
                    {layers.map((layer) => (
                      <option key={layer.id} value={layer.id}>
                        {layer.id}: {layer.name} ({layer.atomCount} atoms)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arrow / swap */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, color: t.fgMuted }}>...</span>
                  {fromLayer && toLayer && fromLayer !== toLayer && (
                    <button
                      onClick={handleSwap}
                      title="Swap base and compare"
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#fff",
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.fgMuted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Ic.Swap />
                    </button>
                  )}
                </div>

                {/* Compare selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>Compare:</span>
                  <select
                    value={toLayer}
                    onChange={(e) => setToLayer(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select layer...</option>
                    {layers.map((layer) => (
                      <option key={layer.id} value={layer.id} disabled={layer.id === fromLayer}>
                        {layer.id}: {layer.name} ({layer.atomCount} atoms)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Diff Loading */}
            {diffLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: 48,
                  color: t.fgMuted,
                  fontSize: 14,
                  marginTop: 24,
                }}
              >
                Calculating diff...
              </div>
            )}

            {/* No selection prompt */}
            {!diffLoading && !diffData && (!fromLayer || !toLayer || fromLayer === toLayer) && (
              <Card>
                <div style={{ textAlign: "center", padding: 48, marginTop: 0 }}>
                  <div style={{ color: t.fgMuted, marginBottom: 12 }}>
                    <svg width="48" height="48" viewBox="0 0 16 16" fill={t.fgMuted}>
                      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                    Select two different layers to compare
                  </h3>
                  <p style={{ fontSize: 14, color: t.fgMuted }}>
                    Choose a base and compare layer to see the differences.
                  </p>
                </div>
              </Card>
            )}

            {/* Diff Results */}
            {!diffLoading && diffData && (
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Stats bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "14px 20px",
                    backgroundColor: "#fff",
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#1a7f37",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "#1a7f37" }}>
                      +{diffData.stats.additions}
                    </span>
                    <span style={{ fontSize: 13, color: t.fgMuted }}>additions</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#cf222e",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "#cf222e" }}>
                      -{diffData.stats.deletions}
                    </span>
                    <span style={{ fontSize: 13, color: t.fgMuted }}>deletions</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#9a6700",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "#9a6700" }}>
                      ~{diffData.stats.modifications}
                    </span>
                    <span style={{ fontSize: 13, color: t.fgMuted }}>modifications</span>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: t.fgMuted }}>
                    {diffData.stats.unchanged} unchanged
                  </span>
                </div>

                {/* Additions */}
                {diffData.diff.additions.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1a7f37",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>+</span> Additions ({diffData.diff.additions.length})
                    </h3>
                    <div
                      style={{
                        border: "1px solid #aceebb",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {diffData.diff.additions.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#dafbe1",
                            borderBottom:
                              i < diffData.diff.additions.length - 1 ? "1px solid #aceebb" : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <code
                            style={{
                              fontFamily: mono,
                              fontSize: 13,
                              color: "#1a7f37",
                              fontWeight: 600,
                            }}
                          >
                            + {item.name || item.field}
                          </code>
                          <span style={{ color: t.fgMuted }}>=</span>
                          <code style={{ fontFamily: mono, fontSize: 13, color: t.fg }}>
                            {JSON.stringify(item.value)}
                          </code>
                          {item.unit && (
                            <span style={{ fontSize: 12, color: t.fgMuted }}>{item.unit}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deletions */}
                {diffData.diff.deletions.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#cf222e",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>-</span> Deletions ({diffData.diff.deletions.length})
                    </h3>
                    <div
                      style={{
                        border: "1px solid #ff818266",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {diffData.diff.deletions.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#ffebe9",
                            borderBottom:
                              i < diffData.diff.deletions.length - 1
                                ? "1px solid #ff818266"
                                : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <code
                            style={{
                              fontFamily: mono,
                              fontSize: 13,
                              color: "#cf222e",
                              fontWeight: 600,
                            }}
                          >
                            - {item.name || item.field}
                          </code>
                          <span style={{ color: t.fgMuted }}>=</span>
                          <code
                            style={{
                              fontFamily: mono,
                              fontSize: 13,
                              color: t.fgMuted,
                              textDecoration: "line-through",
                            }}
                          >
                            {JSON.stringify(item.value)}
                          </code>
                          {item.unit && (
                            <span style={{ fontSize: 12, color: t.fgMuted }}>{item.unit}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modifications */}
                {diffData.diff.modifications.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#9a6700",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>~</span> Modifications ({diffData.diff.modifications.length})
                    </h3>
                    <div
                      style={{
                        border: "1px solid #d4a72c66",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {diffData.diff.modifications.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            backgroundColor: "#fff8c5",
                            borderBottom:
                              i < diffData.diff.modifications.length - 1
                                ? "1px solid #d4a72c66"
                                : "none",
                          }}
                        >
                          <div
                            style={{ fontWeight: 600, fontSize: 13, color: t.fg, marginBottom: 8 }}
                          >
                            {item.name || item.field}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {/* Before */}
                            <div
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#ffebe9",
                                borderRadius: 6,
                                border: "1px solid #ff818266",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#cf222e",
                                  marginBottom: 4,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Before
                              </div>
                              <code style={{ fontFamily: mono, fontSize: 13, color: "#82071e" }}>
                                {JSON.stringify(item.from?.value)}
                              </code>
                              {item.from?.unit && (
                                <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 4 }}>
                                  {item.from.unit}
                                </span>
                              )}
                            </div>
                            {/* After */}
                            <div
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#dafbe1",
                                borderRadius: 6,
                                border: "1px solid #aceebb",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#1a7f37",
                                  marginBottom: 4,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                After
                              </div>
                              <code style={{ fontFamily: mono, fontSize: 13, color: "#116329" }}>
                                {JSON.stringify(item.to?.value)}
                              </code>
                              {item.to?.unit && (
                                <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 4 }}>
                                  {item.to.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No differences */}
                {diffData.stats.additions === 0 &&
                  diffData.stats.deletions === 0 &&
                  diffData.stats.modifications === 0 && (
                    <Card>
                      <div style={{ textAlign: "center", padding: 48 }}>
                        <div style={{ color: "#1a7f37", marginBottom: 12 }}>
                          <svg width="32" height="32" viewBox="0 0 16 16" fill="#1a7f37">
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                          </svg>
                        </div>
                        <h3
                          style={{ fontSize: 16, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}
                        >
                          No differences
                        </h3>
                        <p style={{ fontSize: 14, color: t.fgMuted }}>
                          These two layers are identical.
                        </p>
                      </div>
                    </Card>
                  )}
              </div>
            )}
          </>
        )}

        {/* Back link */}
        {!loading && (
          <div style={{ marginTop: 24 }}>
            <Link
              href={`/containers/${encodeURIComponent(containerId)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                color: t.fgMuted,
                textDecoration: "none",
              }}
            >
              <Ic.Back /> Back to container
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
