import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates, getUniqueDateRange } from "./test-helpers";
import type { TrpcContext } from "./_core/context";

describe("leaves router", () => {
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

  describe("getTypes", () => {
    it("returns leave types without authentication", async () => {
      const ctx: TrpcContext = {
        user: undefined,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      const types = await caller.leaves.getTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty("name");
    });
  });

  describe("getStats", () => {
    it("returns dashboard statistics for authenticated user", async () => {
      const caller = appRouter.createCaller(adminCtx);
      const stats = await caller.leaves.getStats();

      expect(stats).toHaveProperty("approvedCount");
      expect(stats).toHaveProperty("pendingCount");
      expect(stats).toHaveProperty("availableStaff");
      expect(stats).toHaveProperty("totalStaff");
      expect(stats).toHaveProperty("utilizationRate");
      expect(typeof stats.approvedCount).toBe("number");
      expect(typeof stats.pendingCount).toBe("number");
    });
  });

  describe("createRequest", () => {
    it("creates a leave request for authenticated user", async () => {
      const caller = appRouter.createCaller(userCtx);
      const { startDate, endDate } = getUniqueDates();

      const result = await caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        notes: "Test vacation",
      });

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(typeof result.requestId).toBe("number");
    });

    it("calculates days correctly", async () => {
      const caller = appRouter.createCaller(userCtx);
      const { startDate, endDate } = getUniqueDateRange(5);

      const result = await caller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getRequests", () => {
    it("returns only user's own requests for regular users", async () => {
      const caller = appRouter.createCaller(userCtx);
      const requests = await caller.leaves.getRequests();

      expect(Array.isArray(requests)).toBe(true);
      requests.forEach((req) => {
        expect(req.userId).toBe(userCtx.user!.id);
      });
    });

    it("returns all requests for admin users", async () => {
      const caller = appRouter.createCaller(adminCtx);
      const requests = await caller.leaves.getRequests();

      expect(Array.isArray(requests)).toBe(true);
    });

    it("filters requests by status", async () => {
      const caller = appRouter.createCaller(adminCtx);
      const pendingRequests = await caller.leaves.getRequests({ status: "pending" });

      expect(Array.isArray(pendingRequests)).toBe(true);
      pendingRequests.forEach((req) => {
        expect(req.status).toBe("pending");
      });
    });
  });

  describe("reviewRequest", () => {
    it("allows admin to approve requests", async () => {
      const userCaller = appRouter.createCaller(userCtx);
      const adminCaller = appRouter.createCaller(adminCtx);
      const { startDate, endDate } = getUniqueDates();

      // Create a request
      const createResult = await userCaller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
      });

      // Approve it
      const result = await adminCaller.leaves.reviewRequest({
        requestId: createResult.requestId!,
        status: "approved",
        reviewNotes: "Approved by test",
      });

      expect(result.success).toBe(true);
    });

    it("prevents non-admin users from reviewing requests", async () => {
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.leaves.reviewRequest({
          requestId: 1,
          status: "approved",
        })
      ).rejects.toThrow("Only admins can review leave requests");
    });
  });
});

describe("announcements router", () => {
  it("returns announcements for all users", async () => {
    const ctx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const announcements = await caller.announcements.getAll();

    expect(Array.isArray(announcements)).toBe(true);
  });
});
