"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlert, PackageOpen } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { PRODUCTS_PAGE_SIZE } from "@/lib/validation/products";
import type { ProductCard as ProductCardData } from "@/server/routers/products";
import { useTRPC } from "@/trpc/client";

import { ProductCard, ProductCardSkeleton } from "./product-card";

type ProductsPage = {
  items: ProductCardData[];
  nextCursor: string | null;
};

const EAGER_IMAGES = 4;
const GRID_CLASSES =
  "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ProductGrid({ initialPage }: { initialPage?: ProductsPage }) {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.products.list.infiniteQueryOptions(
      { limit: PRODUCTS_PAGE_SIZE },
      {
        getNextPageParam: (page) => page.nextCursor,
        // Primeira página já vem renderizada do servidor
        initialData: initialPage
          ? { pages: [initialPage], pageParams: [null] }
          : undefined,
        staleTime: 60_000,
      },
    ),
  );
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = query;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    // Depois de uma falha, só o botão "Tentar de novo" busca de novo; senão o
    // observer recriado dispara outra request a cada erro, em loop
    if (!sentinel || !hasNextPage || isFetchNextPageError) return;

    // Começa a buscar a próxima página 400px antes do fim da lista
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (query.isPending) return <GridSkeleton />;

  if (query.isError && !data) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  if (products.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-14">
      <ul className={GRID_CLASSES} aria-busy={isFetchingNextPage}>
        {products.map((product, index) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} eager={index < EAGER_IMAGES} />
          </li>
        ))}
        {isFetchingNextPage
          ? Array.from({ length: 4 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholders estáticos
              <li key={index}>
                <ProductCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      <div ref={sentinelRef} className="flex min-h-10 justify-center">
        {isFetchNextPageError ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar mais produtos.
            </p>
            <Button variant="outline" size="lg" onClick={() => fetchNextPage()}>
              Tentar de novo
            </Button>
          </div>
        ) : hasNextPage ? (
          <Button
            variant="outline"
            size="lg"
            className="px-4"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? "Carregando…" : "Carregar mais produtos"}
          </Button>
        ) : (
          <p className="flex items-center gap-3 text-sm text-muted-foreground before:h-px before:w-10 before:bg-border after:h-px after:w-10 after:bg-border">
            Você viu todos os produtos
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {isFetchingNextPage
          ? "Carregando mais produtos"
          : `${products.length} produtos carregados`}
      </p>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <ul className={GRID_CLASSES} aria-label="Carregando produtos">
      {Array.from({ length: 8 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholders estáticos
        <li key={index}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-background text-primary ring-1 ring-border">
        <PackageOpen aria-hidden="true" className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">
          Nenhum produto por aqui ainda
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Assim que um produto for cadastrado, ele aparece nesta página para
          receber avaliações.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-3xl bg-muted px-6 py-20 text-center"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-background text-destructive ring-1 ring-border">
        <CircleAlert aria-hidden="true" className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">
          Não foi possível carregar os produtos
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Verifique sua conexão e tente de novo.
        </p>
      </div>
      <Button size="lg" className="px-4" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
