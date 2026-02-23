export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last updated: February 22, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600">
            By accessing GitChain (gitchain.0711.io), you agree to be bound by these Terms of Service. 
            If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-600">
            GitChain provides blockchain-verified context injection for AI agents. The service includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
            <li>Container storage and versioning</li>
            <li>Blockchain anchoring on Base Mainnet</li>
            <li>API access for context injection</li>
            <li>Verification tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>You are responsible for data you upload to containers</li>
            <li>You must not upload illegal, harmful, or infringing content</li>
            <li>You must keep your API keys secure</li>
            <li>You must not attempt to circumvent security measures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
          <p className="text-gray-600">
            You retain ownership of data you upload. By uploading to public containers, 
            you grant others the right to access and inject that data via the API.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Blockchain Immutability</h2>
          <p className="text-gray-600">
            You acknowledge that data anchored on blockchain cannot be deleted or modified. 
            Only cryptographic hashes are stored on-chain, not actual content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. API Usage</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>API access is subject to rate limits</li>
            <li>Abuse may result in suspension</li>
            <li>Commercial use requires appropriate plan</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-600">
            GitChain is provided &quot;as is&quot; without warranties. We are not liable for 
            data loss, service interruptions, or damages arising from use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Termination</h2>
          <p className="text-gray-600">
            We may terminate or suspend access for violations of these terms. 
            You may delete your account at any time via Settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
          <p className="text-gray-600">
            These terms are governed by the laws of Germany. Disputes shall be resolved 
            in the courts of Stuttgart.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
          <p className="text-gray-600">
            Questions? Contact us at: <a href="mailto:legal@0711.io" className="text-emerald-600 hover:underline">legal@0711.io</a>
          </p>
        </section>
      </div>
    </div>
  );
}
