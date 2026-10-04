import { z } from "zod";
import { adminProcedure, controlProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateOperationalReport, getClientOperationalOverview, getOperationalOverview, getOperationalSettings, provisionGatewayCredentials, requestOperation, runGatewayCycle, simulateMachineCondition, updateOperationalSettings } from "../operations";

const operationCommand = z.enum(["start", "stop", "pause", "resume", "reset", "maintenance", "acknowledge_alarm", "test", "emergency_stop_simulation"]);

export const operationsRouter = router({
  overview: controlProcedure.query(({ ctx }) => getOperationalOverview(ctx.user!.id)),
  clientOverview: protectedProcedure.query(({ ctx }) => getClientOperationalOverview(ctx.user!.id)),
  gateway: router({
    runCycle: controlProcedure.mutation(({ ctx }) => runGatewayCycle(ctx.user!.id)),
    provisionCredentials: adminProcedure.mutation(({ ctx }) => provisionGatewayCredentials(ctx.user!.id)),
  }),
  commands: router({
    request: controlProcedure
      .input(z.object({ machineId: z.number().int().positive(), commandType: operationCommand, idempotencyKey: z.string().min(12).max(96), confirmed: z.boolean().optional() }))
      .mutation(({ ctx, input }) => requestOperation({ ownerId: ctx.user!.id, ...input })),
  }),
  machine: router({
    simulateCondition: controlProcedure
      .input(z.object({ machineId: z.number().int().positive(), condition: z.enum(["disconnect", "reconnect", "fault", "recover", "latency"]), latencyMs: z.number().int().min(0).max(5000).optional(), confirmed: z.boolean().optional() }))
      .mutation(({ ctx, input }) => simulateMachineCondition({ ownerId: ctx.user!.id, ...input })),
  }),
  reports: router({
    generate: controlProcedure.mutation(({ ctx }) => generateOperationalReport(ctx.user!.id)),
  }),
  settings: router({
    get: controlProcedure.query(({ ctx }) => getOperationalSettings(ctx.user!.id)),
    update: controlProcedure
      .input(z.object({ telemetryCadenceSeconds: z.number().int().min(2).max(300), defaultLatencyMs: z.number().int().min(0).max(5000), maxQueuedCommands: z.number().int().min(1).max(500), requireConfirmationForHighRisk: z.boolean() }))
      .mutation(({ ctx, input }) => updateOperationalSettings({ ownerId: ctx.user!.id, ...input })),
  }),
});
