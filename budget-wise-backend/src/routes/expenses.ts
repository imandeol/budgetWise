import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const router = Router();

router.use(requireAuth);

/**
 * POST /api/expenses
 * body: {
 *   groupId,
 *   payerId,
 *   date,
 *   category,
 *   description,
 *   cost,
 *   splits: [
 *     { userId, shareType: "equal" | "percentage" | "exact", percentage?, amount? }
 *   ]
 * }
 */
router.post("/", async (req: AuthedRequest, res) => {
  const { groupId, payerId, date, category, description, cost, splits } =
    req.body as {
      groupId: number;
      payerId: number;
      date: string;
      category?: string;
      description?: string;
      cost: number;
      splits: {
        userId: number;
        shareType?: "equal" | "percentage" | "exact";
        percentage?: number | null;
        amount?: number | null;
      }[];
    };

  if (
    !groupId ||
    !payerId ||
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
      [groupId, payerId, date, category ?? null, description ?? null, cost]
    );
    const expenseId = (expenseResult as any).insertId;

    const equalSplits = splits.filter(
      (s) => (s.shareType ?? "equal") === "equal"
    );
    let equalAmount: number | null = null;
    if (equalSplits.length > 0) {
      equalAmount = Number(cost) / equalSplits.length;
    }

    for (const split of splits) {
      if (!split.userId) {
        throw new Error("Split is missing userId");
      }

      const shareType: "equal" | "percentage" | "exact" =
        (split.shareType as any) ?? "equal";

      let percentage: number | null | undefined = split.percentage;
      let amount: number | null | undefined = split.amount;

      if (shareType === "equal") {
        amount = equalAmount;
        percentage = null;
      } else if (shareType === "percentage" && split.percentage != null) {
        percentage = Number(split.percentage);
        amount = (Number(cost) * percentage) / 100;
      } else if (shareType === "exact") {
        amount = split.amount ?? null;
        percentage = null;
      }

      const percentageDb = percentage == null ? null : percentage;
      const amountDb = amount == null ? null : amount;

      await conn.execute(
        `INSERT INTO expense_splits (expense_id, user_id, share_type, percentage, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [expenseId, split.userId, shareType, percentageDb, amountDb]
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
