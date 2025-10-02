import express from "express";
import {
  getRoomsList,
  getRoomsListWithUnread,
} from "../service/roomsService.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : null;
  try {
    const data = userId
      ? await getRoomsListWithUnread(userId)
      : await getRoomsList();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
