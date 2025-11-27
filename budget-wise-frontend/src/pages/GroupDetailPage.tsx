import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchGroupExpenses } from "../api/groups";
import type { Expense, User } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";
import { api } from "../api/client";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const numericId = Number(groupId);
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState<string>("");

  const load = async () => {
    if (!numericId) return;

    const [expRes, membersRes, groupRes] = await Promise.all([
      fetchGroupExpenses(numericId),
      api.get(`/groups/${numericId}/members`),
      api.get(`/groups/${numericId}`),
    ]);

    setExpenses(expRes);
    setMembers(membersRes.data as User[]);
    setGroupName(groupRes.data.groupName ?? `Group ${numericId}`);
  };

  useEffect(() => {
    load();
  }, [numericId]);

  if (!user) return null;

  return (
    <div>
      <h1>{groupName}</h1>
      <p className="text-muted mt-1">View group expenses and add new ones.</p>

      {/* ----- Expenses Table Card ----- */}
      <div className="card mt-3">
        <h2>Expenses</h2>

        {expenses.length === 0 ? (
          <p className="text-muted mt-1">No expenses yet.</p>
        ) : (
          <table className="mt-2">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payer</th>
                <th>Description</th>
                <th>Category</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.expenseId}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.payerName}</td>
                  <td>{e.description || "-"}</td>
                  <td>{e.category || "—"}</td>
                  <td>{e.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ----- Add New Expense Card ----- */}
      <div className="card mt-3">
        <h2>Add an expense</h2>
        <p className="text-muted mb-2">
          Fill in the details below to record a new group expense.
        </p>

        <ExpenseForm
          groupId={numericId}
          currentUser={user}
          members={members}
          onCreated={load}
        />
      </div>
    </div>
  );
}
