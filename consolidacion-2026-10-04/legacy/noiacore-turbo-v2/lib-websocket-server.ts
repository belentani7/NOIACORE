import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export function createWebSocketServer(port: number = 3001) {
  const server = createServer();
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Subscribe to Redis events
  redisSubscriber.subscribe("task:updates", "notifications", (err) => {
    if (err) console.error("Redis subscribe error:", err);
  });

  redisSubscriber.on("message", (channel, message) => {
    const data = JSON.parse(message);

    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (channel === "notifications" || data.userId === client.userId)
      ) {
        client.send(JSON.stringify({ channel, data }));
      }
    });
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: string };
      ws.userId = payload.userId;
      ws.isAlive = true;

      // Heartbeat
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Handle messages
      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "subscribe") {
            await redis.sadd(`subscriptions:${ws.userId}`, message.taskId);
          } else if (message.type === "unsubscribe") {
            await redis.srem(`subscriptions:${ws.userId}`, message.taskId);
          }
        } catch (e) {
          console.error("Message parse error:", e);
        }
      });

      // Send initial connection message
      ws.send(JSON.stringify({ type: "connected", userId: ws.userId }));
    } catch (error) {
      ws.close(4000, "Invalid token");
    }
  });

  // Heartbeat check every 30s
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  server.listen(port, () => {
    console.log(`WebSocket server running on ws://localhost:${port}`);
  });

  return { server, wss };
}

// Publish task update
export async function publishTaskUpdate(userId: string, taskId: string, data: any) {
  await redis.publish("task:updates", JSON.stringify({ userId, taskId, ...data }));
}

// Publish notification
export async function publishNotification(userId: string, message: string, type: string = "info") {
  await redis.publish("notifications", JSON.stringify({ userId, message, type }));
}
