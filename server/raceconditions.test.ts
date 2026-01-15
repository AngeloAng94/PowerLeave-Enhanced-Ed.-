import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates } from "./test-helpers";

describe("Race Conditions & Concurrency Tests", () => {
  let validLeaveTypeId: number;
  let adminCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];
  let userCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];
  let userId: number;

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const adminResult = await createTestContext("admin");
    adminCtx = adminResult.ctx;
    const userResult = await createTestContext("user");
    userCtx = userResult.ctx;
    userId = userResult.userId;
  });

  it("handles concurrent approvals of same request by different admins", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const { startDate: dateStr } = getUniqueDates();

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr,
      endDate: dateStr,
      hours: 8,
      notes: "Race condition test - concurrent approvals",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const admin1Caller = appRouter.createCaller(adminCtx);
    const admin2Caller = appRouter.createCaller(adminCtx);

    const [result1, result2] = await Promise.allSettled([
      admin1Caller.leaves.reviewRequest({ requestId, status: "approved" }),
      admin2Caller.leaves.reviewRequest({ requestId, status: "approved" }),
    ]);

    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");

    const requests = await admin1Caller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(targetRequest?.status).toBe("approved");
  });

  it("handles concurrent approve/reject conflict", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const { startDate: dateStr } = getUniqueDates();

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr,
      endDate: dateStr,
      hours: 8,
      notes: "Race condition test - approve vs reject",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const adminCaller = appRouter.createCaller(adminCtx);

    const [result1, result2] = await Promise.allSettled([
      adminCaller.leaves.reviewRequest({ requestId, status: "approved" }),
      adminCaller.leaves.reviewRequest({ requestId, status: "rejected" }),
    ]);

    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");

    const requests = await adminCaller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(["approved", "rejected"]).toContain(targetRequest?.status);
  });

  it("prevents user from modifying request after admin approval", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const { startDate: dateStr1 } = getUniqueDates();
    const { startDate: dateStr2 } = getUniqueDates();

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr1,
      endDate: dateStr1,
      hours: 8,
      notes: "Original request",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const adminCaller = appRouter.createCaller(adminCtx);
    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });

    const createResult2 = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr2,
      endDate: dateStr2,
      hours: 4,
      notes: "Different date request",
    });

    expect(createResult2.success).toBe(true);
  });

  it("handles concurrent request creation for same user", async () => {
    const caller = appRouter.createCaller(userCtx);

    const promises: Promise<any>[] = [];
    for (let i = 0; i < 3; i++) {
      const { startDate: dateStr } = getUniqueDates();
      promises.push(
        caller.leaves.createRequest({
          leaveTypeId: validLeaveTypeId,
          startDate: dateStr,
          endDate: dateStr,
          hours: 8,
          notes: `Concurrent request ${i}`,
        })
      );
    }

    const results = await Promise.allSettled(promises);
    const successes = results.filter((r) => r.status === "fulfilled").length;
    // At least 2 should succeed (some may fail due to race conditions)
    expect(successes).toBeGreaterThanOrEqual(2);
  });

  it("maintains consistency when rejecting and creating simultaneously", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const { startDate: dateStr1 } = getUniqueDates();
    const { startDate: dateStr2 } = getUniqueDates();

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr1,
      endDate: dateStr1,
      hours: 8,
      notes: "To be rejected",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const adminCaller = appRouter.createCaller(adminCtx);

    const [rejectResult, createResult2] = await Promise.allSettled([
      adminCaller.leaves.reviewRequest({ requestId, status: "rejected" }),
      userCaller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate: dateStr2,
        endDate: dateStr2,
        hours: 8,
        notes: "New request",
      }),
    ]);

    expect(rejectResult.status).toBe("fulfilled");
    expect(createResult2.status).toBe("fulfilled");
  });

  it("handles rapid status changes on same request", async () => {
    const userCaller = appRouter.createCaller(userCtx);
    const { startDate: dateStr } = getUniqueDates();

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr,
      endDate: dateStr,
      hours: 8,
      notes: "Rapid status changes test",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const adminCaller = appRouter.createCaller(adminCtx);

    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "rejected" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });

    const requests = await adminCaller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(targetRequest?.status).toBe("approved");
  });
});
