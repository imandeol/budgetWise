// src/routes/expenses.ts
import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

router.use(requireAuth);

/**
 * POST /api/expenses
 * body: { group_id, payer_id, date, category, description, cost, splits }
 * splits: [{ user_id, share_type, percentage, amount }]
 */
router.post("/", async (req: AuthedRequest, res) => {
  const { group_id, payer_id, date, category, description, cost, splits } =
    req.body;

  if (
    !group_id ||
    !payer_id ||
    !date ||
    !cost ||
    !Array.isArray(splits) ||
    splits.length === 0
  ) {
    return res.status(400).json({ error: "Missing required fields or splits" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [expenseResult] = await conn.execute(
      `INSERT INTO expenses (group_id, payer_id, date, category, description, cost)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [group_id, payer_id, date, category ?? null, description ?? null, cost]
    );

    const expenseId = (expenseResult as any).insertId;

    // If share_type = equal and amount not specified, compute equal share
    const equalSplits = splits.filter((s: any) => s.share_type === "equal");
    let equalAmount: number | null = null;
    if (equalSplits.length > 0) {
      equalAmount = Number(cost) / equalSplits.length;
    }

    for (const split of splits) {
      const shareType = split.share_type ?? "equal";
      let amount = split.amount ?? null;

      if (shareType === "equal") {
        amount = equalAmount;
      } else if (shareType === "percentage" && split.percentage != null) {
        amount = (Number(cost) * Number(split.percentage)) / 100;
      }

      await conn.execute(
        `INSERT INTO expense_splits (expense_id, user_id, share_type, percentage, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [expenseId, split.user_id, shareType, split.percentage ?? null, amount]
      );
    }

    await conn.commit();
    res.status(201).json({ expenseId });
  } catch (err) {
    await conn.rollback();
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Failed to create expense" });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/expenses/group/:groupId
 */
router.get("/group/:groupId", async (req: AuthedRequest, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.expense_id AS expenseId,
              e.group_id AS groupId,
              e.payer_id AS payerId,
              e.date,
              e.category,
              e.description,
              e.cost,
              u.name AS payerName
       FROM expenses e
       JOIN users u ON u.user_id = e.payer_id
       WHERE e.group_id = ?
       ORDER BY e.date DESC, e.expense_id DESC`,
      [req.params.groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch group expenses error:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});
