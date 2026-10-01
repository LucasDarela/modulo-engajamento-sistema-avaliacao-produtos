// Ordenações da home. `value` vai para a API; `slug` fica na URL (?ordem=)
export const PRODUCT_SORTS = [
  { value: "top_rated", slug: "melhores", label: "Melhor avaliados" },
  { value: "relevance", slug: "relevantes", label: "Mais relevantes" },
  { value: "most_reviewed", slug: "mais-avaliados", label: "Mais avaliados" },
  { value: "lowest_rated", slug: "piores", label: "Pior avaliados" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

export const DEFAULT_PRODUCT_SORT: ProductSort = "top_rated";

export const PRODUCT_SORT_VALUES = PRODUCT_SORTS.map((sort) => sort.value) as [
  ProductSort,
  ...ProductSort[],
];

// Slug desconhecido ou ausente cai na ordenação padrão
export function sortFromSlug(slug: string | string[] | undefined) {
  return (
    PRODUCT_SORTS.find((sort) => sort.slug === slug)?.value ??
    DEFAULT_PRODUCT_SORT
  );
}
