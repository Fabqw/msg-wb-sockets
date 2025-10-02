import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

export const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DB_TOKEN,
});

export async function initDb() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id)
    );`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS user_room_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        last_read_message_id INTEGER DEFAULT 0,
        last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        UNIQUE(user_id, room_id)
    );`
  );

  await db.execute(
    `INSERT OR IGNORE INTO rooms (id, name, description) VALUES (1, 'General', 'Sala general de chat')`
  );
}
