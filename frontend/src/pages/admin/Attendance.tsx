import { useMemo, useState } from "react";
import { Topbar } from "../../components/Layout/Topbar";
import { exportToExcel } from "../../utils/exportExcel";

type Status = "present" | "absent" | "off_day" | "late";
type CalendarDay = { id: string; day: string; date: string; events: { rider: string; status: Status; slot: string }[] };

const statusMeta: Record<Status, { bg: string; color: string; label: string }> = {
  present: { bg: "#e0f2fe", color: "#0369a1", label: "Present" },
  absent: { bg: "#fee2e2", color: "#b91c1c", label: "Absent" },
  off_day: { bg: "#f3e8ff", color: "#7e22ce", label: "Off Day" },
  late: { bg: "#fef9c3", color: "#a16207", label: "Late" },
};

// Start empty; attendance records are created when riders sign in.
const week: CalendarDay[] = [];

export default function Attendance() {
  const [filter, setFilter] = useState<Status | "all">("all");

  const filteredWeek = useMemo(() => {
    if (filter === "all") return week;
    return week.map((d) => ({
      ...d,
      events: d.events.filter((e) => e.status === filter),
    }));
  }, [filter]);

  const exportRows = useMemo(() => {
    const rows: { date: string; rider: string; status: string; slot: string }[] = [];
    filteredWeek.forEach((d) => {
      d.events.forEach((e) => rows.push({ date: d.date, rider: e.rider, status: statusMeta[e.status].label, slot: e.slot }));
    });
    return rows;
  }, [filteredWeek]);

  const totals = useMemo(() => {
    const counts: Record<Status, number> = { present: 0, absent: 0, off_day: 0, late: 0 };
    week.forEach((d) => d.events.forEach((e) => { counts[e.status] += 1; }));
    return counts;
  }, []);

  const hasEvents = filteredWeek.some((d) => d.events.length > 0);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Topbar title="Attendance" />

      <section style={toolbar}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Week view</div>
          <h3 style={{ margin: 0 }}>{hasEvents ? "This week" : "No attendance yet"}</h3>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", "present", "late", "off_day", "absent"] as const).map((s) => (
            <button
              key={s}
              style={{ ...chip, ...(filter === s ? chipActive : {}) }}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : statusMeta[s].label}
            </button>
          ))}
          <button style={ghostBtn} onClick={() => exportToExcel(exportRows, "attendance_week")} disabled={!hasEvents}>
            Export
          </button>
        </div>
      </section>

      {!hasEvents ? (
        <section style={grid}>
          <div style={dayCard}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>No attendance yet</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Records will appear once riders sign in.</div>
          </div>
        </section>
      ) : (
        <section style={grid}>
          {filteredWeek.map((d) => (
            <div key={d.id} style={dayCard}>
              <div style={dayHeader}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{d.day}</div>
                  <div style={{ fontWeight: 800 }}>{d.date}</div>
                </div>
                <div style={dayBadges}>
                  {Object.entries(totals).map(([k, v]) => (
                    <span key={k} style={tinyBadge(statusMeta[k as Status].color, statusMeta[k as Status].bg)}>{v}</span>
                  ))}
                </div>
              </div>
              {d.events.length === 0 ? (
                <div style={{ opacity: 0.6, fontSize: 12 }}>No records</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {d.events.map((e, idx) => (
                    <div key={idx} style={eventCard(statusMeta[e.status].bg, statusMeta[e.status].color)}>
                      <div style={{ fontWeight: 700 }}>{e.rider}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{statusMeta[e.status].label} at {e.slot}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

const toolbar: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const dayCard: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  display: "grid",
  gap: 10,
};

const dayHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const dayBadges: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" };

const eventCard = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  borderRadius: 12,
  padding: 10,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
});

const chip: React.CSSProperties = { padding: "8px 12px", borderRadius: 999, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontWeight: 700 };
const chipActive: React.CSSProperties = { background: "#e0f2fe", color: "#0ea5e9", borderColor: "#0ea5e9" };

const ghostBtn: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontWeight: 700, cursor: "pointer" };

const tinyBadge = (color: string, bg: string): React.CSSProperties => ({
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  color,
  background: bg,
  fontWeight: 700,
});
