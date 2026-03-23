import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "towers";
const LAYER_ID = "towers-circles";

const emptyCollection = {
  type: "FeatureCollection",
  features: [],
};

export default function Map({ geojson, onTowerClick, sidebarOpen }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const onTowerClickRef = useRef(onTowerClick);

  useEffect(() => {
    onTowerClickRef.current = onTowerClick;
  }, [onTowerClick]);

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
    });

    mapRef.current = map;

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.remove();
      mapRef.current = null;
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
