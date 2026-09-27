"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui";

export type PasswordCopy = { show: string; hide: string };

/**
 * Campo de contraseña con el ojo para verla.
 * Quien escribe en el móvil necesita comprobar lo que puso antes de mandar el
 * formulario; sin esto la única salida es borrar y volver a escribir.
 */
export function PasswordInput({
  name = "password",
  autoComplete,
  minLength,
  copy,
}: {
  name?: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  copy: PasswordCopy;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? copy.hide : copy.show}
        aria-pressed={visible}
        title={visible ? copy.hide : copy.show}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:text-ink"
      >
        {visible ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 5.2A9.6 9.6 0 0 1 12 5c5 0 9 4.5 9 7a11 11 0 0 1-2.4 3.4" />
            <path d="M6.5 6.9C4.2 8.4 3 10.6 3 12c0 2.5 4 7 9 7a9.7 9.7 0 0 0 4.2-.95" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M3 12c0-2.5 4-7 9-7s9 4.5 9 7c0 2.5-4 7-9 7s-9-4.5-9-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
