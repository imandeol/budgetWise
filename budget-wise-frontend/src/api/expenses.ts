import { api } from "./client";

interface NewExpensePayload {
  groupId: number;
  payerId: number;
  date: string;
  category?: string;
  description?: string;
  cost: number;
  splits: {
    userId: number;
    shareType?: string;
    percentage?: number;
    amount?: number;
  }[];
}

export async function createExpense(payload: NewExpensePayload) {
  const res = await api.post("/expenses", {
    group_id: payload.groupId,
    payer_id: payload.payerId,
    date: payload.date,
    category: payload.category,
    description: payload.description,
    cost: payload.cost,
    splits: payload.splits.map((s) => ({
      user_id: s.userId,
      share_type: s.shareType ?? "equal",
      percentage: s.percentage ?? null,
      amount: s.amount ?? null,
    })),
  });

  return res.data as { expenseId: number };
}
