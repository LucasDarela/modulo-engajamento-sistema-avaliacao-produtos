import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { after } from "next/server";
import { z } from "zod";

import { createFeedbackSchema } from "@/lib/validation/feedback";
import { summarizeProductFeedbacks } from "@/server/ai/summarize-product";
import { db } from "@/server/db";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc";

// Só nome e sobrenome do autor: email e senha nunca saem do banco
const FEEDBACK_COLUMNS =
  "id, score, comment, created_at, author:accounts(first_name, last_name)";

type FeedbackRow = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  author: { first_name: string; last_name: string } | null;
};

function toFeedback(row: FeedbackRow) {
  return {
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
    author: {
      firstName: row.author?.first_name ?? "",
      lastName: row.author?.last_name ?? "",
    },
  };
}

export type Feedback = ReturnType<typeof toFeedback>;

export const feedbacksRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      const { data, error } = await db
        .from("products_feedbacks")
        .select(FEEDBACK_COLUMNS)
        .eq("product_id", input.productId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível carregar as avaliações.",
          cause: error,
        });
      }

      return data.map(toFeedback);
    }),

  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: product, error: productError } = await db
        .from("products")
        .select("id")
        .eq("id", input.productId)
        .maybeSingle();

      if (productError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível enviar sua avaliação. Tente novamente.",
          cause: productError,
        });
      }
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }

      const { data, error } = await db
        .from("products_feedbacks")
        .insert({
          id: nanoid(),
          score: input.score,
          comment: input.comment,
          created_by: ctx.session.accountId,
          product_id: product.id,
        })
        .select(FEEDBACK_COLUMNS)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível enviar sua avaliação. Tente novamente.",
          cause: error,
        });
      }

      // Atualiza o resumo da IA depois da resposta, sem atrasar o envio
      after(() => summarizeProductFeedbacks(product.id));

      return toFeedback(data);
    }),
});
