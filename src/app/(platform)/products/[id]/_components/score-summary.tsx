import { cn } from "cn";

import { formatScore, ScoreDisplay } from "@/components/score-display";

type ScoreSummaryProps = {
  score: number | null;
  count: number;
  scores: number[];
  className?: string;
};

export function ScoreSummary({
  score,
  count,
  scores,
  className,
}: ScoreSummaryProps) {
  if (!count || score === null) {
    return (
      <div
        className={cn("rounded-2xl bg-secondary px-5 py-6 sm:px-6", className)}
      >
        <div className="flex items-center gap-3">
          <ScoreDisplay score={0} size="lg" />
        </div>
        <p className="mt-3 font-medium">Ainda sem avaliações</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Usou este produto? Conte para as próximas pessoas como foi.
        </p>
        <a
          href="#avaliar"
          className="mt-3 inline-block rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Escrever a primeira avaliação
        </a>
      </div>
    );
  }

  const distribution = [5, 4, 3, 2, 1].map((value) => ({
    value,
    total: scores.filter((item) => item === value).length,
  }));
  const max = Math.max(1, ...distribution.map((item) => item.total));

  return (
    <div
      className={cn(
        "grid gap-6 rounded-2xl bg-secondary px-5 py-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
        <p className="text-[3.5rem] leading-none font-semibold tracking-[-0.03em]">
          {formatScore(score)}
        </p>
        <div className="flex flex-col gap-1.5">
          <ScoreDisplay score={score} />
          <p className="text-sm text-muted-foreground tabular-nums">
            {count} {count === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
      </div>

      <dl className="flex flex-col justify-center gap-1.5">
        {distribution.map(({ value, total }) => (
          <div
            key={value}
            className="grid grid-cols-[1.75rem_1fr_2rem] items-center gap-3 text-sm"
          >
            <dt className="text-muted-foreground tabular-nums">
              <span className="sr-only">
                {value === 1 ? "1 estrela" : `${value} estrelas`}
              </span>
              <span aria-hidden="true">{value}★</span>
            </dt>
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-primary/10"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(total / max) * 100}%` }}
              />
            </div>
            <dd className="text-right text-muted-foreground tabular-nums">
              {total}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
