import express from "express";
import { findOrCreateUser } from "../service/usersService.js";
const router = express.Router();

router.post("/join", async (req, res) => {
  const { username, avatar } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  try {
    const avatarUrl =
      avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const { user, isNew } = await findOrCreateUser(username, avatarUrl);
    res.json({ user, isNew });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
