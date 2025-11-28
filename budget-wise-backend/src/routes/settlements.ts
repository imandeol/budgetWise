import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

router.use(requireAuth);

/**
 * POST /api/settlements
 * body: { payeeId, amount, date }
 * payerId comes from authenticated user (req.userId)
 *
 * We auto-detect a groupId as:
 *  - any group where both payer and payee are members
 */
router.post("/", async (req: AuthedRequest, res) => {
  const { payeeId, amount, date } = req.body as {
    payeeId: number;
    amount: number;
    date: string;
  };

  const payerId = req.userId!;

  if (!payeeId || !amount || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1) Find any group both users belong to
    const [groups] = await pool.execute(
      `
      SELECT gm1.group_id
      FROM group_members gm1
      JOIN group_members gm2
        ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = ? AND gm2.user_id = ?
      LIMIT 1
      `,
      [payerId, payeeId]
    );

    const rows = groups as { group_id: number }[];

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ error: "No common group found between these users" });
    }

    const groupId = rows[0].group_id;

    // 2) Insert settlement
    const [result] = await pool.execute(
      `INSERT INTO settlements (group_id, payer_id, payee_id, amount, date)
       VALUES (?, ?, ?, ?, ?)`,
      [groupId, payerId, payeeId, amount, date]
    );

    const settlementId = (result as any).insertId;
    res.status(201).json({ settlementId });
  } catch (err) {
    console.error("Error creating settlement:", err);
    res.status(500).json({ error: "Failed to record settlement" });
  }
});
