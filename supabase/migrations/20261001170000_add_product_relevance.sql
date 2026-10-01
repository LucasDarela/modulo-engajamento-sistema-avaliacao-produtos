-- Ordenação "Mais relevantes" da home: média ponderada estilo IMDb. Cada produto
-- ganha 5 votos neutros (nota 3), então poucas avaliações puxam a nota para 3 e
-- muitas avaliações fazem valer a média real. Nula sem avaliações (vai para o fim).
alter table public.products
  add column relevance numeric generated always as (
    case
      when feedbacks_count > 0
        then round((score * feedbacks_count + 3 * 5) / (feedbacks_count + 5), 4)
    end
  ) stored;
