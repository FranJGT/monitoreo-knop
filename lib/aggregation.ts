/**
 * Presets de periodo y agregación (minutos por bucket).
 * Valores reusados del sistema original.
 */
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
