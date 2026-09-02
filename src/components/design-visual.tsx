import { paletteOf } from "@/lib/domain";

/**
 * Cada diseño de la vitrina necesita una imagen. Mientras Karen carga las suyas,
 * generamos una portada determinista a partir del slug: misma pieza → misma
 * composición, siempre. Nada de placeholders grises.
 */
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function DesignVisual({
  slug,
  palette,
  label,
  image,
  alt,
  className = "",
}: {
  slug: string;
  palette: string;
  label?: string;
  /** Foto real de la pieza; manda sobre la portada generada. */
  image?: string | null;
  alt?: string;
  className?: string;
}) {
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-shell ${className}`}>
        <img src={image} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
        {label ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[0.625rem] font-semibold tracking-wide text-ink-soft backdrop-blur-sm">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  const p = paletteOf(palette);
  const h = hash(slug);
  const variant = h % 4;
  const rot = (h % 24) - 12;
  const id = `g-${slug.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${id})`} />

        {variant === 0 ? (
          <>
            <circle cx="200" cy="150" r="88" fill="none" stroke={p.ink} strokeWidth="1.2" opacity="0.5" />
            <circle cx="200" cy="150" r="62" fill="none" stroke={p.ink} strokeWidth="0.8" opacity="0.35" />
            <path d="M112 150h176" stroke={p.ink} strokeWidth="0.8" opacity="0.3" />
          </>
        ) : null}

        {variant === 1 ? (
          <g transform={`rotate(${rot} 200 150)`} opacity="0.45">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={92 + i * 8}
                y={62 + i * 8}
                width={216 - i * 16}
                height={176 - i * 16}
                fill="none"
                stroke={p.ink}
                strokeWidth="0.9"
              />
            ))}
          </g>
        ) : null}

        {variant === 2 ? (
          <g opacity="0.4" stroke={p.ink} strokeWidth="1" fill="none">
            <path d="M60 220 C 130 90, 270 90, 340 220" />
            <path d="M60 200 C 130 70, 270 70, 340 200" opacity="0.6" />
            <path d="M60 240 C 130 110, 270 110, 340 240" opacity="0.6" />
            <circle cx="200" cy="128" r="5" fill={p.ink} stroke="none" />
          </g>
        ) : null}

        {variant === 3 ? (
          <g opacity="0.4">
            {Array.from({ length: 7 }).map((_, i) => (
              <circle
                key={i}
                cx={70 + i * 43}
                cy={150 + Math.sin((h + i) % 7) * 34}
                r={12 + ((h >> i) % 16)}
                fill="none"
                stroke={p.ink}
                strokeWidth="0.9"
              />
            ))}
          </g>
        ) : null}

        <text
          x="200"
          y="288"
          textAnchor="middle"
          fontSize="9"
          letterSpacing="4"
          fill={p.ink}
          opacity="0.55"
          fontFamily="Georgia, serif"
        >
          CON PROPÓSITO
        </text>
      </svg>

      {label ? (
        <span
          className="absolute top-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[0.625rem] font-semibold tracking-wide backdrop-blur-sm"
          style={{ color: p.ink }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
