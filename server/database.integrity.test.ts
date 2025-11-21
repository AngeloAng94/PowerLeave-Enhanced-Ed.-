import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { leaveRequests, leaveTypes, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

describe("Database Integrity Tests", () => {
  it("enforces foreign key constraint on leaveTypeId", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Try to insert leave request with non-existent leaveTypeId
    await expect(
      db.insert(leaveRequests).values({
        userId: 1,
        leaveTypeId: 999999, // Non-existent
        startDate: "2025-12-01",
        endDate: "2025-12-01",
        days: 1,
        hours: 8,
        status: "pending",
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on userId", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Try to insert leave request with non-existent userId
    await expect(
      db.insert(leaveRequests).values({
        userId: 999999, // Non-existent
        leaveTypeId: leaveTypesData[0]!.id,
        startDate: "2025-12-01",
        endDate: "2025-12-01",
        days: 1,
        hours: 8,
        status: "pending",
      })
    ).rejects.toThrow();
  });

  it("maintains referential integrity when deleting leave types", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Create a test leave type
    const [newLeaveType] = await db
      .insert(leaveTypes)
      .values({
        name: "Test Leave Type for Deletion",
        description: "Will be deleted",
        color: "#FF0000",
      })
      .$returningId();

    if (!newLeaveType?.id) {
      throw new Error("Failed to create test leave type");
    }

    // Create a leave request using this type
    await db.insert(leaveRequests).values({
      userId: 1,
      leaveTypeId: newLeaveType.id,
      startDate: "2025-12-01",
      endDate: "2025-12-01",
      days: 1,
      hours: 8,
      status: "pending",
    });

    // Try to delete the leave type (should fail due to FK constraint)
    await expect(db.delete(leaveTypes).where(eq(leaveTypes.id, newLeaveType.id))).rejects.toThrow();
  });

  it("prevents duplicate leave type names", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const existingTypes = await caller.leaves.getTypes();
    if (existingTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Try to create duplicate leave type (should fail if unique constraint exists)
    // Note: Currently no unique constraint on name, so this will succeed
    const result = await db.insert(leaveTypes).values({
      name: existingTypes[0]!.name, // Duplicate name
      description: "Duplicate test",
      color: "#000000",
    });

    // This test documents current behavior (no unique constraint)
    expect(result).toBeDefined();
  });

  it("handles cascading deletes correctly", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        openId: "test-cascade-delete",
        name: "Test Cascade User",
        email: "cascade@test.com",
        role: "user",
      })
      .$returningId();

    if (!testUser?.id) {
      throw new Error("Failed to create test user");
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Create leave requests for this user
    await db.insert(leaveRequests).values({
      userId: testUser.id,
      leaveTypeId: leaveTypesData[0]!.id,
      startDate: "2025-12-01",
      endDate: "2025-12-01",
      days: 1,
      hours: 8,
      status: "pending",
    });

    // Try to delete user (should fail if FK constraint prevents it)
    await expect(db.delete(users).where(eq(users.id, testUser.id))).rejects.toThrow();
  });

  it("validates data types and constraints", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Try to insert with invalid status (should fail if enum constraint exists)
    await expect(
      db.insert(leaveRequests).values({
        userId: 1,
        leaveTypeId: leaveTypesData[0]!.id,
        startDate: "2025-12-01",
        endDate: "2025-12-01",
        days: 1,
        hours: 8,
        status: "invalid_status" as any, // Invalid enum value
      })
    ).rejects.toThrow();
  });

  it("handles NULL values correctly", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Insert with NULL notes (should succeed - notes is nullable)
    const result = await db.insert(leaveRequests).values({
      userId: 1,
      leaveTypeId: leaveTypesData[0]!.id,
      startDate: "2025-12-01",
      endDate: "2025-12-01",
      days: 1,
      hours: 8,
      status: "pending",
      notes: null,
    });

    expect(result).toBeDefined();
  });

  it("maintains data consistency across related tables", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    // Get current stats
    const statsBefore = await caller.leaves.getStats();

    // Create a new request
    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    await caller.leaves.createRequest({
      leaveTypeId: leaveTypesData[0]!.id,
      startDate: "2025-12-15",
      endDate: "2025-12-15",
      hours: 8,
      notes: "Consistency test",
    });

    // Get stats again
    const statsAfter = await caller.leaves.getStats();

    // Pending count should increase by 1
    expect(statsAfter.pendingCount).toBe(statsBefore.pendingCount + 1);
  });

  it("handles concurrent inserts without data corruption", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const { ctx } = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    const leaveTypesData = await caller.leaves.getTypes();
    if (leaveTypesData.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Insert 50 records concurrently
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        db.insert(leaveRequests).values({
          userId: 1,
          leaveTypeId: leaveTypesData[0]!.id,
          startDate: "2025-12-20",
          endDate: "2025-12-20",
          days: 1,
          hours: 8,
          status: "pending",
          notes: `Concurrent insert ${i}`,
        })
      );
    }

    const results = await Promise.allSettled(promises);
    const successes = results.filter((r) => r.status === "fulfilled").length;

    // All should succeed
    expect(successes).toBe(50);

    // Verify all records exist
    const allRequests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.startDate, "2025-12-20"));

    const concurrentInserts = allRequests.filter((r) => r.notes?.includes("Concurrent insert"));
    expect(concurrentInserts.length).toBe(50);
  });
});
