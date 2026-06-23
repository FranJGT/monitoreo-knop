import Link from "next/link";
import { Gauge, Thermometer, BarChart3, ArrowRight, Activity } from "lucide-react";

const CARDS = [
  {
    href: "/monitoreo/sdp",
    icon: Gauge,
    title: "Diferencial de Presión",
    desc: "Cascadas de presión en esclusas y salas limpias (Pa / inH₂O), con rangos operacionales y exportación.",
  },
  {
    href: "/monitoreo/termohigrometros",
    icon: Thermometer,
    title: "Termohigrómetros",
    desc: "Temperatura y humedad relativa en bodegas, salas y laboratorios, contra rango de aceptación.",
  },
  {
    href: "/informe",
    icon: BarChart3,
    title: "Informe estadístico",
    desc: "Estado general, cumplimiento, tiempo fuera de rango y alarmas — listo para exportar a PDF.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
          <Activity className="h-3.5 w-3.5" /> Monitoreo ambiental en tiempo real
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl">
          Plataforma de monitoreo
          <br />
          <span className="text-brand-700">Knop Laboratorios</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Visualización y análisis de los sensores de diferencial de presión y
          termohigrómetros de las áreas controladas. Datos en vivo, rangos de
          aceptación e informes estadísticos para soporte de calidad y mantención.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-brand-900">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              Abrir
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
