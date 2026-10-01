import { getConfig } from "@/lib/config";

/**
 * Aviso fijo de que la plataforma no atiende emergencias, con los números a
 * los que llamar. Va donde alguien podría escribir en un mal momento: la
 * agenda, el contacto y sus citas. El texto se edita en Configuración.
 */
export async function AvisoCrisis({ compacto = false }: { compacto?: boolean }) {
  const { avisoCrisis } = await getConfig();

  return (
    <div
      role="note"
      className={`rounded-2xl border border-rose/30 bg-rose-soft text-rose-deep ${compacto ? "px-4 py-3 text-[0.8125rem]" : "px-5 py-4 text-sm"} leading-relaxed`}
    >
      <span aria-hidden="true" className="mr-1.5">
        ☎
      </span>
      {avisoCrisis}
    </div>
  );
}
