import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { accessAuditLogs, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { recordAccessAudit } from "../accessAudit";

const roles = z.enum(["user", "client", "operator", "supervisor", "auditor", "admin"]);

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("La base de datos no está disponible.");
  return db;
}

export const accessRouter = router({
  profile: protectedProcedure.query(({ ctx }) => ({ id: ctx.user!.id, name: ctx.user!.name, email: ctx.user!.email, role: ctx.user!.role, lastSignedIn: ctx.user!.lastSignedIn })),
  users: adminProcedure.query(async () => {
    const db = requireDb(await getDb());
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn)).limit(100);
  }),
  audit: adminProcedure.query(async () => {
    const db = requireDb(await getDb());
    return db.select().from(accessAuditLogs).orderBy(desc(accessAuditLogs.createdAt)).limit(200);
  }),
  setRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), role: roles }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user!.id === input.userId && input.role !== "admin") throw new Error("El administrador actual no puede retirarse su propio rol mediante esta acción.");
      const db = requireDb(await getDb());
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      await recordAccessAudit({ userId: ctx.user!.id, role: ctx.user!.role, action: "access.setRole", origin: "admin-console", metadata: { targetUserId: input.userId, newRole: input.role } });
      return { success: true } as const;
    }),
});
