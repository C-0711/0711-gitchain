// 0711 Studio C2PA Service (Python Bridge)
// Uses c2pa-python via subprocess for EU AI Act compliance

import { spawn } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { randomUUID } from "crypto";
import os from "os";
import { fileURLToPath } from "url";

// ============================================
// TYPES
// ============================================

export interface C2PASignRequest {
  imageBuffer: Buffer;
  mimeType: string;
  prompt?: string;
  modelId?: string;
  contentHash?: string;
  blockchainRef?: {
    network: string;
    contractAddress: string;
    batchId?: number;
    txHash?: string;
  };
  compliance?: {
    ecgt?: { passed: boolean; score: number };
    pii?: { passed: boolean; score: number };
    brand?: { passed: boolean; score: number };
  };
}

export interface C2PASignResponse {
  success: boolean;
  signedImageBuffer?: Buffer;
  manifestId?: string;
  error?: string;
}

export interface C2PAVerifyResponse {
  success: boolean;
  valid: boolean;
  hasC2PA: boolean;
  manifest?: {
    claimGenerator: string;
    title?: string;
    assertions: string[];
  };
  compliance?: any;
  aiGenerated: boolean;
  error?: string;
}

// ============================================
// PATHS
// ============================================

// Python scripts location
const SCRIPTS_DIR = join(process.cwd(), "src/lib/c2pa/scripts");
const SIGN_SCRIPT = join(SCRIPTS_DIR, "sign.py");
const VERIFY_SCRIPT = join(SCRIPTS_DIR, "verify.py");

const TEMP_DIR = join(os.tmpdir(), "c2pa-0711");

function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function runPythonScript(scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", [scriptPath, ...args]);
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });
    
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// ============================================
// C2PA FUNCTIONS
// ============================================

export async function signImage(request: C2PASignRequest): Promise<C2PASignResponse> {
  try {
    ensureTempDir();
    
    const id = randomUUID();
    const ext = request.mimeType.includes("png") ? "png" : "jpg";
    const inputPath = join(TEMP_DIR, `input_${id}.${ext}`);
    const outputPath = join(TEMP_DIR, `output_${id}.${ext}`);
    const metadataPath = join(TEMP_DIR, `metadata_${id}.json`);
    
    // Write input image
    writeFileSync(inputPath, request.imageBuffer);
    
    // Write metadata
    writeFileSync(metadataPath, JSON.stringify({
      prompt: request.prompt,
      modelId: request.modelId,
      contentHash: request.contentHash,
      blockchainRef: request.blockchainRef,
      compliance: request.compliance,
    }));
    
    // Run Python signing script
    const result = await runPythonScript(SIGN_SCRIPT, [inputPath, outputPath, metadataPath]);
    const parsed = JSON.parse(result);
    
    if (!parsed.success) {
      try { unlinkSync(inputPath); } catch {}
      try { unlinkSync(metadataPath); } catch {}
      return { success: false, error: parsed.error };
    }
    
    // Read signed output
    const signedBuffer = readFileSync(outputPath);
    
    // Cleanup
    try { unlinkSync(inputPath); } catch {}
    try { unlinkSync(outputPath); } catch {}
    try { unlinkSync(metadataPath); } catch {}
    
    return {
      success: true,
      signedImageBuffer: signedBuffer,
      manifestId: parsed.manifestId,
    };
    
  } catch (error) {
    console.error("[C2PA] Sign error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "C2PA signing failed",
    };
  }
}

export async function verifyImage(imageBuffer: Buffer, mimeType: string): Promise<C2PAVerifyResponse> {
  try {
    ensureTempDir();
    
    const id = randomUUID();
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const inputPath = join(TEMP_DIR, `verify_${id}.${ext}`);
    
    // Write image
    writeFileSync(inputPath, imageBuffer);
    
    // Run Python verification script
    const result = await runPythonScript(VERIFY_SCRIPT, [inputPath]);
    const parsed = JSON.parse(result);
    
    // Cleanup
    try { unlinkSync(inputPath); } catch {}
    
    return parsed;
    
  } catch (error) {
    console.error("[C2PA] Verify error:", error);
    return {
      success: false,
      valid: false,
      hasC2PA: false,
      aiGenerated: false,
      error: error instanceof Error ? error.message : "C2PA verification failed",
    };
  }
}

export async function isC2PAAvailable(): Promise<boolean> {
  try {
    const proc = spawn("python3", ["-c", "import c2pa; print('ok')"]); 
    return new Promise((resolve) => {
      let out = "";
      proc.stdout.on("data", (d) => out += d.toString());
      proc.on("close", (code) => resolve(code === 0 && out.trim() === "ok"));
      proc.on("error", () => resolve(false));
    });
  } catch {
    return false;
  }
}
