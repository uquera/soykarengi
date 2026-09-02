import Link from "next/link";

/**
 * La marca es el rostro de Karen. Un PNG con la máscara circular ya aplicada,
 * así que no depende de CSS para leerse bien sobre cualquier fondo.
 */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/karen-logo.png"
      alt="Karen Ramos"
      width={size}
      height={size}
      className={`shrink-0 rounded-full ring-1 ring-orchid/20 ${className}`}
      style={{ width: size, height: size }}
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
      <BrandMark size={size} />
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

/** Retrato grande, con un halo suave para que respire sobre el crema. */
export function KarenPortrait({ size = 220 }: { size?: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        className="absolute -inset-3 rounded-full bg-orchid/10 blur-xl"
      />
      <img
        src="/karen-retrato.png"
        alt="Karen Ramos"
        width={size}
        height={size}
        className="relative rounded-full ring-1 ring-orchid/20"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
