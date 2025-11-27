import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchGroupExpenses } from "../api/groups";
import type { Expense, User } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import { useAuth } from "../context/AuthContext";
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

      <section style={{ marginBottom: 24 }}>
        <h2>Expenses</h2>
        {expenses.length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          <table>
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
                  <td>{e.date}</td>
                  <td>{e.payerName}</td>
                  <td>{e.description}</td>
                  <td>{e.category}</td>
                  <td>{e.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <ExpenseForm
          groupId={numericId}
          currentUser={user}
          members={members}
          onCreated={load}
        />
      </section>
    </div>
  );
}
