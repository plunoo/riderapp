import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Layout/Topbar";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

type StatusRow = { rider_id: number; name: string; status: string; updated_at?: string | null };
type Summary = {
  total_riders: number;
  active: number;
  delivery: number;
  available: number;
  on_break: number;
  absent: number;
  updated_at?: string;
};

type PrimeOverview = {
  items: Array<{
    id: number;
    name: string;
    username: string;
    rider_count: number;
    active: number;
    delivery: number;
    available: number;
  }>;
  totals: { active: number; delivery: number; available: number };
  stores?: Array<{ store: string; rider_count: number; active: number; delivery: number; available: number }>;
};

type ImpLog = {
  id: number;
  actor_name?: string | null;
  target_name?: string | null;
  target_role: string;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const isPrime = user?.role === "prime_admin";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [primeOverview, setPrimeOverview] = useState<PrimeOverview | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [impLogs, setImpLogs] = useState<ImpLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const requests: Promise<any>[] = [
        api.get<Summary>("/admin/dashboard-stats", { params: { store: selectedStore !== "all" ? selectedStore : undefined } }),
        api.get<{ items: StatusRow[] }>("/admin/rider-status", { params: { store: selectedStore !== "all" ? selectedStore : undefined } }),
      ];
      if (isPrime) {
        requests.push(api.get<PrimeOverview>("/admin/prime-overview"));
        requests.push(api.get<{ items: ImpLog[] }>("/admin/impersonation-logs", { params: { limit: 15 } }));
      }

      const [statsRes, statusRes, primeRes, logsRes] = await Promise.all(requests);
      setSummary(statsRes.data);
      setStatuses(statusRes.data.items || []);
      if (isPrime && primeRes) {
        setPrimeOverview(primeRes.data);
      }
      if (isPrime && logsRes) {
        setImpLogs(logsRes.data.items || []);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [selectedStore]);

  const availableList = useMemo(() => statuses.filter((s) => s.status === "available"), [statuses]);
  const deliveryList = useMemo(() => statuses.filter((s) => s.status === "delivery"), [statuses]);
  const breakList = useMemo(() => statuses.filter((s) => s.status === "break"), [statuses]);

  const statCards = [
    {
      label: "Active Riders",
      value: summary?.active ?? "-",
      delta: `${summary?.total_riders ?? 0} total`,
      color: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    },
    {
      label: "On Delivery",
      value: summary?.delivery ?? "-",
      delta: `${deliveryList.length} in progress`,
      color: "linear-gradient(135deg,#f59e0b,#ef4444)",
    },
    {
      label: "Available Now",
      value: summary?.available ?? "-",
      delta: `${availableList.length} ready`,
      color: "linear-gradient(135deg,#22c55e,#16a34a)",
    },
    {
      label: "Absent / Off",
      value: summary?.absent ?? 0,
      delta: `${breakList.length} on break`,
      color: "linear-gradient(135deg,#a855f7,#6366f1)",
    },
  ];

  const leaderboard = [...statuses]
    .filter((s) => s.status === "delivery" || s.status === "available")
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Topbar title="Command Center" />

      <div style={hero}>
        <div>
          <div style={pill}>Live Ops</div>
          <h2 style={{ margin: "10px 0 6px 0" }}>Today's rider pulse</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>Monitor live capacity, deliveries, and incidents in one view.</p>
        </div>
        <div style={heroBadge}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{summary ? `${summary.active || 0}/${summary.total_riders || 0}` : "--"}</span>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Active / Total</span>
          {summary?.updated_at && <span style={{ fontSize: 11, opacity: 0.65 }}>Updated {new Date(summary.updated_at).toLocaleTimeString()}</span>}
        </div>
        {isPrime && (
          <select
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", minWidth: 160 }}
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="all">All stores</option>
            {(primeOverview?.stores || []).map((s) => (
              <option key={s.store} value={s.store}>{s.store}</option>
            ))}
          </select>
        )}
      </div>

      {err && <div style={alert}>{err}</div>}

      <div style={statGrid}>
        {statCards.map((s) => (
          <div key={s.label} style={{ ...statCard, background: s.color }}>
            <div style={{ opacity: 0.85 }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, margin: "8px 0" }}>{s.value}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div style={mainGrid}>
        {isPrime && primeOverview && (
          <>
            <div style={panel}>
              <header style={panelHeader}>
                <div>
                  <div style={panelLabel}>Prime overview</div>
                  <div style={panelTitle}>Sub admin activity</div>
                </div>
                <span style={chip}>{primeOverview.items.length} sub admins</span>
              </header>
              <div style={{ display: "grid", gap: 8 }}>
                {primeOverview.items.length === 0 && <div style={empty}>No sub admins yet.</div>}
                {primeOverview.items.map((s) => (
                  <div key={s.id} style={row}>
                    <div>
                      <div style={{ fontWeight: 750 }}>{s.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{s.username} • Riders: {s.rider_count}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                      <span style={badge}>Active {s.active}</span>
                      <span style={badgeWarning}>Delivery {s.delivery}</span>
                      <span style={badgeSuccess}>Available {s.available}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={panel}>
              <header style={panelHeader}>
                <div>
                  <div style={panelLabel}>Stores</div>
                  <div style={panelTitle}>Waiting lists by store</div>
                </div>
              </header>
              <div style={statGrid}>
                {(primeOverview.stores || []).map((store) => (
                  <div key={store.store} style={{ ...statCard, background: "linear-gradient(135deg,#0f172a,#2563eb)" }}>
                    <div style={{ fontWeight: 800 }}>{store.store}</div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>Riders: {store.rider_count}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      <span style={badge}>Active {store.active}</span>
                      <span style={badgeWarning}>Delivery {store.delivery}</span>
                      <span style={badgeSuccess}>Available {store.available}</span>
                    </div>
                  </div>
                ))}
                {(primeOverview.stores || []).length === 0 && <div style={empty}>No stores yet.</div>}
              </div>
            </div>

            <div style={panel}>
              <header style={panelHeader}>
                <div>
                  <div style={panelLabel}>Security</div>
                  <div style={panelTitle}>Recent impersonations</div>
                </div>
              </header>
              <div style={{ display: "grid", gap: 8 }}>
                {impLogs.length === 0 && <div style={empty}>No impersonation activity yet.</div>}
                {impLogs.map((log) => (
                  <div key={log.id} style={row}>
                    <div style={{ fontWeight: 700 }}>
                      {log.actor_name || "Unknown"} &rarr; {log.target_name || "Unknown"} ({log.target_role})
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Live queue</div>
              <div style={panelTitle}>Available now</div>
            </div>
            <span style={chip}>{availableList.length} ready</span>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {availableList.length === 0 ? (
              <div style={empty}>No riders available right now.</div>
            ) : (
              availableList.map((r, idx) => (
                <div key={r.rider_id} style={row}>
                  <div>
                    <div style={{ fontWeight: 700 }}>#{idx + 1} {r.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{r.updated_at ? new Date(r.updated_at).toLocaleTimeString() : ""}</div>
                  </div>
                  <span style={badge}>Ready</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Recent updates</div>
              <div style={panelTitle}>Deliveries & breaks</div>
            </div>
            <span style={chipWarning}>{deliveryList.length + breakList.length} active</span>
          </header>
          <div style={{ display: "grid", gap: 10 }}>
            {[...deliveryList, ...breakList].slice(0, 6).map((i) => (
              <div key={i.rider_id} style={row}>
                <div>
                  <div style={{ fontWeight: 700 }}>{i.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{i.status === "delivery" ? "On delivery" : "On break"}</div>
                </div>
                <span style={badgeMuted}>{i.updated_at ? new Date(i.updated_at).toLocaleTimeString() : ""}</span>
              </div>
            ))}
            {deliveryList.length + breakList.length === 0 && <div style={empty}>No riders on delivery or break.</div>}
          </div>
        </div>

        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Top performers</div>
              <div style={panelTitle}>Leaderboard</div>
            </div>
          </header>
          <div style={{ display: "grid", gap: 12 }}>
            {leaderboard.length === 0 ? (
              <div style={empty}>No active riders yet.</div>
            ) : (
              leaderboard.map((l, idx) => (
                <div key={l.rider_id} style={leaderRow}>
                  <div style={leaderRank}>#{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 750 }}>{l.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{l.status === "delivery" ? "On delivery" : "Available"}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{l.updated_at ? new Date(l.updated_at).toLocaleTimeString() : ""}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
  minWidth: 120,
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

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const statCard: React.CSSProperties = {
  borderRadius: 18,
  padding: "clamp(14px, 3vw, 18px)",
  color: "white",
  boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
  alignItems: "start",
};

const panel: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const panelLabel: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 };
const panelTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginTop: 4 };
const chip: React.CSSProperties = { padding: "8px 10px", borderRadius: 12, background: "#e0f2fe", color: "#0ea5e9", fontWeight: 700 };
const chipWarning: React.CSSProperties = { padding: "8px 10px", borderRadius: 12, background: "#fff7ed", color: "#ea580c", fontWeight: 700 };

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
};

const badge: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#ecfeff", color: "#0891b2", fontWeight: 700 };
const badgeSuccess: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#ecfdf3", color: "#15803d", fontWeight: 700 };
const badgeMuted: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#f1f5f9", color: "#0f172a", fontWeight: 700 };
const badgeWarning: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#fff7ed", color: "#c2410c", fontWeight: 700 };

const leaderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const leaderRank: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#0ea5e9",
  color: "white",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
};

const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};

const empty: React.CSSProperties = {
  padding: 12,
  border: "1px dashed #e5e7eb",
  borderRadius: 10,
  textAlign: "center",
  color: "#6b7280",
};
