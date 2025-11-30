import { api } from "./client";
import type { BalanceRow, CategorySpend } from "../types";

export async function fetchBalances() {
  const res = await api.get("/balances");
  return res.data as BalanceRow[];
}

export async function fetchTracking() {
  const res = await api.get("/tracking");
  return res.data as {
    total: number;
    spentByYou: number;
    categories: CategorySpend[];
    monthly?: { year: number; month: number; total: number }[];
  };
}
