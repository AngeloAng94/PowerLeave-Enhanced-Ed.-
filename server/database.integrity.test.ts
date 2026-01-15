import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { leaveRequests, leaveTypes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createTestContext, getValidLeaveTypeId, getUniqueDates } from "./test-helpers";

describe("Database Integrity Tests", () => {
  let validLeaveTypeId: number;
  let userCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];
  let userId: number;

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const userResult = await createTestContext("user");
    userCtx = userResult.ctx;
    userId = userResult.userId;
  });

  it("enforces foreign key constraint on leaveTypeId", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    await expect(
      db.insert(leaveRequests).values({
        userId: userId,
        leaveTypeId: 999999,
        startDate: getUniqueDates().startDate,
        endDate: getUniqueDates().startDate,
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

    await expect(
      db.insert(leaveRequests).values({
        userId: 999999,
        leaveTypeId: validLeaveTypeId,
        startDate: getUniqueDates().startDate,
        endDate: getUniqueDates().startDate,
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

    const [newLeaveType] = await db
      .insert(leaveTypes)
      .values({
        name: `Test Leave Type ${Date.now()}`,
        description: "Will be deleted",
        color: "#FF0000",
      })
      .$returningId();

    if (!newLeaveType?.id) {
      throw new Error("Failed to create test leave type");
    }

    await db.insert(leaveRequests).values({
      userId: userId,
      leaveTypeId: newLeaveType.id,
        startDate: getUniqueDates().startDate,
        endDate: getUniqueDates().startDate,
      days: 1,
      hours: 8,
      status: "pending",
    });

    await expect(db.delete(leaveTypes).where(eq(leaveTypes.id, newLeaveType.id))).rejects.toThrow();
  });

  it("validates data types and constraints", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    await expect(
      db.insert(leaveRequests).values({
        userId: userId,
        leaveTypeId: validLeaveTypeId,
        startDate: getUniqueDates().startDate,
        endDate: getUniqueDates().startDate,
        days: 1,
        hours: 8,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("handles NULL values correctly", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const result = await db.insert(leaveRequests).values({
      userId: userId,
      leaveTypeId: validLeaveTypeId,
        startDate: getUniqueDates().startDate,
        endDate: getUniqueDates().startDate,
      days: 1,
      hours: 8,
      status: "pending",
      notes: null,
    });

    expect(result).toBeDefined();
  });

  it("maintains data consistency across related tables", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate: dateStr } = getUniqueDates();

    const statsBefore = await caller.leaves.getStats();

    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate: dateStr,
      endDate: dateStr,
      hours: 8,
      notes: "Consistency test",
    });

    expect(result.success).toBe(true);

    const statsAfter = await caller.leaves.getStats();
    expect(statsAfter.pendingCount).toBeGreaterThanOrEqual(statsBefore.pendingCount);
  });

  it("handles concurrent inserts without data corruption", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const promises: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
      const { startDate: dateStr } = getUniqueDates();
      promises.push(
        db.insert(leaveRequests).values({
          userId: userId,
          leaveTypeId: validLeaveTypeId,
          startDate: dateStr,
          endDate: dateStr,
          days: 1,
          hours: 8,
          status: "pending",
          notes: `Concurrent insert ${i}`,
        })
      );
    }

    const results = await Promise.allSettled(promises);
    const successes = results.filter((r) => r.status === "fulfilled").length;

    expect(successes).toBe(10);
  });
});
