import {
  markAllRoomsAsReadForNewUser,
  markRoomAsRead,
} from "./service/usersService.js";
import { findOrCreateUser } from "./service/usersService.js";
import {
  getRoomByName,
  createRoom,
  getRoomsListWithUnread,
} from "./service/roomsService.js";
import { getRoomMessages, saveMessage } from "./service/messagesService.js";

export function setupSocket(io) {
  io.on("connection", async (socket) => {
    console.log("Usuario conectado");

    socket.on("join user", async (userData) => {
      try {
        const { username, avatar, room } = userData;

        const avatarUrl =
          avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const { user, isNew } = await findOrCreateUser(username, avatarUrl);

        socket.userId = user.id;
        socket.username = user.username;
        socket.avatar = user.avatar;
        socket.currentRoom = room || "General";

        socket.join(socket.currentRoom);

        if (isNew) await markAllRoomsAsReadForNewUser(socket.userId);

        socket.emit("user joined", {
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
          },
          room: socket.currentRoom,
        });
        socket.to(socket.currentRoom).emit("user connected", {
          username: user.username,
          avatar: user.avatar,
        });

        const history = await getRoomMessages(socket.currentRoom);
        socket.emit("message history", history);

        await markRoomAsRead(socket.userId, socket.currentRoom);

        const roomsList = await getRoomsListWithUnread(socket.userId);
        socket.emit("rooms list", roomsList);
      } catch (error) {
        console.error("Error en join user:", error);
        socket.emit("error", { message: "Error al unirse al chat" });
      }
    });

    socket.on("join room", async (roomName) => {
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        socket
          .to(socket.currentRoom)
          .emit("user left", { username: socket.username });
      }

      socket.currentRoom = roomName;
      socket.join(roomName);

      socket.emit("room changed", { room: roomName });
      socket.to(roomName).emit("user connected", {
        username: socket.username,
        avatar: socket.avatar,
      });

      const history = await getRoomMessages(roomName);
      socket.emit("message history", history);

      await markRoomAsRead(socket.userId, roomName);

      await broadcastRoomsListWithUnread(io);
    });

    socket.on("get rooms", async () => {
      const roomsList = await getRoomsListWithUnread(socket.userId);
      socket.emit("rooms list", roomsList);
    });

    socket.on("disconnect", () => {
      if (socket.currentRoom && socket.username) {
        socket
          .to(socket.currentRoom)
          .emit("user disconnected", { username: socket.username });
      }
      console.log("Usuario desconectado");
    });

    socket.on("chat message", async (msg) => {
      if (!socket.userId || !socket.currentRoom) {
        socket.emit("error", { message: "Debes unirte como usuario primero" });
        return;
      }

      try {
        let room = await getRoomByName(socket.currentRoom);
        if (!room) {
          room = await createRoom(socket.currentRoom, socket.userId);
        }

        const saved = await saveMessage(msg, socket.userId, room.id);

        const messageData = {
          id: saved.id.toString(),
          content: msg,
          username: socket.username,
          avatar: socket.avatar,
          timestamp: new Date().toISOString(),
          userId: socket.userId,
        };

        io.to(socket.currentRoom).emit("chat message", messageData);

        await markRoomAsRead(socket.userId, socket.currentRoom);

        await broadcastRoomsListWithUnread(io);
      } catch (error) {
        console.error("Error enviando mensaje:", error);
        socket.emit("error", { message: "Error al enviar mensaje" });
      }
    });
  });
}

async function broadcastRoomsListWithUnread(io) {
  try {
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      if (s.userId) {
        const roomsList = await getRoomsListWithUnread(s.userId);
        s.emit("rooms list", roomsList);
      }
    }
  } catch (err) {
    console.error("Error broadcasting rooms list:", err);
  }
}
