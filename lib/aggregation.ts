/**
 * Presets de periodo y agregación (minutos por bucket).
 * Valores reusados del sistema original.
 */
import { ymdLocal } from "./units";

export type PresetKey = "24h" | "2d" | "3d" | "7d" | "30d" | "12m";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "24h", label: "24 Horas" },
  { key: "2d", label: "2 Días" },
  { key: "3d", label: "3 Días" },
  { key: "7d", label: "7 Días" },
  { key: "30d", label: "30 Días" },
  { key: "12m", label: "12 Meses" },
];

export const AGG_MAP: Record<PresetKey, number> = {
  "24h": 5,
  "2d": 5,
  "3d": 5,
  "7d": 15,
  "30d": 60,
  "12m": 1440,
};

export function aggForPreset(key: PresetKey): number {
  return AGG_MAP[key] ?? 5;
}

/** Estima la agregación adecuada para un rango personalizado (en días). */
export function estimateAggFromDates(startYmd: string, endYmd: string): number {
  const a = new Date(startYmd + "T00:00:00");
  const b = new Date(endYmd + "T23:59:59");
  const days = Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 3600 * 1000)));
  if (days <= 3) return 5;
  if (days <= 7) return 15;
  if (days <= 30) return 60;
  return 1440;
}

/* ------------------------------- Termohigrómetros ------------------------------- */
// El endpoint kpiSTH.php NO respeta `preset` (devuelve solo ~1 día): el sistema
// original SIEMPRE consulta por start/end y usa su propio mapeo de agg. Se replica
// aquí para que los datos —y por tanto el Excel— coincidan con el original.

/** Agg (min/bucket) por preset para termohigrómetros. `null` = agg por defecto del servidor. */
export const AGG_MAP_STH: Record<PresetKey, number | null> = {
  "24h": null,
  "2d": null,
  "3d": null,
  "7d": 10,
  "30d": 30,
  "12m": 60,
};

export function aggForPresetSth(key: PresetKey): number | null {
  return key in AGG_MAP_STH ? AGG_MAP_STH[key] : null;
}

/** Estima la agregación STH para un rango personalizado (replica el original). */
export function estimateAggFromDatesSth(startYmd: string, endYmd: string): number | null {
  const a = new Date(startYmd + "T00:00:00");
  const b = new Date(endYmd + "T23:59:59");
  const days = Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 3600 * 1000)));
  if (days <= 3) return null;
  if (days <= 7) return 10;
  if (days <= 30) return 30;
  return 60;
}

/** Rango de fechas (YYYY-MM-DD) equivalente a un preset, relativo a hoy.
 *  Replica getRangeAndAgg() del sistema STH original (end = hoy, start = hoy − N). */
export function presetRangeYmd(key: PresetKey): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  switch (key) {
    case "24h":
      start.setDate(start.getDate() - 1);
      break;
    case "2d":
      start.setDate(start.getDate() - 2);
      break;
    case "3d":
      start.setDate(start.getDate() - 3);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "12m":
      start.setMonth(start.getMonth() - 12);
      break;
  }
  return { start: ymdLocal(start), end: ymdLocal(now) };
}
