import { z } from "zod";

import { IMAGE_HOSTS } from "@/lib/image-hosts";

export const PRODUCTS_PAGE_SIZE = 12;
export const PRODUCTS_MAX_PAGE_SIZE = 50;

export const listProductsSchema = z.object({
  // Cursor opaco devolvido em `nextCursor` pela página anterior
  cursor: z.string().trim().min(1).max(200).nullish(),
  limit: z
    .number("O limite deve ser um número")
    .int("O limite deve ser um número inteiro")
    .min(1, "O limite mínimo é 1")
    .max(PRODUCTS_MAX_PAGE_SIZE, `O limite máximo é ${PRODUCTS_MAX_PAGE_SIZE}`)
    .default(PRODUCTS_PAGE_SIZE),
});

export const createProductSchema = z.object({
  name: z
    .string("Informe o nome do produto")
    .trim()
    .min(1, "Informe o nome do produto")
    .max(300, "O nome deve ter no máximo 300 caracteres"),
  description: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres")
    .optional()
    .transform((value) => value || undefined),
  externalLink: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain,
    error: "Informe um link http ou https válido",
  }),
  imageUrl: z
    .url({
      protocol: /^https$/,
      hostname: z.regexes.domain,
      error: "Informe a URL https de uma imagem",
    })
    .refine(
      (url) =>
        (IMAGE_HOSTS as readonly string[]).includes(new URL(url).hostname),
      `A imagem deve estar hospedada em: ${IMAGE_HOSTS.join(", ")}`,
    ),
});

export type ListProductsInput = z.input<typeof listProductsSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
