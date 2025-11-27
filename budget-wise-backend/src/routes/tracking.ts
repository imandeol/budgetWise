// src/routes/tracking.ts
import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

router.use(requireAuth);

/**
 * GET /api/tracking
 * Returns:
 * {
 *   categories: [{ category, total }],
 *   total: number
 * }
 */
router.get("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  try {
    const [catRows] = await pool.execute(
      `
      SELECT
        COALESCE(e.category, 'Uncategorized') AS category,
        SUM(s.amount) AS total
      FROM expense_splits s
      JOIN expenses e ON e.expense_id = s.expense_id
      WHERE s.user_id = ?
      GROUP BY COALESCE(e.category, 'Uncategorized')
      ORDER BY total DESC
      `,
      [userId]
    );

    const [totalRows] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expense_splits
       WHERE user_id = ?`,
      [userId]
    );

    const total = (totalRows as any[])[0]?.total ?? 0;

    res.json({
      categories: catRows,
      total,
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to compute tracking data" });
  }
});
