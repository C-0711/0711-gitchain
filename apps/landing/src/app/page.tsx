"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-bold text-emerald-400">GitChain</span>
          <div className="flex gap-6 items-center">
            <Link href="/docs" className="text-gray-400 hover:text-white">Docs</Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link>
            <Link href="https://github.com/C-0711/0711-gitchain" className="text-gray-400 hover:text-white">GitHub</Link>
            <Link href="/login" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Verified Context
              <br />
              <span className="text-emerald-400">for AI Agents</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              No hallucination. Full audit trail. Every fact traceable to its source and verified on blockchain.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg"
              >
                Start Free
              </Link>
              <Link
                href="/docs"
                className="px-8 py-4 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold text-lg"
              >
                Documentation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <pre className="bg-black rounded-xl p-6 overflow-x-auto border border-gray-800">
            <code className="text-sm">
              <span className="text-gray-500">// Inject verified context into your AI agent</span>{"\n"}
              <span className="text-purple-400">import</span> {"{"} inject {"}"} <span className="text-purple-400">from</span> <span className="text-emerald-400">"@0711/inject"</span>;{"\n\n"}
              <span className="text-purple-400">const</span> context = <span className="text-purple-400">await</span> <span className="text-blue-400">inject</span>({"{"}{"\n"}
              {"  "}containers: [<span className="text-emerald-400">"0711:product:bosch:7736606982:v3"</span>],{"\n"}
              {"  "}verify: <span className="text-orange-400">true</span>,{"\n"}
              {"  "}format: <span className="text-emerald-400">"markdown"</span>,{"\n"}
              {"}"});{"\n\n"}
              <span className="text-gray-500">// Every fact is verified on Base Mainnet</span>{"\n"}
              console.<span className="text-blue-400">log</span>(context.verified);  <span className="text-gray-500">// true</span>{"\n"}
              console.<span className="text-blue-400">log</span>(context.formatted); <span className="text-gray-500">// LLM-ready markdown</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why GitChain?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔒",
                title: "Blockchain Verified",
                desc: "Every container is anchored to Base Mainnet. Merkle proofs ensure data integrity.",
              },
              {
                icon: "📚",
                title: "Full Citation Trail",
                desc: "Every fact traces back to its source document. No more hallucinated data.",
              },
              {
                icon: "🔀",
                title: "Git Versioning",
                desc: "Complete version history. Diff any two versions. Audit every change.",
              },
              {
                icon: "💉",
                title: "inject() API",
                desc: "One function to get verified context. Works with any LLM or AI agent.",
              },
              {
                icon: "🏷️",
                title: "Universal IDs",
                desc: "Standard format: 0711:type:namespace:id:version. Products, campaigns, knowledge.",
              },
              {
                icon: "⚡",
                title: "Edge-Ready",
                desc: "Redis caching, CDN distribution. Sub-100ms latency worldwide.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to eliminate hallucination?</h2>
          <p className="text-gray-400 mb-8">
            Start injecting verified context into your AI agents today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400">
            © 2026 0711 Intelligence. All rights reserved.
          </div>
          <div className="flex gap-6 text-gray-400">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="https://github.com/C-0711/0711-gitchain" className="hover:text-white">GitHub</Link>
            <Link href="https://twitter.com/0711_ai" className="hover:text-white">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
