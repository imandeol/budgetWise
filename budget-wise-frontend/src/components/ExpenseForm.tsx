import { type FormEvent, useMemo, useEffect, useState } from "react";
import { createExpense } from "../api/expenses";
import { CATEGORY_OPTIONS, type User } from "../types";

interface Props {
  groupId: number;
  currentUser: User;
  members: User[];
  onCreated: () => void;
}

type SplitMode = "equal" | "percentage" | "amount";

export default function ExpenseForm({
  groupId,
  currentUser,
  members,
  onCreated,
}: Props) {
  const [cost, setCost] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [payerId, setPayerId] = useState<number>(currentUser.userId);

  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [percentages, setPercentages] = useState<number[]>([]);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [splitError, setSplitError] = useState<string | null>(null);

  // Ensure current user is present in options (in case members list is out of sync)
  const payerOptions = useMemo(() => {
    const ids = new Set(members.map((m) => m.userId));
    if (!ids.has(currentUser.userId)) {
      return [currentUser, ...members];
    }
    return members;
  }, [members, currentUser]);

  // Keep percentages/amounts array in sync with members length
  useEffect(() => {
    setPercentages((prev) => {
      if (prev.length === members.length) return prev;
      return members.map((_, i) => prev[i] ?? 0);
    });
    setAmounts((prev) => {
      if (prev.length === members.length) return prev;
      return members.map((_, i) => prev[i] ?? 0);
    });
  }, [members]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSplitError(null);

    if (!cost || cost <= 0) {
      setSplitError("Please enter a valid amount.");
      return;
    }
    if (!date) {
      setSplitError("Please choose a date.");
      return;
    }
    if (!payerId) {
      setSplitError("Please select a payer.");
      return;
    }

    let splits: {
      userId: number;
      shareType: "equal" | "percentage" | "exact";
      percentage?: number;
      amount?: number;
    }[] = [];

    if (splitMode === "equal") {
      // Backend will compute equal shares from cost and members count
      splits = members.map((m) => ({
        userId: m.userId,
        shareType: "equal",
      }));
    } else if (splitMode === "percentage") {
      const sum = percentages.reduce((acc, v) => acc + (v || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setSplitError("Total percentage must be exactly 100%.");
        return;
      }
      splits = members.map((m, idx) => ({
        userId: m.userId,
        shareType: "percentage",
        percentage: percentages[idx] || 0,
      }));
    } else if (splitMode === "amount") {
      const sum = amounts.reduce((acc, v) => acc + (v || 0), 0);
      if (Math.abs(sum - cost) > 0.01) {
        setSplitError("Total of amounts must equal the expense amount.");
        return;
      }
      splits = members.map((m, idx) => ({
        userId: m.userId,
        shareType: "exact",
        amount: amounts[idx] || 0,
      }));
    }

    await createExpense({
      groupId,
      payerId,
      date,
      category,
      description,
      cost,
      splits,
    });

    // Reset form
    setCost(0);
    setCategory("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setPayerId(currentUser.userId);
    setPercentages(members.map(() => 0));
    setAmounts(members.map(() => 0));
    setSplitMode("equal");
    onCreated();
  };

  const handlePercentageChange = (index: number, value: string) => {
    const parsed = value === "" ? 0 : parseFloat(value);
    setPercentages((prev) => {
      const next = [...prev];
      next[index] = isNaN(parsed) ? 0 : parsed;
      return next;
    });
  };

  const handleAmountChange = (index: number, value: string) => {
    const parsed = value === "" ? 0 : parseFloat(value);
    setAmounts((prev) => {
      const next = [...prev];
      next[index] = isNaN(parsed) ? 0 : parsed;
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add expense</h3>

      <label className="text-muted">
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="text-muted">
        Payer
        <select
          value={payerId}
          onChange={(e) => setPayerId(Number(e.target.value))}
        >
          {payerOptions.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </label>

      <label className="text-muted">
        Amount
        <input
          type="number"
          step="0.01"
          value={cost || ""}
          onChange={(e) =>
            setCost(e.target.value === "" ? 0 : parseFloat(e.target.value))
          }
          placeholder="Amount"
        />
      </label>

      <label className="text-muted">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1"
        >
          <option value="">Select category</option>

          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {category === "Other" && (
          <input
            className="mt-2"
            placeholder="Enter custom category"
            onChange={(e) => setCategory(e.target.value)}
          />
        )}
      </label>

      <label className="text-muted">
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note"
        />
      </label>

      {/* ----- Split mode selection ----- */}
      <div className="mt-3">
        <p className="text-muted">Split between members</p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            marginTop: "0.25rem",
          }}
        >
          <label style={{ marginBottom: 10 }}>
            <span>Split equally between all members</span>
            <input
              type="radio"
              name="splitMode"
              value="equal"
              checked={splitMode === "equal"}
              onChange={() => setSplitMode("equal")}
              style={{ marginRight: "0.4rem", marginTop: "-1.4rem" }}
            />
          </label>

          <label style={{ marginBottom: 10 }}>
            Split by percentage share
            <input
              type="radio"
              name="splitMode"
              value="percentage"
              checked={splitMode === "percentage"}
              onChange={() => setSplitMode("percentage")}
              style={{ marginRight: "0.4rem", marginTop: "-1.4rem" }}
            />
          </label>

          <label>
            <span>Split by exact amount</span>
            <input
              type="radio"
              name="splitMode"
              value="amount"
              checked={splitMode === "amount"}
              onChange={() => setSplitMode("amount")}
              style={{ marginRight: "0.4rem", marginTop: "-1.4rem" }}
            />
          </label>
        </div>
      </div>

      {/* ----- Percentage split inputs ----- */}
      {splitMode === "percentage" && (
        <div className="mt-2">
          <p className="text-muted">
            Enter percentage share for each member (must total 100%).
          </p>
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            {members.map((m, idx) => (
              <div
                key={m.userId}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ flex: 1 }}>{m.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={percentages[idx] ?? 0}
                  onChange={(e) => handlePercentageChange(idx, e.target.value)}
                  style={{ width: "90px" }}
                />
                <span>%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----- Amount split inputs ----- */}
      {splitMode === "amount" && (
        <div className="mt-2">
          <p className="text-muted">
            Enter amount for each member (total must equal the expense amount).
          </p>
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            {members.map((m, idx) => (
              <div
                key={m.userId}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ flex: 1 }}>{m.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={amounts[idx] ?? 0}
                  onChange={(e) => handleAmountChange(idx, e.target.value)}
                  style={{ width: "120px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {splitError && (
        <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>{splitError}</p>
      )}

      <button type="submit" className="btn-primary mt-2">
        Add expense
      </button>
    </form>
  );
}
