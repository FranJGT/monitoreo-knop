import { ClipboardPlus } from "lucide-react";

type Props = {
  equipment: string;
};

/** Abre la bitácora con el equipo del informe ya seleccionado. */
export function RegisterBitacoraButton({ equipment }: Props) {
  const href = `/bitacora?nuevo=1&equipo=${encodeURIComponent(equipment)}`;

  return (
    <a
      href={href}
      className="no-print flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-100"
    >
      <ClipboardPlus className="h-4 w-4" />
      Registrar acción
    </a>
  );
}
