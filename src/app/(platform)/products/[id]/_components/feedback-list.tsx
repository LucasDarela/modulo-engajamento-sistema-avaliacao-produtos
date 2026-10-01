import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ScoreDisplay } from "@/components/score-display";
import type { Feedback } from "@/server/routers/feedbacks";

// Mesmo estilo do avatar do header (user-menu)
function avatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&fontSize=40&fontWeight=600&backgroundType=gradientLinear&backgroundColor=4f46e5,7c3aed`;
}

export function FeedbackList({ feedbacks }: { feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        Seja a primeira pessoa a avaliar este produto.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {feedbacks.map((feedback) => {
        const name =
          `${feedback.author.firstName} ${feedback.author.lastName}`.trim() ||
          "Pessoa usuária";
        const createdAt = new Date(feedback.createdAt);
        return (
          <li key={feedback.id} className="py-6">
            <article className="flex gap-4">
              {/* biome-ignore lint/performance/noImgElement: SVG externo do Dicebear exigiria dangerouslyAllowSVG no next/image */}
              <img
                src={avatarUrl(name)}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                className="size-10 shrink-0 rounded-full bg-secondary"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h3 className="font-semibold">{name}</h3>
                  <time
                    dateTime={feedback.createdAt}
                    title={createdAt.toLocaleString("pt-BR")}
                    className="text-sm text-muted-foreground"
                  >
                    {formatDistanceToNow(createdAt, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </time>
                </div>
                <ScoreDisplay
                  score={feedback.score}
                  size="sm"
                  className="mt-1.5"
                />
                <p className="mt-2.5 leading-relaxed break-words whitespace-pre-line text-foreground/90">
                  {feedback.comment}
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
