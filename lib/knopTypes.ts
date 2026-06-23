import type { PresetKey } from "./aggregation";

export type SensorKind = "dp" | "sth";

/** Dispositivo de diferencial de presión (deviceDP.php). */
export type DpDevice = {
  devEui: string;
  identificador: string;
  ubicacion: string;
  area: string;
  seccion: string;
  tipoRango: string;
  label: string;
};

/** Dispositivo termohigrómetro (device.php → "CODE - Ubicacion"). */
export type SthDevice = {
  /** Etiqueta completa "CODE - Ubicacion" — es el parámetro deviceName. */
  name: string;
  identificador: string;
  ubicacion: string;
};

/** Fila normalizada de presión (kpiDP.php). */
export type DpRow = {
  t: string; // bucket_time
  last: string | null; // last_datetime
  pa: number | null;
};

/** Fila normalizada de termohigrómetro (kpiSTH.php). */
export type SthRow = {
  t: string; // bucket_time
  tempC: number | null; // tempC_SHT
  hum: number | null; // hum_SHT
  batV: number | null; // batV
  tempDs: number | null; // tempC_DS
};

/** Rango operacional de presión (rangoDP.php). */
export type RangoDp = {
  ok: boolean;
  identificador: string;
  area: string;
  seccion: string;
  ubicacion: string;
  tipo: string;
  descripcion: string;
  minPa: number | null;
  maxPa: number | null;
  visible: boolean;
};

/** Rango de aceptación termohigrómetro (rangoSTH.php). */
export type RangoSth = {
  ok: boolean;
  identificador: string;
  tipo: string;
  tempMin: number | null;
  tempMax: number | null;
  humMin: number | null;
  humMax: number | null;
};

export type KpiQuery = {
  kind: SensorKind;
  /** devEui (dp) o deviceName (sth). */
  id: string;
  preset?: PresetKey;
  start?: string;
  end?: string;
  agg?: number;
};
