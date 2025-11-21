import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "user" | "admin", userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("Role-based access control", () => {
  describe("leaves.getRequests", () => {
    it("ADMIN can get all pending requests", async () => {
      const ctx = createMockContext("admin", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leaves.getRequests({ status: "pending" });
      
      // Admin dovrebbe vedere tutte le richieste pending, non solo le proprie
      expect(Array.isArray(result)).toBe(true);
    });

    it("USER can only get their own requests", async () => {
      const ctx = createMockContext("user", 2);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leaves.getRequests({ userId: 2 });
      
      // User dovrebbe vedere solo le proprie richieste
      expect(Array.isArray(result)).toBe(true);
      // Verifica che tutte le richieste appartengano all'utente
      result.forEach(req => {
        expect(req.userId).toBe(2);
      });
    });
  });

  describe("leaves.reviewRequest", () => {
    it("ADMIN can approve requests", async () => {
      const adminCtx = createMockContext("admin", 1);
      const userCtx = createMockContext("user", 2);
      
      const adminCaller = appRouter.createCaller(adminCtx);
      const userCaller = appRouter.createCaller(userCtx);

      // Get valid leave type ID
      const leaveTypes = await userCaller.leaves.getTypes();
      if (leaveTypes.length === 0) {
        throw new Error("No leave types available for testing");
      }

      // User crea una richiesta
      const createResult = await userCaller.leaves.createRequest({
        leaveTypeId: leaveTypes[0]!.id,
        startDate: "2025-12-25",
        endDate: "2025-12-25",
        hours: 8,
        notes: "Test request for admin approval",
      });

      expect(createResult.success).toBe(true);
      expect(createResult.requestId).toBeDefined();

      // Admin approva la richiesta
      const approveResult = await adminCaller.leaves.reviewRequest({
        requestId: createResult.requestId!,
        status: "approved",
      });

      expect(approveResult.success).toBe(true);
    });

    it("USER cannot approve requests (should fail)", async () => {
      const ctx = createMockContext("user", 2);
      const caller = appRouter.createCaller(ctx);

      // Prova ad approvare una richiesta come user normale
      // Nota: questo test assume che reviewRequest sia protetto per admin
      // Se non lo è ancora, questo test evidenzierà il problema
      await expect(
        caller.leaves.reviewRequest({
          requestId: 1,
          status: "approved",
        })
      ).rejects.toThrow();
    });
  });
});
