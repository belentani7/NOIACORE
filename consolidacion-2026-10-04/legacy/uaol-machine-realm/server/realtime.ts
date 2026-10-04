import type { Response } from "express";

export type OperationalRealtimeEvent = {
  topic: "gateway" | "machine" | "command" | "telemetry" | "event" | "health";
  payload: Record<string, unknown>;
  emittedAt: string;
};

const subscribers = new Map<number, Set<Response>>();

export function subscribeOperationalEvents(ownerId: number, response: Response) {
  const ownerSubscribers = subscribers.get(ownerId) ?? new Set<Response>();
  ownerSubscribers.add(response);
  subscribers.set(ownerId, ownerSubscribers);
  response.write(`event: ready\ndata: ${JSON.stringify({ emittedAt: new Date().toISOString(), topic: "health", payload: { status: "connected" } })}\n\n`);
  return () => {
    ownerSubscribers.delete(response);
    if (ownerSubscribers.size === 0) subscribers.delete(ownerId);
  };
}

export function publishOperationalEvent(ownerId: number, topic: OperationalRealtimeEvent["topic"], payload: Record<string, unknown>) {
  const event: OperationalRealtimeEvent = { topic, payload, emittedAt: new Date().toISOString() };
  Array.from(subscribers.get(ownerId) ?? []).forEach(response => response.write(`event: operational\ndata: ${JSON.stringify(event)}\n\n`));
}
