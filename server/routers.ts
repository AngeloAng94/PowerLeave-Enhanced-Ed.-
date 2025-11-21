import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { teamRouter } from "./team";

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
          leaveTypeId: z.number().positive("Leave type ID must be positive"),
          startDate: z.string().min(1, "Start date is required"),
          endDate: z.string().min(1, "End date is required"),
          hours: z.number().min(0.5, "Hours must be at least 0.5").max(24, "Hours cannot exceed 24").default(8),
          notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createLeaveRequest } = await import("./db");
        
        // Validate dates
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        
        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid date format");
        }
        
        // Check date range (must be between 2020 and 2100)
        const minYear = 2020;
        const maxYear = 2100;
        if (startDate.getFullYear() < minYear || startDate.getFullYear() > maxYear ||
            endDate.getFullYear() < minYear || endDate.getFullYear() > maxYear) {
          throw new Error(`Dates must be between ${minYear} and ${maxYear}`);
        }
        
        // Check end date is not before start date
        if (endDate < startDate) {
          throw new Error("End date cannot be before start date");
        }
        
        // Check period is not longer than 365 days
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > 365) {
          throw new Error("Leave period cannot exceed 365 days");
        }
        
        const days = daysDiff;
        
        // Verify leave type exists
        const { getLeaveTypes } = await import("./db");
        const leaveTypes = await getLeaveTypes();
        const leaveTypeExists = leaveTypes.some(lt => lt.id === input.leaveTypeId);
        
        if (!leaveTypeExists) {
          throw new Error(`Leave type with ID ${input.leaveTypeId} not found`);
        }

        const requestId = await createLeaveRequest({
          userId: ctx.user.id,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          days,
          hours: input.hours || 8,
          notes: input.notes,
        });

        return { success: true, requestId };
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
          requestId: z.number().positive("Request ID must be positive"),
          status: z.enum(["approved", "rejected"]),
          reviewNotes: z.string().max(500, "Review notes cannot exceed 500 characters").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can review leave requests");
        }

        // Verify request exists before updating
        const { getLeaveRequests, updateLeaveRequestStatus } = await import("./db");
        const allRequests = await getLeaveRequests();
        const requestExists = allRequests.some(r => r.id === input.requestId);
        
        if (!requestExists) {
          throw new Error(`Leave request with ID ${input.requestId} not found`);
        }

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

    // Get monthly leaves for calendar
    getMonthlyLeaves: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        const { getMonthlyCalendar } = await import("./db");
        return getMonthlyCalendar(input.year, input.month);
      }),

    // Get company closures for a month
    getCompanyClosures: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        const { getCompanyClosures } = await import("./db");
        return getCompanyClosures(input.year, input.month);
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

  leaveUsage: router({
    getSummary: protectedProcedure
      .input(z.object({ leaveTypeId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getLeaveUsageSummary } = await import("./db");
        return getLeaveUsageSummary(input?.leaveTypeId);
      }),
  }),

  team: teamRouter,
});

export type AppRouter = typeof appRouter;
