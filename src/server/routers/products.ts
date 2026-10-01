import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";
import type { ProductSort } from "@/lib/product-sort";
import {
  createProductSchema,
  listProductsSchema,
} from "@/lib/validation/products";
import type { Database } from "@/server/database.types";
import { db } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const CARD_COLUMNS = "id, name, description, image_url, score, feedbacks_count";

function toCard(
  row: Pick<
    ProductRow,
    "id" | "name" | "description" | "image_url" | "score" | "feedbacks_count"
  >,
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    score: row.score,
    feedbacksCount: row.feedbacks_count,
  };
}

export type ProductCard = ReturnType<typeof toCard>;

// Colunas de ordenação por opção da home. Sem avaliação (nota nula) sempre vai
// para o fim; o id no final deixa a ordem determinística entre páginas.
const SORT_ORDER: Record<
  ProductSort,
  { column: keyof ProductRow; ascending: boolean }[]
> = {
  top_rated: [
    { column: "score", ascending: false },
    { column: "feedbacks_count", ascending: false },
  ],
  relevance: [
    { column: "relevance", ascending: false },
    { column: "feedbacks_count", ascending: false },
  ],
  most_reviewed: [
    { column: "feedbacks_count", ascending: false },
    { column: "score", ascending: false },
  ],
  lowest_rated: [
    { column: "score", ascending: true },
    { column: "feedbacks_count", ascending: false },
  ],
};

// Cursor opaco: base64url("<sort>:<offset>"). Offset porque a ordenação por nota
// tem nulos e muda conforme chegam avaliações; o client remove duplicados.
const MAX_OFFSET = 10_000;

function encodeCursor(sort: ProductSort, offset: number) {
  return Buffer.from(`${sort}:${offset}`).toString("base64url");
}

function decodeCursor(cursor: string, sort: ProductSort) {
  const [cursorSort, rawOffset, ...rest] = Buffer.from(cursor, "base64url")
    .toString("utf8")
    .split(":");
  const offset = Number(rawOffset);
  if (
    rest.length > 0 ||
    cursorSort !== sort ||
    !/^\d+$/.test(rawOffset ?? "") ||
    offset > MAX_OFFSET
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cursor inválido." });
  }
  return offset;
}

// Hash antes de comparar: timingSafeEqual exige buffers do mesmo tamanho
function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

// Sem ADMIN_API_KEY configurada, recusa tudo (falha fechada)
export function isValidApiKey(received: string | null) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !received) return false;
  return timingSafeEqual(sha256(received), sha256(expected));
}

// Cadastro de produtos (usado pelo n8n): exige o header x-api-key == ADMIN_API_KEY.
// Fica na procedure (e não só no route handler) para também proteger a chamada
// via /api/trpc. Roda antes do .input(), então sem chave a resposta é 401.
const adminProcedure = publicProcedure.use(async ({ next }) => {
  const requestHeaders = await headers();
  if (!isValidApiKey(requestHeaders.get("x-api-key"))) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Chave de API ausente ou inválida.",
    });
  }
  return next();
});

export const productsRouter = router({
  list: publicProcedure.input(listProductsSchema).query(async ({ input }) => {
    const offset = input.cursor ? decodeCursor(input.cursor, input.sort) : 0;

    let query = db.from("products").select(CARD_COLUMNS);
    for (const { column, ascending } of SORT_ORDER[input.sort]) {
      query = query.order(column, { ascending, nullsFirst: false });
    }
    // Busca 1 a mais para saber se existe próxima página (range é inclusivo)
    const { data, error } = await query
      .order("id", { ascending: true })
      .range(offset, offset + input.limit);
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível carregar os produtos.",
        cause: error,
      });
    }

    const hasMore = data.length > input.limit;
    const rows = hasMore ? data.slice(0, input.limit) : data;

    return {
      items: rows.map(toCard),
      nextCursor: hasMore
        ? encodeCursor(input.sort, offset + rows.length)
        : null,
    };
  }),

  create: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      const { data, error } = await db
        .from("products")
        .insert({
          id: nanoid(),
          name: input.name,
          description: input.description ?? null,
          external_link: input.externalLink,
          image_url: input.imageUrl,
        })
        .select(
          "id, name, description, image_url, external_link, score, feedbacks_count, created_at",
        )
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível cadastrar o produto.",
          cause: error,
        });
      }

      return {
        ...toCard(data),
        externalLink: data.external_link,
        createdAt: data.created_at,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      const { data, error } = await db
        .from("products")
        .select(
          "id, name, description, image_url, external_link, score, feedbacks_count, created_at, ai_summary, ai_summary_feedbacks_count, ai_summary_updated_at",
        )
        .eq("id", input.id)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível carregar o produto.",
          cause: error,
        });
      }
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        externalLink: data.external_link,
        score: data.score,
        feedbacksCount: data.feedbacks_count,
        createdAt: data.created_at,
        aiSummary: data.ai_summary,
        aiSummaryFeedbacksCount: data.ai_summary_feedbacks_count,
        aiSummaryUpdatedAt: data.ai_summary_updated_at,
      };
    }),
});
