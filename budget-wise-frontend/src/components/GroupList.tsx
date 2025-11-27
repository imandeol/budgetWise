import { Link } from "react-router-dom";
import type { Group } from "../types";

export default function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return <p className="text-muted">You have not joined any groups yet.</p>;
  }

  return (
    <ul className="group-list">
      {groups.map((g) => (
        <li key={g.groupId} className="group-list-item">
          <Link to={`/groups/${g.groupId}`}>{g.groupName}</Link>
        </li>
      ))}
    </ul>
  );
}
