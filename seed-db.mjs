import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("Seeding database...");

// Insert leave types
await connection.execute(`
  INSERT INTO leave_types (name, description, requires_approval) VALUES
  ('Ferie', 'Giorni di ferie annuali', 1),
  ('Permesso', 'Permessi retribuiti', 1),
  ('Malattia', 'Assenza per malattia', 0)
  ON DUPLICATE KEY UPDATE name=name
`);

console.log("✓ Leave types inserted");

// Insert sample announcements
await connection.execute(`
  INSERT INTO announcements (title, content, type, created_by) VALUES
  ('Nuova Politica Ferie Estive', 'Ricordiamo che le richieste per il periodo 1-31 Agosto devono essere inviate entro il 15 Giugno. Massimo 2 persone in ferie contemporaneamente.', 'info', 1)
  ON DUPLICATE KEY UPDATE title=title
`);

console.log("✓ Announcements inserted");

await connection.end();
console.log("Database seeded successfully!");
