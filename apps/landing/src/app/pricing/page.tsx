import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For developers and small projects",
    features: [
      "1,000 containers",
      "10,000 inject calls/month",
      "Community support",
      "Public namespaces",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For growing teams and products",
    features: [
      "100,000 containers",
      "1M inject calls/month",
      "Private namespaces",
      "Priority support",
      "Custom domains",
      "Webhooks",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Unlimited containers",
      "Unlimited inject calls",
      "Dedicated infrastructure",
      "SLA guarantee",
      "On-premise deployment",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-xl text-gray-400">Start free. Scale as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={"rounded-2xl p-8 " + (plan.highlighted
                ? "bg-emerald-900/30 border-2 border-emerald-500"
                : "bg-gray-900/50 border border-gray-800")}
            >
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-400 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={"block text-center py-3 rounded-lg font-semibold " + (plan.highlighted
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-gray-800 hover:bg-gray-700")}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
