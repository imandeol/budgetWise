import { api } from "./client";
import type { Group, Expense } from "../types";

export async function fetchMyGroups() {
  const res = await api.get("/groups/my");
  return res.data as Group[];
}

export async function createGroup(groupName: string) {
  const res = await api.post("/groups", { group_name: groupName });
  return res.data as { groupId: number };
}

export async function joinGroup(groupCodeOrId: string) {
  const res = await api.post(`/groups/join`, { codeOrId: groupCodeOrId });
  return res.data;
}

export async function fetchGroupExpenses(groupId: number) {
  const res = await api.get(`/expenses/group/${groupId}`);
  return res.data as Expense[];
}
