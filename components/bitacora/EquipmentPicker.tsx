"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { EquipmentOption } from "@/lib/equipment";

type Props = {
  id: string;
  value: string;
  options: EquipmentOption[];
  fallbackLabel?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitLabel(label: string): { primary: string; secondary: string | null } {
  const separatorIndex = label.indexOf(" — ");
  if (separatorIndex < 0) return { primary: label, secondary: null };
  return {
    primary: label.slice(0, separatorIndex),
    secondary: label.slice(separatorIndex + 3) || null,
  };
}

function kindLabel(kind: EquipmentOption["kind"]): string {
  return kind === "dp" ? "SDP" : "STH";
}

function compactLabel(option: EquipmentOption): string {
  const prefix = `${kindLabel(option.kind)} · `;
  const label = option.label.startsWith(prefix) ? option.label.slice(prefix.length) : option.label;
  const { primary, secondary } = splitLabel(label);
  if (!secondary) return label;

  const identifierPattern = primary
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
  const compactSecondary = secondary
    .replace(new RegExp(`^${identifierPattern}\\s*[-–—:|]*\\s*`, "i"), "")
    .trim();

  return compactSecondary ? `${primary} — ${compactSecondary}` : primary;
}

/** Selector buscable y agrupado por las categorías solicitadas: STH y SDP. */
export function EquipmentPicker({
  id,
  value,
  options,
  fallbackLabel,
  placeholder = "Buscar equipo…",
  onChange,
  onBlur,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value) ?? null;
  const selectedLabel = selected
    ? `${kindLabel(selected.kind)} · ${compactLabel(selected)}`
    : fallbackLabel || value;

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) =>
        compactLabel(a).localeCompare(compactLabel(b), "es", { numeric: true, sensitivity: "base" })
      ),
    [options]
  );
  const filteredOptions = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    if (!needle) return sortedOptions;
    return sortedOptions.filter((option) =>
      normalizeSearch(`${compactLabel(option)} ${option.label} ${option.value} ${option.id}`).includes(needle)
    );
  }, [query, sortedOptions]);
  const sthOptions = filteredOptions.filter((option) => option.kind === "sth");
  const dpOptions = filteredOptions.filter((option) => option.kind === "dp");
  const activeOptionIndex = Math.min(activeIndex, Math.max(filteredOptions.length - 1, 0));

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const closePicker = () => {
    setOpen(false);
    setQuery("");
  };

  const selectOption = (option: EquipmentOption) => {
    onChange(option.value);
    closePicker();
    inputRef.current?.focus();
  };

  const openPicker = () => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && filteredOptions[activeOptionIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeOptionIndex]);
    }
  };

  const renderOption = (option: EquipmentOption, index: number) => {
    const { primary, secondary } = splitLabel(compactLabel(option));
    const selectedOption = option.value === value;
    const activeOption = filteredOptions[activeOptionIndex]?.value === option.value;
    return (
      <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={selectedOption}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectOption(option)}
        className={[
          "flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors",
          activeOption ? "bg-brand-50" : "hover:bg-surface-2",
        ].join(" ")}
      >
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-brand-700">
          {selectedOption && <Check className="h-4 w-4" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink">{primary}</span>
          {secondary && <span className="block truncate text-xs text-muted">{secondary}</span>}
        </span>
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
          value={open ? query : selectedLabel}
          placeholder={open ? placeholder : "Selecciona un equipo"}
          onFocus={openPicker}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-9 pr-16 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-brand-300 focus:border-brand-500"
        />
        {value && (
          <button
            type="button"
            aria-label="Limpiar equipo seleccionado"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-8 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Cerrar lista de equipos" : "Abrir lista de equipos"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => (open ? closePicker() : openPicker())}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Equipos STH y SDP"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-pop)]"
        >
          {value && !selected && fallbackLabel && (
            <div className="mb-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
              {fallbackLabel}
            </div>
          )}
          {!filteredOptions.length && (
            <p className="px-3 py-5 text-center text-sm text-muted">
              No encontramos equipos con “{query}”.
            </p>
          )}
          {!!sthOptions.length && (
            <div>
              <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                STH
              </p>
              {sthOptions.map((option) => renderOption(option, filteredOptions.indexOf(option)))}
            </div>
          )}
          {!!dpOptions.length && (
            <div className={sthOptions.length ? "mt-2 border-t border-line pt-2" : ""}>
              <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                SDP
              </p>
              {dpOptions.map((option) => renderOption(option, filteredOptions.indexOf(option)))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
