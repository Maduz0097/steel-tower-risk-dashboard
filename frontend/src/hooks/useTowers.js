import { useCallback, useEffect, useState } from "react";
import { fetchGeoJSON, fetchStats } from "../api/towers.js";

export function useTowers(filters) {
  const [geojson, setGeojson] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(filters ?? {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gj, st] = await Promise.all([
        fetchGeoJSON(filters ?? {}),
        fetchStats(),
      ]);
      setGeojson(gj);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { geojson, stats, loading, error, reload: load };
}
