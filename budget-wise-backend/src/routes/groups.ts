import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

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
       JOIN groups_table g ON g.group_id = gm.group_id
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
      `INSERT INTO groups_table (group_name) VALUES (?)`,
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
    const [gRows] = await pool.execute(
      "SELECT group_id FROM groups_table WHERE group_id = ?",
      [groupId]
    );
    if (Array.isArray(gRows) && gRows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

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
       FROM groups_table WHERE group_id = ?`,
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

/**
 * POST /api/groups/:groupId/members
 * body: { email }
 * Adds an existing user (by email) to the group as 'member'.
 * Requires that the current user is a member of that group (optionally admin).
 */
router.post("/:groupId/members", async (req: AuthedRequest, res) => {
  const { groupId } = req.params;
  const { email } = req.body as { email?: string };
  const currentUserId = req.userId!;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const numericGroupId = Number(groupId);
  if (!Number.isFinite(numericGroupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [membershipRows] = await conn.execute(
      `SELECT role
       FROM group_members
       WHERE group_id = ? AND user_id = ?`,
      [numericGroupId, currentUserId]
    );
    const membershipArr = membershipRows as { role: string }[];

    if (membershipArr.length === 0) {
      await conn.rollback();
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // if (membershipArr[0].role !== "admin") {
    //   await conn.rollback();
    //   return res.status(403).json({ error: "Only admins can add members" });
    // }

    const [userRows] = await conn.execute(
      `SELECT user_id AS userId, name, email
       FROM users
       WHERE email = ?`,
      [email]
    );
    const usersArr = userRows as {
      userId: number;
      name: string;
      email: string;
    }[];

    if (usersArr.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "User with this email not found" });
    }

    const userToAdd = usersArr[0];

    await conn.execute(
      `INSERT IGNORE INTO group_members (group_id, user_id, role)
       VALUES (?, ?, 'member')`,
      [numericGroupId, userToAdd.userId]
    );

    await conn.commit();

    res.status(201).json({
      message: "User added to group",
      member: {
        userId: userToAdd.userId,
        name: userToAdd.name,
        email: userToAdd.email,
        role: "member",
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error("Add group member error:", err);
    res.status(500).json({ error: "Failed to add member to group" });
  } finally {
    conn.release();
  }
});
