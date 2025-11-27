import { useEffect, useState, type FormEvent } from "react";
import { fetchMyGroups, createGroup, joinGroup } from "../api/groups";
import type { Group } from "../types";
import GroupList from "../components/GroupList";

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchMyGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load groups");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newGroupName.trim()) return;
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create group");
    }
  };

  const handleJoinGroup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!joinCode.trim()) return;
    try {
      await joinGroup(joinCode.trim());
      setJoinCode("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to join group");
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: 24 }}>
        <h2>Your groups</h2>
        <GroupList groups={groups} />
      </section>

      <section style={{ display: "flex", gap: 32 }}>
        <form onSubmit={handleCreateGroup}>
          <h3>Create new group</h3>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
          />
          <button type="submit">Create</button>
        </form>

        <form onSubmit={handleJoinGroup}>
          <h3>Join group</h3>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Group code or id"
          />
          <button type="submit">Join</button>
        </form>
      </section>
    </div>
  );
}
