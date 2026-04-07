import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fetchDoeMatchGeoJSON } from "../api/towers.js";

const SOURCE_ID = "doe-towers";
const LAYER_ID = "doe-towers-circle";
const SIDEBAR_W = 300;

const emptyCollection = {
  type: "FeatureCollection",
  features: [],
};

const RED = "#E24B4A";
const GREEN = "#1D9E75";
const BLUE = "#185FA5";

function fmtNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtStr(v) {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s || "—";
}

export default function DoeMatchMap({ isActive }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const mapInitRef = useRef(false);
  const onTowerClickRef = useRef(null);
  const requestIdRef = useRef(0);
  const moveDebounceRef = useRef(null);
  const payloadRef = useRef(null);
  const lastViewportKeyRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState(null);

  const sidebarOpen = selected != null;

  useEffect(() => {
    onTowerClickRef.current = (f) => setSelected(f);
  }, []);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  const requestViewportData = async () => {
    if (isActive === false) return;
    const map = mapRef.current;
    if (!map) return;

    const b = map.getBounds();
    const zoom = map.getZoom();

    let limit = 10000;
    if (zoom >= 14) limit = 80000;
    else if (zoom >= 12) limit = 50000;
    else if (zoom >= 10) limit = 30000;
    else if (zoom >= 8) limit = 20000;

    const viewportKey = [
      b.getWest().toFixed(5),
      b.getSouth().toFixed(5),
      b.getEast().toFixed(5),
      b.getNorth().toFixed(5),
      zoom.toFixed(3),
      limit,
    ].join("|");

    if (viewportKey === lastViewportKeyRef.current && payloadRef.current != null) {
      return;
    }

    const isFirstLoad = payloadRef.current == null;
    const myId = ++requestIdRef.current;
    setLoadError(null);
    if (isFirstLoad) setLoading(true);
    try {
      const data = await fetchDoeMatchGeoJSON({
        min_lon: b.getWest(),
        min_lat: b.getSouth(),
        max_lon: b.getEast(),
        max_lat: b.getNorth(),
        limit,
      });
      if (myId === requestIdRef.current) {
        setPayload(data);
        lastViewportKeyRef.current = viewportKey;
      }
    } catch (e) {
      if (myId === requestIdRef.current)
        setLoadError(e?.message || String(e));
    } finally {
      if (myId === requestIdRef.current && isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapEl.current || mapInitRef.current) return;
    mapInitRef.current = true;

    const map = new maplibregl.Map({
      container: mapEl.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-96, 38],
      zoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");

    const onClick = (e) => {
      if (!map.getLayer(LAYER_ID)) return;
      const feats = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
      if (feats.length && onTowerClickRef.current) onTowerClickRef.current(feats[0]);
    };

    let hoverRaf = null;
    let lastHoverPoint = null;
    const onMove = (e) => {
      lastHoverPoint = e.point;
      if (hoverRaf != null) return;
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = null;
        const point = lastHoverPoint;
        if (!map.getLayer(LAYER_ID)) {
          map.getCanvas().style.cursor = "";
          return;
        }
        const feats = map.queryRenderedFeatures(point, { layers: [LAYER_ID] });
        map.getCanvas().style.cursor = feats.length ? "pointer" : "";
      });
    };

    map.on("click", onClick);
    map.on("mousemove", onMove);

    map.once("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data: emptyCollection });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            2,
            8,
            4,
            12,
            7,
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Initial viewport fetch once the layer exists.
      requestViewportData();
    });

    const onMoveEnd = () => {
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      moveDebounceRef.current = setTimeout(() => {
        requestViewportData();
      }, 350);
    };
    map.on("moveend", onMoveEnd);

    mapRef.current = map;

    return () => {
      if (hoverRaf != null) cancelAnimationFrame(hoverRaf);
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
      mapInitRef.current = false;
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      moveDebounceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !payload) return;

    const data =
      payload.type === "FeatureCollection"
        ? {
            type: "FeatureCollection",
            features: payload.features || [],
          }
        : emptyCollection;

    const apply = () => {
      const src = map.getSource(SOURCE_ID);
      if (src && typeof src.setData === "function") src.setData(data);
    };

    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("load", apply);
  }, [payload]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = requestAnimationFrame(() => map.resize());
    return () => cancelAnimationFrame(t);
  }, [sidebarOpen]);

  const meta = payload?.meta || {};
  const total = meta.total ?? 0;
  const matched = meta.matched ?? 0;
  const unmatched = meta.unmatched ?? 0;

  const p = selected?.properties || {};
  const isMatched = Boolean(p.doe_matched);
  const badgeBg = isMatched ? RED : GREEN;
  const customers = fmtNum(p.doe_max_customers);

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        minHeight: 0,
        overflow: "hidden",
        background: "#f1f5f9",
      }}
    >
      <div
        ref={mapEl}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarOpen ? `calc(100% - ${SIDEBAR_W}px)` : "100%",
          transition: "width 0.3s ease",
        }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(241,245,249,0.92)",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "28px 36px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Loading outage match data...
          </div>
        </div>
      )}

      {!loading && loadError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(241,245,249,0.92)",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "28px 36px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 14,
              color: "#b91c1c",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            {loadError}
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 16,
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            padding: "14px 22px",
            display: "flex",
            gap: 28,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              {total}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Total towers
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: RED }}>
              {matched}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Near recorded outage
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>
              {unmatched}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              No outage recorded
            </div>
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            zIndex: 10,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            padding: "14px 16px",
            maxWidth: 320,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            Outage record status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: RED,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#334155" }}>
              Major outage recorded within 100 km
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: GREEN,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#334155" }}>
              No major outage recorded nearby
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.45 }}>
            Based on DOE OE-417 major disturbance reports 2015–2022.
            <br />
            Red = at least one event within 100 km.
            <br />
            Not a prediction of future outages.
          </div>
        </div>
      )}

      {sidebarOpen && (
        <aside
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: SIDEBAR_W,
            background: "#fff",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            fontFamily: "system-ui, sans-serif",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 14px 12px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#0f172a",
                lineHeight: 1.3,
                flex: 1,
                minWidth: 0,
                wordBreak: "break-word",
              }}
            >
              {fmtStr(p.owner)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                  background: badgeBg,
                  padding: "4px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {isMatched ? "Outage recorded" : "No record"}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
            <div
              style={{
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                background: isMatched ? "rgba(226, 75, 74, 0.1)" : "rgba(29, 158, 117, 0.1)",
                color: "#0f172a",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {isMatched
                ? `A major grid outage affecting ${customers} customers was recorded within 100 km of this tower.`
                : "No major grid outage has been recorded within 100 km of this tower in DOE reports from 2015–2022."}
            </div>

            {isMatched && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: RED,
                    marginBottom: 8,
                  }}
                >
                  Outage details
                </div>
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Outage events nearby</span>
                    <span style={{ color: "#0f172a" }}>{fmtNum(p.doe_event_count)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Max customers affected</span>
                    <span style={{ color: "#0f172a" }}>{fmtNum(p.doe_max_customers)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Max MW loss</span>
                    <span style={{ color: "#0f172a" }}>{fmtNum(p.doe_max_mw_loss)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Dominant outage type</span>
                    <span style={{ color: "#0f172a", textAlign: "right", maxWidth: "55%" }}>
                      {fmtStr(p.doe_dominant_type)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>NERC region</span>
                    <span style={{ color: "#0f172a", textAlign: "right", maxWidth: "55%" }}>
                      {fmtStr(p.doe_nerc_region)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: BLUE,
                  marginBottom: 8,
                }}
              >
                Tower info
              </div>
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#64748b" }}>Owner</span>
                  <span style={{ color: "#0f172a", textAlign: "right", maxWidth: "60%" }}>
                    {fmtStr(p.owner)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#64748b" }}>Voltage class</span>
                  <span style={{ color: "#0f172a" }}>{fmtStr(p.volt_class)}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 10,
                borderRadius: 8,
                background: "#f1f5f9",
                fontSize: 11,
                color: "#64748b",
                lineHeight: 1.45,
              }}
            >
              This map shows historical outage records only. A red tower means an outage was
              recorded nearby — not that this specific tower failed. A green tower means no DOE
              report was filed nearby — not that the area is safe.
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
