// src/routes/balances.ts
import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

router.use(requireAuth);

/**
 * GET /api/balances
 * Returns [{ userId, userName, amount }]
 * amount > 0 => they owe you
 * amount < 0 => you owe them
 */
router.get("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        b.other_user_id AS userId,
        u.name AS userName,
        b.balance AS amount
      FROM (
        SELECT
          CASE
            WHEN e.payer_id = ? THEN s.user_id
            WHEN s.user_id = ? THEN e.payer_id
          END AS other_user_id,
          SUM(
            CASE
              WHEN e.payer_id = ? AND s.user_id != ? THEN s.amount
              WHEN s.user_id = ? AND e.payer_id != ? THEN -s.amount
              ELSE 0
            END
          ) AS balance
        FROM expenses e
        JOIN expense_splits s ON s.expense_id = e.expense_id
        WHERE (e.payer_id = ? OR s.user_id = ?)
        GROUP BY other_user_id
      ) AS b
      JOIN users u ON u.user_id = b.other_user_id
      WHERE b.other_user_id IS NOT NULL
        AND b.balance IS NOT NULL
        AND b.balance <> 0
      ORDER BY userName ASC
      `,
      [userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Balances error:", err);
    res.status(500).json({ error: "Failed to compute balances" });
  }
});
