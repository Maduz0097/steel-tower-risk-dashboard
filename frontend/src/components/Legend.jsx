export default function Legend() {
  const row = (hex, label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: hex,
          flexShrink: 0,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      />
      <span style={{ fontSize: 12, color: "#333" }}>{label}</span>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 5,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        padding: "14px 16px",
        maxWidth: 280,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13, color: "#111" }}>
        Exposure level
      </div>
      {row("#E24B4A", "High — top 20%")}
      {row("#EF9F27", "Moderate — 50th–80th percentile")}
      {row("green", "Low — bottom 50%")}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #eee",
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.4,
        }}
      >
        Historical exposure index — not a prediction
      </div>
    </div>
  );
}
