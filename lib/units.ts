/**
 * Conversiones y formato de unidades.
 * Regla del sistema original: 1 inH₂O = 249.08891 Pa.
 */
export const PA_PER_INH2O = 249.08891;

export function paToInH2O(pa: number): number {
  return pa / PA_PER_INH2O;
}

/** Parsea fechas tipo "2026-06-22 01:53:09.164" o ISO de forma robusta. */
function parseRaw(raw: string | number | Date): Date | null {
  if (raw instanceof Date) return raw;
  if (raw == null) return null;
  const d = new Date(String(raw).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

/** "dd-mm-yyyy HH:mm" (usado en títulos / "última lectura"). */
export function formatDateToMinute(raw: string | number | Date): string {
  const d = parseRaw(raw);
  if (!d) return String(raw ?? "");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

/**
 * Etiqueta para el eje X, redondeada al minuto. Replica el original:
 * si segundos >= 30 sube un minuto. Devuelve "dd-mm-yyyy HH:mm:00".
 */
export function formatLabelDate(raw: string | number | Date): string {
  const d = parseRaw(raw);
  if (!d) return String(raw ?? "");
  if (d.getSeconds() >= 30) d.setMinutes(d.getMinutes() + 1);
  d.setSeconds(0, 0);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:00`;
}

/** Formatea un número con n decimales y separadores es-CL; "—" si null/NaN. */
export function fmt(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Fecha YYYY-MM-DD en hora local (para parámetros start/end). */
export function ymdLocal(d: Date): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export function todayLocalDate(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
