// Gera o resumo da IA dos produtos que já têm avaliações suficientes e estão
// sem resumo (ou com resumo desatualizado). Uso:
//   bun --conditions=react-server --env-file=.env.local scripts/backfill-ai-summaries.ts
// O --conditions=react-server faz o import "server-only" resolver para vazio.
import { AI_SUMMARY_MIN_FEEDBACKS } from "@/lib/ai-summary";
import { summarizeProductFeedbacks } from "@/server/ai/summarize-product";
import { db } from "@/server/db";

const { data: products, error } = await db
  .from("products")
  .select("id, name, feedbacks_count, ai_summary_feedbacks_count")
  .gte("feedbacks_count", AI_SUMMARY_MIN_FEEDBACKS);
if (error) throw error;

const pending = products.filter(
  (product) =>
    product.ai_summary_feedbacks_count === null ||
    product.ai_summary_feedbacks_count < product.feedbacks_count,
);
console.log(`${pending.length} produto(s) para resumir`);

// Um por vez para não estourar o rate limit da OpenAI
for (const product of pending) {
  console.log(`→ ${product.name} (${product.feedbacks_count} avaliações)`);
  await summarizeProductFeedbacks(product.id);
}
