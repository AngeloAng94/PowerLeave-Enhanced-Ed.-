import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): { ctx: TrpcContext } {
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

describe("leaves.createRequest with hours support", () => {
  it("accepts hours parameter with default value of 8", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Test con valore default (8 ore)
    const input = {
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-01",
      endDate: "2025-12-01",
      notes: "Test richiesta giornata intera",
    };

    // Non dovrebbe lanciare errori
    await expect(caller.leaves.createRequest(input)).resolves.toMatchObject({
      success: true,
    });
  });

  it("accepts 2 hours for short leave", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const input = {
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-02",
      endDate: "2025-12-02",
      hours: 2,
      notes: "Permesso breve 2 ore",
    };

    await expect(caller.leaves.createRequest(input)).resolves.toMatchObject({
      success: true,
    });
  });

  it("accepts 4 hours for half day", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const input = {
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-03",
      endDate: "2025-12-03",
      hours: 4,
      notes: "Mezza giornata",
    };

    await expect(caller.leaves.createRequest(input)).resolves.toMatchObject({
      success: true,
    });
  });

  it("accepts 8 hours for full day", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    const input = {
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-04",
      endDate: "2025-12-04",
      hours: 8,
      notes: "Giornata intera",
    };

    await expect(caller.leaves.createRequest(input)).resolves.toMatchObject({
      success: true,
    });
  });

  it("validates required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invalidInput = {
      leaveTypeId: 1,
      // Missing startDate and endDate
    } as any;

    await expect(caller.leaves.createRequest(invalidInput)).rejects.toThrow();
  });
});

describe("leaves.getRequests returns hours field", () => {
  it("includes hours in the response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leaveTypes = await caller.leaves.getTypes();
    if (leaveTypes.length === 0) {
      throw new Error("No leave types available for testing");
    }

    // Prima crea una richiesta con ore specifiche
    await caller.leaves.createRequest({
      leaveTypeId: leaveTypes[0]!.id,
      startDate: "2025-12-05",
      endDate: "2025-12-05",
      hours: 4,
      notes: "Test con 4 ore",
    });

    // Poi recupera le richieste
    const requests = await caller.leaves.getRequests({});

    // Verifica che il campo hours sia presente
    expect(requests).toBeInstanceOf(Array);
    if (requests.length > 0) {
      const lastRequest = requests[requests.length - 1];
      expect(lastRequest).toHaveProperty("hours");
      expect(typeof lastRequest.hours).toBe("number");
    }
  });
});
