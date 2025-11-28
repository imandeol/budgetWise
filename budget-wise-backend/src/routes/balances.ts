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
 *
 * Combines:
 *  - flows from expenses/expense_splits
 *  - flows from settlements
 */
router.get("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        pf.other_user_id AS userId,
        u.name AS userName,
        SUM(pf.delta) AS amount
      FROM (
        -- 🔹 Flows from expenses
        SELECT
          CASE
            WHEN e.payer_id = ? THEN s.user_id
            WHEN s.user_id = ? THEN e.payer_id
          END AS other_user_id,
          CASE
            WHEN e.payer_id = ? AND s.user_id != ? THEN s.amount      -- you paid for them → they owe you (+)
            WHEN s.user_id = ? AND e.payer_id != ? THEN -s.amount     -- they paid for you → you owe them (-)
            ELSE 0
          END AS delta
        FROM expenses e
        JOIN expense_splits s ON s.expense_id = e.expense_id
        WHERE (e.payer_id = ? OR s.user_id = ?)

        UNION ALL

        -- 🔹 Flows from settlements
        SELECT
          CASE
            WHEN st.payer_id = ? THEN st.payee_id       -- you paid someone
            WHEN st.payee_id = ? THEN st.payer_id       -- they paid you
          END AS other_user_id,
          CASE
            WHEN st.payer_id = ? AND st.payee_id != ? THEN st.amount   -- you pay them → your debt reduced (move balance towards 0) → +
            WHEN st.payee_id = ? AND st.payer_id != ? THEN -st.amount  -- they pay you → their debt reduced → -
            ELSE 0
          END AS delta
        FROM settlements st
        WHERE (st.payer_id = ? OR st.payee_id = ?)
      ) AS pf
      JOIN users u ON u.user_id = pf.other_user_id
      WHERE pf.other_user_id IS NOT NULL
      GROUP BY pf.other_user_id, u.name
      HAVING SUM(pf.delta) <> 0
      ORDER BY u.name ASC
      `,
      [
        // expenses part (8)
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        // settlements part (8)
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
      ]
    );

    res.json(rows);
  } catch (err) {
    console.error("Balances error:", err);
    res.status(500).json({ error: "Failed to compute balances" });
  }
});
