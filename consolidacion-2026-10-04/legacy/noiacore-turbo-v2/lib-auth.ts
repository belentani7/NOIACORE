import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_EXPIRY = "24h";

interface TokenPayload {
  userId: string;
  email: string;
  tier: string;
}

// Rate limiting in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.create({
    data: { email, passwordHash, name, tier: "free" }
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  const token = jwt.sign(
    { userId: user.id, email: user.email, tier: user.tier } as TokenPayload,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return { token, user };
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function rateLimitCheck(userId: string): Promise<boolean> {
  const now = Date.now();
  const key = `ratelimit:${userId}`;
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }

  limit.count++;
  if (limit.count > 100) {
    return true;
  }

  return false;
}

export async function auditLog(
  userId: string,
  action: string,
  resource: string,
  details?: string
) {
  return db.auditLog.create({
    data: {
      userId,
      action,
      resource,
      details,
      ipAddress: "0.0.0.0" // Get from request if needed
    }
  });
}

export async function encryptSecret(secret: string): Promise<string> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32)),
    iv
  );
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export async function decryptSecret(encrypted: string): Promise<string> {
  const [ivHex, encryptedHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32)),
    iv
  );
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function validateApiKey(apiKey: string): Promise<{ userId: string; provider: string } | null> {
  const key = await db.apiKey.findUnique({
    where: { key: apiKey },
    select: { userId: true, provider: true, active: true }
  });

  if (!key || !key.active) return null;
  return { userId: key.userId, provider: key.provider };
}
