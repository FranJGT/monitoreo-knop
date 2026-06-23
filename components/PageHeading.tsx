import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function PageHeading({ kicker, title, subtitle, right }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && (
          <div className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
            {kicker}
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-[32px] sm:leading-none">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}
