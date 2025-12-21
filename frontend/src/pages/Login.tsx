import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"admin" | "rider">("admin");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const u = await login(username, password);
      nav(u.role === "rider" ? "/rider" : "/admin");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-hero">
          <div className="hero-badge">
            <span className="status-dot" />
            RiderFlow
          </div>
          <h1>Admin Dashboard</h1>
          <p className="hero-lead">Track and manage your riders attendance and live status.</p>

          <div className="hero-grid">
            <div className="hero-card metric">
              <span className="card-title">Today</span>
              <div className="card-value">128</div>
              <span className="card-sub">Active riders</span>
            </div>

            <div className="hero-card status">
              <span className="card-title">Live Status</span>
              <div className="chip-row">
                <span className="chip">Online</span>
                <span className="chip">Delivery</span>
                <span className="chip">Break</span>
              </div>
              <span className="card-sub">Updated in real-time</span>
            </div>
          </div>

          <div className="hero-card performance">
            <span className="card-title">Performance</span>
            <svg viewBox="0 0 260 90" aria-hidden="true">
              <path d="M5 65 C40 45, 70 75, 110 55 S185 40, 240 55" />
            </svg>
          </div>
        </section>

        <section className="login-panel">
          <div className="panel-tabs" role="tablist" aria-label="Login role">
            <button
              type="button"
              className={`tab ${mode === "admin" ? "active" : ""}`}
              onClick={() => setMode("admin")}
              aria-pressed={mode === "admin"}
            >
              Admin
            </button>
            <button
              type="button"
              className={`tab ${mode === "rider" ? "active" : ""}`}
              onClick={() => setMode("rider")}
              aria-pressed={mode === "rider"}
            >
              Rider
            </button>
          </div>

          <div className="panel-header">
            <h2>
              Welcome back{" "}
              <span className="wave" aria-hidden="true">
                {"\uD83D\uDC4B"}
              </span>
            </h2>
            <p className="login-sub">Login to continue as {mode}</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="form-field">
              <span className="field-label">Username</span>
              <div className="input-wrap">
                <input
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="form-field">
              <span className="field-label">Password</span>
              <div className="input-wrap">
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </label>

            {err && <div className="alert">{err}</div>}

            <button className="primary-btn" type="submit">
              Login
            </button>
            <button className="link-btn" type="button">
              Forgot Password?
            </button>
          </form>

          <p className="footnote">
            Admin access only. Keep your token safe{" "}
            <span aria-hidden="true">{"\uD83D\uDD10"}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
