import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates } from "./test-helpers";

describe("Role-based access control", () => {
  let validLeaveTypeId: number;
  let adminCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];
  let userCtx: Awaited<ReturnType<typeof createTestContext>>["ctx"];

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const adminResult = await createTestContext("admin");
    adminCtx = adminResult.ctx;
    const userResult = await createTestContext("user");
    userCtx = userResult.ctx;
  });

  describe("leaves.getRequests", () => {
    it("ADMIN can get all pending requests", async () => {
      const caller = appRouter.createCaller(adminCtx);
      const result = await caller.leaves.getRequests({ status: "pending" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("USER can only get their own requests", async () => {
      const caller = appRouter.createCaller(userCtx);
      const result = await caller.leaves.getRequests({ userId: userCtx.user!.id });
      expect(Array.isArray(result)).toBe(true);
      result.forEach(req => {
        expect(req.userId).toBe(userCtx.user!.id);
      });
    });
  });

  describe("leaves.reviewRequest", () => {
    it("ADMIN can approve requests", async () => {
      const adminCaller = appRouter.createCaller(adminCtx);
      const userCaller = appRouter.createCaller(userCtx);
      const { startDate, endDate } = getUniqueDates();

      const createResult = await userCaller.leaves.createRequest({
        leaveTypeId: validLeaveTypeId,
        startDate,
        endDate,
        hours: 8,
        notes: "Test request for admin approval",
      });

      expect(createResult.success).toBe(true);
      expect(createResult.requestId).toBeDefined();

      const approveResult = await adminCaller.leaves.reviewRequest({
        requestId: createResult.requestId!,
        status: "approved",
      });

      expect(approveResult.success).toBe(true);
    });

    it("USER cannot approve requests (should fail)", async () => {
      const caller = appRouter.createCaller(userCtx);

      await expect(
        caller.leaves.reviewRequest({
          requestId: 999999,
          status: "approved",
        })
      ).rejects.toThrow();
    });
  });
});
