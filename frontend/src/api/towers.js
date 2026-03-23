const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

function buildParams(filters) {
  const params = new URLSearchParams();
  if (!filters || typeof filters !== "object") return params;
  const keys = ["color", "state", "owner", "min_score", "max_score"];
  for (const key of keys) {
    const v = filters[key];
    if (v === undefined || v === null || v === "") continue;
    if (key === "min_score" || key === "max_score") {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      params.set(key, String(n));
    } else {
      params.set(key, String(v));
    }
  }
  return params;
}

export async function fetchGeoJSON(filters) {
  const q = buildParams(filters);
  const url = `${BASE}/towers/geojson${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GeoJSON failed: ${res.status}`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/towers/stats`);
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
}

export async function fetchTower(id) {
  const enc = encodeURIComponent(id);
  const res = await fetch(`${BASE}/towers/${enc}`);
  if (!res.ok) throw new Error(`Tower failed: ${res.status}`);
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${BASE}/towers/filters/options`);
  if (!res.ok) throw new Error(`Filter options failed: ${res.status}`);
  return res.json();
}

export async function fetchDoeMatchGeoJSON() {
  const res = await fetch(`${BASE}/towers/geojson/doe-match`);
  return res.json();
}

export async function downloadTowersCsv(filters) {
  const q = buildParams(filters);
  const url = `${BASE}/towers/export/csv${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV export failed: ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = "towers_export.csv";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
