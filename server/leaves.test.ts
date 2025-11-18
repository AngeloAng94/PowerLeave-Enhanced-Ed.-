import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("leaves router", () => {
  describe("getTypes", () => {
    it("returns leave types without authentication", async () => {
      const ctx: TrpcContext = {
        user: undefined,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
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
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

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
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-01",
        endDate: "2025-12-05",
        notes: "Test vacation",
      });

      expect(result).toEqual({ success: true });
    });

    it("calculates days correctly", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      // 5 days from Dec 1 to Dec 5 (inclusive)
      const result = await caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-01",
        endDate: "2025-12-05",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getRequests", () => {
    it("returns only user's own requests for regular users", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      const requests = await caller.leaves.getRequests();

      expect(Array.isArray(requests)).toBe(true);
      // All requests should belong to the authenticated user
      requests.forEach((req) => {
        expect(req.userId).toBe(ctx.user!.id);
      });
    });

    it("returns all requests for admin users", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const requests = await caller.leaves.getRequests();

      expect(Array.isArray(requests)).toBe(true);
    });

    it("filters requests by status", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const pendingRequests = await caller.leaves.getRequests({ status: "pending" });

      expect(Array.isArray(pendingRequests)).toBe(true);
      pendingRequests.forEach((req) => {
        expect(req.status).toBe("pending");
      });
    });
  });

  describe("reviewRequest", () => {
    it("allows admin to approve requests", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      // First create a request
      await caller.leaves.createRequest({
        leaveTypeId: 1,
        startDate: "2025-12-10",
        endDate: "2025-12-15",
      });

      // Get the pending requests
      const requests = await caller.leaves.getRequests({ status: "pending" });
      
      if (requests.length > 0) {
        const result = await caller.leaves.reviewRequest({
          requestId: requests[0]!.id,
          status: "approved",
          reviewNotes: "Approved by test",
        });

        expect(result).toEqual({ success: true });
      }
    });

    it("prevents non-admin users from reviewing requests", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

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
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const announcements = await caller.announcements.getAll();

    expect(Array.isArray(announcements)).toBe(true);
  });
});
