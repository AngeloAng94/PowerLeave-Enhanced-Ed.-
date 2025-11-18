import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Leave management queries

export async function getLeaveTypes() {
  const db = await getDb();
  if (!db) return [];
  const { leaveTypes } = await import("../drizzle/schema");
  return db.select().from(leaveTypes);
}

export async function getLeaveBalance(userId: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  const { leaveBalances } = await import("../drizzle/schema");
  return db.select().from(leaveBalances).where(eq(leaveBalances.userId, userId));
}

export async function createLeaveRequest(data: {
  userId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  days: number;
  hours?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { leaveRequests } = await import("../drizzle/schema");
  await db.insert(leaveRequests).values({
    userId: data.userId,
    leaveTypeId: data.leaveTypeId,
    startDate: data.startDate,
    endDate: data.endDate,
    days: data.days,
    hours: data.hours || 8,
    notes: data.notes,
    status: "pending",
  });
}

export async function getLeaveRequests(filters?: { userId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const { leaveRequests, users, leaveTypes } = await import("../drizzle/schema");
  
  let query = db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      userName: users.name,
      leaveTypeId: leaveRequests.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      hours: leaveRequests.hours,
      notes: leaveRequests.notes,
      status: leaveRequests.status,
      reviewedBy: leaveRequests.reviewedBy,
      reviewedAt: leaveRequests.reviewedAt,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id));

  if (filters?.userId) {
    query = query.where(eq(leaveRequests.userId, filters.userId)) as any;
  }
  if (filters?.status) {
    query = query.where(eq(leaveRequests.status, filters.status as any)) as any;
  }

  return query;
}

export async function updateLeaveRequestStatus(requestId: number, status: "approved" | "rejected", reviewedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { leaveRequests } = await import("../drizzle/schema");
  await db.update(leaveRequests)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(leaveRequests.id, requestId));
}

export async function getAnnouncements(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const { announcements, users } = await import("../drizzle/schema");
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      type: announcements.type,
      createdBy: announcements.createdBy,
      createdByName: users.name,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.createdBy, users.id))
    .orderBy(announcements.createdAt)
    .limit(limit);
}

export async function getMessages(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const { messages, users } = await import("../drizzle/schema");
  return db
    .select({
      id: messages.id,
      fromUserId: messages.fromUserId,
      fromUserName: users.name,
      toUserId: messages.toUserId,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.fromUserId, users.id))
    .where(eq(messages.toUserId, userId))
    .orderBy(messages.createdAt)
    .limit(limit);
}
