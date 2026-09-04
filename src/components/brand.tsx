import Link from "next/link";

/**
 * El isotipo de SoyKarengi: la figura dentro del círculo, sin la palabra.
 * Viene recortado con fondo transparente, así que no necesita máscara ni aro:
 * a 32 px el lockup completo sería ilegible y el isotipo se sigue reconociendo.
 */
export function BrandMark({
  size = 40,
  className = "",
  plate = false,
}: {
  size?: number;
  className?: string;
  /** Sobre fondo oscuro la ciruela del isotipo se pierde: va sobre un disco crema. */
  plate?: boolean;
}) {
  const img = (
    <img
      src="/soykarengi-isotipo.png"
      alt="SoyKarengi"
      width={size}
      height={size}
      className={plate ? "" : `shrink-0 ${className}`}
      style={{ width: plate ? size * 0.78 : size, height: plate ? size * 0.78 : size }}
    />
  );

  if (!plate) return img;

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-cream ${className}`}
      style={{ width: size, height: size }}
    >
      {img}
    </span>
  );
}

/**
 * El logo completo, con la palabra y su bajada («Sana la raíz, eleva tu ser,
 * renace»). Para donde hay aire: la portada y las pantallas de acceso.
 */
export function BrandLogo({ width = 300, className = "" }: { width?: number; className?: string }) {
  return (
    <img
      src="/soykarengi-logo.png"
      alt="SoyKarengi · Sana la raíz, eleva tu ser, renace"
      width={width}
      height={Math.round((width * 1324) / 900)}
      className={className}
      style={{ width, height: "auto" }}
    />
  );
}

export function BrandLockup({
  name,
  tagline,
  size = 40,
  tone = "light",
  href = "/",
  taglineClassName = "",
}: {
  name: string;
  tagline?: string;
  size?: number;
  tone?: "light" | "dark";
  href?: string | null;
  /** La bajada ocupa ancho: en cabeceras apretadas se esconde con una clase. */
  taglineClassName?: string;
}) {
  const content = (
    <span className="flex items-center gap-3">
      <BrandMark size={size} plate={tone === "dark"} />
      <span className="leading-none">
        <span
          className={`block font-[family-name:var(--font-display)] tracking-tight ${
            tone === "dark" ? "text-cream" : "text-ink"
          }`}
          style={{ fontSize: size >= 44 ? "1.35rem" : "1.15rem" }}
        >
          {name}
        </span>
        {tagline ? (
          <span
            className={`mt-1 block font-[family-name:var(--font-display)] text-[0.75rem] italic ${
              tone === "dark" ? "text-cream/60" : "text-muted"
            } ${taglineClassName}`}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="shrink-0">
      {content}
    </Link>
  ) : (
    content
  );
}

/** Retrato de Karen. Es su foto, no la marca: vive en las páginas donde se
 *  presenta ella, no donde va el logo. */
export function KarenPortrait({ size = 220 }: { size?: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        className="absolute -inset-3 rounded-full bg-orchid/12 blur-xl"
      />
      <img
        src="/karen-retrato.png"
        alt="Karen Ramos"
        width={size}
        height={size}
        className="relative rounded-full ring-1 ring-orchid/25"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
