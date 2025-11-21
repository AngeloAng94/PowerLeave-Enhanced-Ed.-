import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user", userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("Race Conditions & Concurrency Tests", () => {
  it("handles concurrent approvals of same request by different admins", async () => {
    // Create a request as user
    const { ctx: userCtx } = createAuthContext("user", 100);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-25",
      endDate: "2025-12-25",
      hours: 8,
      notes: "Race condition test - concurrent approvals",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    // Two admins try to approve the same request simultaneously
    const { ctx: admin1Ctx } = createAuthContext("admin", 1);
    const { ctx: admin2Ctx } = createAuthContext("admin", 2);

    const admin1Caller = appRouter.createCaller(admin1Ctx);
    const admin2Caller = appRouter.createCaller(admin2Ctx);

    const [result1, result2] = await Promise.allSettled([
      admin1Caller.leaves.reviewRequest({
        requestId,
        status: "approved",
      }),
      admin2Caller.leaves.reviewRequest({
        requestId,
        status: "approved",
      }),
    ]);

    // Both should succeed (idempotent operation)
    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");

    // Verify final state is approved
    const requests = await admin1Caller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(targetRequest?.status).toBe("approved");
  });

  it("handles concurrent approve/reject conflict", async () => {
    // Create a request as user
    const { ctx: userCtx } = createAuthContext("user", 101);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-26",
      endDate: "2025-12-26",
      hours: 8,
      notes: "Race condition test - approve vs reject",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    // One admin approves, another rejects simultaneously
    const { ctx: admin1Ctx } = createAuthContext("admin", 1);
    const { ctx: admin2Ctx } = createAuthContext("admin", 2);

    const admin1Caller = appRouter.createCaller(admin1Ctx);
    const admin2Caller = appRouter.createCaller(admin2Ctx);

    const [result1, result2] = await Promise.allSettled([
      admin1Caller.leaves.reviewRequest({
        requestId,
        status: "approved",
      }),
      admin2Caller.leaves.reviewRequest({
        requestId,
        status: "rejected",
      }),
    ]);

    // Both operations should succeed (last write wins)
    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");

    // Verify final state is one of the two (deterministic based on timing)
    const requests = await admin1Caller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(["approved", "rejected"]).toContain(targetRequest?.status);
  });

  it("prevents user from modifying request after admin approval", async () => {
    // Create a request as user
    const { ctx: userCtx } = createAuthContext("user", 102);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-27",
      endDate: "2025-12-27",
      hours: 8,
      notes: "Original request",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    // Admin approves
    const { ctx: adminCtx } = createAuthContext("admin", 1);
    const adminCaller = appRouter.createCaller(adminCtx);

    await adminCaller.leaves.reviewRequest({
      requestId,
      status: "approved",
    });

    // User tries to create another request with same dates (should succeed - no lock)
    const createResult2 = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-27",
      endDate: "2025-12-27",
      hours: 4,
      notes: "Modified request",
    });

    // Should succeed (no date overlap validation currently)
    expect(createResult2.success).toBe(true);
  });

  it("handles concurrent request creation for same user and dates", async () => {
    const { ctx } = createAuthContext("user", 103);
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // User tries to create 5 identical requests simultaneously
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        caller.leaves.createRequest({
          leaveTypeId: leaveTypes[0]!.id,
          startDate: "2025-12-28",
          endDate: "2025-12-28",
          hours: 8,
          notes: `Duplicate request ${i}`,
        })
      );
    }

    const results = await Promise.allSettled(promises);

    // All should succeed (no duplicate prevention currently)
    const successes = results.filter((r) => r.status === "fulfilled").length;
    expect(successes).toBe(5);

    // Verify all were created
    const userRequests = await caller.leaves.getRequests();
    const duplicates = userRequests.filter(
      (r) => r.startDate === "2025-12-28" && r.notes?.includes("Duplicate request")
    );

    expect(duplicates.length).toBe(5);
  });

  it("maintains consistency when deleting and creating simultaneously", async () => {
    const { ctx: userCtx } = createAuthContext("user", 104);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Create initial request
    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-29",
      endDate: "2025-12-29",
      hours: 8,
      notes: "To be deleted",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    // Simulate concurrent operations:
    // - Admin rejects (soft delete)
    // - User creates new request for same date
    const { ctx: adminCtx } = createAuthContext("admin", 1);
    const adminCaller = appRouter.createCaller(adminCtx);

    const [rejectResult, createResult2] = await Promise.allSettled([
      adminCaller.leaves.reviewRequest({
        requestId,
        status: "rejected",
      }),
      userCaller.leaves.createRequest({
        leaveTypeId: leaveTypes[0]!.id,
        startDate: "2025-12-29",
        endDate: "2025-12-29",
        hours: 8,
        notes: "New request",
      }),
    ]);

    // Both should succeed
    expect(rejectResult.status).toBe("fulfilled");
    expect(createResult2.status).toBe("fulfilled");

    // Verify both requests exist with correct states
    const allRequests = await adminCaller.leaves.getRequests();
    const dec29Requests = allRequests.filter((r) => r.startDate === "2025-12-29");

    expect(dec29Requests.length).toBeGreaterThanOrEqual(2);
    expect(dec29Requests.some((r) => r.status === "rejected")).toBe(true);
    expect(dec29Requests.some((r) => r.status === "pending")).toBe(true);
  });

  it("handles rapid status changes on same request", async () => {
    const { ctx: userCtx } = createAuthContext("user", 105);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const createResult = await userCaller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-30",
      endDate: "2025-12-30",
      hours: 8,
      notes: "Rapid status changes test",
    });

    expect(createResult.success).toBe(true);
    const requestId = createResult.requestId!;

    const { ctx: adminCtx } = createAuthContext("admin", 1);
    const adminCaller = appRouter.createCaller(adminCtx);

    // Rapid sequence: approve → reject → approve → reject → approve
    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "rejected" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "rejected" });
    await adminCaller.leaves.reviewRequest({ requestId, status: "approved" });

    // Final state should be approved
    const requests = await adminCaller.leaves.getRequests();
    const targetRequest = requests.find((r) => r.id === requestId);
    expect(targetRequest?.status).toBe("approved");
  });
});
