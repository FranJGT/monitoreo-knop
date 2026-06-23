import { ShieldCheck, AlertTriangle, OctagonAlert } from "lucide-react";
import type { SensorStatus } from "@/lib/stats";
import { STATUS_LABEL } from "@/lib/stats";

const STYLES: Record<
  SensorStatus,
  { bg: string; ring: string; text: string; icon: typeof ShieldCheck; msg: string }
> = {
  normal: {
    bg: "bg-gradient-to-br from-brand-700 to-brand-800",
    ring: "ring-brand-600",
    text: "text-white",
    icon: ShieldCheck,
    msg: "Todo dentro de rango",
  },
  advertencia: {
    bg: "bg-gradient-to-br from-amber-500 to-amber-600",
    ring: "ring-amber-400",
    text: "text-white",
    icon: AlertTriangle,
    msg: "Cerca del límite operacional",
  },
  alerta: {
    bg: "bg-gradient-to-br from-red-600 to-red-700",
    ring: "ring-red-500",
    text: "text-white",
    icon: OctagonAlert,
    msg: "Fuera de rango",
  },
};

export function StatusHero({
  status,
  compliancePct,
  outMinutes,
}: {
  status: SensorStatus;
  compliancePct: number | null;
  outMinutes: number;
}) {
  const s = STYLES[status];
  const Icon = s.icon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${s.bg} p-6 shadow-[var(--shadow-card)] ring-1 ${s.ring}`}
    >
      <div className="flex items-start gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Icon className="h-9 w-9 text-white" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
            Estado general
          </div>
          <div className="mt-1 text-4xl font-extrabold leading-none text-white">
            {STATUS_LABEL[status].toUpperCase()}
          </div>
          <div className="mt-2 text-sm font-medium text-white/85">{s.msg}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            Cumplimiento
          </div>
          <div className="tnum mt-0.5 text-2xl font-extrabold text-white">
            {compliancePct == null ? "—" : `${compliancePct.toFixed(1)}%`}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            Tiempo fuera de rango
          </div>
          <div className="tnum mt-0.5 text-2xl font-extrabold text-white">
            {outMinutes} min
          </div>
        </div>
      </div>
    </div>
  );
}
