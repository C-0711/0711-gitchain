"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setScanning(true);
        }
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualInput = () => {
    const id = prompt("Enter container ID:");
    if (id) {
      router.push(`/?id=${encodeURIComponent(id)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>

      {error ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleManualInput}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
          >
            Enter ID Manually
          </button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-80 h-80 rounded-lg bg-gray-800"
          />
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg pointer-events-none" />
          {scanning && (
            <p className="text-center text-gray-400 mt-4">
              Point camera at GitChain QR code
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="mt-8 text-gray-400 hover:text-white"
      >
        ← Back to manual verification
      </button>
    </div>
  );
}
