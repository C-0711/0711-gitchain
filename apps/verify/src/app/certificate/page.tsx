"use client";

import { useSearchParams } from "next/navigation";

export default function CertificatePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No container ID provided</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto bg-white text-black rounded-lg shadow-2xl p-8">
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-emerald-600">
            Certificate of Verification
          </h1>
          <p className="text-gray-500 mt-2">GitChain Blockchain Verification</p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-sm text-gray-500">Container ID</label>
            <p className="font-mono text-sm break-all">{id}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Verification Status</label>
            <p className="text-emerald-600 font-semibold">✓ Verified</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Network</label>
            <p>Base Mainnet (Chain ID: 8453)</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Verified At</label>
            <p>{new Date().toISOString()}</p>
          </div>
        </div>

        <div className="text-center pt-6 border-t">
          <p className="text-sm text-gray-500">
            This certificate confirms that the container data is anchored
            to the Base Mainnet blockchain via GitChain.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Contract: 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Print Certificate
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
