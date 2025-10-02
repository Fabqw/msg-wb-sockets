import { db } from "../db.js";

export async function getRoomByName(name) {
  const res = await db.execute({
    sql: `SELECT id, name FROM rooms WHERE name = ?`,
    args: [name],
  });
  return res.rows[0];
}

export async function createRoom(name, createdBy) {
  const res = await db.execute({
    sql: `INSERT INTO rooms (name, created_by) VALUES (?, ?) RETURNING id, name`,
    args: [name, createdBy],
  });
  return res.rows[0];
}

export async function getRoomsListWithUnread(userId) {
  const rooms = await db.execute(
    `SELECT 
        r.name, 
        r.description, 
        COUNT(DISTINCT m.user_id) as user_count, 
        MAX(m.timestamp) as last_activity, 
        COUNT(
            CASE WHEN m.id > COALESCE(urs.last_read_message_id, 0) AND m.user_id != ? 
            THEN 1 
        END) as unread_count
    FROM rooms r
    LEFT JOIN messages m ON r.id = m.room_id
    LEFT JOIN user_room_read_status urs ON ( r.id = urs.room_id AND urs.user_id = ? )
    GROUP BY r.id, r.name, r.description, urs.last_read_message_id
    ORDER BY last_activity DESC NULLS LAST `,
    [userId, userId]
  );

  return rooms.rows.map((row) => ({
    name: row.name,
    description: row.description,
    userCount: row.user_count || 0,
    lastActivity: row.last_activity,
    unreadCount: row.unread_count || 0,
  }));
}

export async function getRoomsList() {
  const rooms = await db.execute(
    `SELECT r.name, r.description, 
        COUNT(DISTINCT m.user_id) as user_count,
        MAX(m.timestamp) as last_activity
    FROM rooms r
    LEFT JOIN messages m ON r.id = m.room_id
    GROUP BY r.id, r.name, r.description
    ORDER BY last_activity DESC NULLS LAST`
  );

  return rooms.rows.map((row) => ({
    name: row.name,
    description: row.description,
    userCount: row.user_count || 0,
    lastActivity: row.last_activity,
  }));
}
