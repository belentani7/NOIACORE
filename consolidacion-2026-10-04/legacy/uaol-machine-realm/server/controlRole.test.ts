import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "admin" | "operator" | "client" | "auditor"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 777, openId: `role-${role}`, name: role, email: null, loginMethod: "test", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("roles operativos", () => {
  it("permite la vista operacional protegida a admin y operator", async () => {
    for (const role of ["admin", "operator"] as const) {
      const caller = appRouter.createCaller(contextWithRole(role));
      const overview = await caller.operations.overview();
      expect(overview).toHaveProperty("machines");
    }
  });

  it("bloquea un ciclo de gateway para un cliente", async () => {
    const caller = appRouter.createCaller(contextWithRole("client"));
    await expect(caller.operations.gateway.runCycle()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloquea un comando para un auditor", async () => {
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.operations.commands.request({ machineId: 1, commandType: "stop", idempotencyKey: "role-test-command-0001" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloquea las vistas de centro operativo a cliente y auditor", async () => {
    const client = appRouter.createCaller(contextWithRole("client"));
    const auditor = appRouter.createCaller(contextWithRole("auditor"));
    await expect(client.operations.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(auditor.simulation.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
