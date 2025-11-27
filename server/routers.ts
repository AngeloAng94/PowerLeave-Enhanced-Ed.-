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
        
        // Normalize dates to avoid timezone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
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
        
        // Validate hours
        if (isNaN(input.hours) || input.hours <= 0) {
          throw new Error("Hours must be a positive number");
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

        // If approved, update leave balance
        if (input.status === "approved") {
          const request = allRequests.find(r => r.id === input.requestId);
          if (request) {
            // Calculate working days based on hours
            // 8H = 1 day, 4H = 0.5 days, 2H = 0.25 days
            const hoursPerDay = request.hours || 8;
            const workingDaysPerRequest = hoursPerDay / 8; // 8H = 1, 4H = 0.5, 2H = 0.25
            const totalWorkingDays = request.days * workingDaysPerRequest;

            // Update leave balance
            const { updateLeaveBalance } = await import("./db");
            const currentYear = new Date().getFullYear();
            await updateLeaveBalance(request.userId, request.leaveTypeId, currentYear, totalWorkingDays);
          }
        }

        return { success: true };
      }),

    // Get dashboard statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getLeaveRequests, getDb } = await import("./db");
      const { users, leaveBalances } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      // Get all requests for the current year
      const currentYear = new Date().getFullYear();
      const allRequests = await getLeaveRequests();

      // Filter requests for current year based on startDate
      const currentYearRequests = allRequests.filter((r) => {
        if (!r.startDate) return false;
        const year = new Date(r.startDate).getFullYear();
        return year === currentYear;
      });

      const approvedCount = currentYearRequests.filter((r) => r.status === "approved").length;
      const pendingCount = currentYearRequests.filter((r) => r.status === "pending").length;

      // Get total users count
      const totalUsers = db ? (await db.select().from(users)).length : 0;

      // Calculate staff available today
      const today = new Date();
      const onLeaveToday = currentYearRequests.filter(
        (r) =>
          r.status === "approved" &&
          r.startDate &&
          r.endDate &&
          new Date(r.startDate) <= today &&
          new Date(r.endDate) >= today
      ).length;
      const availableStaff = totalUsers - onLeaveToday;

      // Calculate utilization rate based on actual days used vs total days available
      let usedDays = 0;
      let totalDaysAvailable = 0;

      if (db) {
        // Sum days from approved requests in current year
        usedDays = currentYearRequests
          .filter((r) => r.status === "approved")
          .reduce((sum, r) => sum + (r.days || 0), 0);

        // Sum total days from leave balances for current year
        const balances = await db.select().from(leaveBalances).where(eq(leaveBalances.year, currentYear));
        totalDaysAvailable = balances.reduce((sum, b) => sum + (b.totalDays || 0), 0);
      }

      const utilizationRate = totalDaysAvailable > 0 ? Math.round((usedDays / totalDaysAvailable) * 100) : 0;

      return {
        approvedCount,
        pendingCount,
        availableStaff,
        totalStaff: totalUsers,
        utilizationRate,
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
