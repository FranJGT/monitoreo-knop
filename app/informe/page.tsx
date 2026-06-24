"use client";

import { useState } from "react";
import { Printer, Gauge, Thermometer } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { DpReport } from "@/components/report/DpReport";
import { SthReport } from "@/components/report/SthReport";

type Tipo = "dp" | "sth";

export default function InformePage() {
  const [tipo, setTipo] = useState<Tipo>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("tipo") === "sth"
      ? "sth"
      : "dp"
  );

  return (
    <div className="informe-root mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <PageHeading
        kicker="Knop Laboratorios · Análisis"
        title="Informe estadístico"
        subtitle="Estado, cumplimiento y alarmas por sensor — listo para exportar a PDF"
        right={
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            <Printer className="h-4 w-4" />
            Generar PDF
          </button>
        }
      />

      {/* Toggle tipo de sensor */}
      <div className="no-print inline-flex w-fit rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-card)]">
        <TypeTab active={tipo === "dp"} onClick={() => setTipo("dp")} icon={<Gauge className="h-4 w-4" />}>
          Diferencial de Presión
        </TypeTab>
        <TypeTab active={tipo === "sth"} onClick={() => setTipo("sth")} icon={<Thermometer className="h-4 w-4" />}>
          Termohigrómetro
        </TypeTab>
      </div>

      {tipo === "dp" ? <DpReport /> : <SthReport />}

      <p className="mt-1 text-center text-xs text-faint">
        Informe generado el {new Date().toLocaleString("es-CL")} · Knop Laboratorios ·
        Monitoreo ambiental
      </p>
    </div>
  );
}

function TypeTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
        active ? "bg-brand-700 text-white shadow-sm" : "text-muted hover:bg-brand-50 hover:text-brand-800",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
