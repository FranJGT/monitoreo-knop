"use client";

import { ChevronDown } from "lucide-react";
import { PRESETS, type PresetKey } from "@/lib/aggregation";

export type SelOption = { value: string; label: string; group?: string };

export function SensorSelect({
  label = "Sensor",
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelOption[];
}) {
  const hasGroups = options.some((o) => o.group);
  const groups = hasGroups
    ? [
        ...options.reduce((m, o) => {
          const g = o.group || "Otros";
          if (!m.has(g)) m.set(g, [] as SelOption[]);
          m.get(g)!.push(o);
          return m;
        }, new Map<string, SelOption[]>()),
      ]
    : null;

  return (
    <div className="min-w-[260px] flex-1">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-line-strong bg-surface pl-3.5 pr-10 text-sm font-semibold text-ink outline-none hover:border-brand-300 focus:border-brand-500"
        >
          {options.length === 0 && <option value="">Cargando…</option>}
          {groups
            ? groups.map(([g, opts]) => (
                <optgroup key={g} label={g}>
                  {opts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      </div>
    </div>
  );
}

export function PresetRow({
  value,
  onSelect,
}: {
  value: PresetKey | null;
  onSelect: (k: PresetKey) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
        Periodo
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = value === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p.key)}
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
  );
}
