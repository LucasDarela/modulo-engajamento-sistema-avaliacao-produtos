import "server-only";

import { AI_SUMMARY_MIN_FEEDBACKS } from "@/lib/ai-summary";
import { db } from "@/server/db";

import { productSummaryAgent } from "./product-summary-agent";

// Limita tokens e custo: produtos muito avaliados usam só as mais recentes
const MAX_FEEDBACKS_IN_PROMPT = 100;

// Gera e salva o resumo das avaliações do produto. Nunca lança: roda em
// background (after()) e uma falha só mantém o resumo anterior.
export async function summarizeProductFeedbacks(productId: string) {
  try {
    const { data: product, error: productError } = await db
      .from("products")
      .select("feedbacks_count")
      .eq("id", productId)
      .single();
    if (productError) throw productError;

    const count = product.feedbacks_count;
    if (count < AI_SUMMARY_MIN_FEEDBACKS) return;

    const { data: feedbacks, error: feedbacksError } = await db
      .from("products_feedbacks")
      .select("score, comment")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(MAX_FEEDBACKS_IN_PROMPT);
    if (feedbacksError) throw feedbacksError;

    // Uma avaliação por linha: quebras de linha do comentário viram espaço
    const lines = feedbacks.map(
      ({ score, comment }) =>
        `Nota ${score}/5: ${comment.replace(/\s+/g, " ").trim()}`,
    );
    const response = await productSummaryAgent.generate(
      `Resuma estas ${lines.length} avaliações:\n<avaliacoes>\n${lines.join("\n")}\n</avaliacoes>`,
    );

    const summary = response.text.trim();
    if (!summary) return;

    // Só grava se cobrir mais avaliações que o resumo salvo: uma geração
    // antiga que termine depois de uma mais nova não a sobrescreve
    const { error: updateError } = await db
      .from("products")
      .update({
        ai_summary: summary,
        ai_summary_feedbacks_count: count,
        ai_summary_updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .or(
        `ai_summary_feedbacks_count.is.null,ai_summary_feedbacks_count.lt.${count}`,
      );
    if (updateError) throw updateError;
  } catch (error) {
    console.error(
      `[ai-summary] Falha ao gerar o resumo do produto ${productId}`,
      error,
    );
  }
}
