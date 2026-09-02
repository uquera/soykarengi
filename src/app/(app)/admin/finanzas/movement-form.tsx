"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { saveMovementAction, deleteMovementAction } from "@/lib/actions/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, METHODS, usd } from "@/lib/finance";
import { Field, inputClass } from "@/components/ui";

export type MovementRow = {
  id: string;
  kind: string;
  concept: string;
  category: string;
  amount: number;
  method: string;
  date: string; // yyyy-mm-dd
  notes: string | null;
};

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : editing ? "Guardar cambios" : "Registrar movimiento"}
    </button>
  );
}

export function MovementDialog({
  open,
  movement,
  onClose,
}: {
  open: boolean;
  movement: MovementRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action] = useActionState(saveMovementAction, {});
  const [kind, setKind] = useState(movement?.kind ?? "EGRESO");

  useEffect(() => {
    if (open) setKind(movement?.kind ?? "EGRESO");
  }, [open, movement]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
    // onClose y router son estables en la práctica; sólo interesa reaccionar al ok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  if (!open) return null;

  const categories = kind === "INGRESO" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div className="card-soft my-auto w-full max-w-lg p-7" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            {movement ? "Editar movimiento" : "Nuevo movimiento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-ink/40 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form action={action} className="space-y-4">
          {movement ? <input type="hidden" name="id" value={movement.id} /> : null}
          <input type="hidden" name="kind" value={kind} />

          <div className="flex gap-2">
            {[
              ["EGRESO", "Egreso"],
              ["INGRESO", "Ingreso"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  kind === value
                    ? value === "INGRESO"
                      ? "bg-orchid-deep text-cream"
                      : "bg-rose text-white"
                    : "bg-shell text-ink-soft hover:bg-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Field label="Concepto">
            <input
              name="concept"
              defaultValue={movement?.concept}
              required
              className={inputClass}
              placeholder={kind === "INGRESO" ? "Venta en feria de octubre" : "Compra de telas"}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <select
                name="category"
                defaultValue={movement?.category ?? categories[0].key}
                key={kind}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Monto (USD)">
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={movement?.amount}
                required
                className={inputClass}
                placeholder="0.00"
              />
            </Field>

            <Field label="Medio de pago">
              <select name="method" defaultValue={movement?.method ?? "TRANSFERENCIA"} className={inputClass}>
                {METHODS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha">
              <input
                name="date"
                type="date"
                defaultValue={movement?.date ?? todayISO}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notas" hint="Opcional">
            <textarea name="notes" rows={2} defaultValue={movement?.notes ?? ""} className={inputClass} />
          </Field>

          {state.error ? (
            <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
              {state.error}
            </p>
          ) : null}

          <Submit editing={!!movement} />
        </form>
      </div>
    </div>
  );
}

export function MovementsTable({ movements }: { movements: MovementRow[] }) {
  const [editing, setEditing] = useState<MovementRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow text-muted">Movimientos registrados</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
        >
          + Registrar movimiento
        </button>
      </div>

      {movements.length === 0 ? (
        <div className="card-soft mt-4 px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl">Todavía no registras movimientos</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Las sesiones realizadas y los pedidos pagados ya cuentan como ingreso. Aquí registras los
            egresos y las ventas que ocurren fuera de la plataforma.
          </p>
        </div>
      ) : (
        <div className="card-soft mt-4 divide-y divide-line">
          {movements.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <span
                className={`rounded-full px-3 py-1 text-[0.6875rem] font-semibold ${
                  m.kind === "INGRESO" ? "bg-orchid-soft text-orchid-deep" : "bg-rose-soft text-rose-deep"
                }`}
              >
                {m.kind === "INGRESO" ? "Ingreso" : "Egreso"}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.concept}</p>
                <p className="mt-0.5 truncate text-[0.8125rem] text-muted">
                  {CATEGORY_LABELS[m.category] ?? m.category} · {METHOD_LABELS[m.method] ?? m.method} ·{" "}
                  {new Date(`${m.date}T12:00:00`).toLocaleDateString("es-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {m.notes ? ` · ${m.notes}` : ""}
                </p>
              </div>

              <span
                className={`font-[family-name:var(--font-display)] text-lg tabular-nums ${
                  m.kind === "INGRESO" ? "text-orchid-deep" : "text-rose-deep"
                }`}
              >
                {m.kind === "INGRESO" ? "+" : "−"}
                {usd(m.amount)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(m)}
                  className="rounded-full border border-line px-4 py-1.5 text-[0.75rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
                >
                  Editar
                </button>
                <form action={deleteMovementAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <MovementDialog open={creating} movement={null} onClose={() => setCreating(false)} />
      <MovementDialog open={!!editing} movement={editing} onClose={() => setEditing(null)} />
    </>
  );
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.key, c.label]),
);
const METHOD_LABELS: Record<string, string> = Object.fromEntries(METHODS.map((m) => [m.key, m.label]));
