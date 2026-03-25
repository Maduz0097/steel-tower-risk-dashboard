import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "towers";
const LAYER_ID = "towers-circles";

const emptyCollection = {
  type: "FeatureCollection",
  features: [],
};

export default function Map({ geojson, onTowerClick, sidebarOpen, onViewportChanged }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const onTowerClickRef = useRef(onTowerClick);
  const onViewportChangedRef = useRef(onViewportChanged);
  const viewportTimerRef = useRef(null);

  useEffect(() => {
    onTowerClickRef.current = onTowerClick;
  }, [onTowerClick]);

  useEffect(() => {
    onViewportChangedRef.current = onViewportChanged;
  }, [onViewportChanged]);

  const emitViewport = () => {
    const map = mapRef.current;
    if (!map) return;
    const cb = onViewportChangedRef.current;
    if (!cb) return;
    const b = map.getBounds();
    const zoom = map.getZoom();

    let limit = 10000;
    if (zoom >= 14) limit = 60000;
    else if (zoom >= 12) limit = 40000;
    else if (zoom >= 10) limit = 30000;
    else if (zoom >= 8) limit = 20000;

    cb({
      min_lon: b.getWest(),
      min_lat: b.getSouth(),
      max_lon: b.getEast(),
      max_lat: b.getNorth(),
      limit,
    });
  };

  useEffect(() => {
    if (!mapEl.current) return;

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

    const onMove = (e) => {
      if (!map.getLayer(LAYER_ID)) {
        map.getCanvas().style.cursor = "";
        return;
      }
      const feats = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
      map.getCanvas().style.cursor = feats.length ? "pointer" : "";
    };

    map.on("click", onClick);
    map.on("mousemove", onMove);

    const onMoveEnd = () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = setTimeout(() => {
        emitViewport();
      }, 350);
    };
    map.on("moveend", onMoveEnd);

    map.once("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data: emptyCollection });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-color": ["get", "concern_color"],
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
          "circle-stroke-width": 0.3,
          "circle-stroke-color": "#1a1a1a",
        },
      });

      // Kick off first viewport fetch after the map is ready.
      emitViewport();
    });

    mapRef.current = map;

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const data =
      geojson && geojson.type === "FeatureCollection"
        ? { type: "FeatureCollection", features: geojson.features || [] }
        : emptyCollection;

    const apply = () => {
      const src = map.getSource(SOURCE_ID);
      if (src && typeof src.setData === "function") src.setData(data);
    };

    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("load", apply);
  }, [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = requestAnimationFrame(() => map.resize());
    return () => cancelAnimationFrame(t);
  }, [sidebarOpen]);

  const width = sidebarOpen ? "calc(100% - 320px)" : "100%";

  return (
    <div
      ref={mapEl}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width,
        transition: "width 0.3s ease",
      }}
    />
  );
}
