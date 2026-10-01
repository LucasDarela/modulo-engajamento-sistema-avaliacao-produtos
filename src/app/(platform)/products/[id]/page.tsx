import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { buttonVariants } from "@/components/ui/button";
import { AI_SUMMARY_MIN_FEEDBACKS } from "@/lib/ai-summary";
import { createCaller } from "@/server/routers/_app";
import { getSession } from "@/server/session";
import { createContext } from "@/server/trpc";

import { AiSummary } from "./_components/ai-summary";
import { FeedbackForm } from "./_components/feedback-form";
import { FeedbackList } from "./_components/feedback-list";
import { ScoreSummary } from "./_components/score-summary";
import { SignInPrompt } from "./_components/sign-in-prompt";

// Compartilhado entre generateMetadata e a página na mesma requisição
const getProduct = cache(async (id: string) =>
  createCaller(await createContext()).products.byId({ id }),
);

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const caller = createCaller(await createContext());

  const [product, feedbacks, session] = await Promise.all([
    getProduct(id),
    caller.feedbacks.listByProduct({ productId: id }),
    getSession(),
  ]);

  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-10">
      <Link
        href="/"
        className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todos os produtos
      </Link>

      <section className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary ring-1 ring-foreground/5 lg:aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            preload
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col lg:py-2">
          <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[2.5rem]">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
              {product.description}
            </p>
          )}

          <a
            href={product.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              className:
                "mt-6 h-11 w-full gap-2 rounded-lg px-5 text-base font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90 sm:w-fit",
            })}
          >
            Ver na loja
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>

          <ScoreSummary
            className="mt-8 lg:mt-auto"
            score={product.score}
            count={product.feedbacksCount}
            scores={feedbacks.map((feedback) => feedback.score)}
          />
        </div>
      </section>

      {product.aiSummary &&
        product.aiSummaryFeedbacksCount !== null &&
        product.feedbacksCount >= AI_SUMMARY_MIN_FEEDBACKS && (
          <AiSummary
            summary={product.aiSummary}
            feedbacksCount={product.aiSummaryFeedbacksCount}
            updatedAt={product.aiSummaryUpdatedAt}
          />
        )}

      <section
        aria-labelledby="avaliacoes"
        className="mx-auto mt-16 max-w-3xl lg:mt-24"
      >
        <div className="flex items-baseline justify-between gap-4 border-b pb-4">
          <h2
            id="avaliacoes"
            className="text-2xl font-semibold tracking-[-0.025em]"
          >
            Avaliações
          </h2>
          {feedbacks.length > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {feedbacks.length}{" "}
              {feedbacks.length === 1 ? "avaliação" : "avaliações"}
            </span>
          )}
        </div>

        <FeedbackList feedbacks={feedbacks} />

        <div id="avaliar" className="mt-12 scroll-mt-24">
          {session ? (
            <FeedbackForm
              productId={product.id}
              authorName={`${session.firstName} ${session.lastName}`}
            />
          ) : (
            <SignInPrompt />
          )}
        </div>
      </section>
    </main>
  );
}
