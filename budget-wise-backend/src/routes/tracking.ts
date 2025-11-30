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
 *   total: number,
 *   spentByYou: number,
 *   monthly: [{ year, month, total }]
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
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expense_splits
      WHERE user_id = ?
      `,
      [userId]
    );
    const total = (totalRows as any[])[0]?.total ?? 0;

    const [spentRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(cost), 0) AS spentByYou
      FROM expenses
      WHERE payer_id = ?
      `,
      [userId]
    );
    const spentByYou = (spentRows as any[])[0]?.spentByYou ?? 0;

    const [monthlyRows] = await pool.execute(
      `
      SELECT
        YEAR(e.date) AS year,
        MONTH(e.date) AS month,
        SUM(s.amount) AS total
      FROM expense_splits s
      JOIN expenses e ON e.expense_id = s.expense_id
      WHERE s.user_id = ?
      GROUP BY YEAR(e.date), MONTH(e.date)
      ORDER BY year, month
      `,
      [userId]
    );

    res.json({
      categories: catRows,
      total,
      spentByYou,
      monthly: monthlyRows,
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to compute tracking data" });
  }
});
