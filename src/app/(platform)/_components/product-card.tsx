import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCard as ProductCardData } from "@/server/routers/products";

// Colunas do grid: 1 / sm:2 / lg:3 / xl:4 dentro de max-w-7xl (1280px)
const IMAGE_SIZES =
  "(min-width: 1280px) 296px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw";

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type ProductCardProps = {
  product: ProductCardData;
  // Os primeiros cards ficam acima da dobra: carregar a imagem sem lazy
  eager?: boolean;
};

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const { id, name, description, imageUrl, score, feedbacksCount } = product;

  return (
    <Link
      href={`/products/${id}`}
      className="group flex flex-col gap-4 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={IMAGE_SIZES}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-0.5">
        <h2 className="line-clamp-2 text-base leading-snug font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
          {name}
        </h2>
        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <ProductScore score={score} feedbacksCount={feedbacksCount} />
      </div>
    </Link>
  );
}

function ProductScore({
  score,
  feedbacksCount,
}: Pick<ProductCardData, "score" | "feedbacksCount">) {
  if (score === null || feedbacksCount === 0) {
    return (
      <p className="mt-auto pt-1.5 text-sm text-muted-foreground">
        Sem avaliações
      </p>
    );
  }

  const formatted = scoreFormatter.format(score);
  const countLabel =
    feedbacksCount === 1 ? "1 avaliação" : `${feedbacksCount} avaliações`;

  return (
    <p className="mt-auto flex items-center gap-1.5 pt-1.5 text-sm">
      <Star aria-hidden="true" className="size-4 fill-primary text-primary" />
      <span className="font-semibold text-foreground tabular-nums">
        <span className="sr-only">Nota </span>
        {formatted}
        <span className="sr-only"> de 5</span>
      </span>
      <span className="text-muted-foreground">({countLabel})</span>
    </p>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="aspect-4/3 rounded-2xl" />
      <div className="flex flex-col gap-2 px-0.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1.5 h-4 w-28" />
      </div>
    </div>
  );
}
