import type { Metadata } from "next";
import { Suspense } from "react";

import { type ProductSort, sortFromSlug } from "@/lib/product-sort";
import { PRODUCTS_PAGE_SIZE } from "@/lib/validation/products";
import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

import { GridSkeleton, ProductGrid } from "./_components/product-grid";
import { SortBar } from "./_components/sort-bar";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Veja a nota e as avaliações de cada produto antes de decidir a compra.",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sort = sortFromSlug((await searchParams).ordem);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:gap-16 lg:px-8 lg:pt-20">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-16">
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 transition-all hover:scale-105">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
            IA & Relevância
          </div>
          <h1 className="max-w-[12ch] text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
            Descubra o que{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 animate-pulse">
              vale a pena.
            </span>
          </h1>
        </div>
        <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg lg:pb-2">
          Avaliações reais de quem já testou os melhores produtos de{" "}
          <strong>Inteligência Artificial</strong> e tecnologia em destaque na
          Amazon. Escolha um produto para ver as opiniões ou deixar a sua.
        </p>
      </header>

      <section aria-label="Produtos" className="flex flex-col gap-8">
        <SortBar active={sort} />
        {/* key: trocar a ordem mostra o skeleton em vez do grid antigo */}
        <Suspense key={sort} fallback={<GridSkeleton />}>
          <FirstPage sort={sort} />
        </Suspense>
      </section>
    </main>
  );
}

// Busca a primeira página no servidor para o grid aparecer sem esperar o JS
async function FirstPage({ sort }: { sort: ProductSort }) {
  const caller = createCaller(await createContext());
  const initialPage = await caller.products
    .list({ limit: PRODUCTS_PAGE_SIZE, sort })
    // Se falhar aqui, o client tenta de novo e mostra o estado de erro
    .catch(() => undefined);

  return <ProductGrid sort={sort} initialPage={initialPage} />;
}
