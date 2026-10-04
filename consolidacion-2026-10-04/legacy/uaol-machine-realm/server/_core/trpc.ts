import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { recordAccessAudit } from "../accessAudit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

const userRateWindows = new Map<number, { count: number; resetAt: number }>();

function acceptsUserRequest(userId: number) {
  const now = Date.now();
  const current = userRateWindows.get(userId);
  if (!current || current.resetAt <= now) {
    userRateWindows.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 240) return false;
  current.count += 1;
  return true;
}

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (!acceptsUserRequest(ctx.user.id)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Límite temporal de solicitudes alcanzado para esta sesión." });
  }
  await recordAccessAudit({
    userId: ctx.user.id,
    role: ctx.user.role,
    action: `trpc.${opts.path}`,
    origin: typeof ctx.req.headers.origin === "string" ? ctx.req.headers.origin : ctx.req.ip,
    metadata: { method: ctx.req.method ?? "POST" },
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const controlProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !["admin", "operator", "supervisor"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "La operación requiere un rol de operador, supervisor o administrador." });
    }
    const user = ctx.user;
    return next({ ctx: { ...ctx, user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
