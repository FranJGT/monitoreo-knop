"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type DateRange } from "react-day-picker";
import {
  aggForPreset,
  estimateAggFromDates,
  type PresetKey,
} from "./aggregation";
import { ymdLocal } from "./units";
import type { KpiClientParams } from "./knopClient";

type Query = {
  preset?: PresetKey;
  start?: string;
  end?: string;
  agg: number | null;
};

type AggFns = {
  aggFn: (k: PresetKey) => number | null;
  estimateFn: (start: string, end: string) => number | null;
  /** Si se define, los presets se convierten a start/end (p. ej. STH, cuyo
   *  endpoint no respeta `preset`). */
  presetToRange?: (k: PresetKey) => { start: string; end: string };
};

function buildQuery(preset: PresetKey | null, range: DateRange | undefined, fns: AggFns): Query {
  if (range?.from && range?.to) {
    const start = ymdLocal(range.from);
    const end = ymdLocal(range.to);
    return { start, end, agg: fns.estimateFn(start, end) };
  }
  const p = preset ?? "24h";
  if (fns.presetToRange) {
    const r = fns.presetToRange(p);
    return { start: r.start, end: r.end, agg: fns.aggFn(p) };
  }
  return { preset: p, agg: fns.aggFn(p) };
}

export function useSensorSeries<TRow>(opts: {
  id: string;
  fetchData: (q: KpiClientParams, signal: AbortSignal) => Promise<TRow[]>;
  autoRefreshMs?: number;
  aggForPreset?: (k: PresetKey) => number | null;
  estimateAgg?: (start: string, end: string) => number | null;
  presetToRange?: (k: PresetKey) => { start: string; end: string };
}) {
  const {
    id,
    fetchData,
    autoRefreshMs = 60000,
    aggForPreset: aggFn = aggForPreset,
    estimateAgg: estimateFn = estimateAggFromDates,
    presetToRange,
  } = opts;

  const [preset, setPresetState] = useState<PresetKey | null>("24h");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [rows, setRows] = useState<TRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const query = buildQuery(preset, range, { aggFn, estimateFn, presetToRange });

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchData(
          { id, preset: query.preset, start: query.start, end: query.end, agg: query.agg },
          controller.signal
        );
        setRows(data);
        setLastUpdated(new Date());
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Error desconocido");
        setRows([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, query.preset, query.start, query.end, query.agg, fetchData]
  );

  // Carga cuando cambian id / periodo / rango
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  // Auto-refresh silencioso
  useEffect(() => {
    if (!autoRefreshMs || !id) return;
    const t = setInterval(() => load(true), autoRefreshMs);
    return () => clearInterval(t);
  }, [load, autoRefreshMs, id]);

  const setPreset = useCallback((k: PresetKey) => {
    setRange(undefined);
    setPresetState(k);
  }, []);

  const applyRange = useCallback((r?: DateRange) => {
    if (r?.from && r?.to) {
      setPresetState(null);
      setRange(r);
    } else {
      setRange(undefined);
      setPresetState("24h");
    }
  }, []);

  const reset = useCallback(() => {
    setRange(undefined);
    setPresetState("24h");
  }, []);

  return {
    preset,
    range,
    rows,
    loading,
    error,
    lastUpdated,
    query,
    setPreset,
    applyRange,
    reset,
    reload: load,
  };
}
