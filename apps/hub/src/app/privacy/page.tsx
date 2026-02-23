export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-400 mb-8">Last updated: February 22, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-400">
            0711 Intelligence (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates GitChain (gitchain.0711.io). 
            This page informs you of our policies regarding the collection, use, and disclosure 
            of personal data when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Data We Collect</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li><strong>Account Data:</strong> Email address, name, and organization when you register</li>
            <li><strong>Container Data:</strong> Data you upload to containers (you control visibility)</li>
            <li><strong>Usage Data:</strong> API calls, page views, and feature usage for analytics</li>
            <li><strong>Blockchain Data:</strong> Transaction hashes and Merkle proofs (public by design)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>To provide and maintain the GitChain service</li>
            <li>To verify container integrity via blockchain</li>
            <li>To send service-related notifications</li>
            <li>To improve our service through analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Blockchain & Public Data</h2>
          <p className="text-gray-400">
            GitChain anchors container hashes on Base Mainnet (Ethereum L2). This data is:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2 mt-2">
            <li>Public and immutable by design</li>
            <li>Contains only cryptographic hashes, not actual content</li>
            <li>Cannot be deleted once recorded (blockchain immutability)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
          <p className="text-gray-400">
            We retain your data as long as your account is active. You may request deletion 
            of your account data at any time. Note that blockchain records cannot be deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion (except blockchain records)</li>
            <li>Export your data</li>
            <li>Object to processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
          <p className="text-gray-400">
            For privacy inquiries, contact us at: <a href="mailto:privacy@0711.io" className="text-emerald-400 hover:underline">privacy@0711.io</a>
          </p>
        </section>
      </div>
    </div>
  );
}
