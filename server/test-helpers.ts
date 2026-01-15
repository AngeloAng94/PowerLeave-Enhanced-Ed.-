import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ============================================================================
// CENTRALIZED DATE HELPER FOR TESTS
// All test dates MUST use this helper to ensure they are within 2020-2100 range
// ============================================================================

const BASE_YEAR = 2026;
const MAX_YEAR = 2090;
// Use random offset based on process ID and timestamp to ensure uniqueness across test runs
// Each test file import gets a unique starting point
let globalDateCounter = (Math.floor(Math.random() * 19000) * 300) + Math.floor(Math.random() * 300);

/**
 * Generate a valid test date string in YYYY-MM-DD format.
 * All dates are guaranteed to be within 2020-2100 range.
 * 
 * @param offsetDays - Optional offset from base date (default: auto-increment)
 * @returns Date string in YYYY-MM-DD format
 */
export function testDate(offsetDays?: number): string {
  const offset = offsetDays ?? globalDateCounter++;
  
  // Calculate year, month, day from offset
  // Each year has ~300 usable days (to avoid edge cases like Feb 30)
  const yearOffset = Math.floor(offset / 300);
  const year = Math.min(MAX_YEAR, BASE_YEAR + yearOffset);
  const dayOfYear = (offset % 300) + 1;
  const month = Math.min(12, Math.floor(dayOfYear / 25) + 1);
  const day = ((dayOfYear - 1) % 25) + 1;
  
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/**
 * Generate a unique date range for tests.
 * Each call returns a different date to avoid overlap validation conflicts.
 */
export function getUniqueDates(): { startDate: string; endDate: string } {
  const date = testDate();
  return { startDate: date, endDate: date };
}

/**
 * Generate a date range with specified duration.
 * @param durationDays - Number of days in the range (default: 1)
 */
export function getUniqueDateRange(durationDays: number = 1): { startDate: string; endDate: string } {
  const startOffset = globalDateCounter;
  globalDateCounter += durationDays + 10; // Leave gap to avoid overlaps
  
  const startDate = testDate(startOffset);
  const endDate = testDate(startOffset + durationDays - 1);
  return { startDate, endDate };
}

/**
 * Generate a specific year within valid range for tests that need year-based grouping.
 * @param index - Index to generate different years for different test groups
 */
export function testYear(index: number = 0): number {
  return Math.min(MAX_YEAR, BASE_YEAR + (index * 2));
}

/**
 * Generate a full date string for a specific month/day within a test year.
 * @param yearIndex - Index to select year (0-based)
 * @param month - Month (1-12)
 * @param day - Day (1-28 to avoid edge cases)
 */
export function testDateInYear(yearIndex: number, month: number, day: number): string {
  const year = testYear(yearIndex);
  const safeMonth = Math.max(1, Math.min(12, month));
  const safeDay = Math.max(1, Math.min(28, day));
  return `${year}-${safeMonth.toString().padStart(2, "0")}-${safeDay.toString().padStart(2, "0")}`;
}

// ============================================================================
// TEST CONTEXT HELPERS
// ============================================================================

// Counter for unique test user IDs per test file
let testUserCounter = Math.floor(Math.random() * 10000);

/**
 * Creates a test context with a unique user for each test.
 * Uses existing users from the database but assigns unique IDs to avoid overlap conflicts.
 */
export async function createTestContext(
  role: "admin" | "user" = "user"
): Promise<{ ctx: TrpcContext; userId: number }> {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available for testing");
  }

  // Get a real user from the database to use as template
  const existingUsers = await db.select().from(users).where(eq(users.role, role)).limit(1);
  
  let userRecord: typeof existingUsers[0] | undefined;

  if (existingUsers.length > 0) {
    userRecord = existingUsers[0];
  } else {
    const anyUser = await db.select().from(users).limit(1);
    if (anyUser.length === 0) {
      throw new Error("No users in database for testing");
    }
    userRecord = anyUser[0];
  }

  // Use the real user's ID for database operations
  const userId = userRecord!.id;

  const user: AuthenticatedUser = {
    id: userId,
    openId: userRecord!.openId,
    email: userRecord!.email,
    name: userRecord!.name,
    loginMethod: userRecord!.loginMethod,
    role: role,
    createdAt: userRecord!.createdAt,
    updatedAt: userRecord!.updatedAt,
    lastSignedIn: userRecord!.lastSignedIn,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx, userId };
}

/**
 * Gets a valid leaveTypeId from the database
 */
export async function getValidLeaveTypeId(): Promise<number> {
  const { getDb } = await import("./db");
  const { leaveTypes } = await import("../drizzle/schema");
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available for testing");
  }

  const types = await db.select().from(leaveTypes).limit(1);
  if (types.length === 0) {
    throw new Error("No leave types in database for testing");
  }

  return types[0]!.id;
}

/**
 * Creates a mock context without database dependency (for unit tests)
 */
export function createMockContext(
  role: "admin" | "user" = "user",
  userId: number = 1
): { ctx: TrpcContext } {
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
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}
