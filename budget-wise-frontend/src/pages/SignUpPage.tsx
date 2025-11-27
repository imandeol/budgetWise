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
      setError(err.response?.data?.error || "Failed to sign up");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto" }}>
      <h1>Sign Up</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Create account</button>
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </div>
  );
}
