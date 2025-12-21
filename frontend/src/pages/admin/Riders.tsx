import React, { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Layout/Topbar";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

type Rider = { id: number; username: string; name: string; store?: string | null; status: string; updated_at?: string | null; manager_id?: number | null };
type SubAdmin = { id: number; username: string; name: string; rider_count: number };

const statusMeta: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  available: { label: "Available", bg: "#ecfeff", color: "#0284c7" },
  delivery: { label: "On Delivery", bg: "#fef3c7", color: "#c2410c" },
  break: { label: "On Break", bg: "#f3f4f6", color: "#4b5563" },
  offline: { label: "Offline", bg: "#fee2e2", color: "#b91c1c" },
};

function RidersInner() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [store, setStore] = useState("");
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<string>("");
  const [delUsername, setDelUsername] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [subAdminForm, setSubAdminForm] = useState({ username: "", name: "", password: "" });
  const [impersonateUser, setImpersonateUser] = useState<string | null>(null);
  const [impersonatePassword, setImpersonatePassword] = useState("");
  const [impersonateErr, setImpersonateErr] = useState<string | null>(null);
  const isPrime = user?.role === "prime_admin";
  const [storeFilter, setStoreFilter] = useState<string>("all");

  const defaultSubAdminId = useMemo(() => subAdmins[0]?.id?.toString() || "", [subAdmins]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ items: Rider[] }>("/admin/riders", {
        params: { store: storeFilter !== "all" ? storeFilter : undefined },
      });
      setRiders(res.data.items || []);
      if (isPrime) {
        const subs = await api.get<{ items: SubAdmin[] }>("/admin/sub-admins");
        setSubAdmins(subs.data.items || []);
        if (!selectedSubAdmin && subs.data.items?.length) {
          setSelectedSubAdmin(String(subs.data.items[0].id));
        }
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load riders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeFilter]);

  const addRider = async () => {
    if (!username || !name || !password || !store) return;
    if (isPrime && !selectedSubAdmin) {
      setErr("Select a sub admin for this rider");
      return;
    }
    setErr(null);
    try {
      await api.post("/admin/add-rider", {
        username,
        name,
        password,
        store: store || null,
        sub_admin_id: isPrime ? Number(selectedSubAdmin) : undefined,
      });
      setUsername("");
      setName("");
      setPassword("");
      setStore("");
      if (isPrime) setSelectedSubAdmin(defaultSubAdminId);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to add rider");
    }
  };

  const deleteRider = async () => {
    if (!delUsername) return;
    setDeleteMsg(null);
    setErr(null);
    setDeleting(true);
    try {
      const normalized = delUsername.trim().toLowerCase();
      await api.delete("/admin/delete-rider", { data: { username: normalized } });
      setRiders((prev) => prev.filter((r) => r.username.toLowerCase() !== normalized && String(r.id) !== normalized));
      setDeleteMsg(`Deleted rider ${delUsername} (if existed)`);
      setDelUsername("");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Delete failed";
      setErr(msg);
      setDeleteMsg(msg);
    } finally {
      setDeleting(false);
    }
  };

  const addSubAdmin = async () => {
    if (!subAdminForm.username || !subAdminForm.password || !subAdminForm.name) return;
    setErr(null);
    try {
      await api.post("/admin/add-sub-admin", subAdminForm);
      setSubAdminForm({ username: "", name: "", password: "" });
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to add sub admin");
    }
  };

  const deleteSubAdmin = async (username: string) => {
    setErr(null);
    try {
      await api.delete("/admin/delete-sub-admin", { data: { username } });
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to delete sub admin");
    }
  };

  const impersonateSubAdmin = async () => {
    if (!impersonateUser || !impersonatePassword) {
      setImpersonateErr("Enter the sub admin password.");
      return;
    }
    setImpersonateErr(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/impersonate", { username: impersonateUser, password: impersonatePassword });
      const { token, user: target } = res.data as { token: string; user: any };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(target));
      window.location.href = "/admin";
    } catch (e: any) {
      setImpersonateErr(e?.response?.data?.detail || "Failed to login as sub admin");
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = Object.keys(statusMeta).map((key) => ({
    key,
    label: statusMeta[key].label,
    count: riders.filter((r) => r.status === key).length,
  }));

  const upNext = riders.filter((r) => r.status === "delivery");

  const statCards = statusCounts.map((c) => ({
    ...c,
    color:
      c.key === "available"
        ? "linear-gradient(135deg,#0ea5e9,#2563eb)"
        : c.key === "delivery"
        ? "linear-gradient(135deg,#f97316,#ef4444)"
        : c.key === "break"
        ? "linear-gradient(135deg,#6b7280,#4b5563)"
        : "linear-gradient(135deg,#a855f7,#6366f1)",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Topbar title="Riders" />

      <div style={hero}>
        <div>
          <div style={pill}>Live Ops</div>
          <h2 style={{ margin: "8px 0 4px 0" }}>Rider roster & actions</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>Manage riders, see live status, and queue updates in one place.</p>
        </div>
        <div style={heroBadge}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{riders.length || 0}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Total riders</div>
          <button style={ghostBtn} onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          {err && <span style={{ fontSize: 12, color: "#fecdd3", fontWeight: 700 }}>{err}</span>}
        </div>
      </div>

      <div style={statGrid}>
        {statCards.map((s) => (
          <div key={s.key} style={{ ...statCard, background: s.color }}>
            <div style={{ opacity: 0.85 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, margin: "6px 0" }}>{s.count}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{s.label === "Available" ? "Ready to assign" : "Live count"}</div>
          </div>
        ))}
      </div>

      {isPrime && (
        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Sub admins</div>
              <div style={panelTitle}>Manage access</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select style={inp} value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                <option value="all">All stores</option>
                {[...new Set(riders.map((r) => r.store).filter(Boolean))].map((store) => (
                  <option key={store as string} value={store as string}>{store as string}</option>
                ))}
              </select>
              <span style={chip}>Total {subAdmins.length}</span>
            </div>
          </header>
          <div className="form-grid" style={{ gap: 10 }}>
            <input style={inp} placeholder="Username" value={subAdminForm.username} onChange={(e) => setSubAdminForm({ ...subAdminForm, username: e.target.value })} />
            <input style={inp} placeholder="Full name" value={subAdminForm.name} onChange={(e) => setSubAdminForm({ ...subAdminForm, name: e.target.value })} />
            <input style={inp} type="password" placeholder="Temp password" value={subAdminForm.password} onChange={(e) => setSubAdminForm({ ...subAdminForm, password: e.target.value })} />
            <button className="full-button" style={btn} onClick={addSubAdmin} disabled={!subAdminForm.username || !subAdminForm.name || !subAdminForm.password}>Add Sub Admin</button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {subAdmins.length === 0 && <div style={empty}>No sub admins yet.</div>}
            {subAdmins.map((s) => (
              <div key={s.id} style={{ ...queueItem, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 750 }}>{s.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{s.username} • Riders: {s.rider_count}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="full-button"
                    style={btn}
                    onClick={() => {
                      setImpersonateUser(s.username);
                      setImpersonatePassword("");
                      setImpersonateErr(null);
                    }}
                    disabled={loading}
                  >
                    Login
                  </button>
                  <button className="full-button" style={btnDanger} onClick={() => deleteSubAdmin(s.username)} disabled={loading}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={mainGrid}>
        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Delivery queue</div>
              <div style={panelTitle}>Up next</div>
            </div>
            <span style={chip}>{upNext.length || 0} on delivery</span>
          </header>
          {upNext.length === 0 ? (
            <div style={empty}>No riders currently on delivery.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {upNext.map((r, idx) => (
                <div key={r.id} style={queueItem}>
                  <div>
                    <div style={{ fontWeight: 750 }}>{`#${idx + 1}`} {r.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>{r.username}</div>
                  </div>
                  <span style={badgeMuted}>Live</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Rider actions</div>
              <div style={panelTitle}>Add rider</div>
            </div>
          </header>
          <div className="form-grid" style={{ gap: 10 }}>
            <input style={inp} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input style={inp} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={inp} placeholder="Store (required)" value={store} onChange={(e) => setStore(e.target.value)} />
            <input style={inp} type="password" placeholder="Temp password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {isPrime && (
              <select style={inp} value={selectedSubAdmin} onChange={(e) => setSelectedSubAdmin(e.target.value)}>
                <option value="">Select sub admin</option>
                {subAdmins.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                ))}
              </select>
            )}
            <button className="full-button" style={btn} onClick={addRider} disabled={!name || !username || !password || !store || (isPrime && !selectedSubAdmin)}>Add</button>
          </div>
        </div>

        <div style={panel}>
          <header style={panelHeader}>
            <div>
              <div style={panelLabel}>Danger zone</div>
              <div style={panelTitle}>Delete rider</div>
            </div>
          </header>
          <div className="form-grid" style={{ gap: 10 }}>
            <input style={inp} placeholder="Rider username" value={delUsername} onChange={(e) => setDelUsername(e.target.value)} />
            <button className="full-button" style={btnDanger} onClick={deleteRider} disabled={!delUsername || deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
          {deleteMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>{deleteMsg}</div>}
        </div>
      </div>

      <div style={panel}>
        <header style={panelHeader}>
          <div>
            <div style={panelLabel}>Roster</div>
            <div style={panelTitle}>Riders list</div>
          </div>
        </header>
        <table style={{ width: "100%" }}>
          <thead><tr><th align="left">Name</th><th align="left">Username</th><th align="left">Store</th><th align="left">Status</th>{isPrime && <th align="left">Sub Admin</th>}</tr></thead>
          <tbody>
            {riders.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.username}</td>
                <td>{r.store || "-"}</td>
                <td>{renderStatus(r.status)}</td>
                {isPrime && (
                  <td>{subAdmins.find((s) => String(s.id) === String(r.manager_id))?.name || "Unassigned"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {impersonateUser && (
        <div className="modal-backdrop" style={modalBackdrop} onClick={() => setImpersonateUser(null)}>
          <div className="modal-card" style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Login as {impersonateUser}</h3>
              <button className="pill-btn" onClick={() => setImpersonateUser(null)}>x</button>
            </div>
            <div className="form-grid" style={{ gap: 10 }}>
              <input
                style={inp}
                type="password"
                placeholder="Sub admin password"
                value={impersonatePassword}
                onChange={(e) => setImpersonatePassword(e.target.value)}
              />
            </div>
            {impersonateErr && <div style={alert}>{impersonateErr}</div>}
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="ghost-btn" onClick={() => setImpersonateUser(null)}>Cancel</button>
              <button className="primary-btn" onClick={impersonateSubAdmin} disabled={!impersonatePassword || loading}>Login</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

class RidersBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("Riders page error", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={panel}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: "#b91c1c" }}>{this.state.error.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Riders() {
  return (
    <RidersBoundary>
      <RidersInner />
    </RidersBoundary>
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
  gap: 6,
  alignItems: "flex-end",
  minWidth: 180,
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

const inp: React.CSSProperties = { flex: 1, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" };
const btn: React.CSSProperties = { padding: "12px 14px", borderRadius: 12, border: 0, color: "white", background: "linear-gradient(135deg,#0ea5e9,#2563eb)", cursor: "pointer", fontWeight: 800 };
const btnDanger: React.CSSProperties = { ...btn, background: "linear-gradient(135deg,#ef4444,#b91c1c)" };
const ghostBtn: React.CSSProperties = { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", fontWeight: 700, cursor: "pointer" };

const statGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const statCard: React.CSSProperties = { borderRadius: 14, padding: 14, color: "white", boxShadow: "0 10px 24px rgba(0,0,0,0.12)" };

const mainGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, alignItems: "start" };
const panel: React.CSSProperties = { background: "white", borderRadius: 16, padding: 14, boxShadow: "0 10px 24px rgba(0,0,0,0.06)", display: "grid", gap: 10 };
const panelHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const panelLabel: React.CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 };
const panelTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginTop: 2 };
const chip: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: 12 };
const badgeMuted: React.CSSProperties = { padding: "6px 10px", borderRadius: 10, background: "#f1f5f9", color: "#0f172a", fontWeight: 700, fontSize: 12 };
const queueItem: React.CSSProperties = { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" };
const empty: React.CSSProperties = { padding: 12, border: "1px dashed #e5e7eb", borderRadius: 10, textAlign: "center", color: "#6b7280" };
const modalBackdrop: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 30 };
const modalCard: React.CSSProperties = { background: "white", borderRadius: 14, padding: 16, width: "min(420px, 92vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "grid", gap: 12 };
const modalHeader: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };

function renderStatus(status: string) {
  const meta = statusMeta[status] || { label: status || "Unknown", bg: "#f3f4f6", color: "#111827" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.color,
        fontWeight: 700,
      }}
    >
      {meta.label}
    </span>
  );
}
