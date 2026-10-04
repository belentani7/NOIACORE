import { EventEmitter } from "node:events";

const operationsStream = new EventEmitter();
operationsStream.setMaxListeners(100);

export function publishOperationsUpdate(reason: string) {
  operationsStream.emit("update", { reason, at: new Date().toISOString() });
}

export function subscribeOperationsUpdates(listener: (event: { reason: string; at: string }) => void) {
  operationsStream.on("update", listener);
  return () => operationsStream.off("update", listener);
}
