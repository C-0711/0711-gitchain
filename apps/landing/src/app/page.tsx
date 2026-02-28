"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xl font-bold">GitChain</span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="https://github.com/C-0711/0711-gitchain"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
            >
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Anchored on Base Mainnet
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Verified Context
              <br />
              <span className="text-emerald-400">for AI Agents</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              No hallucination. Full audit trail. Every fact traceable to its source and verified
              on blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg transition-colors"
              >
                Start Free
              </Link>
              <Link
                href="/docs"
                className="px-8 py-4 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold text-lg transition-colors"
              >
                Documentation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100K+", label: "Containers" },
              { value: "<100ms", label: "Latency" },
              { value: "100%", label: "Verified" },
              { value: "24/7", label: "Uptime" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">One API. Zero Hallucination.</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Inject verified product data, knowledge bases, and context into any AI agent with a
            single function call.
          </p>
          <pre className="bg-gray-900 rounded-xl p-6 overflow-x-auto border border-gray-800">
            <code className="text-sm">
              <span className="text-gray-500">// Inject verified context into your AI agent</span>
              {"\n"}
              <span className="text-purple-400">import</span> {"{"} inject {"}"}{" "}
              <span className="text-purple-400">from</span>{" "}
              <span className="text-emerald-400">&quot;@0711/inject&quot;</span>;{"\n\n"}
              <span className="text-purple-400">const</span> context ={" "}
              <span className="text-purple-400">await</span>{" "}
              <span className="text-blue-400">inject</span>({"{"}
              {"\n"}
              {"  "}containers: [
              <span className="text-emerald-400">&quot;0711:product:bosch:7736606982:v3&quot;</span>
              ],{"\n"}
              {"  "}verify: <span className="text-orange-400">true</span>,{"\n"}
              {"  "}format: <span className="text-emerald-400">&quot;markdown&quot;</span>,{"\n"}
              {"}"});{"\n\n"}
              <span className="text-gray-500">
                // Every fact is verified on Base Mainnet
              </span>
              {"\n"}
              console.<span className="text-blue-400">log</span>(context.verified);{" "}
              <span className="text-gray-500">// true</span>
              {"\n"}
              console.<span className="text-blue-400">log</span>(context.txHash);{"   "}
              <span className="text-gray-500">// &quot;0x7f9e...&quot;</span>
            </code>
          </pre>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Three simple steps to verified AI context
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Container",
                desc: "Upload product specs, knowledge, or any structured data. We version it like Git.",
                icon: "📦",
              },
              {
                step: "02",
                title: "Anchor On-Chain",
                desc: "Every container gets a Merkle root anchored to Base Mainnet. Immutable proof.",
                icon: "⛓️",
              },
              {
                step: "03",
                title: "Inject & Verify",
                desc: "Call inject() in your AI agent. Get verified context with full citation trail.",
                icon: "💉",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-gray-800 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="bg-black border border-gray-800 rounded-xl p-6 pt-12 relative z-10">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why GitChain?</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Built for AI agents that need trustworthy data
          </p>
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
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Use Cases</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Trusted by teams building AI-powered products
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Product Catalogs",
                desc: "Inject verified product specs into shopping assistants. Accurate prices, dimensions, compatibility.",
                tags: ["E-commerce", "Manufacturing", "B2B"],
              },
              {
                title: "Knowledge Bases",
                desc: "Company documentation with audit trail. Every answer cites the source document.",
                tags: ["Support", "Internal Tools", "RAG"],
              },
              {
                title: "Compliance & DPP",
                desc: "EU Digital Product Passport ready. Sustainability data, recyclability, certifications.",
                tags: ["ESPR 2024", "Sustainability", "Regulatory"],
              },
              {
                title: "Marketing Campaigns",
                desc: "Brand guidelines, campaign assets, messaging. Consistent AI-generated content.",
                tags: ["Agencies", "Brand Safety", "Content"],
              },
            ].map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-black border border-gray-800 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-gray-400 mb-4">{useCase.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-12"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to eliminate hallucination?</h2>
            <p className="text-gray-400 mb-8">
              Start injecting verified context into your AI agents today. Free tier available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold text-lg transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/docs" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/api-reference" className="hover:text-white transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-white transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="https://github.com/C-0711/0711-gitchain"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/dpa" className="hover:text-white transition-colors">
                    DPA
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2026 0711 Intelligence. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link
                href="https://github.com/C-0711/0711-gitchain"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </Link>
              <Link
                href="https://twitter.com/0711_ai"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://linkedin.com/company/0711-intelligence"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
