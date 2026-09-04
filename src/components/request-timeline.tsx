import { REQUEST_FLOW, REQUEST_LABEL, REQUEST_COLOR, requestProgress } from "@/lib/domain";

type TrackerCopy = {
  title: string;
  step: string;
  of: string;
  done: string;
};

const DEFAULT_COPY: TrackerCopy = {
  title: "Seguimiento del pedido",
  step: "Paso",
  of: "de",
  done: "listo",
};

/**
 * El flujo del documento, hecho visible: SOLICITUD → … → ENTREGA.
 * Cada estado tiene su color, así que el avance se lee sin leer las etiquetas:
 * la barra dice cuánto falta y el punto encendido dice dónde estamos.
 */
export function RequestTimeline({
  status,
  labels = REQUEST_LABEL,
  cancelledText = "Esta solicitud fue cancelada.",
  copy = DEFAULT_COPY,
}: {
  status: string;
  labels?: Record<string, string>;
  cancelledText?: string;
  copy?: TrackerCopy;
}) {
  if (status === "CANCELADA") {
    return (
      <p className="rounded-xl border border-line bg-shell px-4 py-3 text-sm text-muted">{cancelledText}</p>
    );
  }

  const current = REQUEST_FLOW.indexOf(status as (typeof REQUEST_FLOW)[number]);
  const progress = requestProgress(status);
  const color = REQUEST_COLOR[status] ?? REQUEST_COLOR.SOLICITUD;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow text-muted">{copy.title}</p>
        <p className="text-xs text-muted">
          {copy.step} {Math.max(current + 1, 1)} {copy.of} {REQUEST_FLOW.length} · {progress}% {copy.done}
        </p>
      </div>

      {/* Barra de avance: el color es el del estado actual */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-shell">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress}%`, background: color }}
        />
      </div>

      <ol className="mt-5 grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {REQUEST_FLOW.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const stepColor = REQUEST_COLOR[step];
          return (
            <li key={step} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
                style={{
                  background: done || active ? stepColor : "transparent",
                  border: done || active ? "none" : "1.5px solid var(--color-line)",
                  boxShadow: active ? `0 0 0 4px ${stepColor}26` : "none",
                }}
              >
                {done ? (
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                    <path d="M1 4.2 3 6.2 7 1.8" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : null}
              </span>
              <span
                className={`text-[0.8125rem] leading-tight ${
                  active ? "font-semibold text-ink" : done ? "text-ink-soft" : "text-muted/70"
                }`}
              >
                {labels[step] ?? REQUEST_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Versión compacta para listados: el mismo color del tracker, en una píldora. */
export function StatusPill({
  status,
  labels = REQUEST_LABEL,
}: {
  status: string;
  labels?: Record<string, string>;
}) {
  const color = REQUEST_COLOR[status] ?? REQUEST_COLOR.SOLICITUD;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold whitespace-nowrap"
      style={{ background: `${color}1F`, color }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {labels[status] ?? REQUEST_LABEL[status] ?? status}
    </span>
  );
}
