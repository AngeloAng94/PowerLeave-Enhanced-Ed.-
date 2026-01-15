import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates, getUniqueDateRange } from "./test-helpers";

describe("Leave Request Overlap Validation", () => {
  let validLeaveTypeId: number;
  let userCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const userResult = await createTestContext("user");
    userCtx = userResult.ctx;
  });

  it("blocks request that completely overlaps existing approved request", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDateRange(5);

    const firstResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "First request - overlap test",
    });

    expect(firstResult.success).toBe(true);

    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: 8,
        notes: "Should fail - complete overlap",
      })
    ).rejects.toThrow(/già una richiesta ferie/);
  });

  it("blocks request that partially overlaps existing request", async () => {
    const caller = appRouter.createCaller(userCtx);
    // Create first request for days 1-4
    const { startDate: startDate1, endDate: endDate1 } = getUniqueDateRange(4);

    const firstResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: startDate1,
      endDate: endDate1,
      hours: 8,
      notes: "First request - partial overlap test",
    });

    expect(firstResult.success).toBe(true);

    // Second request overlaps with first (same dates)
    await expect(
      caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: startDate1,
        endDate: endDate1,
        hours: 8,
        notes: "Should fail - same dates overlap",
      })
    ).rejects.toThrow(/già una richiesta ferie/);
  });

  it("allows request for non-overlapping dates", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate: startDate1, endDate: endDate1 } = getUniqueDateRange(4);
    const { startDate: startDate2, endDate: endDate2 } = getUniqueDateRange(4);

    const firstResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: startDate1,
      endDate: endDate1,
      hours: 8,
      notes: "First request - no overlap test",
    });

    expect(firstResult.success).toBe(true);

    const secondResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: startDate2,
      endDate: endDate2,
      hours: 8,
      notes: "Should succeed - no overlap",
    });

    expect(secondResult.success).toBe(true);
  });

  it("allows request when existing request was rejected", async () => {
    const caller = appRouter.createCaller(userCtx);
    const adminResult = await createTestContext("admin");
    const adminCaller = appRouter.createCaller(adminResult.ctx);
    const { startDate, endDate } = getUniqueDateRange(4);

    const firstResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "To be rejected",
    });

    expect(firstResult.success).toBe(true);

    await adminCaller.leaves.reviewRequest({
      requestId: firstResult.requestId!,
      status: "rejected",
    });

    const secondResult = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "Should succeed - previous was rejected",
    });

    expect(secondResult.success).toBe(true);
  });
});
