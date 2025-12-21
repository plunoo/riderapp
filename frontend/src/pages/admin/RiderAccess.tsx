import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../components/Layout/Topbar";
import { useAuth } from "../../auth/AuthContext";

export default function RiderAccess() {
  const { login, user: currentUser } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isPrime = useMemo(() => currentUser?.role === "prime_admin", [currentUser]);
  const isSub = useMemo(() => currentUser?.role === "sub_admin", [currentUser]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isPrime && !isSub) {
      setErr("Only prime or sub admins can use this access page.");
      return;
    }
    setLoading(true);
    try {
      // prime or sub admin uses impersonate endpoint
      const res = await api.post("/auth/impersonate", { username, password });
      const { token, user: target } = res.data as { token: string; user: any };
      if (target.role === "rider") {
        if (isSub && currentUser?.id && target.manager_id !== Number(currentUser.id)) {
          setErr("You can only access riders you manage.");
        } else {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(target));
          nav("/rider");
        }
      } else if (target.role === "sub_admin") {
        if (isPrime) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(target));
          nav("/admin");
        } else {
          setErr("Sub admins cannot impersonate other sub admins.");
        }
      } else {
        setErr("Only sub admin or rider accounts can be impersonated here.");
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Topbar title="Rider Access" />

      <div style={hero}>
        <div>
          <div style={pill}>Impersonate rider</div>
          <h2 style={{ margin: "8px 0 4px 0" }}>Rider login (admin)</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>Use rider credentials to view their dashboard, queue, and status.</p>
        </div>
        <div style={heroBadge}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Secure</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Admin-only</div>
        </div>
      </div>

      <div style={statGrid}>
        {[
          { label: "Queue view", value: "Live", color: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
          { label: "Rider status", value: "Realtime", color: "linear-gradient(135deg,#f97316,#ef4444)" },
          { label: "Scope", value: "Read-only", color: "linear-gradient(135deg,#22c55e,#16a34a)" },
        ].map((s) => (
          <div key={s.label} style={{ ...statCard, background: s.color }}>
            <div style={{ opacity: 0.85 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <section style={shell}>
        <div style={{ display: "grid", gap: 6 }}>
          <h3 style={{ margin: 0 }}>Admin impersonation</h3>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Prime admin can sign in as a rider or sub admin. Sub admins can sign in only as riders they manage.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label style={field}>
            <span style={label}>Rider username</span>
            <input
              style={input}
              placeholder="rider1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label style={field}>
            <span style={label}>Password</span>
            <input
              type="password"
              style={input}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {err && <div style={alert}>{err}</div>}

          <button type="submit" style={primaryBtn} disabled={!username || !password || loading || (!isPrime && !isSub)}>
            {loading ? "Logging in..." : "Login / Impersonate"}
          </button>
        </form>
      </section>
    </div>
  );
}

const hero: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px clamp(12px, 3vw, 18px)",
  borderRadius: 18,
  background: "linear-gradient(135deg,#0f172a,#1f2937)",
  color: "white",
};

const heroBadge: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  alignItems: "flex-end",
  minWidth: 140,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  fontSize: 12,
  fontWeight: 700,
};

const statGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const statCard: React.CSSProperties = { borderRadius: 14, padding: 14, color: "white", boxShadow: "0 10px 24px rgba(0,0,0,0.12)" };

const shell: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const field: React.CSSProperties = { display: "grid", gap: 6 };
const label: React.CSSProperties = { fontSize: 12, color: "#6b7280", fontWeight: 700 };
const input: React.CSSProperties = { padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" };
const primaryBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: 0,
  color: "white",
  background: "linear-gradient(135deg,#2563eb,#10b981)",
  fontWeight: 800,
  cursor: "pointer",
};
const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};
