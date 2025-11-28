// src/api/settlements.ts
import { api } from "./client";

interface NewSettlementPayload {
  groupId: number;
  payeeId: number; // who you are paying
  amount: number;
  date: string; // "YYYY-MM-DD"
}

export async function createSettlement(payload: NewSettlementPayload) {
  const res = await api.post("/settlements", {
    groupId: payload.groupId,
    payeeId: payload.payeeId,
    amount: payload.amount,
    date: payload.date,
  });

  return res.data as { settlementId: number };
}
