import "server-only";
import type {
  DpDevice,
  DpRow,
  RangoDp,
  RangoSth,
  SthDevice,
  SthRow,
  KpiQuery,
} from "./knopTypes";

/** Base del sistema del cliente (Knop/Softronica). */
export const UPSTREAM = "https://newenergy.softronica.cl/knop/monitoreo/";

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

async function getJson<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upstream ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/* ---------------------------- Diferencial de Presión ---------------------------- */

export async function fetchDpDevices(): Promise<DpDevice[]> {
  type Raw = {
    devEui?: string;
    identificador?: string;
    ubicacion?: string;
    area?: string;
    seccion?: string;
    tipo_rango?: string;
    label?: string;
  };
  const rows = await getJson<Raw[]>(`${UPSTREAM}sdp/deviceDP.php`, 300);
  return (rows ?? []).map((r) => ({
    devEui: r.devEui ?? "",
    identificador: r.identificador ?? r.devEui ?? "",
    ubicacion: r.ubicacion ?? "",
    area: r.area ?? "",
    seccion: r.seccion ?? "",
    tipoRango: r.tipo_rango ?? "",
    label: r.label ?? r.identificador ?? r.devEui ?? "",
  }));
}

export async function fetchDpKpi(q: KpiQuery): Promise<DpRow[]> {
  const url = new URL(`${UPSTREAM}sdp/kpiDP.php`);
  url.searchParams.set("devEui", q.id);
  if (q.start && q.end) {
    url.searchParams.set("start", q.start);
    url.searchParams.set("end", q.end);
    if (q.agg) url.searchParams.set("agg", String(q.agg));
  } else {
    if (q.preset) url.searchParams.set("preset", q.preset);
    if (q.agg) url.searchParams.set("agg", String(q.agg));
  }
  type Raw = {
    bucket_time?: string;
    last_datetime?: string;
    Differential_pressure_Pa?: number | string;
  };
  const rows = await getJson<Raw[]>(url.toString(), 30);
  return (rows ?? []).map((r) => ({
    t: String(r.bucket_time ?? ""),
    last: r.last_datetime ?? null,
    pa: toNum(r.Differential_pressure_Pa),
  }));
}

export async function fetchDpRango(devEui: string): Promise<RangoDp | null> {
  type Raw = {
    ok?: boolean;
    identificador?: string;
    area?: string;
    seccion?: string;
    ubicacion?: string;
    tipo_rango_dp?: string;
    tipo_rango?: string;
    descripcion_rango?: string;
    descripcion?: string;
    min_pa?: number | string;
    max_pa?: number | string;
    visible?: number | string;
  };
  const url = `${UPSTREAM}sdp/rangoDP.php?devEui=${encodeURIComponent(devEui)}`;
  const r = await getJson<Raw>(url, 300);
  if (!r || r.ok === false) return null;
  return {
    ok: true,
    identificador: r.identificador ?? "",
    area: r.area ?? "",
    seccion: r.seccion ?? "",
    ubicacion: r.ubicacion ?? "",
    tipo: r.tipo_rango_dp ?? r.tipo_rango ?? "",
    descripcion: r.descripcion_rango ?? r.descripcion ?? "",
    minPa: toNum(r.min_pa),
    maxPa: toNum(r.max_pa),
    visible: Number(r.visible ?? 0) === 1,
  };
}

/* ------------------------------- Termohigrómetros ------------------------------- */

export async function fetchSthDevices(): Promise<SthDevice[]> {
  const rows = await getJson<string[]>(`${UPSTREAM}device.php`, 300);
  return (rows ?? []).map((label) => {
    const name = String(label);
    const sep = name.indexOf(" - ");
    return {
      name,
      identificador: sep >= 0 ? name.slice(0, sep) : name,
      ubicacion: sep >= 0 ? name.slice(sep + 3) : "",
    };
  });
}

export async function fetchSthKpi(q: KpiQuery): Promise<SthRow[]> {
  const url = new URL(`${UPSTREAM}kpiSTH.php`);
  url.searchParams.set("deviceName", q.id);
  if (q.start && q.end) {
    url.searchParams.set("start", q.start);
    url.searchParams.set("end", q.end);
    if (q.agg) url.searchParams.set("agg", String(q.agg));
  } else {
    if (q.preset) url.searchParams.set("preset", q.preset);
    if (q.agg) url.searchParams.set("agg", String(q.agg));
  }
  type Raw = {
    bucket_time?: string;
    tempC_SHT?: number | string;
    hum_SHT?: number | string;
    batV?: number | string;
    tempC_DS?: number | string;
  };
  const rows = await getJson<Raw[]>(url.toString(), 30);
  return (rows ?? []).map((r) => ({
    t: String(r.bucket_time ?? ""),
    tempC: toNum(r.tempC_SHT),
    hum: toNum(r.hum_SHT),
    batV: toNum(r.batV),
    tempDs: toNum(r.tempC_DS),
  }));
}

export async function fetchSthRango(deviceName: string): Promise<RangoSth | null> {
  type Raw = {
    ok?: boolean;
    identificador?: string;
    tipo_rango_sth?: string;
    temp_min?: number | string;
    temp_max?: number | string;
    hum_min?: number | string;
    hum_max?: number | string;
  };
  const url = `${UPSTREAM}rangoSTH.php?deviceName=${encodeURIComponent(deviceName)}`;
  const r = await getJson<Raw>(url, 300);
  if (!r || r.ok === false) return null;
  return {
    ok: true,
    identificador: r.identificador ?? "",
    tipo: r.tipo_rango_sth ?? "",
    tempMin: toNum(r.temp_min),
    tempMax: toNum(r.temp_max),
    humMin: toNum(r.hum_min),
    humMax: toNum(r.hum_max),
  };
}
