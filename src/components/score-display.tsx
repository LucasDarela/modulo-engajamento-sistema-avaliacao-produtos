import { cn } from "cn";

const STAR_PATH =
  "M12 2.6l2.82 6.06 6.63.8-4.9 4.54 1.28 6.56L12 17.3l-5.83 3.26 1.28-6.56-4.9-4.54 6.63-.8z";

type StarProps = { fill: number; className?: string };

// fill entre 0 e 1: a parte preenchida é recortada por largura, o que dá a estrela parcial
function Star({ fill, className }: StarProps) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute inset-0 size-full fill-primary/15"
      >
        <path d={STAR_PATH} />
      </svg>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${Math.round(fill * 100)}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn(
            "absolute top-0 left-0 max-w-none fill-primary",
            className,
          )}
        >
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

export function formatScore(score: number) {
  return score.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

type ScoreDisplayProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
};

export function ScoreDisplay({
  score,
  size = "md",
  className,
}: ScoreDisplayProps) {
  const value = Math.min(5, Math.max(0, score));
  return (
    <span
      role="img"
      aria-label={`Nota ${formatScore(value)} de 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          fill={Math.min(1, Math.max(0, value - (position - 1)))}
          className={sizes[size]}
        />
      ))}
    </span>
  );
}

export { STAR_PATH };
