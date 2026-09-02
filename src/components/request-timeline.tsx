import { REQUEST_FLOW, REQUEST_LABEL } from "@/lib/domain";

/** El flujo del documento, hecho visible: SOLICITUD → … → ENTREGA. */
export function RequestTimeline({
  status,
  labels = REQUEST_LABEL,
  cancelledText = "Esta solicitud fue cancelada.",
}: {
  status: string;
  labels?: Record<string, string>;
  cancelledText?: string;
}) {
  if (status === "CANCELADA") {
    return (
      <p className="rounded-xl border border-line bg-shell px-4 py-3 text-sm text-muted">{cancelledText}</p>
    );
  }

  const current = REQUEST_FLOW.indexOf(status as (typeof REQUEST_FLOW)[number]);

  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-2">
      {REQUEST_FLOW.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold whitespace-nowrap ${
                active ? "bg-clay text-white" : done ? "bg-clay-soft text-clay-deep" : "bg-shell text-muted/70"
              }`}
            >
              {labels[step] ?? REQUEST_LABEL[step]}
            </span>
            {i < REQUEST_FLOW.length - 1 ? (
              <span className={`h-px w-3 ${done ? "bg-clay/50" : "bg-line"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function StatusPill({
  status,
  labels = REQUEST_LABEL,
}: {
  status: string;
  labels?: Record<string, string>;
}) {
  const tone =
    status === "ENTREGADA"
      ? "bg-sage-soft text-sage-deep"
      : status === "CANCELADA"
        ? "bg-shell text-muted"
        : status === "COTIZADA"
          ? "bg-gold/15 text-[#8A6C1D]"
          : "bg-clay-soft text-clay-deep";

  return (
    <span className={`rounded-full px-3 py-1 text-[0.6875rem] font-semibold ${tone}`}>
      {labels[status] ?? REQUEST_LABEL[status] ?? status}
    </span>
  );
}
