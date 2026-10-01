"use client";

import { cn } from "cn";
import { type Ref, useId, useState } from "react";

import { STAR_PATH } from "@/components/score-display";

export const SCORE_LABELS: Record<number, string> = {
  1: "Péssimo",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

const SCORES = [1, 2, 3, 4, 5] as const;

type ScoreInputProps = {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  name: string;
  legend: string;
  invalid?: boolean;
  disabled?: boolean;
  "aria-describedby"?: string;
  // Vai para o radio que recebe o Tab, para o form conseguir focar o campo com erro
  ref?: Ref<HTMLInputElement>;
};

// Radios nativos (visualmente escondidos): Tab entra no grupo e as setas mudam a nota
export function ScoreInput({
  value,
  onChange,
  onBlur,
  name,
  legend,
  invalid,
  disabled,
  "aria-describedby": describedBy,
  ref,
}: ScoreInputProps) {
  const id = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const preview = hovered ?? (value >= 1 ? value : null);
  const tabStop = value >= 1 ? value : 1;

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="flex flex-col gap-2 disabled:opacity-60"
    >
      <legend className="mb-2 text-sm leading-snug font-medium">
        {legend}
      </legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: só limpa a prévia visual do hover; teclado usa os radios */}
        <div
          className="-mx-1 flex items-center"
          onMouseLeave={() => setHovered(null)}
        >
          {SCORES.map((score) => {
            const inputId = `${id}-${score}`;
            const active = preview !== null && score <= preview;
            return (
              <label
                key={score}
                htmlFor={inputId}
                onMouseEnter={() => setHovered(score)}
                className="group/star relative cursor-pointer rounded-lg p-1 has-disabled:cursor-not-allowed has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  ref={score === tabStop ? ref : undefined}
                  id={inputId}
                  type="radio"
                  name={name}
                  value={score}
                  checked={value === score}
                  onChange={() => onChange(score)}
                  onBlur={onBlur}
                  className="sr-only"
                />
                <span className="sr-only">
                  {score} de 5, {SCORE_LABELS[score]}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={cn(
                    "size-9 transition-[fill,transform] duration-150 ease-out sm:size-8 motion-safe:group-active/star:scale-90",
                    active
                      ? "fill-primary"
                      : invalid
                        ? "fill-destructive/20"
                        : "fill-primary/15",
                  )}
                >
                  <path d={STAR_PATH} />
                </svg>
              </label>
            );
          })}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "min-w-20 text-sm font-medium",
            preview ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {preview ? SCORE_LABELS[preview] : "Escolha uma nota"}
        </span>
      </div>
    </fieldset>
  );
}
