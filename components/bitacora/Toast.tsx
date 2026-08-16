"use client";

import { useEffect } from "react";

export type ToastState = {
  message: string;
  tone: "success" | "error";
} | null;

type Props = { toast: ToastState; onDismiss: () => void };

/** Mensaje transitorio con auto-dismiss (3,5 s), según guideline de feedback. */
export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-pop)]",
        toast.tone === "success" ? "bg-brand-700" : "bg-alert",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}
