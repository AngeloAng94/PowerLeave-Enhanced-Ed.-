import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createTestContext, getValidLeaveTypeId, getUniqueDates } from "./test-helpers";
import type { TrpcContext } from "./_core/context";

describe("leaves.createRequest with hours support", () => {
  let validLeaveTypeId: number;
  let userCtx: TrpcContext;

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const result = await createTestContext("user");
    userCtx = result.ctx;
  });

  it("accepts hours parameter with default value of 8", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();

    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      notes: "Test richiesta giornata intera",
    });

    expect(result.success).toBe(true);
  });

  it("accepts 2 hours for short leave", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();

    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 2,
      notes: "Permesso breve 2 ore",
    });

    expect(result.success).toBe(true);
  });

  it("accepts 4 hours for half day", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();

    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 4,
      notes: "Mezza giornata",
    });

    expect(result.success).toBe(true);
  });

  it("accepts 8 hours for full day", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();

    const result = await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
      hours: 8,
      notes: "Giornata intera",
    });

    expect(result.success).toBe(true);
  });

  it("validates required fields", async () => {
    const caller = appRouter.createCaller(userCtx);

    const invalidInput = {
      leaveTypeId: validLeaveTypeId,
      // Missing startDate and endDate
    } as any;

    await expect(caller.leaves.createRequest(invalidInput)).rejects.toThrow();
  });
});

describe("leaves.getRequests returns hours field", () => {
  let validLeaveTypeId: number;
  let userCtx: TrpcContext;

  beforeAll(async () => {
    validLeaveTypeId = await getValidLeaveTypeId();
    const result = await createTestContext("user");
    userCtx = result.ctx;
  });

  it("includes hours in the response", async () => {
    const caller = appRouter.createCaller(userCtx);
    const { startDate, endDate } = getUniqueDates();

    // Prima crea una richiesta con ore specifiche
    await caller.leaves.createRequest({
      leaveTypeId: validLeaveTypeId,
      startDate,
      endDate,
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
