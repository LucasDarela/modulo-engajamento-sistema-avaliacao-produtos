import { cn } from "cn";
import Link from "next/link";

import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORTS,
  type ProductSort,
} from "@/lib/product-sort";

// Links (e não estado local): a ordem fica na URL, funciona sem JS e o servidor
// já renderiza a primeira página na ordem escolhida
export function SortBar({ active }: { active: ProductSort }) {
  return (
    <nav
      aria-label="Ordenar produtos"
      className="flex items-center gap-3 sm:gap-4"
    >
      <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:inline">
        Ordenar por
      </span>
      {/* Rola na horizontal no mobile; o -mx/px deixa a sombra do foco visível */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {PRODUCT_SORTS.map((sort) => {
          const isActive = sort.value === active;
          return (
            <li key={sort.value} className="shrink-0">
              <Link
                href={
                  sort.value === DEFAULT_PRODUCT_SORT
                    ? "/"
                    : { pathname: "/", query: { ordem: sort.slug } }
                }
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {sort.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
