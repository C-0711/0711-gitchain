'use client';

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

// ============================================================================
// GITCHAIN — LIGHT ENTERPRISE THEME
// GitHub-grade. No blue. No emojis. No AI aesthetic.
// ============================================================================

const t = {
  bg: "#ffffff",
  canvas: "#f6f8fa",
  subtle: "#f6f8fa",
  muted: "#eaeef2",
  border: "#d1d9e0",
  borderSub:"#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  fgSubtle: "#8b949e",
  link: "#0969da",
  green: "#1a7f37",
  greenBg: "#dafbe1",
  greenBor: "#aceebb",
  amber: "#9a6700",
  amberBg: "#fff8c5",
  amberBor: "#d4a72c",
  red: "#d1242f",
  redBg: "#ffebe9",
  redBor: "#ff8182",
  purple: "#8250df",
  purpleBg: "#fbefff",
  purpleBor:"#c297ff",
  accent: "#1f883d",
  accentHov:"#1a7f37",
  tabLine: "#fd8c73",
  overlay: "rgba(27,31,36,0.5)",
};

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";

// --- Icons (Octicon-style, no emoji) ---
const Icon = {
  Lock: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"/></svg>,
  Unlock: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 4a2.5 2.5 0 0 1 5 0v2h-1V4a1.5 1.5 0 1 0-3 0v2h-1V4Zm-1.75 3.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25Zm-.75-.75C3 5.784 3.784 5 4.75 5H11V4a3.5 3.5 0 1 0-7 0v1h-.25C2.784 5 2 5.784 2 6.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-5.5A1.75 1.75 0 0 0 12.25 5H12v1h.25c.138 0 .25.112.25.25v5.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-5.5c0-.138.112-.25.25-.25Z"/></svg>,
  Layers: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0ZM8 2.236 2.987 5.11 8 7.986l5.013-2.875ZM2.39 8.737a.75.75 0 0 1 1.024-.274L8 11.236l4.586-2.773a.75.75 0 1 1 .778 1.282l-5 3.023a.75.75 0 0 1-.778 0l-5-3.023a.75.75 0 0 1-.196-1.008Z"/></svg>,
  File: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688Z"/></svg>,
  Folder: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.927-1.236A1.75 1.75 0 0 0 4.972 1ZM1.5 2.75a.25.25 0 0 1 .25-.25h3.222a.25.25 0 0 1 .2.1l.927 1.236c.374.498.97.789 1.601.789h6.55a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25Z"/></svg>,
  Commit: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>,
  PR: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></svg>,
  Alert: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>,
  Graph: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.06 1.06Z"/></svg>,
  Branch: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></svg>,
  Search: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>,
  Chev: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/></svg>,
  ChevR: ({s=12}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/></svg>,
  Copy: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>,
  Download: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06Z"/></svg>,
  Clock: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.556 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg>,
  Dot: ({s=8, color="#1a7f37"}: {s?: number; color?: string}) => <svg width={s} height={s} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={color}/></svg>,
  Check: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.042-.018.751.751 0 0 1 .018 1.042L6 13.06l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>,
  Ext: ({s=16}: {s?: number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"/></svg>,
};

// --- Types ---
interface AtomData {
  n: string;
  m: string;
  c: string;
  ct: string;
  msg: string;
  tr: number;
  d: string;
}

interface FolderData {
  folder: string;
  children: AtomData[];
}

type AtomOrFolder = AtomData | FolderData;

// --- Badge ---
function Badge({ label, variant = "default" }: { label: string; variant?: string }) {
  const variants: Record<string, { bg: string; color: string; bor: string }> = {
    default: { bg: t.canvas, color: t.fgMuted, bor: t.border },
    immutable: { bg: t.canvas, color: t.fgSubtle, bor: t.border },
    mutable: { bg: t.amberBg, color: t.amber, bor: t.amberBor },
    versioned: { bg: t.purpleBg, color: t.purple, bor: t.purpleBor },
    success: { bg: t.greenBg, color: t.green, bor: t.greenBor },
    danger: { bg: t.redBg, color: t.red, bor: t.redBor },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "0 6px", fontSize: 12, fontWeight: 500, fontFamily: mono,
      lineHeight: "20px", borderRadius: 6,
      border: `1px solid ${v.bor}`, backgroundColor: v.bg, color: v.color,
    }}>
      {variant === "immutable" && <Icon.Lock s={10}/>}
      {variant === "mutable" && <Icon.Unlock s={10}/>}
      {variant === "versioned" && <Icon.Layers s={10}/>}
      {label}
    </span>
  );
}

function Trust({ score }: { score: number }) {
  const c = score >= 90 ? t.green : score >= 70 ? t.amber : t.red;
  return <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: c }}>{score}%</span>;
}

// --- Pull Dropdown ---
function PullDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("cli");
  const [copied, setCopied] = useState<string | null>(null);
  const [sdkLang, setSdkLang] = useState("ts");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const cid = "0711:product:bosch:8738208680";
  const snippets = {
    cli: `gitchain pull ${cid}`,
    cliPinned: `gitchain pull ${cid}@b7e3201`,
    api: `curl -H "Authorization: Bearer $TOKEN" \\\n  https://api.gitchain.0711.io/v1/containers/${cid}`,
    python: `from gitchain import Client\n\nclient = Client(token="...")\ncontainer = client.pull("${cid}")\nprint(container.atoms)`,
    ts: `import { GitChain } from '@gitchain/sdk';\n\nconst gc = new GitChain({ token: '...' });\nconst container = await gc.pull('${cid}');\nconsole.log(container.atoms);`,
  };

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, marginTop: 4, width: 420,
      backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 8,
      boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
      zIndex: 100, overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: t.fg }}>Pull container</span>
        <span style={{ fontSize: 12, color: t.fgSubtle, fontFamily: mono }}>HEAD @ b7e3201</span>
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${t.borderSub}`, padding: "0 16px" }}>
        {[{ id: "cli", label: "CLI" }, { id: "api", label: "API" }, { id: "sdk", label: "SDK" }, { id: "zip", label: "Download" }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: "8px 12px", fontSize: 13, fontWeight: tab === tb.id ? 600 : 400,
            color: tab === tb.id ? t.fg : t.fgMuted,
            borderBottom: tab === tb.id ? `2px solid ${t.tabLine}` : "2px solid transparent",
            background: "none", border: "none", cursor: "pointer", marginBottom: -1,
          }}>{tb.label}</button>
        ))}
      </div>
      <div style={{ padding: 16 }}>
        {tab === "cli" && (
          <div>
            <div style={{ fontSize: 12, color: t.fgMuted, marginBottom: 8 }}>Pull full container:</div>
            <CodeBlock text={snippets.cli} id="cli" copied={copied} onCopy={copy} />
            <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 12, marginBottom: 8 }}>Pin to commit:</div>
            <CodeBlock text={snippets.cliPinned} id="clipin" copied={copied} onCopy={copy} />
          </div>
        )}
        {tab === "api" && (
          <div>
            <div style={{ fontSize: 12, color: t.fgMuted, marginBottom: 8 }}>REST endpoint:</div>
            <CodeBlock text={snippets.api} id="api" copied={copied} onCopy={copy} />
          </div>
        )}
        {tab === "sdk" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[{id:"ts",label:"TypeScript"},{id:"py",label:"Python"}].map(l => (
                <button key={l.id} onClick={() => setSdkLang(l.id)} style={{
                  padding: "3px 8px", fontSize: 12, borderRadius: 6,
                  border: `1px solid ${sdkLang === l.id ? t.border : t.borderSub}`,
                  background: sdkLang === l.id ? t.canvas : "transparent",
                  color: sdkLang === l.id ? t.fg : t.fgMuted, cursor: "pointer",
                }}>{l.label}</button>
              ))}
            </div>
            <CodeBlock text={sdkLang === "ts" ? snippets.ts : snippets.python} id={sdkLang} copied={copied} onCopy={copy} />
          </div>
        )}
        {tab === "zip" && (
          <div>
            <div style={{ fontSize: 12, color: t.fgMuted, marginBottom: 12 }}>Download as archive:</div>
            <button style={{
              width: "100%", padding: "8px 16px", backgroundColor: t.accent, color: "#fff",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}><Icon.Download s={14}/> Download ZIP</button>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 16px", borderTop: `1px solid ${t.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: t.canvas }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: t.fgSubtle }}>{cid}</span>
        <button onClick={() => copy(cid, "cid")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: t.fgMuted, fontSize: 11, cursor: "pointer" }}>
          {copied === "cid" ? <><Icon.Check s={12}/> Copied</> : <><Icon.Copy s={12}/> Copy ID</>}
        </button>
      </div>
    </div>
  );
}

function CodeBlock({ text, id, copied, onCopy }: { text: string; id: string; copied: string | null; onCopy: (t: string, i: string) => void }) {
  return (
    <div style={{ position: "relative", backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, borderRadius: 6, overflow: "hidden" }}>
      <pre style={{ margin: 0, padding: "10px 40px 10px 12px", fontFamily: mono, fontSize: 12, lineHeight: 1.5, color: t.fg, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{text}</pre>
      <button onClick={() => onCopy(text, id)} style={{ position: "absolute", top: 6, right: 6, padding: "4px 6px", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 4, cursor: "pointer", color: t.fgMuted, display: "flex", alignItems: "center" }}>
        {copied === id ? <Icon.Check s={14}/> : <Icon.Copy s={14}/>}
      </button>
    </div>
  );
}

// --- Atom Detail Panel ---
function AtomDetailPanel({ atom, onClose }: { atom: AtomData | null; onClose: () => void }) {
  if (!atom) return null;

  const sampleData: Record<string, any> = {
    "product.json": { supplier_pid: "8738208680", description_short: "CS7000iAW 7 IR-S", manufacturer: "Bosch Thermotechnik GmbH", ean: "4057749693020" },
    "ean.json": { ean: "4057749693020", gtin_type: "GTIN-13", verified: true },
    "abmessungen.json": { breite_mm: 440, hoehe_mm: 1370, tiefe_mm: 510, gewicht_kg: 140 },
    "effizienz.json": { scop_35: 5.12, scop_55: 3.45, eta_s_35: 200, eta_s_55: 135, energy_label_35: "A+++", energy_label_55: "A++" },
    "etim.json": { etim_class: "EC012034", etim_class_name: "Wärmepumpe", features_count: 22 },
    "leistung.json": { heizleistung_kw: 7, max_vorlauftemperatur_c: 62 },
  };

  const data = sampleData[atom.n];

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, backgroundColor: t.bg, borderLeft: `1px solid ${t.border}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.08)", zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 8, backgroundColor: t.canvas, flexShrink: 0 }}>
        <Icon.File s={16}/>
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, flex: 1 }}>{atom.n}</span>
        <Badge label={atom.m} variant={atom.m} />
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.fgMuted, fontSize: 18, padding: "2px 6px", lineHeight: 1 }}>&times;</button>
      </div>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.borderSub}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, backgroundColor: t.canvas, flexShrink: 0 }}>
        <div><span style={{ color: t.fgSubtle }}>Contributor:</span> <span style={{ fontFamily: mono, color: t.fg }}>{atom.c}</span></div>
        <div><span style={{ color: t.fgSubtle }}>Type:</span> <span style={{ fontFamily: mono, color: atom.ct === "A" ? t.amber : t.fg, fontWeight: 600 }}>{atom.ct === "A" ? "AI-generated" : "Original (Mfr)"}</span></div>
        <div><span style={{ color: t.fgSubtle }}>Trust:</span> <Trust score={atom.tr} /></div>
        <div><span style={{ color: t.fgSubtle }}>Updated:</span> <span style={{ fontFamily: mono }}>{atom.d}</span></div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {data ? (
          <div style={{ backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, borderRadius: 6, overflow: "hidden" }}>
            <pre style={{ margin: 0, padding: 16, fontFamily: mono, fontSize: 12, lineHeight: 1.6, color: t.fg, whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ color: t.fgSubtle, fontSize: 13, textAlign: "center", padding: 40 }}>No preview available</div>
        )}
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 8, backgroundColor: t.canvas, flexShrink: 0 }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, borderRadius: 6, background: t.bg, color: t.fg, cursor: "pointer" }}><Icon.Clock s={12}/> History</button>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, borderRadius: 6, background: t.bg, color: t.fg, cursor: "pointer" }}><Icon.Copy s={12}/> Raw</button>
        <div style={{ flex: 1 }} />
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, border: `1px solid ${t.border}`, borderRadius: 6, background: t.bg, color: t.link, cursor: "pointer" }}><Icon.Ext s={12}/> Open full</button>
      </div>
    </div>
  );
}

// --- Commits Tab ---
function CommitsTab() {
  const commits = [
    { hash: "e91d4b7", message: "AI audit: marketing descriptions + README", author: "0711-audit-pipeline", authorType: "A", date: "Feb 23, 2026", stats: { added: 6, modified: 2 } },
    { hash: "a3f8c12", message: "AI audit: efficiency data + ETIM classification", author: "0711-audit-pipeline", authorType: "A", date: "Feb 10, 2026", stats: { added: 18, modified: 6 } },
    { hash: "b7e3201", message: "Initial import: BMEcat + media files", author: "bosch-thermotechnik", authorType: "O", date: "Nov 15, 2025", stats: { added: 12, modified: 0 } },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon.Commit s={14}/><span><strong style={{ color: t.fg }}>3</strong> commits on <strong style={{ color: t.fg }}>main</strong></span>
      </div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, overflow: "hidden" }}>
        {commits.map((c, i) => (
          <div key={c.hash} style={{ padding: "12px 16px", borderBottom: i < commits.length - 1 ? `1px solid ${t.borderSub}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.fg, marginBottom: 4 }}>{c.message}</div>
              <div style={{ fontSize: 12, color: t.fgMuted, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, backgroundColor: c.authorType === "A" ? t.amberBg : t.canvas, border: `1px solid ${c.authorType === "A" ? t.amberBor : t.border}`, color: c.authorType === "A" ? t.amber : t.fgSubtle }}>{c.authorType}</span>
                <span style={{ fontFamily: mono }}>{c.author}</span>
                <span>committed on {c.date}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontFamily: mono, flexShrink: 0 }}>
              <span style={{ color: t.green }}>+{c.stats.added}</span>
              {c.stats.modified > 0 && <span style={{ color: t.amber }}>~{c.stats.modified}</span>}
              <span style={{ color: t.link, padding: "2px 8px", backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, borderRadius: 4 }}>{c.hash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Pull Requests Tab ---
function PullRequestsTab() {
  return (
    <div>
      <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon.PR s={14}/><span><strong style={{ color: t.fg }}>0</strong> open pull requests</span>
      </div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, padding: 40, textAlign: "center", backgroundColor: t.canvas }}>
        <div style={{ color: t.fgSubtle, marginBottom: 8 }}><Icon.PR s={24}/></div>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.fg, marginBottom: 4 }}>No open pull requests</div>
        <div style={{ fontSize: 13, color: t.fgMuted, maxWidth: 400, margin: "0 auto" }}>Pull requests let contributors propose changes to atoms in this container.</div>
        <button style={{ marginTop: 16, padding: "6px 14px", fontSize: 13, fontWeight: 600, backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>New pull request</button>
      </div>
    </div>
  );
}

// --- Conflicts Tab ---
function ConflictsTab() {
  return (
    <div>
      <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon.Alert s={14}/><span><strong style={{ color: t.fg }}>0</strong> active conflicts</span>
      </div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, padding: 40, textAlign: "center", backgroundColor: t.canvas }}>
        <div style={{ color: t.green, marginBottom: 8 }}><Icon.Check s={24}/></div>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.fg, marginBottom: 4 }}>All clear</div>
        <div style={{ fontSize: 13, color: t.fgMuted, maxWidth: 400, margin: "0 auto" }}>No conflicting data detected between manufacturer data and AI-generated atoms.</div>
      </div>
    </div>
  );
}

// --- Graph Tab ---
function GraphTab() {
  const nodes = [
    { id: "self", label: "CS7000iAW 7 IR-S", type: "current", x: 300, y: 180 },
    { id: "fam1", label: "CS7000iAW 9 IR-S", type: "family", x: 100, y: 80 },
    { id: "fam2", label: "CS7000iAW 12 IR-S", type: "family", x: 100, y: 280 },
    { id: "acc1", label: "AWB 13-17", type: "compatible", x: 520, y: 60 },
    { id: "acc2", label: "BSH 750/1000", type: "compatible", x: 540, y: 150 },
    { id: "acc3", label: "CW 400/800", type: "compatible", x: 520, y: 240 },
    { id: "acc4", label: "EHP 300", type: "compatible", x: 540, y: 320 },
    { id: "rep", label: "CS5800iAW 7 IR", type: "replaced", x: 160, y: 180 },
  ];
  const edges = [
    { from: "self", to: "fam1", type: "family" },
    { from: "self", to: "fam2", type: "family" },
    { from: "self", to: "acc1", type: "compatible" },
    { from: "self", to: "acc2", type: "compatible" },
    { from: "self", to: "acc3", type: "compatible" },
    { from: "self", to: "acc4", type: "compatible" },
    { from: "rep", to: "self", type: "replaced" },
  ];
  const nodeColor: Record<string, string> = { current: t.accent, family: t.purple, compatible: t.link, replaced: t.fgSubtle };
  const edgeColor: Record<string, string> = { family: t.purple, compatible: t.link, replaced: t.fgSubtle };

  return (
    <div>
      <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Dot s={8} color={t.accent}/> Current</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Dot s={8} color={t.purple}/> Family</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Dot s={8} color={t.link}/> Compatible</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Dot s={8} color={t.fgSubtle}/> Replaced by</span>
      </div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, overflow: "hidden", backgroundColor: t.canvas, position: "relative" }}>
        <svg width="100%" height="380" viewBox="0 0 660 380" style={{ display: "block" }}>
          <defs><marker id="arrowGray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={t.fgSubtle}/></marker></defs>
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from)!;
            const to = nodes.find(n => n.id === e.to)!;
            return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={edgeColor[e.type]} strokeWidth={1.5} strokeDasharray={e.type === "replaced" ? "4 3" : "none"} markerEnd={e.type === "replaced" ? "url(#arrowGray)" : ""} opacity={0.5} />;
          })}
          {nodes.map(n => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.type === "current" ? 8 : 5} fill={nodeColor[n.type]} stroke={t.bg} strokeWidth={2}/>
              <text x={n.x} y={n.y + (n.type === "current" ? 22 : 18)} textAnchor="middle" fontSize={11} fontFamily={mono} fill={t.fg} fontWeight={n.type === "current" ? 700 : 400}>{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", fontSize: 12, color: t.fgMuted, backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, borderRadius: 6, display: "flex", gap: 24 }}>
        <span><strong style={{ color: t.fg }}>3</strong> family variants</span>
        <span><strong style={{ color: t.fg }}>44</strong> compatible products</span>
        <span><strong style={{ color: t.fg }}>1</strong> predecessor</span>
      </div>
    </div>
  );
}

// --- Atom Row ---
function AtomRow({ a, last, onClick }: { a: AtomData; last: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: "1fr 160px 1fr 60px 56px", padding: "7px 16px 7px 40px", borderBottom: last ? "none" : `1px solid ${t.borderSub}`, backgroundColor: t.bg, fontSize: 13, alignItems: "center", cursor: "pointer", transition: "background-color 0.1s" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = t.canvas)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = t.bg)}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ color: t.fgSubtle }}><Icon.File s={14}/></span>
        <span style={{ color: t.link, fontFamily: mono, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.n}</span>
        <Badge label={a.m} variant={a.m} />
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, color: t.fgMuted, fontSize: 12, fontFamily: mono }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, backgroundColor: a.ct === "A" ? t.amberBg : t.canvas, border: `1px solid ${a.ct === "A" ? t.amberBor : t.border}`, color: a.ct === "A" ? t.amber : t.fgSubtle }}>{a.ct}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.c}</span>
      </span>
      <span style={{ color: t.fgMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</span>
      <span style={{ textAlign: "right" }}><Trust score={a.tr} /></span>
      <span style={{ textAlign: "right", color: t.fgSubtle, fontSize: 12, fontFamily: mono }}>{a.d}</span>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
// Transform API fileTree to internal format
function transformFileTree(fileTree: any[]): AtomOrFolder[] {
  return fileTree.map(item => {
    if (item.type === "dir") {
      const flatChildren: AtomData[] = [];
      function flattenChildren(items: any[]) {
        for (const child of items) {
          if (child.type === "dir") {
            flattenChildren(child.children || []);
          } else {
            flatChildren.push({
              n: child.name,
              m: child.mutability || "mutable",
              c: child.contributor || "unknown",
              ct: child.source === "manufacturer" ? "O" : "A",
              msg: child.message || "",
              tr: child.trust || 80,
              d: child.lastCommit ? child.lastCommit.replace(/^\d{4}-/, "").replace("-", "/") : "",
            });
          }
        }
      }
      flattenChildren(item.children || []);
      return { folder: item.name.replace("/", ""), children: flatChildren };
    } else {
      return {
        n: item.name,
        m: item.mutability || "mutable",
        c: item.contributor || "unknown",
        ct: item.source === "manufacturer" ? "O" : "A",
        msg: item.message || "",
        tr: item.trust || 80,
        d: item.lastCommit ? item.lastCommit.replace(/^\d{4}-/, "").replace("-", "/") : "",
      };
    }
  });
}

export default function ContainerPage() {
  const params = useParams();
  const containerId = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
  
  const [activeTab, setActiveTab] = useState("code");
  const [pullOpen, setPullOpen] = useState(false);
  const [folders, setFolders] = useState<Record<string, boolean>>({ metadata: true, specs: true, marketing: true, media: true, relations: false, quality: false });
  const [selectedAtom, setSelectedAtom] = useState<AtomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [container, setContainer] = useState<any>(null);
  const [atoms, setAtoms] = useState<AtomOrFolder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContainer() {
      if (!containerId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/full`);
        if (!res.ok) throw new Error("Container not found");
        const data = await res.json();
        setContainer(data);
        setAtoms(transformFileTree(data.fileTree || []));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load container");
      } finally {
        setLoading(false);
      }
    }
    fetchContainer();
  }, [containerId]);

  const tabs = [
    { id: "code", icon: <Icon.File s={14}/>, label: "Code" },
    { id: "pulls", icon: <Icon.PR s={14}/>, label: "Pull Requests", count: 0 },
    { id: "commits", icon: <Icon.Commit s={14}/>, label: "Commits", count: 3 },
    { id: "conflicts", icon: <Icon.Alert s={14}/>, label: "Conflicts", count: 0 },
    { id: "graph", icon: <Icon.Graph s={14}/>, label: "Graph" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, color: t.fgMuted }}>Loading container...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, color: t.red }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, color: t.fg, fontFamily: sans, fontSize: 14 }}>

      {/* CONTAINER HEADER */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: "16px 32px 0", backgroundColor: t.canvas }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: mono, fontSize: 16 }}>
            <span style={{ color: t.fgMuted }}>{container?.namespace || "0711:product"} / </span>
            <a href="#" style={{ color: t.link, textDecoration: "none", fontWeight: 700 }}>{container?.identifier || "..."}</a>
          </span>
        </div>
        <p style={{ fontSize: 14, color: t.fgMuted, margin: "4px 0 12px" }}>
          <strong style={{ color: t.fg }}>{container?.name || "Loading..."}</strong> — {container?.description || ""} · ETIM {container?.etim?.class || "..."}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontSize: 12, color: t.fgMuted, flexWrap: "wrap" }}>
          <span>Trust: <strong style={{ color: t.fg }}>{container?.stats?.mfrTrust || 0}%</strong> mfr / <strong style={{ color: t.fg }}>{container?.stats?.aiTrust || 0}%</strong> ai</span>
          <span style={{ color: t.borderSub }}>·</span>
          <span><strong style={{ color: t.fg }}>{container?.stats?.atomCount || 0}</strong> atoms</span>
          <span style={{ color: t.borderSub }}>·</span>
          <span><strong style={{ color: t.fg }}>{container?.stats?.mediaCount || 0}</strong> media</span>
          <span style={{ color: t.borderSub }}>·</span>
          <span><strong style={{ color: t.fg }}>{container?.stats?.familyCount || 0}</strong> family</span>
          <span style={{ color: t.borderSub }}>·</span>
          <span><strong style={{ color: t.fg }}>{container?.stats?.compatibleCount || 0}</strong> compatible</span>
          <span style={{ color: t.borderSub }}>·</span>
          <Badge label={`${container?.stats?.score || 0}% ${container?.stats?.grade || "?"}`} variant="success" />
        </div>
        <nav style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setActiveTab(tb.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 14, fontWeight: activeTab === tb.id ? 600 : 400, color: activeTab === tb.id ? t.fg : t.fgMuted, background: "none", border: "none", borderBottom: activeTab === tb.id ? `2px solid ${t.tabLine}` : "2px solid transparent", cursor: "pointer" }}>
              {tb.icon}{tb.label}
              {tb.count != null && <span style={{ backgroundColor: t.muted, color: t.fgMuted, fontSize: 11, fontFamily: mono, padding: "0 6px", borderRadius: 10 }}>{tb.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px" }}>
        {activeTab === "code" && (
          <>
            {/* Branch bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: t.canvas, border: `1px solid ${t.border}`, borderRadius: 6, padding: "5px 12px", color: t.fg, fontSize: 13, fontWeight: 500, cursor: "pointer" }}><Icon.Branch s={14}/> main <Icon.Chev s={12}/></button>
              <span style={{ fontFamily: mono, fontSize: 13, color: t.fgMuted }}>
                <span style={{ color: t.link }}>b7e3201</span> · Initial import: BMEcat + media files… · 2025-11-15
              </span>
              <span style={{ fontFamily: mono, fontSize: 12, color: t.fgSubtle }}>3 commits</span>
              <div style={{ flex: 1 }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => setPullOpen(!pullOpen)} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Icon.Download s={14}/> Pull container <Icon.Chev s={12}/>
                </button>
                <PullDropdown open={pullOpen} onClose={() => setPullOpen(false)} />
              </div>
            </div>

            {/* File table */}
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 1fr 60px 56px", padding: "8px 16px", backgroundColor: t.canvas, borderBottom: `1px solid ${t.border}`, fontSize: 12, fontWeight: 600, color: t.fgMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <span>Name</span><span>Contributor</span><span>Last commit</span>
                <span style={{ textAlign: "right" }}>Trust</span><span style={{ textAlign: "right" }}>Date</span>
              </div>
              {atoms.map((item, i) => {
                if ('folder' in item) {
                  const open = folders[item.folder];
                  return (
                    <div key={item.folder}>
                      <div onClick={() => setFolders(p => ({...p, [item.folder]: !p[item.folder]}))} style={{ display: "grid", gridTemplateColumns: "1fr 160px 1fr 60px 56px", padding: "7px 16px", borderBottom: `1px solid ${t.borderSub}`, cursor: "pointer", backgroundColor: t.bg }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                          <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-flex" }}><Icon.ChevR s={12}/></span>
                          <span style={{ color: t.fgSubtle }}><Icon.Folder s={14}/></span>
                          <span style={{ fontFamily: mono, fontSize: 13 }}>{item.folder}/</span>
                          <span style={{ fontSize: 11, color: t.fgSubtle, fontFamily: mono }}>{item.children.length}</span>
                        </span>
                      </div>
                      {open && item.children.map((a, j) => <AtomRow key={a.n} a={a} last={j === item.children.length - 1} onClick={() => setSelectedAtom(a)} />)}
                    </div>
                  );
                }
                return <AtomRow key={item.n} a={item} last={i === atoms.length - 1} onClick={() => setSelectedAtom(item)} />;
              })}
            </div>
          </>
        )}
        {activeTab === "commits" && <CommitsTab />}
        {activeTab === "pulls" && <PullRequestsTab />}
        {activeTab === "conflicts" && <ConflictsTab />}
        {activeTab === "graph" && <GraphTab />}
      </div>

      {/* Overlay + Panel */}
      {selectedAtom && (
        <>
          <div onClick={() => setSelectedAtom(null)} style={{ position: "fixed", inset: 0, backgroundColor: t.overlay, zIndex: 199 }} />
          <AtomDetailPanel atom={selectedAtom} onClose={() => setSelectedAtom(null)} />
        </>
      )}
    </div>
  );
}
