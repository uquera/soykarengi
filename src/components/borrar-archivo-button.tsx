"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BorrarArchivoButton({
  id,
  label,
  confirmacion,
}: {
  id: string;
  label: string;
  confirmacion: string;
}) {
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    if (!window.confirm(confirmacion)) return;
    setBorrando(true);
    const res = await fetch(`/api/archivos/${id}`, { method: "DELETE" });
    setBorrando(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "No se pudo borrar. Prueba otra vez.");
    }
  }

  return (
    <button
      type="button"
      onClick={borrar}
      disabled={borrando}
      className="rounded-full px-3 py-2 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-rose-deep disabled:opacity-50"
    >
      {borrando ? "…" : label}
    </button>
  );
}
