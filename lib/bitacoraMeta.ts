/** Constantes y tipos compartidos de la bitácora (usable desde cliente y servidor). */

export const EVENT_TYPES = [
  "visita",
  "mantencion",
  "incidente",
  "calibracion",
  "otro",
] as const;

export type EventoTipo = (typeof EVENT_TYPES)[number];

export const TIPO_LABEL: Record<EventoTipo, string> = {
  visita: "Visita",
  mantencion: "Mantención",
  incidente: "Incidente",
  calibracion: "Calibración",
  otro: "Otro",
};

export interface EventoBitacora {
  id: number;
  tipo: EventoTipo;
  /** "YYYY-MM-DD HH:mm:ss" en hora local de Chile. */
  fechaHora: string;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  autor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EventoInput {
  tipo: EventoTipo;
  /** "YYYY-MM-DDTHH:mm" desde el input datetime-local. */
  fechaHora: string;
  titulo: string;
  descripcion?: string | null;
  area?: string | null;
  autor: string;
}

export interface EventoFiltros {
  tipo?: EventoTipo | "todos";
  texto?: string;
  /** "YYYY-MM-DD" inclusive. */
  desde?: string;
  hasta?: string;
}
