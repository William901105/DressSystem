create index outfit_items_clothing_id on public.outfit_items (clothing_id);

create view public.clothes_with_popularity
with (security_invoker = true)
as
select
  clothing.id,
  clothing.name,
  clothing.category_id,
  clothing.photo_path,
  clothing.created_at,
  clothing.archived_at,
  (
    select count(*)
    from public.outfit_items as item
    where item.clothing_id = clothing.id
  ) as selection_count
from public.clothes as clothing;

revoke all on public.clothes_with_popularity from public, anon, authenticated;
grant select on public.clothes_with_popularity to service_role;

notify pgrst, 'reload schema';
