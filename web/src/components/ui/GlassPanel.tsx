import type { ReactNode } from "react";

export default function GlassPanel({
  eyebrow,
  title,
  children,
  footer,
  className,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`glass-panel isolate p-7 ${className ?? ""}`}>
      <div className="relative z-10">
        {eyebrow ? <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.3em] text-neon-mint">{eyebrow}</p> : null}
        <h2 className="glass-heading text-xl font-semibold">{title}</h2>
        <div className="mt-6 space-y-4 text-sm text-slate-200">{children}</div>
        {footer ? <footer className="mt-8 border-t border-white/5 pt-4 text-[12px] text-slate-400">{footer}</footer> : null}
      </div>
    </article>
  );
}
