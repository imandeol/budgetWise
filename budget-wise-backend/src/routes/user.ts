import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import bcrypt from "bcrypt";

export const router = Router();

router.use(requireAuth);

/**
 * GET /api/user/me
 * Returns the current user's profile: { userId, name, email }
 */
router.get("/me", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  try {
    const [rows] = await pool.execute(
      `SELECT user_id AS userId, name, email
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    const arr = rows as any[];
    if (arr.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(arr[0]);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /api/user/me
 * Update name and/or password.
 *
 * body:
 * {
 *   name?: string;
 *   currentPassword?: string; // required if newPassword is set
 *   newPassword?: string;
 * }
 */
router.put("/me", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const {
    name,
    currentPassword,
    newPassword,
  }: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  } = req.body;

  if (!name && !newPassword) {
    return res
      .status(400)
      .json({ error: "Nothing to update. Provide name or newPassword." });
  }

  try {
    let newPasswordHash: string | undefined;

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "currentPassword is required to change password" });
      }

      const [rows] = await pool.execute(
        `SELECT password_hash FROM users WHERE user_id = ?`,
        [userId]
      );
      const arr = rows as any[];
      if (arr.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const ok = await bcrypt.compare(currentPassword, arr[0].password_hash);
      if (!ok) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      newPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (typeof name === "string" && name.trim() !== "") {
      fields.push("name = ?");
      values.push(name.trim());
    }
    if (newPasswordHash) {
      fields.push("password_hash = ?");
      values.push(newPasswordHash);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: "Nothing to update. Provide valid name or newPassword.",
      });
    }

    values.push(userId);

    await pool.execute(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE user_id = ?`,
      values
    );

    const [updatedRows] = await pool.execute(
      `SELECT user_id AS userId, name, email
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    const updatedArr = updatedRows as any[];
    res.json({
      message: "Profile updated",
      user: updatedArr[0],
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
