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
  const { groupId, payerId, date, category, description, cost } = payload;
  const res = await api.post("/expenses", {
    groupId,
    payerId,
    date,
    category,
    description,
    cost,
    splits: payload.splits.map((s) => ({
      userId: s.userId,
      shareType: s.shareType ?? "equal",
      percentage: s.percentage ?? null,
      amount: s.amount ?? null,
    })),
  });

  return res.data as { expenseId: number };
}
