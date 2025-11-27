export interface User {
  userId: number;
  name: string;
  email: string;
}

export interface Group {
  groupId: number;
  groupName: string;
}

export interface Expense {
  expenseId: number;
  groupId: number;
  payerId: number;
  date: string;
  category: string | null;
  description: string | null;
  cost: number;
  payerName?: string;
}

export interface ExpenseSplit {
  expenseId: number;
  userId: number;
  shareType: "equal" | "percentage" | "exact";
  percentage?: number | null;
  amount?: number | null;
}

export interface BalanceRow {
  userId: number;
  userName: string;
  amount: number; // positive -> they owe you, negative -> you owe them
}

export interface CategorySpend {
  category: string;
  total: number; // total spent in that category based on user's split
}
