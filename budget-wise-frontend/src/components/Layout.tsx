import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 240,
          padding: "1rem",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <h2>BudgetWise</h2>
        <p style={{ fontSize: 14 }}>Hi, {user?.name}</p>
        <Link to="/">Dashboard</Link>
        <Link to="/balances">Who owes whom</Link>
        <Link to="/tracking">Tracking</Link>
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            background: "transparent",
            border: "none",
            color: "red",
          }}
        >
          Logout
        </button>
      </nav>
      <main style={{ flex: 1, padding: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
