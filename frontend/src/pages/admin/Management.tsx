import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Layout/Topbar";
import { api } from "../../api/client";

type RiderStatus = {
  rider_id: number;
  name: string;
  status: string;
  updated_at?: string;
};

export default function Management() {
  const [items, setItems] = useState<RiderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const waiting = useMemo(
    () => items.filter((i) => i.status === "available"),
    [items]
  );
  const onDelivery = useMemo(
    () => items.filter((i) => i.status === "delivery"),
    [items]
  );
  const onBreak = useMemo(
    () => items.filter((i) => i.status === "break"),
    [items]
  );

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ items: RiderStatus[] }>("/admin/rider-status");
      setItems(res.data.items || []);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load rider statuses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Topbar title="Waiting List" />

      <div style={banner}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 0.3, opacity: 0.7 }}>Admin-controlled queue</div>
          <h2 style={{ margin: 0 }}>Rider Waiting Dashboard</h2>
          <p style={{ margin: "4px 0 0", opacity: 0.8 }}>
            See who is available, on delivery, or on break. Riders set their own status.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={ghostBtn} onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div style={alert}>{err}</div>}

      <div style={queueCard}>
        <div style={queueHead}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Waiting (Available)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{waiting.length}</div>
          </div>
        </div>
        {waiting.length === 0 ? (
          <div style={empty}>No riders waiting.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {waiting.map((r, idx) => (
              <div key={r.rider_id} style={queueRow}>
                <div>
                  <div style={nameText}>
                    #{idx + 1} {r.name} <span style={pill("#e0f2fe", "#0369a1")}>ID {r.rider_id}</span>
                  </div>
                  <div style={meta}>{r.updated_at ? `Updated ${new Date(r.updated_at).toLocaleTimeString()}` : ""}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>Ready for next delivery</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={grid}>
        <StatusBlock title="On Delivery" tone="#f97316" items={onDelivery} />
        <StatusBlock title="On Break" tone="#6b7280" items={onBreak} />
      </div>
    </div>
  );
}

function StatusBlock({ title, tone, items }: { title: string; tone: string; items: RiderStatus[] }) {
  return (
    <div style={queueCard}>
      <div style={queueHead}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{items.length}</div>
        </div>
        <div style={pill(tone)}>{title}</div>
      </div>
      {items.length === 0 ? (
        <div style={empty}>None</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((r) => (
            <div key={r.rider_id} style={queueRow}>
              <div style={nameText}>
                {r.name} <span style={pill("#e0f2fe", "#0369a1")}>ID {r.rider_id}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {r.updated_at ? new Date(r.updated_at).toLocaleTimeString() : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const banner: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const queueCard: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  display: "grid",
  gap: 12,
};

const queueHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const queueRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  background: "#f8fafc",
};

const empty: React.CSSProperties = {
  padding: 14,
  textAlign: "center",
  color: "#6b7280",
};

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};

const nameText: React.CSSProperties = { fontWeight: 800, display: "flex", alignItems: "center", gap: 8 };
const meta: React.CSSProperties = { fontSize: 12, color: "#6b7280", marginTop: 2 };
const pill = (bg: string, color = "#0f172a"): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 999,
  background: bg,
  color,
  fontSize: 12,
  fontWeight: 700,
});

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};
