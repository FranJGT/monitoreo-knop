import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/** Fila de regla de alarma con estado OK / ACTIVA. */
export function AlarmRow({
  label,
  rule,
  active,
}: {
  label: string;
  rule: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            active ? "bg-alert-soft text-alert" : "bg-ok-soft text-ok"
          }`}
        >
          {active ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">{label}</div>
          <div className="tnum text-xs text-faint">{rule}</div>
        </div>
      </div>
      <span className={`text-xs font-bold ${active ? "text-alert" : "text-ok"}`}>
        {active ? "ACTIVA" : "OK"}
      </span>
    </div>
  );
}

/** Fila etiqueta/valor para paneles de estadística. */
export function StatRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <span className="text-sm text-muted">{label}</span>
      <span className="tnum text-sm font-bold text-brand-900">{value}</span>
    </div>
  );
}

/** Fila de información del sensor (icono + etiqueta + valor). */
export function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-2 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <span className="flex items-center gap-1.5 text-sm text-muted">
        <span className="text-brand-600">{icon}</span>
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-brand-900">
        {value}
      </span>
    </div>
  );
}

/** Subtítulo de bloque dentro de un panel. */
export function PanelSubhead({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted first:mt-0">
      {children}
    </div>
  );
}
