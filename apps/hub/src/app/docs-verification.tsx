import Link from "next/link";

export default function VerificationPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-600 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">How Verification Works</h1>
        <p className="text-gray-600">
          GitChain uses blockchain anchoring and Merkle proofs to verify data integrity.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Triple Verification</h2>
          <p className="text-gray-600 mb-6">
            Every container in GitChain is verified through three independent mechanisms:
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-6">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold mb-2">1. Git Commit Hash</h3>
              <p className="text-sm text-gray-600">
                Every version has a unique SHA hash, just like Git commits.
                Any change creates a new hash.
              </p>
            </div>
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-6">
              <div className="text-3xl mb-3">🌳</div>
              <h3 className="font-semibold mb-2">2. Merkle Proof</h3>
              <p className="text-sm text-gray-600">
                Containers are grouped into Merkle trees. Each container
                can prove inclusion without revealing other data.
              </p>
            </div>
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-6">
              <div className="text-3xl mb-3">⛓️</div>
              <h3 className="font-semibold mb-2">3. Blockchain TX</h3>
              <p className="text-sm text-gray-600">
                Merkle roots are anchored on Base Mainnet. Immutable,
                timestamped, publicly verifiable.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Verification Flow</h2>
          <div className="bg-white rounded-lg p-6">
            <pre className="text-sm text-gray-600">{`Container Data
      ↓
┌─────────────────┐
│ Content Hash    │ ← SHA-256 of container data
└────────┬────────┘
         ↓
┌─────────────────┐
│ Merkle Tree     │ ← Batched with other containers
└────────┬────────┘
         ↓
┌─────────────────┐
│ Merkle Root     │ ← Single hash representing batch
└────────┬────────┘
         ↓
┌─────────────────┐
│ Base Mainnet TX │ ← Permanently recorded on blockchain
└─────────────────┘`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Verifying a Container</h2>
          
          <h3 className="font-semibold mt-4 mb-2">Using the API</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const verification = await client.verify("0711:product:acme:widget-001:v1");

// Response
{
  "verified": true,
  "container": {
    "id": "0711:product:acme:widget-001:v1",
    "contentHash": "0x7f3a5b2c..."
  },
  "chain": {
    "network": "base-mainnet",
    "batchId": 42,
    "txHash": "0xa1b2c3d4...",
    "blockNumber": 18234567,
    "timestamp": "2026-02-22T12:00:00Z"
  },
  "merkle": {
    "root": "0x8a9b0c1d...",
    "proof": ["0x...", "0x...", "0x..."],
    "index": 7
  }
}`}</code></pre>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Manual Verification</h3>
          <p className="text-gray-600 mb-4">
            You can independently verify any container by:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Computing the content hash from the container data</li>
            <li>Verifying the Merkle proof leads to the root</li>
            <li>Checking the root exists in the blockchain transaction</li>
            <li>Confirming the transaction on <a href="https://basescan.org" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">Basescan</a></li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Smart Contract</h2>
          <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-4">
              The GitChain smart contract is deployed on Base Mainnet:
            </p>
            <div className="font-mono text-emerald-600 text-sm break-all mb-4">
              0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
            </div>
            <a 
              href="https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7"
              target="_blank"
              rel="noopener"
              className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
            >
              View on Basescan →
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Why Blockchain?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Immutability</h3>
              <p className="text-sm text-gray-600">
                Once anchored, data cannot be altered without detection.
                The blockchain provides a tamper-proof timestamp.
              </p>
            </div>
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Decentralization</h3>
              <p className="text-sm text-gray-600">
                Verification doesn&apos;t rely on a single authority.
                Anyone can verify proofs independently.
              </p>
            </div>
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Transparency</h3>
              <p className="text-sm text-gray-600">
                All anchoring transactions are public.
                Full audit trail available to everyone.
              </p>
            </div>
            <div className="bg-gray-50/50 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Trust</h3>
              <p className="text-sm text-gray-600">
                AI agents can trust verified data.
                No more hallucination about facts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
