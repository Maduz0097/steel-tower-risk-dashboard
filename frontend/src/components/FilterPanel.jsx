import { useEffect, useState } from "react";
import { downloadTowersCsv, fetchFilterOptions } from "../api/towers.js";

const EXPOSURE_OPTIONS = [
  { value: "", label: "All" },
  { value: "#E24B4A", label: "High" },
  { value: "#EF9F27", label: "Moderate" },
  { value: "green", label: "Low" },
];

function buildFilters(snapshot) {
  const f = {};
  if (snapshot.color) f.color = snapshot.color;
  if (snapshot.stateFilter) f.state = snapshot.stateFilter;
  if (snapshot.owner.trim()) f.owner = snapshot.owner.trim();
  if (snapshot.min_score !== "" && snapshot.min_score !== null) {
    const n = Number(snapshot.min_score);
    if (Number.isFinite(n)) f.min_score = n;
  }
  return f;
}

export default function FilterPanel({ onChange }) {
  const [states, setStates] = useState([]);
  const [color, setColor] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [owner, setOwner] = useState("");
  const [min_score, setMinScore] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchFilterOptions()
      .then((opts) => {
        if (!cancelled && opts.states) setStates(opts.states);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const emit = (next) => {
    onChange(buildFilters(next));
  };

  const snapshot = { color, stateFilter, owner, min_score };

  const runExport = () => {
    setExportErr(null);
    setExporting(true);
    downloadTowersCsv(buildFilters(snapshot))
      .catch((e) => {
        setExportErr(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setExporting(false));
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 240,
        zIndex: 6,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        padding: 14,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 10, color: "#111" }}>
        Filters
      </div>

      <label style={{ display: "block", marginBottom: 8, color: "#444" }}>
        Exposure level
        <select
          value={color}
          onChange={(e) => {
            const v = e.target.value;
            setColor(v);
            emit({ ...snapshot, color: v });
          }}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
          }}
        >
          {EXPOSURE_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: 4, color: "#444" }}>
        State
        <select
          value={stateFilter}
          onChange={(e) => {
            const v = e.target.value;
            setStateFilter(v);
            emit({ ...snapshot, stateFilter: v });
          }}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
          }}
        >
          <option value="">All</option>
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </label>
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.35,
          marginBottom: 10,
        }}
      >
        County is not in the source data. State uses{" "}
        <code style={{ fontSize: 10 }}>worst_storm_state</code> (location of the
        worst recorded storm event), not a geocoded tower address.
      </div>

      <label style={{ display: "block", marginBottom: 8, color: "#444" }}>
        Owner search
        <input
          type="text"
          value={owner}
          onChange={(e) => {
            const v = e.target.value;
            setOwner(v);
            emit({ ...snapshot, owner: v });
          }}
          placeholder="Partial match"
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
            boxSizing: "border-box",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 10, color: "#444" }}>
        Min exposure score
        <input
          type="number"
          step="0.0001"
          min={0}
          max={1}
          value={min_score}
          onChange={(e) => {
            const v = e.target.value;
            setMinScore(v);
            emit({ ...snapshot, min_score: v });
          }}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
            boxSizing: "border-box",
          }}
        />
      </label>

      <button
        type="button"
        onClick={runExport}
        disabled={exporting}
        style={{
          width: "100%",
          padding: "10px 10px",
          borderRadius: 6,
          border: "1px solid #185FA5",
          background: exporting ? "#e2e8f0" : "#185FA5",
          color: exporting ? "#64748b" : "#fff",
          cursor: exporting ? "wait" : "pointer",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {exporting ? "Exporting…" : "Export CSV (current filters)"}
      </button>
      {exportErr && (
        <div
          style={{
            fontSize: 11,
            color: "#b91c1c",
            marginBottom: 8,
            lineHeight: 1.35,
          }}
        >
          {exportErr}
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.35,
          marginBottom: 10,
        }}
      >
        Download includes all columns in the dataset for towers matching the
        filters above (including exposure level when set).
      </div>

      <button
        type="button"
        onClick={() => {
          setColor("");
          setStateFilter("");
          setOwner("");
          setMinScore("");
          setExportErr(null);
          onChange({});
        }}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f8fafc",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Clear all filters
      </button>
    </div>
  );
}
