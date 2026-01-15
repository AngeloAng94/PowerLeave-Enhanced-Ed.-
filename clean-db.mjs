import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
const db = drizzle(process.env.DATABASE_URL);
await db.execute(sql`DELETE FROM leave_requests`);
console.log("Cleaned");
process.exit(0);
