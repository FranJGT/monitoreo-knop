import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

type Props = {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children: ReactNode;
  className?: string;
};

export function ChartFrame({
  loading,
  error,
  empty,
  emptyText = "Sin datos para los filtros seleccionados.",
  children,
  className,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 ${className ?? ""}`}
    >
      {children}

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60 backdrop-blur-[1px]">
          <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            Cargando datos…
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <AlertTriangle className="h-8 w-8 text-alert" />
          <p className="text-sm font-semibold text-ink">No se pudieron cargar los datos</p>
          <p className="max-w-sm text-xs text-muted">{error}</p>
        </div>
      )}

      {!loading && !error && empty && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Inbox className="h-8 w-8 text-faint" />
          <p className="text-sm font-medium text-muted">{emptyText}</p>
        </div>
      )}
    </div>
  );
}
