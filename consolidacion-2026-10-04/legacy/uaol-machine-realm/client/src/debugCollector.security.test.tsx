/** @vitest-environment jsdom */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("colector de depuración", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as Window & { __MANUS_DEBUG_COLLECTOR__?: boolean }).__MANUS_DEBUG_COLLECTOR__;
  });

  it("redacta Authorization antes de enviar un registro de red", async () => {
    vi.useFakeTimers();
    const reports: Array<{ networkRequests: Array<{ request: { headers: Record<string, string> } }> }> = [];

    window.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "/__manus__/logs") {
        reports.push(JSON.parse(String(init?.body)));
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof window.fetch;

    const source = await readFile(resolve(process.cwd(), "client/public/__manus__/debug-collector.js"), "utf8");
    window.eval(source);

    await window.fetch("/api/audit-probe", {
      headers: { Authorization: "Bearer audit-secret-value", "X-Trace-Id": "trace-safe" },
    });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(2_000);

    expect(reports).toHaveLength(1);
    const capturedHeaders = reports[0].networkRequests[0].request.headers;
    expect(capturedHeaders.authorization).toBe("[REDACTED]");
    expect(capturedHeaders["x-trace-id"]).toBe("trace-safe");
    expect(JSON.stringify(reports)).not.toContain("audit-secret-value");
  });
});
