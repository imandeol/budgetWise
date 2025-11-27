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
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <h3>Add expense</h3>
      <input
        type="number"
        step="0.01"
        value={cost}
        onChange={(e) => setCost(parseFloat(e.target.value))}
        placeholder="Amount"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category (e.g. Food, Travel)"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button type="submit">Add</button>
    </form>
  );
}
