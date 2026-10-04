import { z } from "zod";
import { router, controlProcedure, protectedProcedure } from "../_core/trpc";
import {
  advanceSimulatedTask,
  createSimulatedTask,
  emulateProtocol,
  getSimulationOverview,
  simulateComputerAction,
  setSimulatedMachineMode,
  tickSimulation,
  transitionSimulatedMachine,
} from "../simulation";

export const simulationRouter = router({
  overview: controlProcedure.query(({ ctx }) => getSimulationOverview(ctx.user!.id)),
  tick: controlProcedure.mutation(({ ctx }) => tickSimulation(ctx.user!.id)),
  task: router({
    create: controlProcedure
      .input(z.object({ title: z.string().min(3).max(180), intent: z.string().min(8).max(4000), riskLevel: z.enum(["low", "medium", "high", "critical"]), executionMode: z.enum(["manual", "autonomous"]) }))
      .mutation(({ ctx, input }) => createSimulatedTask({ ownerId: ctx.user!.id, ...input })),
    advance: controlProcedure.input(z.object({ taskId: z.number().int().positive() })).mutation(({ ctx, input }) => advanceSimulatedTask(ctx.user!.id, input.taskId)),
    simulateComputerAction: controlProcedure
      .input(z.object({ taskId: z.number().int().positive(), action: z.enum(["open_console", "inspect_page", "complete_form", "capture_evidence"]) }))
      .mutation(({ ctx, input }) => simulateComputerAction({ ownerId: ctx.user!.id, ...input })),
  }),
  machine: router({
    transition: controlProcedure
      .input(z.object({ machineId: z.number().int().positive(), targetState: z.enum(["idle", "calibrating", "operating", "maintenance", "stopped", "emergency"]), confirmed: z.boolean().optional() }))
      .mutation(({ ctx, input }) => transitionSimulatedMachine({ ownerId: ctx.user!.id, ...input })),
    setMode: controlProcedure
      .input(z.object({ machineId: z.number().int().positive(), mode: z.enum(["manual", "autonomous"]), confirmed: z.boolean().optional() }))
      .mutation(({ ctx, input }) => setSimulatedMachineMode({ ownerId: ctx.user!.id, ...input })),
  }),
  protocol: router({
    emulate: controlProcedure
      .input(z.object({ machineId: z.number().int().positive(), protocol: z.enum(["mqtt", "opcua", "modbus"]), direction: z.enum(["publish", "subscribe", "command", "response", "event"]), confirmed: z.boolean().optional() }))
      .mutation(({ ctx, input }) => emulateProtocol({ ownerId: ctx.user!.id, ...input })),
  }),
});
