import type {
  DpDevice,
  DpRow,
  RangoDp,
  RangoSth,
  SthDevice,
  SthRow,
} from "./knopTypes";
import type { PresetKey } from "./aggregation";

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export type KpiClientParams = {
  id: string;
  preset?: PresetKey;
  start?: string;
  end?: string;
  /** `null` = no enviar agg (usa el agg por defecto del servidor). */
  agg?: number | null;
};

function kpiUrl(kind: "dp" | "sth", p: KpiClientParams): string {
  const u = new URLSearchParams({ type: kind, id: p.id });
  if (p.start && p.end) {
    u.set("start", p.start);
    u.set("end", p.end);
    if (p.agg) u.set("agg", String(p.agg));
  } else {
    if (p.preset) u.set("preset", p.preset);
    if (p.agg) u.set("agg", String(p.agg));
  }
  return `/api/knop/kpi?${u.toString()}`;
}

/* Diferencial de Presión */
export const getDpDevices = (signal?: AbortSignal) =>
  get<DpDevice[]>("/api/knop/devices?type=dp", signal);

export const getDpKpi = (p: KpiClientParams, signal?: AbortSignal) =>
  get<DpRow[]>(kpiUrl("dp", p), signal);

export const getDpRango = (id: string, signal?: AbortSignal) =>
  get<RangoDp | null>(`/api/knop/rango?type=dp&id=${encodeURIComponent(id)}`, signal);

/* Termohigrómetros */
export const getSthDevices = (signal?: AbortSignal) =>
  get<SthDevice[]>("/api/knop/devices?type=sth", signal);

export const getSthKpi = (p: KpiClientParams, signal?: AbortSignal) =>
  get<SthRow[]>(kpiUrl("sth", p), signal);

export const getSthRango = (id: string, signal?: AbortSignal) =>
  get<RangoSth | null>(`/api/knop/rango?type=sth&id=${encodeURIComponent(id)}`, signal);
