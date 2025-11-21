import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("leaves.createRequest - Edge Cases & Extreme Inputs", () => {
  it("rejects invalid date format (31 February)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-02-31", // Invalid date
        endDate: "2025-02-31",
        hours: 8,
        notes: "Invalid date test",
      })
    ).rejects.toThrow();
  });

  it("rejects year 9999 (extreme future date)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "9999-12-31",
        endDate: "9999-12-31",
        hours: 8,
        notes: "Far future test",
      })
    ).rejects.toThrow();
  });

  it("rejects past dates (year 1900)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "1900-01-01",
        endDate: "1900-01-01",
        hours: 8,
        notes: "Past date test",
      })
    ).rejects.toThrow();
  });

  it("rejects end date before start date", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-31",
        endDate: "2025-12-01", // End before start
        hours: 8,
        notes: "Reversed dates",
      })
    ).rejects.toThrow();
  });

  it("rejects negative hours", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: -8, // Negative hours
        notes: "Negative hours test",
      })
    ).rejects.toThrow();
  });

  it("rejects zero hours", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: 0, // Zero hours
        notes: "Zero hours test",
      })
    ).rejects.toThrow();
  });

  it("rejects hours > 24", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: 48, // More than 24 hours
        notes: "Excessive hours test",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid leaveTypeId (negative)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: -1, // Invalid ID
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: 8,
        notes: "Invalid leave type",
      })
    ).rejects.toThrow();
  });

  it("rejects non-existent leaveTypeId (999999)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 999999, // Non-existent ID
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: 8,
        notes: "Non-existent leave type",
      })
    ).rejects.toThrow();
  });

  it("handles SQL injection attempt in notes field", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get valid leave type ID first
    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      // Skip test if no leave types exist
      return;
    }

    // Should NOT throw, but should escape SQL properly
    const result = await caller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-15",
      endDate: "2025-12-15",
      hours: 8,
      notes: "'; DROP TABLE leave_requests; --", // SQL injection attempt
    });

    expect(result.success).toBe(true);
  });

  it("handles extremely long notes (10000 characters)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const longNotes = "A".repeat(10000);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-15",
        endDate: "2025-12-15",
        hours: 8,
        notes: longNotes,
      })
    ).rejects.toThrow(); // Should reject if notes field has length limit
  });

  it("handles empty string dates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "",
        endDate: "",
        hours: 8,
        notes: "Empty dates",
      })
    ).rejects.toThrow();
  });

  it("handles malformed date strings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "not-a-date",
        endDate: "also-not-a-date",
        hours: 8,
        notes: "Malformed dates",
      })
    ).rejects.toThrow();
  });

  it("rejects period longer than 365 days", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-01-01",
        endDate: "2026-12-31", // 2 years
        hours: 8,
        notes: "Extremely long period",
      })
    ).rejects.toThrow();
  });

  it("handles special characters in notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get valid leave type ID first
    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      return;
    }

    const result = await caller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-15",
      endDate: "2025-12-15",
      hours: 8,
      notes: "Test with émojis 🎉 and spëcial çhars <>&\"'",
    });

    expect(result.success).toBe(true);
  });

  it("handles Unicode characters in notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get valid leave type ID first
    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      return;
    }

    const result = await caller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-15",
      endDate: "2025-12-15",
      hours: 8,
      notes: "中文测试 日本語テスト العربية тест",
    });

    expect(result.success).toBe(true);
  });
});

describe("leaves.reviewRequest - Edge Cases", () => {
  it("rejects invalid requestId (negative)", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.role = "admin"; // Make admin
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.reviewRequest({
        requestId: -1,
        status: "approved",
      })
    ).rejects.toThrow();
  });

  it("rejects non-existent requestId (999999)", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.reviewRequest({
        requestId: 999999,
        status: "approved",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid status value", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.reviewRequest({
        requestId: 1,
        status: "invalid-status" as any, // Invalid status
      })
    ).rejects.toThrow();
  });

  it("rejects non-admin user trying to approve", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.role = "user"; // Regular user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leaves.reviewRequest({
        requestId: 1,
        status: "approved",
      })
    ).rejects.toThrow();
  });
});

describe("leaves.getStats - Edge Cases", () => {
  it("handles system with zero users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.leaves.getStats();

    expect(stats).toBeDefined();
    expect(typeof stats.approvedCount).toBe("number");
    expect(typeof stats.pendingCount).toBe("number");
  });

  it("handles division by zero in utilization rate", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.leaves.getStats();

    // Should not crash even if totalStaff is 0
    expect(stats.utilizationRate).toBeGreaterThanOrEqual(0);
    expect(stats.utilizationRate).toBeLessThanOrEqual(100);
  });
});
