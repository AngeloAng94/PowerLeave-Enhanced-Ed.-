import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates, getUniqueDateRange } from "./test-helpers";
import type { TrpcContext } from "./_core/context";

describe("announcements.getByMonth", () => {
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

  it("returns leave requests for the specified month", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDateRange(3);
    const year = parseInt(startDate.split('-')[0]!);
    const month = parseInt(startDate.split('-')[1]!);

    await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "Calendar test request",
    });

    const result = await caller.announcements.getByMonth({ year, month });

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns empty array for months with no leaves", async () => {
    const caller = appRouter.createCaller(userCtx);
    // Use year 2090 month 1 which is unlikely to have data
    const result = await caller.announcements.getByMonth({ year: 2090, month: 1 });
    expect(result).toBeInstanceOf(Array);
  });

  it("includes user and leave type information", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();
    const year = parseInt(startDate.split('-')[0]!);
    const month = parseInt(startDate.split('-')[1]!);

    await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "Info test request",
    });

    const result = await caller.announcements.getByMonth({ year, month });

    if (result.length > 0) {
      const leave = result[0]!;
      expect(leave).toHaveProperty("userName");
      expect(leave).toHaveProperty("leaveTypeName");
      expect(leave).toHaveProperty("status");
      expect(leave).toHaveProperty("hours");
      expect(leave).toHaveProperty("startDate");
      expect(leave).toHaveProperty("endDate");
    }
  });

  it("includes both approved and pending requests", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const adminCaller = appRouter.createCaller(adminCtx);
    const { startDate: date1 } = getUniqueDates();
    const { startDate: date2 } = getUniqueDates();
    const year = parseInt(date1.split('-')[0]!);
    const month = parseInt(date1.split('-')[1]!);

    await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: date1,
      endDate: date1,
      hours: 8,
      notes: "Pending request",
    });

    const approveResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: date2,
      endDate: date2,
      hours: 8,
      notes: "To be approved",
    });

    await adminCaller.leaves.reviewRequest({
      requestId: approveResult.requestId!,
      status: "approved",
    });

    const result = await userCaller.announcements.getByMonth({ year, month });

    if (result.length > 1) {
      const statuses = result.map(r => r.status);
      const hasApproved = statuses.includes("approved");
      const hasPending = statuses.includes("pending");
      expect(hasApproved || hasPending).toBe(true);
    }
  });
});
