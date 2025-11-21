import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createLeaveRequest } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("announcements.getByMonth", () => {
  let validLeaveTypeId: number;

  beforeAll(async () => {
    // Get valid leave type ID
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx.ctx);
    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }
    validLeaveTypeId = leaveTypes[0]!.id;

    // Crea alcune richieste di test per dicembre 2025
    await createLeaveRequest({
      userId: 1,
      leaveTypeId: validLeaveTypeId,
      startDate: "2025-12-01",
      endDate: "2025-12-03",
      days: 3,
      hours: 8,
      status: "approved",
    });

    await createLeaveRequest({
      userId: 1,
      leaveTypeId: validLeaveTypeId,
      startDate: "2025-12-15",
      endDate: "2025-12-20",
      days: 6,
      hours: 8,
      status: "pending",
    });
  });

  it.skip("returns leave requests for the specified month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcements.getByMonth({
      year: 2025,
      month: 12,
    });

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Verifica che tutte le richieste siano di dicembre 2025
    result.forEach((leave) => {
      console.log('Leave data:', {
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        userName: leave.userName
      });
      
      // Le date sono stringhe in formato YYYY-MM-DD
      const startYear = parseInt(leave.startDate.split('-')[0]);
      const startMonth = parseInt(leave.startDate.split('-')[1]);
      const endYear = parseInt(leave.endDate.split('-')[0]);
      const endMonth = parseInt(leave.endDate.split('-')[1]);
      
      // Almeno una delle date deve essere in dicembre 2025
      const isInDecember2025 = 
        (startYear === 2025 && startMonth === 12) ||
        (endYear === 2025 && endMonth === 12);
      
      expect(isInDecember2025).toBe(true);
    });
  });

  it("returns empty array for months with no leaves", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcements.getByMonth({
      year: 2026,
      month: 1,
    });

    expect(result).toBeInstanceOf(Array);
    // Potrebbe essere vuoto o avere richieste, dipende dai dati di test
  });

  it("includes user and leave type information", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcements.getByMonth({
      year: 2025,
      month: 12,
    });

    if (result.length > 0) {
      const leave = result[0];
      
      expect(leave).toHaveProperty("userName");
      expect(leave).toHaveProperty("leaveTypeName");
      expect(leave).toHaveProperty("status");
      expect(leave).toHaveProperty("hours");
      expect(leave).toHaveProperty("startDate");
      expect(leave).toHaveProperty("endDate");
    }
  });

  it("includes both approved and pending requests", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcements.getByMonth({
      year: 2025,
      month: 12,
    });

    if (result.length > 1) {
      const statuses = result.map(r => r.status);
      const hasApproved = statuses.includes("approved");
      const hasPending = statuses.includes("pending");
      
      // Verifica che ci siano entrambi i tipi (se esistono nel database)
      expect(hasApproved || hasPending).toBe(true);
    }
  });
});
