import { ArrowLeft, PackageSearch } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <PackageSearch className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.025em]">
        Produto não encontrado
      </h1>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        O link pode estar incompleto ou o produto foi removido. Veja os outros
        produtos disponíveis para avaliar.
      </p>
      <Link
        href="/"
        className={buttonVariants({
          className: "mt-8 h-11 gap-2 rounded-lg px-5 text-base font-semibold",
        })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Ver todos os produtos
      </Link>
    </main>
  );
}
