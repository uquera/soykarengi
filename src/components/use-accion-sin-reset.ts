"use client";

import { useActionState, useTransition, type FormEvent } from "react";

/**
 * useActionState sin el reinicio automático de React 19.
 *
 * Con <form action={fn}>, React vacía los campos no controlados al terminar
 * cada envío, también cuando la acción devuelve un error: Karen perdía una
 * entrada de blog entera por un título corto, y una clienta lo que había
 * escrito sobre lo que le pasa. Despachando la acción desde onSubmit, los
 * campos se quedan como estaban y el error se muestra al lado.
 */
export function useAccionSinReset<S extends object>(
  action: (prev: Awaited<S>, fd: FormData) => Promise<S>,
  inicial: Awaited<S>,
) {
  const [state, dispatch, pendingAccion] = useActionState<S, FormData>(action, inicial);
  const [pendingTransicion, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // El botón que envió también cuenta, como en un envío normal.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => dispatch(fd));
  }

  return { state, onSubmit, pending: pendingAccion || pendingTransicion };
}
