import { useEffect, useState } from "react";
import { fetchBalances } from "../api/summary";
import { createSettlement } from "../api/settlements";
import type { BalanceRow } from "../types";

export default function BalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleAmounts, setSettleAmounts] = useState<Record<number, string>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchBalances();
      setRows(data);
    } catch (err: any) {
      console.error("Failed to load balances", err);
      setError(err?.response?.data?.error || "Failed to load balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const youOwe = rows.filter((r) => r.amount < 0);
  const owedToYou = rows.filter((r) => r.amount > 0);

  const handleSettle = async (row: BalanceRow) => {
    setError(null);
    const key = row.userId;
    const currentOwe = Math.abs(row.amount);
    const valueStr = settleAmounts[key] ?? currentOwe.toString();
    const amount = parseFloat(valueStr);

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount to pay.");
      return;
    }
    if (amount > currentOwe + 0.01) {
      setError("Payment amount cannot exceed what you owe.");
      return;
    }

    try {
      await createSettlement({
        groupId: row.groupId,
        payeeId: row.userId,
        amount,
        date: new Date().toISOString().slice(0, 10),
      });

      await load();
    } catch (err: any) {
      console.error("Failed to create settlement", err);
      setError(err?.response?.data?.error || "Failed to record payment");
    }
  };

  if (loading && rows.length === 0) {
    return <p>Loading balances...</p>;
  }

  return (
    <div>
      <h1>Who owes whom</h1>
      <p className="text-muted mt-1">
        See your balances with other group members.
      </p>

      {error && (
        <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>{error}</p>
      )}

      <div className="card mt-3">
        <h2>You owe</h2>
        {youOwe.length === 0 ? (
          <p className="text-muted mt-1">You don&apos;t owe anyone 🎉</p>
        ) : (
          <ul
            style={{ marginTop: "0.5rem", paddingLeft: 0, listStyle: "none" }}
          >
            {youOwe.map((r) => {
              const key = r.userId;
              const defaultAmount = Math.abs(r.amount);
              const value = settleAmounts[key] ?? defaultAmount.toString();

              return (
                <li
                  key={r.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {r.userName}: {"$" + defaultAmount}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ color: "#555" }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={defaultAmount}
                      value={value}
                      onChange={(e) =>
                        setSettleAmounts((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      style={{ width: "80px" }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void handleSettle(r)}
                  >
                    Pay
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card mt-3">
        <h2>Owes you</h2>
        {owedToYou.length === 0 ? (
          <p className="text-muted mt-1">No one owes you right now.</p>
        ) : (
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            {owedToYou.map((r) => (
              <li key={r.userId}>
                {r.userName}: {"$" + r.amount}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
