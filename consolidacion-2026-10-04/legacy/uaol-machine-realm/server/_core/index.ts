import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { subscribeOperationalEvents } from "../realtime";
import { leaseGatewayCommand, receiveGatewayHeartbeat, reportGatewayCommandResult } from "../operations";

const gatewayRateWindows = new Map<string, { count: number; resetAt: number }>();

function acceptsGatewayRequest(gatewayKey: string) {
  const now = Date.now();
  const current = gatewayRateWindows.get(gatewayKey);
  if (!current || current.resetAt <= now) {
    gatewayRateWindows.set(gatewayKey, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 120) return false;
  current.count += 1;
  return true;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/stream/operational", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      const unsubscribe = subscribeOperationalEvents(user.id, res);
      const keepAlive = setInterval(() => res.write(": keepalive\n\n"), 25_000);
      req.on("close", () => { clearInterval(keepAlive); unsubscribe(); });
    } catch {
      res.status(401).json({ error: "authentication_required" });
    }
  });
  app.post("/api/gateway/heartbeat", async (req, res) => {
    const gatewayKey = req.header("X-Gateway-Id") ?? "";
    const authorization = req.header("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const status = req.body?.status;
    if (!gatewayKey || !token || !["online", "offline", "degraded"].includes(status)) return res.status(400).json({ error: "invalid_gateway_heartbeat" });
    if (!acceptsGatewayRequest(gatewayKey)) return res.status(429).json({ error: "gateway_rate_limited" });
    try {
      const result = await receiveGatewayHeartbeat({ gatewayKey, token, status, latencyMs: Number(req.body?.latencyMs ?? 0), metadata: { adapterKind: req.body?.adapterKind, machineMode: req.body?.machineMode, version: req.body?.version } });
      return res.json(result);
    } catch (error) {
      return res.status(401).json({ error: "gateway_unauthorized", detail: error instanceof Error ? error.message : "unknown_error" });
    }
  });
  app.post("/api/gateway/commands/pull", async (req, res) => {
    const gatewayKey = req.header("X-Gateway-Id") ?? "";
    const authorization = req.header("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!gatewayKey || !token) return res.status(400).json({ error: "invalid_gateway_request" });
    if (!acceptsGatewayRequest(gatewayKey)) return res.status(429).json({ error: "gateway_rate_limited" });
    try {
      return res.json(await leaseGatewayCommand({ gatewayKey, token }));
    } catch (error) {
      return res.status(401).json({ error: "gateway_unauthorized", detail: error instanceof Error ? error.message : "unknown_error" });
    }
  });
  app.post("/api/gateway/commands/result", async (req, res) => {
    const gatewayKey = req.header("X-Gateway-Id") ?? "";
    const authorization = req.header("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const { commandId, accepted, nextState, message, telemetry } = req.body ?? {};
    if (!gatewayKey || !token || typeof commandId !== "string" || typeof accepted !== "boolean" || typeof message !== "string") return res.status(400).json({ error: "invalid_gateway_result" });
    if (!acceptsGatewayRequest(gatewayKey)) return res.status(429).json({ error: "gateway_rate_limited" });
    try {
      return res.json(await reportGatewayCommandResult({ gatewayKey, token, commandId, accepted, nextState, message, telemetry }));
    } catch (error) {
      return res.status(401).json({ error: "gateway_unauthorized", detail: error instanceof Error ? error.message : "unknown_error" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
