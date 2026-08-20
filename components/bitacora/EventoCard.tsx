"use client";

import { MapPin, User, Pencil, Users, Wrench, AlertTriangle, BadgeCheck, NotebookPen } from "lucide-react";
import { TIPO_LABEL_PERSISTIDO, type EventoTipoPersistido, type EventoBitacora } from "@/lib/bitacoraMeta";
import { formatDateToMinute } from "@/lib/units";

/** Icono y clases por tipo de evento (badge + punto de la timeline). */
export const TIPO_STYLE: Record<
  EventoTipoPersistido,
  { icon: typeof Users; badge: string; dot: string }
> = {
  visita: {
    icon: Users,
    badge: "bg-info-soft text-info",
    dot: "bg-info",
  },
  mantencion_programada: {
    icon: Wrench,
    badge: "bg-brand-50 text-brand-700",
    dot: "bg-brand-700",
  },
  mantencion_correctiva: {
    icon: Wrench,
    badge: "bg-warn-soft text-warn",
    dot: "bg-warn",
  },
  mantencion: {
    icon: Wrench,
    badge: "bg-brand-50 text-brand-700",
    dot: "bg-brand-700",
  },
  incidente: {
    icon: AlertTriangle,
    badge: "bg-alert-soft text-alert",
    dot: "bg-alert",
  },
  calibracion: {
    icon: BadgeCheck,
    badge: "bg-warn-soft text-warn",
    dot: "bg-warn",
  },
  otro: {
    icon: NotebookPen,
    badge: "bg-surface-2 text-muted ring-1 ring-line",
    dot: "bg-line-strong",
  },
};

type Props = {
  evento: EventoBitacora;
  onEdit: (e: EventoBitacora) => void;
};

/** Item de la timeline: hora, tipo, título, área, detalle y autor. */
export function EventoCard({ evento, onEdit }: Props) {
  const s = TIPO_STYLE[evento.tipo];
  const Icon = s.icon;

  return (
    <li className="relative pl-8">
      {/* punto + línea de la timeline */}
      <span
        aria-hidden
        className={`absolute left-[3px] top-5 h-3 w-3 rounded-full ring-4 ring-canvas ${s.dot}`}
      />
      <article className="card group p-4 transition-shadow hover:shadow-[var(--shadow-pop)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${s.badge}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {TIPO_LABEL_PERSISTIDO[evento.tipo]}
              </span>
              <time
                dateTime={evento.fechaHora}
                className="tnum text-[13px] font-semibold text-muted"
              >
                {formatDateToMinute(evento.fechaHora)}
              </time>
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-brand-900">
              {evento.titulo}
            </h3>
            {evento.area && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {evento.area}
              </p>
            )}
            {evento.descripcion && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {evento.descripcion}
              </p>
            )}
            {evento.archivo && (
              <a
                href={`/api/bitacora/${evento.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 underline underline-offset-2"
              >
                <NotebookPen className="h-3.5 w-3.5" />
                Ver informe: {evento.archivo.nombre}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => onEdit(evento)}
            title="Editar evento"
            aria-label={`Editar evento: ${evento.titulo}`}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-muted transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <footer className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {evento.autor}
          </span>
          {evento.actualizadoEn !== evento.creadoEn && (
            <span>Editado el {formatDateToMinute(evento.actualizadoEn)}</span>
          )}
        </footer>
      </article>
    </li>
  );
}
