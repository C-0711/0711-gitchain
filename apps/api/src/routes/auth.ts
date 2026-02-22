/**
 * Authentication routes
 */

import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory store (replace with database in production)
const apiKeys = new Map<string, { userId: string; email: string; createdAt: Date }>();
const users = new Map<string, { email: string; passwordHash: string }>();

/**
 * POST /auth/register - Register new user
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    const userId = crypto.randomUUID();

    users.set(email, { email, passwordHash });

    // Generate initial API key
    const apiKey = `gc_live_${crypto.randomBytes(24).toString("hex")}`;
    apiKeys.set(apiKey, { userId, email, createdAt: new Date() });

    res.status(201).json({
      message: "Registration successful",
      userId,
      apiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/login - Login and get API key
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find or create API key
    let existingKey: string | undefined;
    for (const [key, data] of apiKeys) {
      if (data.email === email) {
        existingKey = key;
        break;
      }
    }

    const apiKey = existingKey || `gc_live_${crypto.randomBytes(24).toString("hex")}`;
    if (!existingKey) {
      apiKeys.set(apiKey, { userId: crypto.randomUUID(), email, createdAt: new Date() });
    }

    res.json({ apiKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/api-key - Generate new API key
 */
router.post("/api-key", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentKey = authHeader.slice(7);
    const keyData = apiKeys.get(currentKey);
    if (!keyData) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Revoke old key and create new one
    apiKeys.delete(currentKey);
    const newKey = `gc_live_${crypto.randomBytes(24).toString("hex")}`;
    apiKeys.set(newKey, { ...keyData, createdAt: new Date() });

    res.json({ apiKey: newKey, message: "New API key generated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /auth/me - Get current user info
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const apiKey = authHeader.slice(7);
    const keyData = apiKeys.get(apiKey);
    if (!keyData) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    res.json({
      email: keyData.email,
      userId: keyData.userId,
      apiKeyCreatedAt: keyData.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
