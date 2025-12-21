import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../components/Layout/Topbar";
import { api } from "../../api/client";

type Choice = "present" | "absent" | null;

export default function CheckIn() {
  const nav = useNavigate();
  const [choice, setChoice] = useState<Choice>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!choice) return;
    setErr(null);
    setLoading(true);
    try {
      await api.post("/attendance/mark", { status: choice });
      nav("/rider", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to save response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <Topbar title="Rider Portal" />

      <section style={card}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Daily check-in</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Are you working today?</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            We record this once per day for attendance. You can change your answer later.
          </div>
        </div>

        <div style={choiceGrid}>
          <button
            style={choiceBtn(choice === "present")}
            onClick={() => setChoice("present")}
            disabled={loading}
          >
            Yes, mark me present
          </button>
          <button
            style={choiceBtn(choice === "absent")}
            onClick={() => setChoice("absent")}
            disabled={loading}
          >
            No, mark me absent
          </button>
        </div>

        {err && <div style={alert}>{err}</div>}

        <button
          style={submitBtn(Boolean(choice))}
          onClick={submit}
          disabled={!choice || loading}
        >
          {loading ? "Saving..." : "Save and continue"}
        </button>
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
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  marginTop: 12,
  display: "grid",
  gap: 12,
};

const choiceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const choiceBtn = (active: boolean): React.CSSProperties => ({
  padding: "14px 16px",
  borderRadius: 12,
  border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "linear-gradient(135deg,#2563eb,#10b981)" : "#f8fafc",
  color: active ? "white" : "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left",
});

const submitBtn = (enabled: boolean): React.CSSProperties => ({
  padding: "12px 14px",
  borderRadius: 12,
  border: 0,
  color: "white",
  background: enabled ? "linear-gradient(135deg,#2563eb,#10b981)" : "#9ca3af",
  fontWeight: 800,
  cursor: enabled ? "pointer" : "not-allowed",
});

const alert: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
};
