function fmt(v) {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "number" && !Number.isFinite(v)) return "—";
  return String(v);
}

function fmtNum(v, digits) {
  if (v === undefined || v === null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return digits !== undefined ? n.toFixed(digits) : String(n);
}

function fmtMoney(v) {
  if (v === undefined || v === null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function badgeFromColor(c) {
  const s = String(c || "");
  if (s === "#E24B4A") return { label: "High", bg: "#E24B4A", fg: "#fff" };
  if (s === "#EF9F27") return { label: "Moderate", bg: "#EF9F27", fg: "#111" };
  if (s === "green" || s === "#16a34a") return { label: "Low", bg: "#16a34a", fg: "#fff" };
  return { label: "—", bg: "#e5e7eb", fg: "#111" };
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f9",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#64748b", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#0f172a", textAlign: "right", wordBreak: "break-word" }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          color,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function Sidebar({ tower, onClose }) {
  if (!tower) return null;

  const p = tower.properties || {};
  const badge = badgeFromColor(p.concern_color);

  return (
    <aside
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        zIndex: 10,
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
            {fmt(p.owner)}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: badge.bg,
                color: badge.fg,
              }}
            >
              {badge.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            border: "none",
            background: "transparent",
            fontSize: 28,
            lineHeight: 1,
            cursor: "pointer",
            color: "#64748b",
            padding: 0,
            width: 36,
            height: 36,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          padding: "20px 18px",
          textAlign: "center",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Exposure score</div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: badge.bg,
            lineHeight: 1,
          }}
        >
          {fmtNum(p.exposure_score, 4)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }}>
        <Section title="Tower info" color="#2563eb">
          <Row label="Voltage (kV)" value={fmtNum(p.voltage, 2)} />
          <Row label="State (worst storm)" value={fmt(p.worst_storm_state)} />
          <Row label="Status" value={fmt(p.status)} />
          <Row label="Structure" value={fmt(p.structure)} />
        </Section>

        <Section title="Weather signals" color="#d97706">
          <Row label="Max wind (m/s)" value={fmtNum(p.max_wind_speed, 2)} />
          <Row label="Max snow depth (m)" value={fmtNum(p.max_snow_depth, 3)} />
          <Row label="Nearest storm type" value={fmt(p.nearest_storm_type)} />
          <Row label="Storm event count" value={fmt(p.storm_event_count)} />
          <Row label="Max storm damage" value={fmtMoney(p.max_storm_damage_usd)} />
        </Section>

        <Section title="Outage signals" color="#dc2626">
          <Row label="DOE event count" value={fmt(p.doe_event_count)} />
          <Row label="Max customers affected" value={fmtNum(p.doe_max_customers, 0)} />
          <Row label="Max MW loss" value={fmtNum(p.doe_max_mw_loss, 2)} />
          <Row label="Outage type" value={fmt(p.doe_dominant_type)} />
          <Row label="NERC region" value={fmt(p.doe_nerc_region)} />
        </Section>
      </div>
    </aside>
  );
}
