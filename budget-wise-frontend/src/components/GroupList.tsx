import { Link } from "react-router-dom";
import type { Group } from "../types";

export default function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) return <p>You have not joined any groups yet.</p>;

  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {groups.map((g) => (
        <li
          key={g.groupId}
          style={{ border: "1px solid #ddd", padding: 8, borderRadius: 4 }}
        >
          <Link to={`/groups/${g.groupId}`}>{g.groupName}</Link>
        </li>
      ))}
    </ul>
  );
}
