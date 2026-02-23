"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";

const t = {
  bg: "#ffffff",
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  green: "#1a7f37",
  greenBg: "#dafbe1",
};

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "For individuals and small projects",
    features: [
      "Unlimited public containers",
      "10 private containers",
      "Basic verification",
      "Community support",
      "API access (100 req/min)",
    ],
    cta: "Get started",
    ctaHref: "/auth/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€29",
    period: "/month",
    description: "For teams and production workloads",
    features: [
      "Unlimited private containers",
      "Priority verification",
      "Team collaboration (5 seats)",
      "Email support",
      "API access (1,000 req/min)",
      "Webhook integrations",
      "Custom namespaces",
    ],
    cta: "Start free trial",
    ctaHref: "/auth/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs",
    features: [
      "Unlimited everything",
      "Dedicated infrastructure",
      "SSO / SAML",
      "Audit logs",
      "SLA guarantee",
      "Dedicated support",
      "On-premise option",
      "Custom integrations",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:enterprise@0711.io",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: t.fg, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 18, color: t.fgMuted, margin: 0, maxWidth: 500, marginInline: "auto" }}>
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: `2px solid ${plan.highlighted ? t.green : t.border}`,
                borderRadius: 12,
                padding: 32,
                backgroundColor: plan.highlighted ? t.greenBg : t.bg,
                position: "relative",
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: t.green,
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  Most popular
                </div>
              )}

              <h2 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: "0 0 8px" }}>{plan.name}</h2>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: t.fg }}>{plan.price}</span>
                <span style={{ fontSize: 16, color: t.fgMuted }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 14, color: t.fgMuted, margin: "0 0 24px" }}>{plan.description}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.green}>
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.042-.018.751.751 0 0 1 .018 1.042L6 13.06l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                    </svg>
                    <span style={{ fontSize: 14, color: t.fg }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px 24px",
                  backgroundColor: plan.highlighted ? t.green : t.bg,
                  color: plan.highlighted ? "#fff" : t.fg,
                  border: `1px solid ${plan.highlighted ? t.green : t.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: t.fg, textAlign: "center", marginBottom: 40 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {[
              { q: "What counts as a container?", a: "A container is a versioned bundle of data (product specs, documents, knowledge). Each container can have unlimited atoms." },
              { q: "Is blockchain verification included?", a: "Yes! All plans include Base Mainnet verification. Pro and Enterprise get priority anchoring." },
              { q: "Can I self-host GitChain?", a: "Enterprise customers can deploy GitChain on their own infrastructure. Contact us for details." },
              { q: "What happens if I exceed limits?", a: "We notify you before limits are reached. Free accounts are rate-limited, not cut off." },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: t.fgMuted, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
