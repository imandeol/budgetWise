import { useEffect, useState } from "react";
import { fetchBalances } from "../api/summary";
import type { BalanceRow } from "../types";

export default function BalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetchBalances();
      setRows(data);
    })();
  }, []);

  const youOwe = rows.filter((r) => r.amount < 0);
  const owedToYou = rows.filter((r) => r.amount > 0);

  return (
    <div>
      <h1>Who owes whom</h1>
      <p className="text-muted mt-1">
        See your balances with other group members.
      </p>

      <div className="card mt-3">
        <h2>You owe</h2>
        {youOwe.length === 0 ? (
          <p className="text-muted mt-1">You don&apos;t owe anyone 🎉</p>
        ) : (
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            {youOwe.map((r) => (
              <li key={r.userId}>
                {r.userName}: {(-r.amount).toFixed(2)}
              </li>
            ))}
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
                {r.userName}: {r.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
