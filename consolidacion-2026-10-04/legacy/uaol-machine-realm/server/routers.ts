import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { simulationRouter } from "./routers/simulation";
import { operationsRouter } from "./routers/operations";
import { accessRouter } from "./routers/access";
import { recordAccessAudit } from "./accessAudit";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      if (ctx.user) {
        void recordAccessAudit({ userId: ctx.user.id, role: ctx.user.role, action: "auth.signOut", origin: "oauth" });
      }
      return { success: true } as const;
    }),
  }),
  simulation: simulationRouter,
  operations: operationsRouter,
  access: accessRouter,
});

export type AppRouter = typeof appRouter;
