import { useCallback, useEffect, useState } from "react";
import { Topbar } from "../../components/Layout/Topbar";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";

type RiderStatus = "available" | "delivery" | "break" | "offline";
type QueueEntry = { rider_id: number; name: string; store?: string | null; updated_at?: string | null };

const statusLabel = (s: RiderStatus) =>
  s === "delivery" ? "On Delivery" : s === "break" ? "On Break" : s === "available" ? "Available" : "Offline";

const statusColor = (s: RiderStatus) => {
  if (s === "delivery") return "#f97316";
  if (s === "break") return "#6b7280";
  if (s === "available") return "#16a34a";
  return "#9ca3af";
};

const normalizeStatus = (value?: string): RiderStatus => {
  if (value === "available" || value === "delivery" || value === "break") return value;
  return "offline";
};

export default function Home() {
  const { logout, user } = useAuth();
  const displayName = user?.name || "You";
  const [status, setStatus] = useState<RiderStatus>("offline");
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const queueSize = queue.length;
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setErr(null);
    try {
      const res = await api.get("/rider/queue");
      const data = res.data as {
        status?: string;
        queue?: QueueEntry[];
        position?: number | null;
      };
      setStatus(normalizeStatus(data?.status));
      setQueue(data?.queue || []);
      setPosition(typeof data?.position === "number" ? data.position : null);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load queue");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadQueue().finally(() => setLoading(false));
  }, [loadQueue]);

  const updateStatus = async (next: RiderStatus) => {
    setErr(null);
    setLoading(true);
    setStatus(next);
    if (next !== "available") setPosition(null);
    try {
      await api.post("/rider/status", { status: next });
      await loadQueue();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const inQueue = status === "available" && position !== null;

  return (
    <div style={page}>
      <Topbar title="Rider Portal" />

      <section style={card}>
        <div style={rowBetween}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Status</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{statusLabel(status)}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Admin sees your updates instantly.</div>
          </div>
          <button style={ghostBtn} onClick={logout}>
            Logout
          </button>
        </div>

        <div style={statusRow}>
          {(["available", "delivery", "break"] as RiderStatus[]).map((s) => (
            <button key={s} style={statusBtn(status === s)} onClick={() => updateStatus(s)} disabled={loading}>
              {s === "delivery" ? "On Delivery" : s === "break" ? "Break" : "Available"}
            </button>
          ))}
        </div>

        {err && <div style={alert}>{err}</div>}

        <div style={queueCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Waiting dashboard</div>
              {inQueue ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>You are in queue</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{`Position #${position}`}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>Not in queue</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {status === "available" ? "Waiting for assignment" : "Switch to Available to rejoin"}
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={pillSmall(statusColor(status))}>{statusLabel(status)}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
                {queueSize ? `${queueSize} riders waiting in your store` : loading ? "Queue updating..." : "No riders waiting"}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {queue.length === 0 && !loading ? (
              <div style={{ padding: "10px 12px", borderRadius: 12, border: "1px dashed #e5e7eb", color: "#6b7280" }}>
                No riders waiting right now.
              </div>
            ) : (
              queue.map((entry, idx) => {
                const isSelf = user?.id === entry.rider_id;
                return (
                  <div
                    key={`${entry.rider_id}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: isSelf ? "#e0f2fe" : "#fff",
                      fontWeight: isSelf ? 800 : 600,
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <span>
                        #{idx + 1} {entry.name === "You" ? displayName : entry.name}
                      </span>
                      {entry.store && <span style={{ fontSize: 12, color: "#475569" }}>{entry.store}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {entry.store && <span style={pillSmall("#10b981")}>{entry.store}</span>}
                      {isSelf && <span style={pillSmall("#2563eb")}>You</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const page: React.CSSProperties = {
  maxWidth: 520,
  margin: "0 auto",
  padding: "10px 14px 24px",
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  marginTop: 12,
  display: "grid",
  gap: 12,
};

const rowBetween: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const statusRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 8,
};

const statusBtn = (active: boolean): React.CSSProperties => ({
  padding: "12px 14px",
  borderRadius: 12,
  border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "linear-gradient(135deg,#2563eb,#10b981)" : "#f8fafc",
  color: active ? "white" : "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
});

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const queueCard: React.CSSProperties = {
  marginTop: 4,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  padding: 12,
  background: "#f8fafc",
};

const pillSmall = (color: string): React.CSSProperties => ({
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: 999,
  background: color,
  color: "white",
  fontWeight: 700,
  fontSize: 12,
});

const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};
