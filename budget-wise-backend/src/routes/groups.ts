// src/routes/groups.ts
import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

// All routes here require auth
router.use(requireAuth);

/**
 * GET /api/groups/my
 * groups where current user is a member
 */
router.get("/my", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  try {
    const [rows] = await pool.execute(
      `SELECT g.group_id AS groupId, g.group_name AS groupName
       FROM group_members gm
       JOIN groups g ON g.group_id = gm.group_id
       WHERE gm.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch my groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

/**
 * POST /api/groups
 * create group AND add current user as admin member
 * body: { group_name }
 */
router.post("/", async (req: AuthedRequest, res) => {
  const { group_name } = req.body as { group_name?: string };
  const userId = req.userId!;
  if (!group_name) {
    return res.status(400).json({ error: "group_name is required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO groups (group_name) VALUES (?)`,
      [group_name]
    );
    const groupId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES (?, ?, 'admin')`,
      [groupId, userId]
    );

    await conn.commit();
    res.status(201).json({ groupId });
  } catch (err) {
    await conn.rollback();
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  } finally {
    conn.release();
  }
});

/**
 * POST /api/groups/join
 * body: { codeOrId }
 * For now, treat codeOrId as numeric group_id.
 */
router.post("/join", async (req: AuthedRequest, res) => {
  const { codeOrId } = req.body as { codeOrId?: string };
  const userId = req.userId!;
  if (!codeOrId) {
    return res.status(400).json({ error: "codeOrId is required" });
  }

  const groupId = Number(codeOrId);
  if (!Number.isFinite(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  try {
    // Ensure group exists
    const [gRows] = await pool.execute(
      "SELECT group_id FROM groups WHERE group_id = ?",
      [groupId]
    );
    if (Array.isArray(gRows) && gRows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Insert member if not already
    await pool.execute(
      `INSERT IGNORE INTO group_members (group_id, user_id, role)
       VALUES (?, ?, 'member')`,
      [groupId, userId]
    );

    res.json({ message: "Joined group", groupId });
  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ error: "Failed to join group" });
  }
});

/**
 * GET /api/groups/:groupId
 * single group info
 */
router.get("/:groupId", async (req: AuthedRequest, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT group_id AS groupId, group_name AS groupName
       FROM groups WHERE group_id = ?`,
      [groupId]
    );
    const arr = rows as any[];
    if (arr.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(arr[0]);
  } catch (err) {
    console.error("Get group error:", err);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

/**
 * GET /api/groups/:groupId/members
 */
router.get("/:groupId/members", async (req: AuthedRequest, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.user_id AS userId, u.name, u.email, gm.role
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = ?`,
      [req.params.groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get group members error:", err);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
});
