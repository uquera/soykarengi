"use client";

import { useState } from "react";
import { usd, type Bucket, type Slice } from "@/lib/finance";

/**
 * Gráficos dibujados a mano: son dos formas simples y así el panel no arrastra
 * una librería de charts entera. Los colores salen de la paleta de la marca.
 */
const INCOME = "#8257A0"; // morado · entra dinero
const EXPENSE = "#C9506B"; // rosa · sale dinero

/** Orden fijo para que una categoría no cambie de color entre visitas. */
const SLICE_COLORS = ["#8257A0", "#C9506B", "#C08A2E", "#5E8C7B", "#7C6BA8", "#B0704A", "#9E3350", "#8C7A96"];

export function IncomeExpenseBars({ buckets, mode }: { buckets: Bucket[]; mode: "dia" | "mes" }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...buckets.flatMap((b) => [b.income, b.expense]), 1);
  const H = 190;
  const height = (v: number) => Math.max((v / max) * H, v > 0 ? 3 : 0);
  const step = Math.ceil(buckets.length / 12);

  if (buckets.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">Sin movimientos en este rango.</p>;
  }

  return (
    <div className="relative">
      <div className="mb-5 flex items-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: INCOME }} />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: EXPENSE }} />
          Egresos
        </span>
        <span className="ml-auto">{mode === "dia" ? "Por día" : "Por mes"}</span>
      </div>

      <div className="flex items-end gap-1" style={{ height: `${H}px` }}>
        {buckets.map((b, i) => (
          <div
            key={b.key}
            className="flex h-full min-w-[3px] flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              <div
                className="rounded-t-[3px] transition-opacity"
                style={{
                  width: "42%",
                  height: `${height(b.income)}px`,
                  background: INCOME,
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
              <div
                className="rounded-t-[3px] transition-opacity"
                style={{
                  width: "42%",
                  height: `${height(b.expense)}px`,
                  background: EXPENSE,
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex gap-1 border-t border-line pt-1.5">
        {buckets.map((b, i) => (
          <div key={b.key} className="flex-1 truncate text-center text-[10px] text-muted capitalize">
            {i % step === 0 ? b.label : ""}
          </div>
        ))}
      </div>

      {hover !== null ? (
        <div
          className="pointer-events-none absolute -top-2 z-10 rounded-xl bg-ink px-3 py-2 text-xs whitespace-nowrap text-cream shadow-lg"
          style={{ left: `${((hover + 0.5) / buckets.length) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="mb-1 font-semibold capitalize">{buckets[hover].label}</p>
          <p style={{ color: "#D9C2E8" }}>Ingresos: {usd(buckets[hover].income)}</p>
          <p style={{ color: "#F2B8C6" }}>Egresos: {usd(buckets[hover].expense)}</p>
          <p className="mt-1 border-t border-cream/20 pt-1 font-semibold">
            Balance: {usd(buckets[hover].balance)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function Donut({ slices, empty }: { slices: Slice[]; empty: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, d) => s + d.amount, 0);

  if (total <= 0) {
    return <p className="grid h-40 place-items-center text-sm text-muted">{empty}</p>;
  }

  const R = 60;
  const STROKE = 22;
  const C = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 2 : 0;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="150" height="150" viewBox="0 0 150 150" className="shrink-0">
        <g transform="rotate(-90 75 75)">
          {slices.map((d, i) => {
            const len = Math.max((d.amount / total) * C - GAP, 0);
            const offset = -(acc / total) * C;
            acc += d.amount;
            return (
              <circle
                key={d.key}
                cx="75"
                cy="75"
                r={R}
                fill="none"
                stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                strokeWidth={STROKE}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={offset}
                style={{ opacity: hover === null || hover === i ? 1 : 0.4, transition: "opacity .15s" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>
        <text x="75" y="71" textAnchor="middle" className="fill-[var(--color-muted)]" style={{ fontSize: "9px" }}>
          Total
        </text>
        <text
          x="75"
          y="87"
          textAnchor="middle"
          className="fill-[var(--color-ink)]"
          style={{ fontSize: "13px", fontWeight: 700 }}
        >
          {usd(total)}
        </text>
      </svg>

      <ul className="min-w-[150px] flex-1 space-y-1.5">
        {slices.map((d, i) => (
          <li
            key={d.key}
            className="flex items-center gap-2 text-sm transition-opacity"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ opacity: hover === null || hover === i ? 1 : 0.5 }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{d.label}</span>
            <span className="font-medium tabular-nums">{usd(d.amount)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted">
              {Math.round((d.amount / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
