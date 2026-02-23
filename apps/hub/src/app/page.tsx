"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

// ============================================================================
// GITCHAIN HOMEPAGE — Enterprise Landing
// GitHub Primer aesthetic. No blue gradients. No AI slop. No emojis.
// ============================================================================

const t = {
  bg:"#ffffff",canvas:"#f6f8fa",muted:"#eaeef2",border:"#d1d9e0",borderSub:"#eaeef2",
  fg:"#1f2328",fgMuted:"#656d76",fgSubtle:"#8b949e",link:"#0969da",
  green:"#1a7f37",greenBg:"#dafbe1",greenBor:"#aceebb",
  amber:"#9a6700",amberBg:"#fff8c5",amberBor:"#d4a72c",
  red:"#d1242f",purple:"#8250df",purpleBg:"#fbefff",purpleBor:"#c297ff",
  accent:"#1f883d",accentHov:"#1a7f37",tabLine:"#fd8c73",
  heroBg:"#0d1117",heroFg:"#e6edf3",heroMuted:"#8b949e",heroSubtle:"#30363d",heroBorder:"#21262d",
  heroAccent:"#3fb950",heroLink:"#58a6ff",
};

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";

// --- Icons ---
const Ic = {
  Chain:({s=16,c="currentColor"}:{s?:number,c?:string})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Shield:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Zm.61 1.429a.25.25 0 0 0-.153 0l-5.25 1.68a.25.25 0 0 0-.174.238V7c0 1.358.275 2.666 1.057 3.86.784 1.194 2.121 2.34 4.366 3.297a.2.2 0 0 0 .154 0c2.245-.956 3.582-2.104 4.366-3.298C13.225 9.666 13.5 8.36 13.5 7V3.48a.251.251 0 0 0-.174-.237Z"/></svg>,
  Search:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>,
  Chev:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/></svg>,
  ChevR:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/></svg>,
  Copy:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>,
  Check:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.042-.018.751.751 0 0 1 .018 1.042L6 13.06l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>,
  Terminal:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM7.25 8a.749.749 0 0 1-.22.53l-2.25 2.25a.749.749 0 0 1-1.06-1.06L5.44 8 3.72 6.28a.749.749 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z"/></svg>,
  Layers:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0ZM8 2.236 2.987 5.11 8 7.986l5.013-2.875ZM2.39 8.737a.75.75 0 0 1 1.024-.274L8 11.236l4.586-2.773a.75.75 0 1 1 .778 1.282l-5 3.023a.75.75 0 0 1-.778 0l-5-3.023a.75.75 0 0 1-.196-1.008Z"/></svg>,
  Commit:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>,
  Lock:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"/></svg>,
  Globe:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 .2 2.014c.312 1.168.834 1.936 1.413 2.33.207.142.378.197.497.222a.75.75 0 0 0 .22 0c.12-.025.29-.08.497-.222.579-.394 1.1-1.162 1.413-2.33A9.64 9.64 0 0 0 10.22 8.75Zm4.972 0h-3.42a11.15 11.15 0 0 1-.235 2.39c-.374 1.399-1.053 2.475-1.953 3.065a6.503 6.503 0 0 0 5.608-5.455Zm-9.504 0A6.503 6.503 0 0 0 6.856 14.2c-.9-.59-1.58-1.666-1.953-3.065a11.15 11.15 0 0 1-.236-2.39Zm9.504-1.5a6.503 6.503 0 0 0-5.608-5.455c.9.59 1.58 1.666 1.953 3.065.141.527.225 1.088.261 1.67h3.42l-.026.72Zm-9.478-.72a6.503 6.503 0 0 1 5.608-5.455c-.9.59-1.58 1.666-1.953 3.065A11.15 11.15 0 0 0 5.78 7.25Z"/></svg>,
  Ext:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"/></svg>,
  Zap:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004Z"/></svg>,
  File:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688Z"/></svg>,
  Graph:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.06 1.06Z"/></svg>,
  PR:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z"/></svg>,
  Star:({s=16}:{s?:number})=><svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>,
};


// ============================================================================
// STRATEGIC SHOWCASE CONTAINERS
// ============================================================================

const showcaseContainers = [
  {
    ns: "bosch",
    id: "product:8738208680",
    type: "product",
    typeColor: "#238636",
    name: "CS7000iAW Heat Pump",
    tagline: "Your AI quotes specs without hallucinating",
    desc: "Every dimension, efficiency rating, and certification — traceable to the original Bosch datasheet. Customer service bots give accurate answers. Configurators use trusted data. No more 'I think the COP is around 4.5'.",
    capabilities: ["207 verified ETIM attributes", "Direct citation to PDF page & quote", "EU Digital Product Passport ready", "Real-time sync from manufacturer ERP"],
    tags: ["manufacturing", "ETIM", "DPP"],
    atoms: 207, trust: 97, sources: 4,
  },
  {
    ns: "doj-sealed",
    id: "case:usa-v-megacorp",
    type: "legal",
    typeColor: "#cf222e",
    name: "USA v. MegaCorp (Sealed)",
    tagline: "Case law your AI can cite — with access control",
    desc: "Federal prosecution evidence, witness depositions, and rulings — all versioned and access-controlled. Your legal AI finds precedent instantly. Opposing counsel can't claim you cited a hallucinated case.",
    capabilities: ["2,847 evidence artifacts indexed", "Witness statement cross-references", "Judge ruling citations", "Access control by clearance level"],
    tags: ["litigation", "sealed", "federal"],
    atoms: 2847, trust: 100, sources: 1,
  },
  {
    ns: "irs-audit",
    id: "case:fortune500-2023",
    type: "tax",
    typeColor: "#9a6700",
    name: "Fortune 500 Tax Audit",
    tagline: "Every deduction, every receipt, every ruling",
    desc: "Transfer pricing documentation, R&D credit substantiation, and prior IRS determinations. When the auditor asks 'Show me the basis for this $47M deduction', your AI pulls the exact memo and sign-off chain.",
    capabilities: ["4,200+ supporting documents", "Transfer pricing models linked", "Prior audit rulings indexed", "Partner approval chains tracked"],
    tags: ["tax", "audit", "transfer-pricing"],
    atoms: 4231, trust: 99, sources: 12,
  },
  {
    ns: "darpa",
    id: "project:classified-xr7",
    type: "classified",
    typeColor: "#1f2328",
    name: "Project XR-7 [TS/SCI]",
    tagline: "Top secret context — verified, compartmentalized",
    desc: "Defense project specifications with need-to-know enforcement. Contractors get exactly the context their clearance allows. No accidental leaks from AI summarization. Full audit trail of every access.",
    capabilities: ["Compartmentalized access control", "Clearance-level content filtering", "Air-gapped verification option", "ITAR/EAR compliance built-in"],
    tags: ["defense", "classified", "ITAR"],
    atoms: 892, trust: 100, sources: 1,
  },
  {
    ns: "fda-trials",
    id: "compound:onc-2847-phase3",
    type: "clinical",
    typeColor: "#8250df",
    name: "ONC-2847 Phase III Trial",
    tagline: "Clinical data with regulatory-grade citations",
    desc: "Patient outcomes, adverse events, and endpoint analyses — every data point traceable to the Case Report Form. When your AI drafts the FDA submission, it cites real trial data. No statistical hallucinations.",
    capabilities: ["12,400 patient records indexed", "Adverse event traceability", "Endpoint calculations verified", "21 CFR Part 11 compliant"],
    tags: ["pharma", "FDA", "clinical-trial"],
    atoms: 12400, trust: 98, sources: 3,
  },
  {
    ns: "agent",
    id: "memory:bombas",
    type: "memory",
    typeColor: "#3fb950",
    name: "Agent Memory Store",
    tagline: "Your AI remembers — with receipts",
    desc: "Learned preferences, past corrections, established facts. When you said 'I prefer concise answers' six months ago, it's still there — versioned and searchable. No mystery. No drift. No gaslighting.",
    capabilities: ["Preference learning with sources", "Correction history tracked", "Session-to-session continuity", "Forgetting is explicit, not silent"],
    tags: ["agent", "personalization", "memory"],
    atoms: 156, trust: 100, sources: 1,
  },
];


// --- Animated number counter ---
function Counter({ end, suffix = "", duration = 1200 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// --- Typed text effect ---
function TypedText({ lines, speed = 40 }: { lines: { prefix?: string; text: string; color?: string }[]; speed?: number }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    if (lineIdx >= lines.length) return;
    if (charIdx <= lines[lineIdx].text.length) {
      const timer = setTimeout(() => setCharIdx(c => c + 1), speed);
      return () => clearTimeout(timer);
    } else {
      setDone(d => [...d, lineIdx]);
      setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, 300);
    }
  }, [lineIdx, charIdx, lines, speed]);
  return <div>{lines.map((line, i) => {
    const visible = i < lineIdx || (i === lineIdx && charIdx > 0);
    const text = i < lineIdx ? line.text : i === lineIdx ? line.text.slice(0, charIdx) : "";
    if (!visible) return null;
    return <div key={i} style={{ marginBottom: 2, opacity: done.includes(i) ? 0.7 : 1 }}>
      <span style={{ color: line.color || t.heroMuted }}>{line.prefix || ""}</span>
      <span style={{ color: line.color || t.heroFg }}>{text}</span>
      {i === lineIdx && charIdx <= line.text.length && <span style={{ display: "inline-block", width: 8, height: 16, backgroundColor: t.heroAccent, marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />}
    </div>;
  })}</div>;
}

// --- Container Card ---

function ShowcaseCard({ c }: { c: typeof showcaseContainers[0] }) {
  const [hov, setHov] = useState(false);
  const router = useRouter();
  return (
    <div 
      onClick={() => router.push(`/containers/${c.ns}/${c.id}`)}
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{ 
        border: `1px solid ${hov ? t.border : t.borderSub}`, 
        borderRadius: 12, 
        padding: 24, 
        backgroundColor: t.bg, 
        transition: "all 0.2s", 
        cursor: "pointer",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.08)" : "none",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: mono, fontSize: 13, color: t.fgMuted }}>{c.ns} /</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: t.link, fontWeight: 600 }}>{c.id}</span>
          </div>
          <span style={{ display: "inline-flex", fontSize: 10, fontWeight: 600, color: c.typeColor, backgroundColor: `${c.typeColor}15`, padding: "3px 10px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.type}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: t.green, backgroundColor: t.greenBg, border: `1px solid ${t.greenBor}`, padding: "4px 10px", borderRadius: 20 }}><Ic.Shield s={12} /> verified</div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: t.fg }}>{c.name}</h3>
      <p style={{ fontSize: 14, fontWeight: 500, color: c.typeColor, margin: "0 0 12px", fontStyle: "italic" }}>{c.tagline}</p>
      <p style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.7, margin: "0 0 16px" }}>{c.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, backgroundColor: t.canvas, borderRadius: 8, marginBottom: 16 }}>
        {c.capabilities.map((cap: string, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: t.fg }}><span style={{ color: c.typeColor, fontSize: 14 }}>→</span>{cap}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {c.tags.map((tag: string) => <span key={tag} style={{ fontSize: 11, fontFamily: mono, color: t.fgMuted, backgroundColor: t.bg, padding: "4px 10px", borderRadius: 6, border: `1px solid ${t.borderSub}` }}>{tag}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${t.borderSub}`, fontSize: 12, color: t.fgMuted }}>
        <span><strong style={{ color: t.fg, fontFamily: mono }}>{c.atoms.toLocaleString()}</strong> atoms</span>
        <span>Trust: <strong style={{ color: t.green, fontFamily: mono }}>{c.trust}%</strong></span>
        <span><strong style={{ color: t.fg }}>{c.sources}</strong> sources</span>
      </div>
    </div>
  );
}

function ContainerCard({ ns, id, name, desc, atoms, trust, chain, tags, updated }: { ns: string; id: string; name: string; desc: string; atoms: number; trust: number; chain?: boolean; tags: string[]; updated: string }) {
  const [hov, setHov] = useState(false);
  const trustColor = trust >= 90 ? t.green : trust >= 70 ? t.amber : t.red;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ border: `1px solid ${hov ? t.border : t.borderSub}`, borderRadius: 8, padding: 20, backgroundColor: t.bg, transition: "all 0.15s", cursor: "pointer", boxShadow: hov ? "0 3px 12px rgba(0,0,0,0.04)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 14 }}><span style={{ color: t.fgMuted }}>{ns} / </span><span style={{ color: t.link, fontWeight: 600 }}>{id}</span></span>
        {chain && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "0 6px", fontSize: 11, fontFamily: mono, lineHeight: "18px", borderRadius: 12, backgroundColor: t.greenBg, border: `1px solid ${t.greenBor}`, color: t.green }}><Ic.Shield s={10} /> verified</span>}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: t.fg, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5, marginBottom: 12, minHeight: 40 }}>{desc}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {tags.map(tg => <span key={tg} style={{ padding: "0 8px", fontSize: 11, fontFamily: mono, lineHeight: "22px", borderRadius: 12, backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, color: t.link }}>{tg}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: t.fgMuted }}>
        <span><strong style={{ color: t.fg }}>{atoms}</strong> atoms</span>
        <span>Trust: <span style={{ fontFamily: mono, fontWeight: 600, color: trustColor }}>{trust}%</span></span>
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: t.fgSubtle }}>{updated}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function GitChainHome() {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const copyCmd = () => { navigator.clipboard?.writeText("npm install -g @gitchain/cli"); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, color: t.fg, fontFamily: sans, fontSize: 14 }}>
      <style>{`
        @keyframes blink { 50% { opacity: 0 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        .fade-up { animation: fadeUp 0.6s ease-out both }
        .fade-d1 { animation-delay: 0.1s }
        .fade-d2 { animation-delay: 0.2s }
        .fade-d3 { animation-delay: 0.3s }
        .fade-d4 { animation-delay: 0.4s }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "transparent" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.heroFg }}>
            <Ic.Chain s={22} c={t.heroFg} />
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>GitChain</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="/explore" style={{ color: t.heroMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Explore</a>
            <a href="/docs" style={{ color: t.heroMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Docs</a>
            <a href="/inject" style={{ color: t.heroMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Inject API</a>
            <a href="https://github.com/C-0711/0711-gitchain" target="_blank" rel="noopener" style={{ color: t.heroMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>GitHub</a>
            <a href="/auth/login" style={{ color: t.heroMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign in</a>
            <a href="/auth/register" style={{ backgroundColor: t.heroAccent, color: "#fff", textDecoration: "none", padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Get started</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: t.heroBg, color: t.heroFg, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `linear-gradient(${t.heroFg} 1px, transparent 1px), linear-gradient(90deg, ${t.heroFg} 1px, transparent 1px)`, backgroundSize: "64px 64px" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 32px 60px", position: "relative" }}>
          <div style={{ display: "flex", gap: 64, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Left column */}
            <div style={{ flex: 1, minWidth: 320, maxWidth: 560 }}>
              <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px 4px 6px", borderRadius: 24, border: `1px solid ${t.heroBorder}`, backgroundColor: "rgba(63,185,80,0.1)", fontSize: 12, color: t.heroAccent, marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: t.heroAccent, animation: "pulse 2s ease-in-out infinite" }} />
                Base Mainnet — Live on-chain verification
              </div>
              <h1 className="fade-up fade-d1" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px", background: `linear-gradient(135deg, ${t.heroFg} 0%, ${t.heroMuted} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Verified context<br />for AI systems
              </h1>
              <p className="fade-up fade-d2" style={{ fontSize: 18, color: t.heroMuted, lineHeight: 1.6, margin: "0 0 32px", maxWidth: 480 }}>
                Version, verify, and inject structured data into AI workflows. Every fact traceable to its source. Every change anchored on-chain.
              </p>
              <div className="fade-up fade-d3" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <button onClick={() => router.push("/auth/register")} style={{ backgroundColor: t.heroAccent, color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>Get started free <Ic.ChevR s={14} /></button>
                <button onClick={() => router.push("/docs")} style={{ backgroundColor: "transparent", color: t.heroFg, border: `1px solid ${t.heroBorder}`, borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><Ic.File s={14} /> Read the docs</button>
              </div>
              <div className="fade-up fade-d4" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 12px 8px 16px", backgroundColor: "rgba(110,118,129,0.1)", border: `1px solid ${t.heroBorder}`, borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 13, color: t.heroMuted }}><span style={{ color: t.heroAccent }}>$</span> npm install -g @gitchain/cli</span>
                <button onClick={copyCmd} style={{ background: "none", border: `1px solid ${t.heroBorder}`, borderRadius: 4, padding: "3px 6px", cursor: "pointer", color: t.heroMuted, display: "flex", alignItems: "center" }}>{copied ? <Ic.Check s={14} /> : <Ic.Copy s={14} />}</button>
              </div>
            </div>

            {/* Right column — Terminal */}
            <div className="fade-up fade-d3" style={{ flex: 1, minWidth: 320, maxWidth: 540 }}>
              <div style={{ backgroundColor: "#161b22", border: `1px solid ${t.heroBorder}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                <div style={{ padding: "10px 16px", backgroundColor: "#0d1117", borderBottom: `1px solid ${t.heroBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#febc2e" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28c840" }} />
                  </div>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: t.heroMuted, fontFamily: mono }}>gitchain — zsh</span>
                </div>
                <div style={{ padding: "20px 20px 24px", fontFamily: mono, fontSize: 13, lineHeight: 1.8 }}>
                  <TypedText speed={25} lines={[
                    { prefix: "$ ", text: "gitchain pull bosch:product:BCS-VT-36:v2", color: t.heroFg },
                    { text: "Pulling container bosch:product:BCS-VT-36:v2...", color: t.heroMuted },
                    { text: " 36 atoms | 17 media refs | trust 92%", color: t.heroMuted },
                    { text: " chain: Base #14,892,331 ✓ verified", color: t.heroAccent },
                    { text: "", color: t.heroMuted },
                    { prefix: "$ ", text: "gitchain inject --format openai ./context.json", color: t.heroFg },
                    { text: "Injecting 36 atoms into AI context...", color: t.heroMuted },
                    { text: " ✓ 36 facts with source citations", color: t.heroAccent },
                    { text: " ✓ Merkle proof attached", color: t.heroAccent },
                    { text: " ✓ Ready for LLM consumption", color: t.heroAccent },
                  ]} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 80, background: `linear-gradient(${t.heroBg}, ${t.bg})` }} />
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 32 }}>
          {[
            { label: "Containers", val: 23141, icon: <Ic.Layers s={18} /> },
            { label: "Atoms verified", val: 847392, icon: <Ic.Shield s={18} /> },
            { label: "Chain anchors", val: 12847, icon: <Ic.Commit s={18} /> },
            { label: "AI injections", val: 394210, icon: <Ic.Zap s={18} /> },
            { label: "Namespaces", val: 1284, icon: <Ic.Globe s={18} /> },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: t.fgSubtle, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: mono, color: t.fg, letterSpacing: "-0.03em" }}><Counter end={s.val} /></div>
              <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "72px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Git for knowledge. Chain for proof.</h2>
          <p style={{ fontSize: 16, color: t.fgMuted, maxWidth: 560, margin: "0 auto" }}>Three primitives that make AI context trustworthy, traceable, and tamper-proof.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Containerize", desc: "Package structured data into versioned containers. Each field becomes an atom with provenance metadata, trust scores, and source attribution.", icon: <Ic.Layers s={24} />, code: `gitchain init product/widget-x1\ngitchain add specs.json --source "erp"\ngitchain commit -m "Import from ERP"`, color: t.green },
            { step: "02", title: "Verify", desc: "Every commit produces a Merkle root anchored on Base Mainnet. Immutable proof that your data existed unchanged.", icon: <Ic.Shield s={24} />, code: `gitchain verify bosch:product:BCS-VT-36\n\n✓ 36 atoms verified\n✓ Chain: Base #14,892,331\n✓ Merkle: QmYw...8b2c`, color: t.purple },
            { step: "03", title: "Inject", desc: "Feed verified context to any AI model. Each fact carries its citation, trust score, and blockchain proof.", icon: <Ic.Zap s={24} />, code: `import { GitChain } from '@gitchain/sdk';\n\nconst ctx = await gc.inject(\n 'bosch:product:BCS-VT-36',\n { format: 'openai' }\n);`, color: t.link },
          ].map(item => (
            <div key={item.step} style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px 24px 20px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, backgroundColor: `${item.color}12`, color: item.color, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: t.fgSubtle, marginBottom: 4 }}>Step {item.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: t.fgMuted, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
              <div style={{ marginTop: "auto", borderTop: `1px solid ${t.borderSub}`, backgroundColor: t.canvas, padding: 16 }}>
                <pre style={{ margin: 0, fontFamily: mono, fontSize: 12, lineHeight: 1.6, color: t.fg, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{item.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPLORE CONTAINERS ── */}
      {/* ── STRATEGIC SHOWCASE ── */}
      <section style={{ padding: "80px 32px", backgroundColor: t.canvas, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Verified context for any domain</h2>
            <p style={{ fontSize: 16, color: t.fgMuted, maxWidth: 640, margin: "0 auto" }}>From product specs to classified defense projects. Every fact traceable. Every access audited.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24 }}>
            {showcaseContainers.map(c => <ShowcaseCard key={c.id} c={c} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={() => router.push("/explore")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, border: `1px solid ${t.border}`, borderRadius: 8, background: t.bg, color: t.fg, cursor: "pointer" }}>Explore all containers <Ic.ChevR s={14} /></button>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "72px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Built for enterprise AI infrastructure</h2>
          <p style={{ fontSize: 16, color: t.fgMuted, maxWidth: 560, margin: "0 auto" }}>Everything your team needs to make AI knowledge trustworthy at scale.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { icon: <Ic.Commit s={20} />, title: "Version Control", desc: "Full Git-style versioning for structured data. Branch, diff, and merge with complete audit trails." },
            { icon: <Ic.Shield s={20} />, title: "Blockchain Anchoring", desc: "Every commit cryptographically anchored on Base Mainnet. Tamper-proof, immutable proof of data provenance." },
            { icon: <Ic.Zap s={20} />, title: "AI Injection API", desc: "One-line integration with OpenAI, Anthropic, LangChain, and LlamaIndex." },
            { icon: <Ic.Lock s={20} />, title: "Trust Scoring", desc: "Per-atom trust scores based on source authority, verification status, and freshness." },
            { icon: <Ic.PR s={20} />, title: "Collaborative Updates", desc: "Pull request workflow for data changes. Review, approve, and merge from multiple contributors." },
            { icon: <Ic.Globe s={20} />, title: "EU DPP Ready", desc: "Digital Product Passport compliant out of the box. C2PA provenance headers included." },
          ].map(f => (
            <div key={f.title} style={{ padding: 24, borderRadius: 10, border: `1px solid ${t.borderSub}` }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, backgroundColor: t.canvas, border: `1px solid ${t.borderSub}`, color: t.fg, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: t.heroBg, color: t.heroFg, borderTop: `1px solid ${t.heroBorder}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px" }}>Start building with verified AI context</h2>
          <p style={{ fontSize: 17, color: t.heroMuted, margin: "0 0 32px", lineHeight: 1.6 }}>Free for open containers. Enterprise plans for private namespaces, SLA, and dedicated support.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/register")} style={{ backgroundColor: t.heroAccent, color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>Create free account <Ic.ChevR s={14} /></button>
            <button style={{ backgroundColor: "transparent", color: t.heroFg, border: `1px solid ${t.heroBorder}`, borderRadius: 8, padding: "14px 28px", fontSize: 16, fontWeight: 500, cursor: "pointer" }}>Contact sales</button>
          </div>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 32, fontSize: 13, color: t.heroMuted, flexWrap: "wrap" }}>
            {["No credit card required", "Free for open containers", "SOC 2 Type II"].map(x => (
              <span key={x} style={{ display: "flex", alignItems: "center", gap: 6 }}><Ic.Check s={14} />{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: t.heroBg, color: t.heroMuted, borderTop: `1px solid ${t.heroBorder}`, padding: "48px 32px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr)", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ic.Chain s={20} c={t.heroAccent} />
                <span style={{ fontWeight: 700, fontSize: 16, color: t.heroFg }}>GitChain</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>Verified context infrastructure for enterprise AI.</p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontFamily: mono, backgroundColor: "rgba(63,185,80,0.12)", border: "1px solid rgba(63,185,80,0.2)", color: t.heroAccent }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: t.heroAccent }} /> All systems operational
                </span>
              </div>
            </div>
            {[
              { title: "Product", links: ["Containers", "Namespaces", "Inject API", "Verify", "Pricing"] },
              { title: "Developers", links: ["Documentation", "CLI Reference", "SDK (npm)", "API Reference"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Security"] },
              { title: "Resources", links: ["Community", "Status", "Support", "EU DPP Guide"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 600, fontSize: 13, color: t.heroFg, marginBottom: 12 }}>{col.title}</div>
                {col.links.map(link => (<a key={link} href="#" style={{ display: "block", fontSize: 13, color: t.heroMuted, textDecoration: "none", padding: "3px 0" }}>{link}</a>))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${t.heroBorder}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: t.heroMuted, flexWrap: "wrap", gap: 16 }}>
            <span>© 2026 GitChain. Anchored on Base Mainnet.</span>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontFamily: mono, fontSize: 11 }}>0xAd31...aEc7</span>
              <a href="https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7" target="_blank" rel="noopener" style={{ color: t.heroLink, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>Basescan <Ic.Ext s={12} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
