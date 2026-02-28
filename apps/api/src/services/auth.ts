/**
 * GitChain Auth Service
 * 
 * Handles user authentication, API keys, and sessions.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===========================================
// TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: Date;
  last_used_at: Date | null;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: Date;
}

export interface AuthResult {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface ApiKeyResult {
  apiKey: ApiKey;
  fullKey: string; // Only returned once on creation
}

// ===========================================
// CONFIG
// ===========================================

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      throw new Error(
        "SECURITY ERROR: JWT_SECRET environment variable is required in production. " +
          "Never use fallback values for secrets."
      );
    }
    console.warn(
      "WARNING: JWT_SECRET not set. Using development-only secret. " +
        "This MUST be set in production."
    );
    return "gitchain-dev-only-not-for-production";
  }
  return secret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 12;
const API_KEY_PREFIX = "gc_live_";
const API_KEY_LENGTH = 32;

// ===========================================
// PASSWORD HASHING
// ===========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===========================================
// JWT TOKENS
// ===========================================

export function generateToken(userId: string): { token: string; expiresAt: Date } {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  const token = jwt.sign({ sub: userId }, getJwtSecret(), options);
  
  // Calculate expiry date
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);
  
  return { token, expiresAt };
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { sub: string };
    return { userId: decoded.sub };
  } catch {
    return null;
  }
}

// ===========================================
// API KEYS
// ===========================================

export function generateApiKey(): { fullKey: string; keyHash: string; keyPrefix: string } {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const randomPart = randomBytes.toString("base64url").slice(0, API_KEY_LENGTH);
  
  // Full key format: gc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  
  // Hash for storage
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  
  // Prefix for display (first 12 chars)
  const keyPrefix = fullKey.slice(0, 12);
  
  return { fullKey, keyHash, keyPrefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_PREFIX.length + API_KEY_LENGTH;
}

// ===========================================
// SESSION TOKENS
// ===========================================

export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ===========================================
// AUTH SERVICE CLASS
// ===========================================

interface DatabaseConnector {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  insert<T>(table: string, data: Record<string, unknown>): Promise<T>;
  execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }>;
}

export class AuthService {
  constructor(private db: DatabaseConnector) {}

  // ===========================================
  // USER REGISTRATION & LOGIN
  // ===========================================

  async register(email: string, password: string, name?: string): Promise<AuthResult> {
    // Check if user exists
    const existing = await this.db.queryOne<User>(
      "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email.toLowerCase()]
    );

    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate username from email
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

    // Create user
    const user = await this.db.insert<User>("users", {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name || null,
      username,
    });

    // Generate token
    const { token, expiresAt } = generateToken(user.id);

    return { user, token, expiresAt };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await this.db.queryOne<User & { password_hash: string }>(
      "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email.toLowerCase()]
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await this.db.execute(
      "UPDATE users SET last_login_at = NOW() WHERE id = $1",
      [user.id]
    );

    // Generate token
    const { token, expiresAt } = generateToken(user.id);

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token, expiresAt };
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.db.queryOne<User>(
      "SELECT id, email, name, username, avatar_url, bio, company, location, website, email_verified, created_at FROM users WHERE id = $1 AND deleted_at IS NULL",
      [userId]
    );
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.queryOne<User>(
      "SELECT id, email, name, username, avatar_url, bio, company, location, website, email_verified, created_at FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email.toLowerCase()]
    );
  }

  // ===========================================
  // API KEYS
  // ===========================================

  async createApiKey(userId: string, name: string, scopes: string[] = ["read", "write"]): Promise<ApiKeyResult> {
    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    const apiKey = await this.db.insert<ApiKey>("api_keys", {
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: JSON.stringify(scopes),
    });

    return { apiKey, fullKey };
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return this.db.query<ApiKey>(
      "SELECT id, user_id, name, key_prefix, scopes, created_at, last_used_at FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC",
      [userId]
    );
  }

  async validateApiKey(key: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    if (!isValidApiKeyFormat(key)) {
      return null;
    }

    const keyHash = hashApiKey(key);

    const result = await this.db.queryOne<ApiKey & { user_id: string }>(
      `SELECT ak.*, u.id as uid, u.email, u.name, u.username 
       FROM api_keys ak 
       JOIN users u ON ak.user_id = u.id 
       WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL AND u.deleted_at IS NULL`,
      [keyHash]
    );

    if (!result) {
      return null;
    }

    // Update last used
    await this.db.execute(
      "UPDATE api_keys SET last_used_at = NOW() WHERE id = $1",
      [result.id]
    );

    const user = await this.getUserById(result.user_id);
    if (!user) {
      return null;
    }

    return { user, apiKey: result };
  }

  async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    const result = await this.db.execute(
      "UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
      [keyId, userId]
    );
    return result.rowCount > 0;
  }

  // ===========================================
  // SESSIONS
  // ===========================================

  async createSession(userId: string, ip?: string, userAgent?: string): Promise<{ session: Session; token: string }> {
    const { token, tokenHash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.db.insert<Session>("sessions", {
      user_id: userId,
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    return { session, token };
  }

  async validateSession(token: string): Promise<User | null> {
    const tokenHash = hashSessionToken(token);

    const session = await this.db.queryOne<Session>(
      "SELECT * FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()",
      [tokenHash]
    );

    if (!session) {
      return null;
    }

    return this.getUserById(session.user_id);
  }

  async revokeSession(token: string): Promise<boolean> {
    const tokenHash = hashSessionToken(token);
    const result = await this.db.execute(
      "UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1",
      [tokenHash]
    );
    return result.rowCount > 0;
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.db.execute(
      "UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );
    return result.rowCount;
  }
}
