import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { commandTypes } from "@shared/machine";
import { protectedProcedure, router } from "../_core/trpc";
import { approveCommand, getOperationsSnapshot, rejectCommand, requestCommand } from "./service";

const commandInput = z.object({
  machineId: z.number().int().positive(),
  type: z.enum(commandTypes),
  idempotencyKey: z.string().min(12).max(128),
  testMode: z.literal(true).default(true),
});

function actorFromUser(user: { id: number; role: "user" | "admin"; operationRole: "observer" | "operator" | "approver" | "policy_admin" }) {
  return { id: user.id, role: user.role, operationRole: user.operationRole };
}

function serviceError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "No se pudo procesar la operación." });
}

export const machineRouter = router({
  snapshot: protectedProcedure.query(async () => {
    try {
      return await getOperationsSnapshot();
    } catch (error) {
      return serviceError(error);
    }
  }),
  requestCommand: protectedProcedure.input(commandInput).mutation(async ({ ctx, input }) => {
    try {
      return await requestCommand(actorFromUser(ctx.user), input);
    } catch (error) {
      return serviceError(error);
    }
  }),
  approveCommand: protectedProcedure.input(z.object({ commandId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    try {
      return await approveCommand(actorFromUser(ctx.user), input.commandId);
    } catch (error) {
      return serviceError(error);
    }
  }),
  rejectCommand: protectedProcedure
    .input(z.object({ commandId: z.string().uuid(), reason: z.string().trim().min(8).max(500) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await rejectCommand(actorFromUser(ctx.user), input.commandId, input.reason);
      } catch (error) {
        return serviceError(error);
      }
    }),
});
