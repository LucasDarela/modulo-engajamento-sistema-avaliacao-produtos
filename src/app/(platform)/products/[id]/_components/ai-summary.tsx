import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";

type AiSummaryProps = {
  summary: string;
  feedbacksCount: number;
  updatedAt: string | null;
};

export function AiSummary({
  summary,
  feedbacksCount,
  updatedAt,
}: AiSummaryProps) {
  const updated = updatedAt ? new Date(updatedAt) : null;

  return (
    <section
      aria-labelledby="resumo-ia"
      // Borda em gradiente: o p-px deixa o fundo do wrapper aparecer como contorno
      className="mx-auto mt-16 max-w-3xl rounded-2xl bg-linear-to-br from-primary/45 via-violet-500/25 to-primary/10 p-px shadow-sm shadow-primary/10 lg:mt-24"
    >
      <div className="rounded-[calc(var(--radius-2xl)-1px)] bg-linear-to-br from-accent via-card to-card px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-primary/30">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <h2
            id="resumo-ia"
            className="text-sm font-semibold tracking-[-0.01em] text-accent-foreground"
          >
            Resumo por IA
          </h2>
        </div>

        <p className="mt-4 text-[1.0625rem] leading-relaxed text-pretty text-foreground/90">
          {summary}
        </p>

        <p className="mt-5 text-xs text-muted-foreground">
          Gerado automaticamente a partir de{" "}
          <span className="tabular-nums">{feedbacksCount}</span>{" "}
          {feedbacksCount === 1 ? "avaliação" : "avaliações"}
          {updated && (
            <>
              {" · "}atualizado{" "}
              <time
                dateTime={updatedAt ?? undefined}
                title={updated.toLocaleString("pt-BR")}
              >
                {formatDistanceToNow(updated, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </time>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
