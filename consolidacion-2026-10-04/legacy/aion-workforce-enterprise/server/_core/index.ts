import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite, serveStatic } from "./vite";
import { createContext } from "./context";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { handleStripeWebhook } from "../stripe.webhook";
import { LedgerService } from "../ledger.service";
import { SlidingWindowRateLimiter, logSanitizedError, publicAuditRateLimiter, requestObservability } from "../observability";
import { sdk } from "./sdk";
import { resolveTenantAccess } from "../tenant-context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CLIENT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function resolveAllowedOrigins(): string[] {
  const configured = (process.env.CLIENT_ORIGIN ?? process.env.CLIENT_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_CLIENT_ORIGINS;
}

const trpcRateLimiter = new SlidingWindowRateLimiter(300, 60_000);

function trpcRateLimit(req: Request, res: Response, next: NextFunction) {
  const rate = trpcRateLimiter.consume(req.ip ?? req.socket.remoteAddress ?? "unknown");
  res.setHeader("X-RateLimit-Remaining", String(rate.remaining));
  res.setHeader("X-RateLimit-Limit", "300");
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({ error: "Rate limit exceeded", retryAfterSeconds: rate.retryAfterSeconds });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(requestObservability());
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || resolveAllowedOrigins().includes(origin)),
      credentials: true,
    })
  );
  const server = createServer(app);

  // Stripe requires the raw request bytes for signature verification. Register before express.json().
  app.post(["/api/stripe/webhook", "/api/webhook/stripe"], express.raw({ type: "application/json" }), handleStripeWebhook);

  app.get("/api/audit/verify", async (req, res) => {
    const tenantId = Number(req.query.tenantId);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit ?? 1000)));
    const rateKey = `${req.ip}:${tenantId}`;
    const rate = publicAuditRateLimiter.consume(rateKey);
    res.setHeader("X-RateLimit-Remaining", String(rate.remaining));
    res.setHeader("X-RateLimit-Limit", "60");
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSeconds));
      res.status(429).json({ error: "Audit verification rate limit exceeded", retryAfterSeconds: rate.retryAfterSeconds });
      return;
    }
    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      res.status(400).json({ error: "tenantId must be a positive integer" });
      return;
    }

    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      await resolveTenantAccess(user, tenantId);
    } catch (error) {
      logSanitizedError(error, { operation: "audit.verify.authorize", requestId: String(res.getHeader("x-request-id") ?? "") });
      res.status(403).json({ error: "No access to requested tenant" });
      return;
    }

    try {
      const result = await LedgerService.getPublicAuditChain(tenantId, Number.isFinite(limit) ? limit : 1000);
      res.setHeader("Cache-Control", "private, no-store");
      res.json(result);
    } catch (error) {
      logSanitizedError(error, { operation: "audit.verify", requestId: String(res.getHeader("x-request-id") ?? "") });
      res.status(503).json({ error: "Audit chain unavailable" });
    }
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // tRPC middleware
  app.use(
    "/api/trpc",
    trpcRateLimit,
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path: trpcPath }) => {
        logSanitizedError(error, { operation: `trpc.${trpcPath ?? "unknown"}` });
      },
    })
  );

  // Setup Vite or static serving
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/`);
  });
}

startServer().catch(console.error);
