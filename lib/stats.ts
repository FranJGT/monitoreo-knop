/**
 * Estadística operacional para el informe: resumen, cumplimiento,
 * tiempo fuera de rango, tendencia, estado y alarmas con histéresis.
 */

export type Range = { min: number | null; max: number | null };
export type SensorStatus = "normal" | "advertencia" | "alerta";
export type Trend = "subiendo" | "bajando" | "estable";

function clean(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v != null && Number.isFinite(v));
}

export function summarize(values: (number | null)[]) {
  const v = clean(values);
  if (!v.length) return { min: null, max: null, avg: null, n: 0 };
  let min = Infinity,
    max = -Infinity,
    sum = 0;
  for (const x of v) {
    if (x < min) min = x;
    if (x > max) max = x;
    sum += x;
  }
  return { min, max, avg: sum / v.length, n: v.length };
}

/** Cuenta de muestras dentro del rango y porcentaje de cumplimiento. */
export function compliance(values: (number | null)[], range: Range) {
  const v = clean(values);
  if (!v.length || range.min == null || range.max == null)
    return { within: 0, total: v.length, pct: null as number | null };
  let within = 0;
  for (const x of v) if (x >= range.min && x <= range.max) within++;
  return { within, total: v.length, pct: (within / v.length) * 100 };
}

/** Minutos fuera de rango estimados (buckets fuera × minutos por bucket). */
export function outOfRange(
  values: (number | null)[],
  range: Range,
  aggMinutes: number
) {
  const v = clean(values);
  if (!v.length || range.min == null || range.max == null)
    return { minutes: 0, buckets: 0, pct: 0 };
  let out = 0;
  for (const x of v) if (x < range.min || x > range.max) out++;
  return {
    minutes: out * aggMinutes,
    buckets: out,
    pct: (out / v.length) * 100,
  };
}

/** Tendencia: compara el promedio del último tercio vs. el tercio previo. */
export function trend(values: (number | null)[]): Trend {
  const v = clean(values);
  if (v.length < 6) return "estable";
  const third = Math.floor(v.length / 3);
  const recent = v.slice(-third);
  const prev = v.slice(-2 * third, -third);
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const diff = avg(recent) - avg(prev);
  const scale = Math.abs(avg(prev)) || 1;
  const rel = diff / scale;
  if (rel > 0.02) return "subiendo";
  if (rel < -0.02) return "bajando";
  return "estable";
}

/** Estado actual según el último valor vs. el rango (con banda de advertencia). */
export function statusFor(
  last: number | null,
  range: Range,
  warnFraction = 0.08
): SensorStatus {
  if (last == null || range.min == null || range.max == null) return "normal";
  if (last < range.min || last > range.max) return "alerta";
  const span = range.max - range.min;
  const margin = Math.max(span * warnFraction, 0);
  if (last <= range.min + margin || last >= range.max - margin)
    return "advertencia";
  return "normal";
}

/**
 * Evaluación de alarma con histéresis sobre una serie ordenada.
 * Se activa cuando el valor cruza el umbral durante `minHold` minutos y
 * se restablece cuando vuelve más allá del valor de recuperación.
 */
export type HysteresisRule = {
  kind: "low" | "high";
  threshold: number;
  recover: number;
  minHoldMin?: number;
};

export function evaluateHysteresis(
  values: (number | null)[],
  rule: HysteresisRule,
  aggMinutes: number
): { active: boolean; activations: number; lastActiveMinutes: number } {
  const minHold = rule.minHoldMin ?? 0;
  let active = false;
  let activations = 0;
  let breachRun = 0; // minutos consecutivos en condición de disparo
  let activeMinutes = 0;

  for (const raw of values) {
    if (raw == null || !Number.isFinite(raw)) continue;
    const breaching =
      rule.kind === "low" ? raw < rule.threshold : raw > rule.threshold;
    const recovered =
      rule.kind === "low" ? raw > rule.recover : raw < rule.recover;

    if (!active) {
      if (breaching) {
        breachRun += aggMinutes;
        if (breachRun >= minHold) {
          active = true;
          activations++;
          activeMinutes = breachRun;
        }
      } else {
        breachRun = 0;
      }
    } else {
      activeMinutes += aggMinutes;
      if (recovered) {
        active = false;
        breachRun = 0;
      }
    }
  }

  return {
    active,
    activations,
    lastActiveMinutes: active ? activeMinutes : 0,
  };
}

export const STATUS_LABEL: Record<SensorStatus, string> = {
  normal: "Normal",
  advertencia: "Advertencia",
  alerta: "Alerta",
};
