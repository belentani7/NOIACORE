type RpcOutcome = "ok" | "error";

type RpcLog = {
  traceId: string;
  path: string;
  type: string;
  organizationId: number;
  enterpriseRole: string;
  durationMs: number;
  outcome: RpcOutcome;
  errorCode?: string;
};

export function logControlPlaneRpc(entry: RpcLog) {
  const payload = {
    service: "forja-control-plane",
    event: "rpc_complete",
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const line = `[FORJA_CONTROL_PLANE] ${JSON.stringify(payload)}`;
  if (entry.outcome === "error") console.warn(line);
  else console.info(line);
}
