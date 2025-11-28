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
    <div className="app-shell">
      <nav className="sidebar">
        <h2>BudgetWise</h2>
        <p className="text-muted">Hi, {user?.name}</p>

        <div className="sidebar-links">
          <Link to="/">Dashboard</Link>
          <Link to="/balances">Balances</Link>
          <Link to="/tracking">Tracking</Link>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline logout-button"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
