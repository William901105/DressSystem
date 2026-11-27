alter table public.outfit_items
  alter column clothing_id drop not null,
  drop constraint outfit_items_clothing_id_fkey,
  add constraint outfit_items_clothing_id_fkey
    foreign key (clothing_id) references public.clothes(id) on delete set null;

-- Use the saved photo path to recognize retries after a garment has been deleted.
create or replace function public.create_outfit(
  new_id uuid,
  outfit_name text,
  outfit_notes text,
  garment_ids uuid[]
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  item_count integer;
begin
  if garment_ids is null or cardinality(garment_ids) not between 1 and 50
    or cardinality(garment_ids) <> (select count(distinct id) from unnest(garment_ids) as selected(id)) then
    raise exception using errcode = 'P0001', message = 'outfit_selection_invalid';
  end if;

  insert into public.outfits (id, name, notes)
  values (new_id, outfit_name, outfit_notes)
  on conflict (id) do nothing;

  if not found then
    if exists (
      select 1 from public.outfits as o
      where o.id = new_id and o.name = outfit_name and o.notes = outfit_notes
        and (
          select array_agg(coalesce('clothes/' || i.clothing_id::text || '.jpg', i.photo_path) order by i.position)
          from public.outfit_items as i where i.outfit_id = new_id
        ) = array(
          select 'clothes/' || selected.id::text || '.jpg'
          from unnest(garment_ids) with ordinality as selected(id, position)
          order by selected.position
        )
    ) then
      return new_id;
    end if;
    raise exception using errcode = 'P0001', message = 'outfit_id_conflict';
  end if;

  insert into public.outfit_items
    (outfit_id, position, clothing_id, clothing_name, category_name, photo_path)
  select new_id, selected.position, g.id, g.name, c.name, g.photo_path
  from unnest(garment_ids) with ordinality as selected(id, position)
  join public.clothes as g on g.id = selected.id and g.archived_at is null
  join public.categories as c on c.id = g.category_id;

  get diagnostics item_count = row_count;
  if item_count <> cardinality(garment_ids) then
    raise exception using errcode = 'P0001', message = 'outfit_item_unavailable';
  end if;

  return new_id;
end;
$$;

notify pgrst, 'reload schema';
