"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { confirmarDesdeCorreoAction } from "@/lib/actions/panel";

export function ConfirmarCita({ token, nombre, citaId }: { token: string; nombre: string; citaId: string }) {
  const [pendiente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok?: boolean; error?: string } | null>(null);

  if (resultado?.ok) {
    return (
      <div className="mt-6 rounded-2xl bg-moss-soft px-5 py-5">
        <p className="text-[1.75rem]" aria-hidden="true">
          ✓
        </p>
        <p className="font-[family-name:var(--font-display)] text-[1.375rem] text-moss-deep">Cita confirmada</p>
        <p className="mt-1 text-[1rem] text-ink-soft">A {nombre} le llegó el aviso por correo.</p>
        <Link href={`/panel/cita/${citaId}`} className="mt-4 inline-block text-[1rem] font-semibold text-ink underline underline-offset-4">
          Ver la cita
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          const fd = new FormData();
          fd.set("token", token);
          startTransition(async () => setResultado(await confirmarDesdeCorreoAction(fd)));
        }}
        className="w-full rounded-2xl bg-moss-deep px-6 py-4 text-[1.125rem] font-semibold text-cream disabled:opacity-60"
      >
        {pendiente ? "Confirmando…" : "Sí, confirmar"}
      </button>
      {resultado?.error ? <p className="mt-3 text-[1rem] font-semibold text-rose-deep">{resultado.error}</p> : null}
      <Link href={`/panel/cita/${citaId}`} className="mt-4 inline-block text-[1rem] text-muted underline underline-offset-4">
        Prefiero verla en el panel
      </Link>
    </div>
  );
}
