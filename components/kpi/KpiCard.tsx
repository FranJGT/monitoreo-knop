import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Trend } from "@/lib/stats";

const TREND_META: Record<Trend, { icon: typeof Minus; label: string; cls: string }> = {
  subiendo: { icon: TrendingUp, label: "Subiendo", cls: "text-brand-600" },
  bajando: { icon: TrendingDown, label: "Bajando", cls: "text-info" },
  estable: { icon: Minus, label: "Estable", cls: "text-faint" },
};

export function KpiCard({
  label,
  value,
  unit,
  sub,
  icon,
  trend,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon?: ReactNode;
  trend?: Trend;
}) {
  const t = trend ? TREND_META[trend] : null;
  const TIcon = t?.icon;
  return (
    <div className="card flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
          {icon && <span className="text-brand-600">{icon}</span>}
          {label}
        </span>
        {t && TIcon && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${t.cls}`}>
            <TIcon className="h-3.5 w-3.5" />
            {t.label}
          </span>
        )}
      </div>
      <div className="tnum flex items-baseline gap-1">
        <span className="text-2xl font-extrabold leading-tight text-brand-900">
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-muted">{unit}</span>}
      </div>
      {sub && <div className="truncate text-xs text-faint">{sub}</div>}
    </div>
  );
}
