"use client";

import { useState } from "react";
import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

export default function InjectPage() {
  const [containerId, setContainerId] = useState("");
  const [format, setFormat] = useState("openai");
  const [result, setResult] = useState<string | null>(null);

  const handleInject = async () => {
    if (!containerId) return;
    setResult("// Loading...");
    try {
      const res = await fetch(`/api/inject?container=${encodeURIComponent(containerId)}&format=${format}`);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult(`// Error: ${e}`);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Inject Context" description="Inject verified container data into your AI workflows" />

        <Card>
          <SectionTitle>Container ID</SectionTitle>
          <input
            type="text"
            placeholder="e.g., bosch:product:BCS-VT-36:v2"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", fontSize: 14, fontFamily: mono,
              border: `1px solid ${t.border}`, borderRadius: 6, marginBottom: 20,
              backgroundColor: "#f6f8fa",
            }}
          />

          <SectionTitle>Output Format</SectionTitle>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {["openai", "anthropic", "markdown", "json"].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  padding: "8px 16px", fontSize: 14, borderRadius: 6, cursor: "pointer",
                  backgroundColor: format === f ? "#0969da" : "#fff",
                  color: format === f ? "#fff" : t.fg,
                  border: `1px solid ${format === f ? "#0969da" : t.border}`,
                  fontWeight: format === f ? 600 : 400,
                }}
              >{f}</button>
            ))}
          </div>

          <button
            onClick={handleInject}
            disabled={!containerId}
            style={{
              padding: "10px 20px", fontSize: 14, fontWeight: 600,
              backgroundColor: containerId ? "#238636" : "#8b949e",
              color: "#fff", border: "none", borderRadius: 6, cursor: containerId ? "pointer" : "not-allowed",
            }}
          >
            Inject Context
          </button>
        </Card>

        {result && (
          <Card>
            <SectionTitle>Result</SectionTitle>
            <pre style={{
              backgroundColor: "#0d1117", color: "#e6edf3", padding: 20, borderRadius: 6,
              overflow: "auto", maxHeight: 400, fontSize: 13, fontFamily: mono, lineHeight: 1.6,
            }}>{result}</pre>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
