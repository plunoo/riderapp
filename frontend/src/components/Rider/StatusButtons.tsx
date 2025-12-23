import React, { useState } from "react";

type Props = {
  onSet: (status: string) => void;
  currentStatus?: string;
  disabled?: boolean;
};

const statuses = [
  { 
    key: "online", 
    label: "Online", 
    color: "#22c55e",
    bgColor: "#dcfce7",
    emoji: "🟢"
  },
  { 
    key: "delivery", 
    label: "Delivery", 
    color: "#f59e0b",
    bgColor: "#fef3c7",
    emoji: "🚚"
  },
  { 
    key: "break", 
    label: "Break", 
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    emoji: "☕"
  },
  { 
    key: "offline", 
    label: "Offline", 
    color: "#6b7280",
    bgColor: "#f3f4f6",
    emoji: "⭕"
  },
];

export function StatusButtons({ onSet, currentStatus, disabled = false }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleClick = async (status: string) => {
    if (disabled || loading) return;
    
    setLoading(status);
    try {
      await onSet(status);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={row}>
      {statuses.map((s) => {
        const isActive = s.key === currentStatus;
        const isLoading = loading === s.key;
        
        return (
          <button 
            key={s.key} 
            style={{
              ...btn,
              ...(isActive ? { ...btnActive, borderColor: s.color, background: s.bgColor } : {}),
              ...(disabled || isLoading ? btnDisabled : {}),
            }}
            onClick={() => handleClick(s.key)} 
            type="button"
            disabled={disabled || !!loading}
          >
            <span style={{ marginRight: 6 }}>{s.emoji}</span>
            {isLoading ? "Updating..." : s.label}
          </button>
        );
      })}
    </div>
  );
}

const row: React.CSSProperties = { 
  display: "flex", 
  gap: 10, 
  flexWrap: "wrap" 
};

const btn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  fontWeight: 600,
  fontSize: 14,
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  minWidth: 100,
  justifyContent: "center",
};

const btnActive: React.CSSProperties = {
  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
  transform: "translateY(-1px)",
  fontWeight: 700,
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
  transform: "none",
};
