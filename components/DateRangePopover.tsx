"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { CalendarDays } from "lucide-react";

function fmt(d?: Date): string {
  if (!d) return "";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  value?: DateRange;
  onApply: (range: DateRange | undefined) => void;
  className?: string;
};

export function DateRangePopover({ value, onApply, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    if (next) setDraft(value); // sincroniza el borrador al abrir
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label =
    value?.from && value?.to
      ? `${fmt(value.from)} – ${fmt(value.to)}`
      : value?.from
        ? fmt(value.from)
        : "Rango personalizado";

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={toggle}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand-300"
      >
        <CalendarDays className="h-[18px] w-[18px] text-brand-700" />
        <span className={value?.from ? "" : "text-faint font-medium"}>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-pop)]">
          <DayPicker
            mode="range"
            locale={es}
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={1}
            weekStartsOn={1}
          />
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => {
                setDraft(undefined);
                onApply(undefined);
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:bg-canvas"
            >
              Limpiar
            </button>
            <button
              type="button"
              disabled={!draft?.from || !draft?.to}
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
              className="rounded-lg bg-brand-700 px-3.5 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
