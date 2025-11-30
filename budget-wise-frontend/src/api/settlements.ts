import { api } from "./client";

interface NewSettlementPayload {
  groupId: number;
  payeeId: number;
  amount: number;
  date: string;
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
