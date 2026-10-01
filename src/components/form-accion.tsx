"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Resultado = { ok?: boolean; error?: string } | void;

/**
 * Formulario para una server action que devuelve { error }. Sirve donde antes
 * había un <form action={...}> mudo:
 *   - muestra el error en vez de fallar en silencio;
 *   - pide confirmación antes de algo que no se deshace;
 *   - no reinicia los campos (React 19 los vacía con `action`, y un error
 *     borraba lo que se había escrito).
 */
export function FormAccion({
  action,
  children,
  className,
  confirmar,
  okMensaje,
}: {
  action: (fd: FormData) => Promise<Resultado>;
  children: ReactNode;
  className?: string;
  confirmar?: string;
  okMensaje?: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className={className}
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmar && !window.confirm(confirmar)) return;
        const fd = new FormData(e.currentTarget);
        // El botón que envió el formulario también cuenta (name/value).
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) fd.set(submitter.name, submitter.value);

        startTransition(async () => {
          const r = await action(fd);
          if (r && r.error) {
            setError(r.error);
            setOk(false);
          } else {
            setError(null);
            setOk(true);
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pendiente} className="contents">
        {children}
      </fieldset>
      {error ? <p className="mt-2 w-full text-[0.8125rem] font-semibold text-rose-deep">{error}</p> : null}
      {ok && okMensaje && !error ? <p className="mt-2 w-full text-[0.8125rem] text-moss-deep">{okMensaje}</p> : null}
    </form>
  );
}
