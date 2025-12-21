import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import Home from "./Home";
import { Topbar } from "../../components/Layout/Topbar";

type AttendanceStatus = "present" | "absent" | null;

export default function Dashboard() {
  const nav = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceStatus | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get("/attendance/today");
        const status = (res.data?.status as AttendanceStatus) ?? null;
        if (!status) {
          nav("/rider/check-in", { replace: true });
          return;
        }
        setAttendance(status);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Unable to load attendance");
        nav("/rider/check-in", { replace: true });
      }
    };
    fetchAttendance();
  }, [nav]);

  if (attendance === undefined) {
    return (
      <div style={loadingShell}>
        <Topbar title="Rider Portal" />
        <div style={{ padding: 16 }}>Loading your dashboard...</div>
      </div>
    );
  }

  if (attendance === "absent") {
    return (
      <div style={loadingShell}>
        <Topbar title="Rider Portal" />
        <div style={absentCard}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>You marked absent today</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Update your response if you start working.</div>
          {err && <div style={alert}>{err}</div>}
          <button style={primaryBtn} onClick={() => nav("/rider/check-in", { replace: true })}>
            Update my response
          </button>
        </div>
      </div>
    );
  }

  return <Home />;
}

const loadingShell: React.CSSProperties = { maxWidth: 520, margin: "0 auto" };
const absentCard: React.CSSProperties = {
  margin: 12,
  background: "white",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  display: "grid",
  gap: 8,
};
const primaryBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: 0,
  color: "white",
  background: "linear-gradient(135deg,#2563eb,#10b981)",
  fontWeight: 800,
  cursor: "pointer",
  width: "fit-content",
};
const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};
