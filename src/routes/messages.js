import express from "express";
import { getRoomMessages } from "../service/messagesService.js";
const router = express.Router();

router.get("/:roomName", async (req, res) => {
  const { roomName } = req.params;
  try {
    const messages = await getRoomMessages(roomName, 100);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
