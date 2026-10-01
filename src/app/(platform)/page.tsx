import type { Metadata } from "next";
import { Suspense } from "react";

import { PRODUCTS_PAGE_SIZE } from "@/lib/validation/products";
import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

import { GridSkeleton, ProductGrid } from "./_components/product-grid";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Veja a nota e as avaliações de cada produto antes de decidir a compra.",
};

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:gap-16 lg:px-8 lg:pt-20">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-16">
        <h1 className="max-w-[12ch] text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
          Descubra o que vale a pena.
        </h1>
        <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg lg:pb-2">
          Notas e comentários de quem já usou. Escolha um produto para ver as
          avaliações ou deixar a sua.
        </p>
      </header>

      <section aria-label="Produtos">
        <Suspense fallback={<GridSkeleton />}>
          <FirstPage />
        </Suspense>
      </section>
    </main>
  );
}

// Busca a primeira página no servidor para o grid aparecer sem esperar o JS
async function FirstPage() {
  const caller = createCaller(await createContext());
  const initialPage = await caller.products
    .list({ limit: PRODUCTS_PAGE_SIZE })
    // Se falhar aqui, o client tenta de novo e mostra o estado de erro
    .catch(() => undefined);

  return <ProductGrid initialPage={initialPage} />;
}
