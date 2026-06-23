"use client";

import { type DateRange } from "react-day-picker";
import { Download, RotateCcw, ChevronDown, Loader2 } from "lucide-react";
import { PRESETS, type PresetKey } from "@/lib/aggregation";
import { DateRangePopover } from "./DateRangePopover";

export type DeviceOption = { value: string; label: string; group?: string };

type Props = {
  devices: DeviceOption[];
  deviceValue: string;
  onDeviceChange: (v: string) => void;
  preset: PresetKey | null;
  onPreset: (k: PresetKey) => void;
  range?: DateRange;
  onApplyRange: (r?: DateRange) => void;
  onReset: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  loading?: boolean;
  deviceLabel?: string;
};

function groupOptions(devices: DeviceOption[]) {
  const hasGroups = devices.some((d) => d.group);
  if (!hasGroups) return null;
  const map = new Map<string, DeviceOption[]>();
  for (const d of devices) {
    const g = d.group || "Otros";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(d);
  }
  return [...map.entries()];
}

export function MonitorToolbar({
  devices,
  deviceValue,
  onDeviceChange,
  preset,
  onPreset,
  range,
  onApplyRange,
  onReset,
  onExport,
  exportDisabled,
  loading,
  deviceLabel = "Código del Sensor",
}: Props) {
  const grouped = groupOptions(devices);

  return (
    <div className="card grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(260px,320px)_1fr_auto]">
      {/* Selector de sensor */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          {deviceLabel}
        </label>
        <div className="relative">
          <select
            value={deviceValue}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-line-strong bg-surface pl-3.5 pr-10 text-sm font-semibold text-ink outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
          >
            {devices.length === 0 && <option value="">Cargando…</option>}
            {grouped
              ? grouped.map(([g, opts]) => (
                  <optgroup key={g} label={g}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : devices.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        </div>
      </div>

      {/* Periodo rápido */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          Periodo
          {loading && (
            <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-brand-500 align-[-2px]" />
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPreset(p.key)}
                className={[
                  "h-11 rounded-xl border px-3.5 text-[13px] font-bold transition-all",
                  active
                    ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                    : "border-line-strong bg-surface text-ink hover:border-brand-300 hover:bg-brand-50",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango + acciones */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-muted">
          Rango de fechas
        </label>
        <div className="flex items-center gap-2">
          <DateRangePopover value={range} onApply={onApplyRange} className="min-w-[220px]" />
          <button
            type="button"
            onClick={onReset}
            title="Reiniciar a 24 horas"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-brand-300 hover:text-brand-800"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="flex h-11 items-center gap-1.5 rounded-xl bg-brand-800 px-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
