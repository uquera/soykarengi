import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "ink" | "sage" | "clay" | "ghost";

const TONE: Record<Tone, string> = {
  ink: "bg-ink text-cream hover:bg-ink-soft",
  sage: "bg-sage text-white hover:bg-sage-deep",
  clay: "bg-clay text-white hover:bg-clay-deep",
  ghost: "border border-line bg-white/70 text-ink hover:border-ink/40 hover:bg-white",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  tone = "ink",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: Tone }) {
  return <button className={`${BASE} ${TONE[tone]} ${className}`} {...props} />;
}

export function ButtonLink({
  tone = "ink",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: Tone }) {
  return <Link className={`${BASE} ${TONE[tone]} ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-muted ${className}`}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] text-balance sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-soft">{lead}</p> : null}
    </header>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "sage" | "clay" | "gold" | "muted";
}) {
  const tones = {
    neutral: "border-line bg-shell text-ink-soft",
    sage: "border-sage/30 bg-sage-soft text-sage-deep",
    clay: "border-clay/30 bg-clay-soft text-clay-deep",
    gold: "border-gold/30 bg-gold/10 text-[#8A6C1D]",
    muted: "border-line bg-white text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {hint ? <span className="mb-2 block text-xs text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";

export function EmptyState({ title, lead, action }: { title: string; lead: string; action?: ReactNode }) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="font-[family-name:var(--font-display)] text-xl">{title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{lead}</p>
      {action}
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}
