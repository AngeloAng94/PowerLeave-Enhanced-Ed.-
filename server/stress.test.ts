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

describe("Stress Tests - Performance & Load", () => {
  it("handles 100 concurrent leave requests", async () => {
    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    // Get valid leave type
    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const promises: Promise<any>[] = [];
    const startTime = Date.now();

    // Create 100 concurrent requests
    for (let i = 0; i < 100; i++) {
      const promise = caller.leaves.createRequest({
        leaveTypeId: leaveTypes[0]!.id,
        startDate: "2025-12-01",
        endDate: "2025-12-01",
        hours: 8,
        notes: `Stress test request ${i}`,
      });
      promises.push(promise);
    }

    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Count successes and failures
    const successes = results.filter((r) => r.status === "fulfilled").length;
    const failures = results.filter((r) => r.status === "rejected").length;

    console.log(`Stress test: 100 requests in ${duration}ms`);
    console.log(`Successes: ${successes}, Failures: ${failures}`);

    // At least 95% should succeed
    expect(successes).toBeGreaterThanOrEqual(95);
    // Should complete in reasonable time (< 10 seconds)
    expect(duration).toBeLessThan(10000);
  });

  it("handles concurrent reads from multiple users", async () => {
    const promises: Promise<any>[] = [];
    const startTime = Date.now();

    // Simulate 50 users reading their requests simultaneously
    for (let i = 1; i <= 50; i++) {
      const { ctx } = createAuthContext("user", i);
      const caller = appRouter.createCaller(ctx);
      promises.push(caller.leaves.getRequests());
    }

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successes = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Concurrent reads: 50 users in ${duration}ms`);
    console.log(`Successes: ${successes}`);

    // All should succeed
    expect(successes).toBe(50);
    // Should be fast (< 5 seconds)
    expect(duration).toBeLessThan(5000);
  });

  it("handles mixed operations under load", async () => {
    const { ctx: adminCtx } = createAuthContext("admin", 1);
    const adminCaller = appRouter.createCaller(adminCtx);

    const leaveTypes = await adminCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const promises: Promise<any>[] = [];
    const startTime = Date.now();

    // Mix of operations:
    // - 30 create requests
    // - 30 read requests
    // - 20 get stats
    // - 20 get types

    for (let i = 0; i < 30; i++) {
      const { ctx } = createAuthContext("user", i + 1);
      const caller = appRouter.createCaller(ctx);
      promises.push(
        caller.leaves.createRequest({
          leaveTypeId: leaveTypes[0]!.id,
          startDate: "2025-12-10",
          endDate: "2025-12-10",
          hours: 8,
          notes: `Mixed load test ${i}`,
        })
      );
    }

    for (let i = 0; i < 30; i++) {
      const { ctx } = createAuthContext("user", i + 1);
      const caller = appRouter.createCaller(ctx);
      promises.push(caller.leaves.getRequests());
    }

    for (let i = 0; i < 20; i++) {
      const { ctx } = createAuthContext("admin", 1);
      const caller = appRouter.createCaller(ctx);
      promises.push(caller.leaves.getStats());
    }

    for (let i = 0; i < 20; i++) {
      const { ctx } = createAuthContext("user", i + 1);
      const caller = appRouter.createCaller(ctx);
      promises.push(caller.leaves.getTypes());
    }

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successes = results.filter((r) => r.status === "fulfilled").length;
    const failures = results.filter((r) => r.status === "rejected").length;

    console.log(`Mixed load: 100 operations in ${duration}ms`);
    console.log(`Successes: ${successes}, Failures: ${failures}`);

    // At least 95% should succeed
    expect(successes).toBeGreaterThanOrEqual(95);
    // Should complete in reasonable time (< 15 seconds)
    expect(duration).toBeLessThan(15000);
  });

  it("handles large result sets efficiently", async () => {
    const { ctx } = createAuthContext("admin", 1);
    const caller = appRouter.createCaller(ctx);

    const startTime = Date.now();

    // Get all requests (could be hundreds/thousands)
    const requests = await caller.leaves.getRequests();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Fetched ${requests.length} requests in ${duration}ms`);

    // Should be fast even with large datasets (< 2 seconds)
    expect(duration).toBeLessThan(2000);
    expect(Array.isArray(requests)).toBe(true);
  });

  it("maintains data consistency under concurrent writes", async () => {
    const { ctx: userCtx } = createAuthContext("user", 999);
    const userCaller = appRouter.createCaller(userCtx);

    const leaveTypes = await userCaller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Create 20 requests concurrently for the same user
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        userCaller.leaves.createRequest({
          leaveTypeId: leaveTypes[0]!.id,
          startDate: "2025-12-20",
          endDate: "2025-12-20",
          hours: 8,
          notes: `Consistency test ${i}`,
        })
      );
    }

    const results = await Promise.allSettled(promises);
    const successes = results.filter((r) => r.status === "fulfilled").length;

    // All should succeed (no race conditions)
    expect(successes).toBe(20);

    // Verify all requests were actually created
    const userRequests = await userCaller.leaves.getRequests();
    const testRequests = userRequests.filter((r) => r.notes?.includes("Consistency test"));

    // Should have exactly 20 requests
    expect(testRequests.length).toBe(20);
  });
});
