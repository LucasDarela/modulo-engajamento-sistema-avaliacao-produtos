import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";

import {
  createProductSchema,
  listProductsSchema,
} from "@/lib/validation/products";
import type { Database } from "@/server/database.types";
import { db } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const CARD_COLUMNS =
  "id, name, description, image_url, score, feedbacks_count, created_at";

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

// Formato do timestamptz devolvido pelo PostgREST, ex.: 2026-10-01T12:00:00.123456+00:00
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

// Cursor opaco: base64url("<created_at>|<id>") da última linha da página
function encodeCursor(row: Pick<ProductRow, "created_at" | "id">) {
  return Buffer.from(`${row.created_at}|${row.id}`).toString("base64url");
}

function decodeCursor(cursor: string) {
  const [createdAt, id, ...rest] = Buffer.from(cursor, "base64url")
    .toString("utf8")
    .split("|");
  if (
    rest.length > 0 ||
    !createdAt ||
    !id ||
    // Regex estrita: o Date.parse aceita texto livre entre parênteses, e o
    // valor é interpolado no filtro do PostgREST logo abaixo
    !ISO_TIMESTAMP.test(createdAt) ||
    !/^[\w-]+$/.test(id)
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cursor inválido." });
  }
  return { createdAt, id };
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
    // Keyset em (created_at desc, id desc): estável mesmo com inserts novos
    let query = db
      .from("products")
      .select(CARD_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(input.limit + 1);

    if (input.cursor) {
      const { createdAt, id } = decodeCursor(input.cursor);
      query = query.or(
        `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível carregar os produtos.",
        cause: error,
      });
    }

    const hasMore = data.length > input.limit;
    const rows = hasMore ? data.slice(0, input.limit) : data;
    const last = rows.at(-1);

    return {
      items: rows.map(toCard),
      nextCursor: hasMore && last ? encodeCursor(last) : null,
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
