import { db } from "../db.js";

export async function saveMessage(content, userId, roomId) {
  const result = await db.execute({
    sql: `INSERT INTO messages (content, user_id, room_id) VALUES (?, ?, ?) RETURNING id, timestamp`,
    args: [content, userId, roomId],
  });
  return {
    id: result.rows[0].id,
    timestamp: result.rows[0].timestamp,
  };
}

export async function getRoomMessages(roomName, limit = 50) {
  const messages = await db.execute({
    sql: `SELECT m.id, m.content, m.timestamp, u.username, u.avatar, u.id as user_id
    FROM messages m
    JOIN users u ON m.user_id = u.id
    JOIN rooms r ON m.room_id = r.id
    WHERE r.name = ?
    ORDER BY m.timestamp ASC
    LIMIT ?`,
    args: [roomName, limit],
  });

  return messages.rows.map((row) => ({
    id: row.id.toString(),
    content: row.content,
    username: row.username,
    avatar: row.avatar,
    timestamp: row.timestamp,
    userId: row.user_id,
  }));
}
