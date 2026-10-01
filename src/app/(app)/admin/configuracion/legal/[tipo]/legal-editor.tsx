"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { publicarDocumentoAction } from "@/lib/actions/config";
import { Field, inputClass } from "@/components/ui";

function Publicar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-6 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Publicando…" : "Publicar nueva versión"}
    </button>
  );
}

export function LegalEditor({
  tipo,
  titulo,
  contenido,
  version,
  avisoReaceptar,
}: {
  tipo: string;
  titulo: string;
  contenido: string;
  version: number;
  avisoReaceptar: string;
}) {
  const [state, action] = useActionState(publicarDocumentoAction, {});
  const [t, setT] = useState(titulo);
  const [c, setC] = useState(contenido);
  const cambiado = t !== titulo || c.trim() !== contenido.trim();

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Se publicará la versión ${version + 1}. ${avisoReaceptar} ¿Continuar?`)) e.preventDefault();
      }}
      className="space-y-5"
    >
      <input type="hidden" name="tipo" value={tipo} />
      <Field label="Título">
        <input name="titulo" value={t} onChange={(e) => setT(e.target.value)} className={inputClass} />
      </Field>
      <Field
        label="Texto"
        hint="Un párrafo por línea. Empieza una línea con «## » para un subtítulo."
      >
        <textarea
          name="contenido"
          value={c}
          onChange={(e) => setC(e.target.value)}
          rows={26}
          className={`${inputClass} font-mono text-[0.8125rem] leading-relaxed`}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        {cambiado ? <Publicar /> : <span className="text-[0.8125rem] text-muted">Sin cambios por publicar.</span>}
        {state.error ? <p className="text-[0.8125rem] font-semibold text-rose-deep">{state.error}</p> : null}
        {state.ok ? <p className="text-[0.8125rem] font-semibold text-moss-deep">Publicada.</p> : null}
      </div>
    </form>
  );
}
