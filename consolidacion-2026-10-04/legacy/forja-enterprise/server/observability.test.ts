import { afterEach, describe, expect, it, vi } from "vitest";
import { logControlPlaneRpc } from "./observability";

describe("control-plane observability", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits structured success telemetry without request payloads", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logControlPlaneRpc({ traceId: "trace-success-1234", path: "enterprise.snapshot", type: "query", organizationId: 7, enterpriseRole: "ciso", durationMs: 12, outcome: "ok" });
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain("FORJA_CONTROL_PLANE");
    expect(line).toContain('"event":"rpc_complete"');
    expect(line).toContain('"traceId":"trace-success-1234"');
    expect(line).toContain('"organizationId":7');
    expect(line).toContain('"enterpriseRole":"ciso"');
    expect(line).toContain('"durationMs":12');
    expect(line).not.toContain("payload");
  });

  it("uses warning severity for failed procedure outcomes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logControlPlaneRpc({ traceId: "trace-error-1234", path: "enterprise.createPlugin", type: "mutation", organizationId: 7, enterpriseRole: "junior_dev", durationMs: 4, outcome: "error", errorCode: "FORBIDDEN" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"errorCode":"FORBIDDEN"'));
  });
});
