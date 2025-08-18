import { Router } from "express";
import auth from "../utils/authMiddleware.js";
import { getProfile, upsertProfile } from "../models/userProfilesModel.js";

const router = Router();

function requireSelfOrAdmin(req, res, userId) {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return false; }
  if (req.user.role === "admin") return true;
  if (Number(req.user.id) === Number(userId)) return true;
  res.status(403).json({ message: "Forbidden" }); return false;
}

router.get("/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  if (!/^\d+$/.test(userId)) return res.status(400).json({ message: "Invalid id" });
  if (!requireSelfOrAdmin(req, res, userId)) return;
  const profile = await getProfile(userId);
  res.json({ status: 200, data: profile });
});

router.put("/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  if (!/^\d+$/.test(userId)) return res.status(400).json({ message: "Invalid id" });
  if (!requireSelfOrAdmin(req, res, userId)) return;
  await upsertProfile(userId, req.body || {});
  const profile = await getProfile(userId);
  res.json({ status: 200, message: "Profile updated", data: profile });
});

export default router;
