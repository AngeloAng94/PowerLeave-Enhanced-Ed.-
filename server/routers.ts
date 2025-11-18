import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leaves: router({
    // Get all leave types
    getTypes: publicProcedure.query(async () => {
      const { getLeaveTypes } = await import("./db");
      return getLeaveTypes();
    }),

    // Get user's leave balance
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const { getLeaveBalance } = await import("./db");
      const currentYear = new Date().getFullYear();
      return getLeaveBalance(ctx.user.id, currentYear);
    }),

    // Create a new leave request
    createRequest: protectedProcedure
      .input(
        z.object({
          leaveTypeId: z.number(),
          startDate: z.string(),
          endDate: z.string(),
          hours: z.number().default(8), // 2, 4, o 8 ore
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createLeaveRequest } = await import("./db");
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await createLeaveRequest({
          userId: ctx.user.id,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          days,
          hours: input.hours || 8,
          notes: input.notes,
        });

        return { success: true };
      }),

    // Get leave requests (filtered by user or status)
    getRequests: protectedProcedure
      .input(
        z
          .object({
            userId: z.number().optional(),
            status: z.enum(["pending", "approved", "rejected"]).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const { getLeaveRequests } = await import("./db");
        // Regular users can only see their own requests
        const filters = ctx.user.role === "admin" ? input : { userId: ctx.user.id, ...input };
        return getLeaveRequests(filters);
      }),

    // Approve or reject a leave request (admin only)
    reviewRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          status: z.enum(["approved", "rejected"]),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can review leave requests");
        }

        const { updateLeaveRequestStatus } = await import("./db");
        await updateLeaveRequestStatus(input.requestId, input.status, ctx.user.id);

        return { success: true };
      }),

    // Get dashboard statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getLeaveRequests } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const db = await getDb();

      // Get all requests for the current year
      const currentYear = new Date().getFullYear();
      const allRequests = await getLeaveRequests();

      const approvedCount = allRequests.filter((r) => r.status === "approved").length;
      const pendingCount = allRequests.filter((r) => r.status === "pending").length;

      // Get total users count
      const totalUsers = db ? (await db.select().from(users)).length : 0;

      // Calculate staff available today
      const today = new Date();
      const onLeaveToday = allRequests.filter(
        (r) =>
          r.status === "approved" &&
          r.startDate &&
          r.endDate &&
          new Date(r.startDate) <= today &&
          new Date(r.endDate) >= today
      ).length;
      const availableStaff = totalUsers - onLeaveToday;

      return {
        approvedCount,
        pendingCount,
        availableStaff,
        totalStaff: totalUsers,
        utilizationRate: totalUsers > 0 ? Math.round((approvedCount / (totalUsers * 24)) * 100) : 0,
      };
    }),
  }),

  announcements: router({
    // Get all announcements
    getAll: publicProcedure.query(async () => {
      const { getAnnouncements } = await import("./db");
      return getAnnouncements();
    }),

    // Get leave requests for a specific month (for calendar display)
    getByMonth: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        const { getLeaveRequestsByMonth } = await import("./db");
        return getLeaveRequestsByMonth(input.year, input.month);
      }),
  }),

  messages: router({
    getMyMessages: protectedProcedure.query(async ({ ctx }) => {
      const { getMessages } = await import("./db");
      return getMessages(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
