-- Corrige uma corrida no recálculo da média: com duas avaliações simultâneas do
-- mesmo produto, o UPDATE da segunda esperava o lock da linha, mas seus subselects
-- usavam o snapshot do início do statement e não enxergavam a primeira avaliação.
-- Agora o lock é pego antes, num statement próprio; o UPDATE seguinte ganha
-- snapshot novo (READ COMMITTED) e conta todas as avaliações já commitadas.
create or replace function public.refresh_product_score()
returns trigger
language plpgsql
as $$
declare
  target_product_id text := coalesce(new.product_id, old.product_id);
begin
  perform 1 from public.products where id = target_product_id for update;

  update public.products
  set
    score = (
      select round(avg(f.score)::numeric, 1)
      from public.products_feedbacks f
      where f.product_id = target_product_id
    ),
    feedbacks_count = (
      select count(*)
      from public.products_feedbacks f
      where f.product_id = target_product_id
    )
  where id = target_product_id;
  return null;
end;
$$;
