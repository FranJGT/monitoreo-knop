"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Thermometer, BarChart3 } from "lucide-react";

const NAV = [
  {
    href: "/monitoreo/sdp",
    label: "Diferencial de Presión",
    short: "Presión",
    icon: Gauge,
  },
  {
    href: "/monitoreo/termohigrometros",
    label: "Termohigrómetros",
    short: "Temp · Humedad",
    icon: Thermometer,
  },
  { href: "/informe", label: "Informe", short: "Informe", icon: BarChart3 },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/brand/knop-logo.png"
            alt="Knop Laboratorios"
            width={630}
            height={180}
            priority
            className="h-8 w-auto sm:h-9"
          />
          <span className="hidden text-[13px] font-semibold leading-tight text-muted lg:block">
            Ingeniería y Mantención
            <br />
            <span className="text-faint font-medium">Monitoreo ambiental</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
          {NAV.map(({ href, label, short, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-muted hover:bg-brand-50 hover:text-brand-800",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
