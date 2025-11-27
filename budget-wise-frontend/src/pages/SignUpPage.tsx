import { type FormEvent, useState } from "react";
import { signUp } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn: saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { user, token } = await signUp(name, email, password);
      saveAuth(user, token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to sign up");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your BudgetWise account</h1>
        <p className="text-muted mb-3">
          Split expenses with friends and keep your balances clear.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="text-muted">
            Name
            <input
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

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
              placeholder="Choose a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p style={{ color: "red", marginTop: "0.25rem" }}>{error}</p>
          )}

          <button type="submit" className="btn-primary mt-2">
            Create account
          </button>
        </form>

        <p className="text-muted mt-3">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
