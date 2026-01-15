import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates } from "./test-helpers";
import type { TrpcContext } from "./_core/context";

describe("leaves.createRequest - Edge Cases & Extreme Inputs", () => {
  let validLeaveTypeId: number;
  let userCtx: TrpcContext;
  let adminCtx: TrpcContext;

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const userResult = await createTestContext("user");
    userCtx = userResult.ctx;
    const adminResult = await createTestContext("admin");
    adminCtx = adminResult.ctx;
  });

  // Tests for INVALID dates (should fail validation)
  // Note: MySQL/JavaScript may auto-correct invalid dates like Feb 31 to Mar 3
  // so we test with clearly invalid formats instead

  it("rejects year 9999 (extreme future date)", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "9999-12-31",
        endDate: "9999-12-31",
        hours: 8,
        notes: "Far future test",
      })
    ).rejects.toThrow();
  });

  it("rejects past dates (year 1900)", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "1900-01-01",
        endDate: "1900-01-01",
        hours: 8,
        notes: "Past date test",
      })
    ).rejects.toThrow();
  });

  it("rejects end date before start date", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "2025-12-31",
        endDate: "2025-12-01",
        hours: 8,
        notes: "Reversed dates",
      })
    ).rejects.toThrow();
  });

  // Tests for INVALID hours (use valid dates from helper)
  it("rejects negative hours", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: -8,
        notes: "Negative hours test",
      })
    ).rejects.toThrow();
  });

  it("rejects zero hours", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: 0,
        notes: "Zero hours test",
      })
    ).rejects.toThrow();
  });

  it("rejects hours > 24", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: 48,
        notes: "Excessive hours test",
      })
    ).rejects.toThrow();
  });

  // Tests for INVALID leaveTypeId
  it("rejects invalid leaveTypeId (negative)", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: -1,
        startDate,
        endDate,
        hours: 8,
        notes: "Invalid leave type",
      })
    ).rejects.toThrow();
  });

  it("rejects non-existent leaveTypeId (999999)", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: 999999,
        startDate,
        endDate,
        hours: 8,
        notes: "Non-existent leave type",
      })
    ).rejects.toThrow();
  });

  // Tests for special characters (should SUCCEED)
  it("handles SQL injection attempt in notes field", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "'; DROP TABLE leave_requests; --",
    });
    expect(result.success).toBe(true);
  });

  it("handles extremely long notes (10000 characters)", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    const longNotes = "A".repeat(10000);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: 8,
        notes: longNotes,
      })
    ).rejects.toThrow();
  });

  it("handles empty string dates", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "",
        endDate: "",
        hours: 8,
        notes: "Empty dates",
      })
    ).rejects.toThrow();
  });

  it("handles malformed date strings", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "not-a-date",
        endDate: "also-not-a-date",
        hours: 8,
        notes: "Malformed dates",
      })
    ).rejects.toThrow();
  });

  it("rejects period longer than 365 days", async () => {
    const caller = appRouter.createCaller(userCtx);
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: "2025-01-01",
        endDate: "2026-12-31",
        hours: 8,
        notes: "Extremely long period",
      })
    ).rejects.toThrow();
  });

  it("handles special characters in notes", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "Test with émojis 🎉 and spëcial çhars <>&\"'",
    });
    expect(result.success).toBe(true);
  });

  it("handles Unicode characters in notes", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "中文测试 日本語テスト العربية тест",
    });
    expect(result.success).toBe(true);
  });
});

describe("leaves.reviewRequest - Edge Cases", () => {
  let adminCtx: TrpcContext;

  beforeAll(async () => {
    const adminResult = await createTestContext("admin");
    adminCtx = adminResult.ctx;
  });

  it("rejects invalid requestId (negative)", async () => {
    const caller = appRouter.createCaller(adminCtx);
    await expect(
      caller.leaves.reviewRequest({ requestId: -1, status: "approved" })
    ).rejects.toThrow();
  });

  it("rejects non-existent requestId (999999)", async () => {
    const caller = appRouter.createCaller(adminCtx);
    await expect(
      caller.leaves.reviewRequest({ requestId: 999999, status: "approved" })
    ).rejects.toThrow();
  });
});
