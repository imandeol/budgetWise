import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchGroupExpenses } from "../api/groups";
import type { Expense, User } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";
import { api } from "../api/client";

const PAGE_SIZE = 10;

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const numericId = Number(groupId);
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState<string>("");

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

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
    void load();
  }, [numericId]);

  // Make sure currentPage is always valid when expenses change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [expenses, currentPage]);

  if (!user) return null;

  const handleExpenseCreated = async () => {
    await load();
    // After adding an expense, jump to first page (assuming newest first)
    setCurrentPage(1);
    setShowAddExpense(false);
  };

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!numericId) return;

    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email.");
      return;
    }

    try {
      setInviteLoading(true);
      await api.post(`/groups/${numericId}/members`, {
        email: inviteEmail.trim(),
      });

      setInviteEmail("");
      setShowAddUser(false);
      await load();
    } catch (err: any) {
      console.error("Failed to add user to group:", err);
      setInviteError(
        err?.response?.data?.error || "Failed to add user to the group"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  // ---- Pagination derived values ----
  const totalExpenses = expenses.length;
  const totalPages = Math.max(1, Math.ceil(totalExpenses / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalExpenses);
  const paginatedExpenses = expenses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <h1 style={{ margin: 0 }}>{groupName}</h1>

            {/* Info "i" icon button */}
            <button
              type="button"
              onClick={() => setShowGroupInfo(true)}
              aria-label="Group info"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "999px",
                border: "1px solid #d4d4d4",
                background: "#f3f4f6",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#4b5563",
                padding: 0,
              }}
            >
              i
            </button>
          </div>

          <p className="text-muted mt-1">
            View group expenses and manage members.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            style={{
              backgroundColor: "white",
              color: "#111827",
              border: "1px solid #092041ff",
            }}
            onClick={() => setShowAddUser(true)}
          >
            Add user
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddExpense(true)}
          >
            Add expense
          </button>
        </div>
      </div>

      {/* Expenses */}
      <div className="card mt-3">
        <h2>Expenses</h2>

        {totalExpenses === 0 ? (
          <p className="text-muted mt-1">No expenses yet.</p>
        ) : (
          <>
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
                {paginatedExpenses.map((e) => (
                  <tr key={e.expenseId}>
                    <td>{formatDate(e.date)}</td>
                    <td>{e.payerName}</td>
                    <td>{e.description || "-"}</td>
                    <td>{e.category || "—"}</td>
                    <td>{"$ " + e.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer – always shown when there are expenses */}
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <p className="text-muted" style={{ margin: 0 }}>
                Showing {startIndex + 1}–{endIndex} expenses of {totalExpenses}{" "}
                total
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddExpense && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "1.5rem 1.75rem",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              backgroundColor: "white",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                position: "sticky",
                top: 0,
                background: "white",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #eee",
                zIndex: 5,
              }}
            >
              <h2 style={{ margin: 0 }}>Add an expense</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddExpense(false)}
              >
                Close
              </button>
            </div>

            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
              Fill in the details below to record a new expense.
            </p>

            <ExpenseForm
              groupId={numericId}
              currentUser={user}
              members={members}
              onCreated={handleExpenseCreated}
            />
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 400 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Add user to group</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddUser(false);
                  setInviteError(null);
                }}
              >
                Close
              </button>
            </div>

            <p className="text-muted mb-2">
              Enter the email of the user you want to add to this group.
            </p>

            <form onSubmit={handleInviteSubmit}>
              <label className="text-muted">
                User email
                <input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </label>

              {inviteError && (
                <p style={{ color: "#b91c1c", marginTop: "0.25rem" }}>
                  {inviteError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary mt-2"
                disabled={inviteLoading}
              >
                {inviteLoading ? "Adding..." : "Add to group"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GROUP INFO MODAL */}
      {showGroupInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 60,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "70vh",
              overflowY: "auto",
              padding: "1.5rem 1.75rem",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Group info</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowGroupInfo(false)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p className="text-muted" style={{ marginBottom: "0.25rem" }}>
                Group name
              </p>
              <p style={{ fontWeight: 500 }}>{groupName}</p>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <h3
                style={{
                  margin: 0,
                  marginBottom: "0.5rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Members
              </h3>

              {members.length === 0 ? (
                <p className="text-muted">No members found.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    paddingLeft: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {members.map((m) => (
                    <li
                      key={m.userId}
                      style={{
                        fontSize: "1rem",
                        padding: "0.4rem 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#111827" }}>
                        {m.name || m.email}
                      </span>

                      <span style={{ color: "#4b5563", marginLeft: "4px" }}>
                        ({m.email})
                      </span>

                      <span style={{ marginLeft: "6px", color: "#6b7280" }}>
                        {"→"} {m.role === "admin" ? "Admin" : "Member"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
