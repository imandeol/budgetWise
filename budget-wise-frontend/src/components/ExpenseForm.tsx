import { type FormEvent, useState } from "react";
import { createExpense } from "../api/expenses";
import type { User } from "../types";

interface Props {
  groupId: number;
  currentUser: User;
  members: User[];
  onCreated: () => void;
}

export default function ExpenseForm({
  groupId,
  currentUser,
  members,
  onCreated,
}: Props) {
  const [cost, setCost] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!cost || cost <= 0) return;

    const splits = members.map((m) => ({
      userId: m.userId,
      shareType: "equal" as const,
    }));

    await createExpense({
      groupId,
      payerId: currentUser.userId,
      date: new Date().toISOString().slice(0, 10),
      category,
      description,
      cost,
      splits,
    });

    setCost(0);
    setCategory("");
    setDescription("");
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add expense</h3>

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
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Food, Travel"
        />
      </label>

      <label className="text-muted">
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note"
        />
      </label>

      <button type="submit" className="btn-primary mt-2">
        Add expense
      </button>
    </form>
  );
}
