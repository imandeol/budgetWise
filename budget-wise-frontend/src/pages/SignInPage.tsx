import { type FormEvent, useState } from "react";
import { signIn } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn: saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { user, token } = await signIn(email, password);
      saveAuth(user, token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to sign in");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in to BudgetWise</h1>
        <p className="text-muted mb-3">
          Track expenses with your groups and see who owes whom.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="text-muted">
            Email
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="text-muted">
            Password
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p style={{ color: "red", marginTop: "0.25rem" }}>{error}</p>
          )}

          <button type="submit" className="btn-primary mt-2">
            Sign In
          </button>
        </form>

        <p className="text-muted mt-3">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
