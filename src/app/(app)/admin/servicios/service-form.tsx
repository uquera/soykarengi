"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveServiceAction } from "@/lib/actions/admin";
import { Field, inputClass } from "@/components/ui";

type Service = {
  id: string;
  name: string;
  summary: string;
  description: string;
  forWho: string;
  whatToExpect: string;
  modality: string;
  specialty: string;
  durationMin: number;
  price: number;
  priceNote: string | null;
  accentEmoji: string;
  order: number;
  active: boolean;
  nameEn: string | null;
  summaryEn: string | null;
  descriptionEn: string | null;
  forWhoEn: string | null;
  whatToExpectEn: string | null;
  specialtyEn: string | null;
  priceNoteEn: string | null;
  modalityEn: string | null;
};

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : isNew ? "Crear servicio" : "Guardar cambios"}
    </button>
  );
}

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action] = useActionState(saveServiceAction, {});

  return (
    <form action={action} className="space-y-6">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <div className="card-soft space-y-5 p-7">
        <div className="grid gap-5 sm:grid-cols-[1fr_7rem]">
          <Field label="Nombre del servicio">
            <input name="name" defaultValue={service?.name} required className={inputClass} />
          </Field>
          <Field label="Ícono">
            <input name="accentEmoji" defaultValue={service?.accentEmoji ?? "✦"} required className={inputClass} />
          </Field>
        </div>

        <Field label="Resumen" hint="Una o dos líneas. Es lo que se ve en las tarjetas.">
          <textarea name="summary" rows={2} defaultValue={service?.summary} required className={inputClass} />
        </Field>

        <Field label="Descripción" hint="Un párrafo por línea.">
          <textarea name="description" rows={5} defaultValue={service?.description} required className={inputClass} />
        </Field>
      </div>

      <div className="card-soft space-y-5 p-7">
        <Field label="¿Para quién es?" hint="Una viñeta por línea.">
          <textarea name="forWho" rows={5} defaultValue={service?.forWho} required className={inputClass} />
        </Field>

        <Field label="¿Qué puedes esperar?" hint="Una viñeta por línea.">
          <textarea
            name="whatToExpect"
            rows={5}
            defaultValue={service?.whatToExpect}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="card-soft grid gap-5 p-7 sm:grid-cols-2">
        <Field label="Especialidad">
          <input name="specialty" defaultValue={service?.specialty ?? "Acompañamiento"} required className={inputClass} />
        </Field>

        <Field label="Modalidad">
          <select name="modality" defaultValue={service?.modality ?? "Ambas"} className={inputClass}>
            <option value="Online">Online</option>
            <option value="Presencial">Presencial</option>
            <option value="Ambas">Ambas</option>
          </select>
        </Field>

        <Field label="Duración (minutos)">
          <input
            name="durationMin"
            type="number"
            min={15}
            max={480}
            defaultValue={service?.durationMin ?? 60}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Precio (USD)">
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={service?.price ?? 0}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label="Nota de precio"
          hint="Opcional. Si la escribes, reemplaza al precio en la ficha: «Sin costo», «Valor del programa a convenir»."
        >
          <input
            name="priceNote"
            defaultValue={service?.priceNote ?? ""}
            className={inputClass}
            placeholder="A convenir"
          />
        </Field>

        <Field label="Orden">
          <input name="order" type="number" min={0} defaultValue={service?.order ?? 0} className={inputClass} />
        </Field>

        <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="active"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 accent-[#8257A0]"
          />
          Visible en la web
        </label>
      </div>

      {/* Versión en inglés. Lo que dejes vacío se muestra en español. */}
      <details className="card-soft p-7">
        <summary className="cursor-pointer text-sm font-semibold">
          Versión en inglés <span className="font-normal text-muted">(opcional)</span>
        </summary>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input name="nameEn" defaultValue={service?.nameEn ?? ""} className={inputClass} />
            </Field>
            <Field label="Specialty">
              <input name="specialtyEn" defaultValue={service?.specialtyEn ?? ""} className={inputClass} />
            </Field>

            <Field label="Price note (EN)">
              <input name="priceNoteEn" defaultValue={service?.priceNoteEn ?? ""} className={inputClass} />
            </Field>
          </div>

          <Field label="Format" hint="Online / In person / Both">
            <input name="modalityEn" defaultValue={service?.modalityEn ?? ""} className={inputClass} />
          </Field>

          <Field label="Summary">
            <textarea name="summaryEn" rows={2} defaultValue={service?.summaryEn ?? ""} className={inputClass} />
          </Field>

          <Field label="Description">
            <textarea
              name="descriptionEn"
              rows={5}
              defaultValue={service?.descriptionEn ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Who is it for?">
            <textarea name="forWhoEn" rows={5} defaultValue={service?.forWhoEn ?? ""} className={inputClass} />
          </Field>

          <Field label="What can you expect?">
            <textarea
              name="whatToExpectEn"
              rows={5}
              defaultValue={service?.whatToExpectEn ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </details>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit isNew={!service} />
    </form>
  );
}
