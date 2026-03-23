export default function StatsBar({ stats }) {
  if (!stats) return null;

  const card = {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 5,
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    padding: "12px 20px",
    display: "flex",
    gap: 28,
    alignItems: "stretch",
    pointerEvents: "none",
  };

  const statBlock = (color, value, label) => (
    <div style={{ textAlign: "center", minWidth: 72 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={card}>
      {statBlock("#2563eb", stats.total, "Total towers")}
      {statBlock("#E24B4A", stats.red, "High")}
      {statBlock("#EF9F27", stats.amber, "Moderate")}
      {statBlock("green", stats.green, "Low")}
      {statBlock("#111827", stats.avg_score, "Avg score")}
    </div>
  );
}
