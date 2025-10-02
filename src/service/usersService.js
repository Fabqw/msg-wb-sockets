import { db } from "../db.js";

export async function findOrCreateUser(username, avatar) {
  try {
    const userResult = await db.execute({
      sql: `INSERT INTO users (username, avatar) VALUES (?, ?) RETURNING id, username, avatar`,
      args: [username, avatar],
    });
    return { user: userResult.rows[0], isNew: true };
  } catch (err) {
    const existing = await db.execute({
      sql: "SELECT id, username, avatar FROM users WHERE username = ?",
      args: [username],
    });
    return { user: existing.rows[0], isNew: false };
  }
}

export async function markAllRoomsAsReadForNewUser(userId) {
  const roomsWithLastMessage = await db.execute(
    `SELECT 
            r.id as room_id,
        COALESCE(MAX(m.id), 0) as last_message_id
        FROM rooms r
        LEFT JOIN messages m ON r.id = m.room_id
        GROUP BY r.id`
  );

  for (const room of roomsWithLastMessage.rows) {
    await db.execute({
      sql: `INSERT INTO user_room_read_status (user_id, room_id, last_read_message_id, last_visit) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, room_id) DO UPDATE SET
            last_read_message_id = ?,
            last_visit = CURRENT_TIMESTAMP`,
      args: [userId, room.room_id, room.last_message_id, room.last_message_id],
    });
  }
}

export async function markRoomAsRead(userId, roomName) {
  const roomResult = await db.execute({
    sql: `SELECT id FROM rooms WHERE name = ?`,
    args: [roomName],
  });

  if (!roomResult.rows[0]) return;

  const roomId = roomResult.rows[0].id;

  const lastMessageResult = await db.execute({
    sql: `SELECT MAX(id) as last_message_id FROM messages WHERE room_id = ?`,
    args: [roomId],
  });

  const lastMessageId = lastMessageResult.rows[0]?.last_message_id || 0;

  if (lastMessageId > 0) {
    await db.execute({
      sql: `INSERT INTO user_room_read_status (user_id, room_id, last_read_message_id, last_visit) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, room_id) DO UPDATE SET
            last_read_message_id = CASE WHEN ? > last_read_message_id THEN ? ELSE last_read_message_id END,
            last_visit = CURRENT_TIMESTAMP`,
      args: [userId, roomId, lastMessageId, lastMessageId, lastMessageId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO user_room_read_status (user_id, room_id, last_read_message_id, last_visit) VALUES (?, ?, 0, CURRENT_TIMESTAMP) ON CONFLICT(user_id, room_id) DO UPDATE SET last_visit = CURRENT_TIMESTAMP`,
      args: [userId, roomId],
    });
  }
}
