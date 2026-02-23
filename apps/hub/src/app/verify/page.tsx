"use client";

import { useState } from "react";
import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

export default function VerifyPage() {
  const [containerId, setContainerId] = useState("");
  const [result, setResult] = useState<{ verified: boolean; details?: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!containerId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify?container=${encodeURIComponent(containerId)}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ verified: false, details: { error: String(e) } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Verify Container" description="Verify blockchain anchoring and data integrity of any container" />

        <Card>
          <SectionTitle>Container ID</SectionTitle>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              placeholder="e.g., bosch:product:BCS-VT-36:v2"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              style={{
                flex: 1, padding: "10px 14px", fontSize: 14, fontFamily: mono,
                border: `1px solid ${t.border}`, borderRadius: 6,
                backgroundColor: "#f6f8fa",
              }}
            />
            <button
              onClick={handleVerify}
              disabled={!containerId || loading}
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                backgroundColor: containerId && !loading ? "#238636" : "#8b949e",
                color: "#fff", border: "none", borderRadius: 6,
                cursor: containerId && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </Card>

        {result && (
          <div style={{ marginTop: 24 }}>
            <Card>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                padding: 16, borderRadius: 8,
                backgroundColor: result.verified ? "#dafbe1" : "#ffebe9",
              }}>
                {result.verified ? (
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="#1a7f37"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.042-1.042L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="#cf222e"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 0 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: result.verified ? "#1a7f37" : "#cf222e" }}>
                    {result.verified ? "Verification Passed" : "Verification Failed"}
                  </div>
                  <div style={{ fontSize: 13, color: result.verified ? "#1a7f37" : "#cf222e", opacity: 0.8 }}>
                    {result.verified ? "This container is anchored on Base Mainnet" : "Could not verify this container"}
                  </div>
                </div>
              </div>

              {result.details && (
                <>
                  <SectionTitle>Details</SectionTitle>
                  <pre style={{
                    backgroundColor: "#0d1117", color: "#e6edf3", padding: 20, borderRadius: 6,
                    overflow: "auto", fontSize: 13, fontFamily: mono, lineHeight: 1.6,
                  }}>{JSON.stringify(result.details, null, 2)}</pre>
                </>
              )}
            </Card>
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <Card>
            <SectionTitle>How Verification Works</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                { step: "1", title: "Compute Merkle Root", desc: "Hash all atoms in the container to generate a unique Merkle root" },
                { step: "2", title: "Query Blockchain", desc: "Check Base Mainnet for the corresponding anchor transaction" },
                { step: "3", title: "Validate Proof", desc: "Verify the cryptographic proof matches the on-chain record" },
              ].map(s => (
                <div key={s.step}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#0969da", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{s.step}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.fg, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
