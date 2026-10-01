-- Resumo das avaliações gerado por IA (ver docs/plans/ai-summary.md)
alter table public.products
  add column ai_summary text,
  -- Quantas avaliações existiam quando o resumo foi gerado (guarda contra corrida)
  add column ai_summary_feedbacks_count integer,
  add column ai_summary_updated_at timestamptz;
