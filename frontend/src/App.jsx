import { useState } from "react";
import { useTowers } from "./hooks/useTowers.js";
import Map from "./components/Map.jsx";
import StatsBar from "./components/StatsBar.jsx";
import FilterPanel from "./components/FilterPanel.jsx";
import Legend from "./components/Legend.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DoeMatchMap from "./components/DoeMatchMap.jsx";

const TAB_ACTIVE = "#185FA5";
const TAB_INACTIVE_TEXT = "#64748b";

export default function App() {
  const [activeTab, setActiveTab] = useState("exposure");
  const [filters, setFilters] = useState({});
  const [selectedTower, setSelectedTower] = useState(null);
  const { geojson, stats, loading, error } = useTowers(filters);

  const sidebarOpen = selectedTower != null;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "0 16px",
          minHeight: 48,
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("exposure")}
          style={{
            border: "none",
            borderBottom: activeTab === "exposure" ? `3px solid ${TAB_ACTIVE}` : "3px solid transparent",
            background: "transparent",
            color: activeTab === "exposure" ? TAB_ACTIVE : TAB_INACTIVE_TEXT,
            fontSize: 15,
            fontWeight: 600,
            padding: "12px 14px",
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          Exposure index map
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("doe")}
          style={{
            border: "none",
            borderBottom: activeTab === "doe" ? `3px solid ${TAB_ACTIVE}` : "3px solid transparent",
            background: "transparent",
            color: activeTab === "doe" ? TAB_ACTIVE : TAB_INACTIVE_TEXT,
            fontSize: 15,
            fontWeight: 600,
            padding: "12px 14px",
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          Outage record map
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "#94a3b8",
            fontWeight: 500,
          }}
        >
          Steel Tower Risk — Osmose
        </span>
      </header>

      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        {activeTab === "exposure" && (
          <div
            style={{
              flex: 1,
              position: "relative",
              minHeight: 0,
              background: "#f1f5f9",
            }}
          >
            <Map
              geojson={geojson}
              sidebarOpen={sidebarOpen}
              onTowerClick={(feature) => setSelectedTower(feature)}
            />
            <StatsBar stats={stats} />
            <FilterPanel onChange={setFilters} />
            <Legend />

            {sidebarOpen && (
              <Sidebar tower={selectedTower} onClose={() => setSelectedTower(null)} />
            )}

            {loading && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9998,
                  background: "rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "28px 36px",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Loading 113,509 towers...
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  position: "fixed",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 9999,
                  background: "#b91c1c",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: 8,
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 14,
                  maxWidth: "90vw",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {activeTab === "doe" && <DoeMatchMap />}
      </div>
    </div>
  );
}
