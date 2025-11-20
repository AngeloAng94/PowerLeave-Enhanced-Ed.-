import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router per gestione team (solo admin)
 */
export const teamRouter = router({
  // Get all users (admin only)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo gli amministratori possono visualizzare tutti gli utenti",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database non disponibile",
      });
    }

    const allUsers = await db.select().from(users).orderBy(users.name);
    return allUsers;
  }),

  // Toggle user role (admin only)
  toggleUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono modificare i ruoli",
        });
      }

      // Non puoi cambiare il tuo stesso ruolo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Non puoi modificare il tuo stesso ruolo",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database non disponibile",
        });
      }

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
