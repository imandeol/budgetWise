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
      setError(err?.response?.data?.error || "Failed to load groups");
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
      setError(err?.response?.data?.error || "Failed to create group");
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
      setError(err?.response?.data?.error || "Failed to join group");
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="text-muted mt-1">
        See your groups, create new ones, or join with a code.
      </p>

      {error && (
        <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>{error}</p>
      )}

      <div className="card mt-3">
        <h2>Your groups</h2>
        <GroupList groups={groups} />
      </div>

      <div
        className="card mt-3"
        style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        <form onSubmit={handleCreateGroup} style={{ flex: 1, minWidth: 220 }}>
          <h3>Create new group</h3>
          <p className="text-muted mb-2">
            Start a group to split expenses with friends or roommates.
          </p>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
          />
          <button type="submit" className="btn-primary mt-2">
            Create
          </button>
        </form>

        <form onSubmit={handleJoinGroup} style={{ flex: 1, minWidth: 220 }}>
          <h3>Join group</h3>
          <p className="text-muted mb-2">
            Enter a group id or code shared with you.
          </p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Group code or id"
          />
          <button type="submit" className="btn-primary mt-2">
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
