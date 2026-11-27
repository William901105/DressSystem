begin;

create sequence public.category_sort_order;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  sort_order integer not null default nextval('public.category_sort_order')
);

create unique index categories_name_unique on public.categories (lower(btrim(name)));

create table public.clothes (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category_id uuid not null references public.categories(id) on delete restrict,
  photo_path text not null unique check (photo_path = 'clothes/' || id::text || '.jpg'),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index clothes_category on public.clothes (category_id);
create index clothes_created_at on public.clothes (created_at desc);

create table public.photo_uploads (
  id uuid primary key,
  expires_at timestamptz not null default (now() + interval '2 hours')
);

create index photo_uploads_expires_at on public.photo_uploads (expires_at);

create table public.outfits (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create index outfits_created_at on public.outfits (created_at desc);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  position integer not null check (position between 1 and 50),
  clothing_id uuid not null references public.clothes(id) on delete restrict,
  clothing_name text not null,
  category_name text not null,
  photo_path text not null,
  primary key (outfit_id, position),
  unique (outfit_id, clothing_id)
);

create function public.reorder_categories(category_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  lock table public.categories in share row exclusive mode;

  if category_ids is null
    or cardinality(category_ids) <> (select count(*) from public.categories)
    or cardinality(category_ids) <> (
      select count(*) from public.categories where id = any(category_ids)
    ) then
    raise exception using errcode = 'P0001', message = 'category_list_changed';
  end if;

  update public.categories as c
  set sort_order = ordered.position
  from unnest(category_ids) with ordinality as ordered(id, position)
  where c.id = ordered.id;
end;
$$;

create function public.add_garment(upload_id uuid, garment_name text, assigned_category uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.photo_uploads
  where id = upload_id and expires_at > now()
  for update;

  if not found then
    if exists (select 1 from public.clothes where id = upload_id) then
      return upload_id;
    end if;
    raise exception using errcode = 'P0001', message = 'upload_expired';
  end if;

  insert into public.clothes (id, name, category_id, photo_path)
  values (upload_id, garment_name, assigned_category, 'clothes/' || upload_id::text || '.jpg');

  delete from public.photo_uploads where id = upload_id;
  return upload_id;
end;
$$;

create function public.create_outfit(
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
        and garment_ids = (
          select array_agg(i.clothing_id order by i.position)
          from public.outfit_items as i where i.outfit_id = new_id
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

alter table public.categories enable row level security;
alter table public.clothes enable row level security;
alter table public.photo_uploads enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;

revoke all on public.categories, public.clothes, public.photo_uploads, public.outfits, public.outfit_items
from public, anon, authenticated;
revoke all on sequence public.category_sort_order from public, anon, authenticated;
grant select, insert, update, delete on
  public.categories, public.clothes, public.photo_uploads, public.outfits, public.outfit_items to service_role;
grant usage on sequence public.category_sort_order to service_role;

revoke execute on function public.reorder_categories(uuid[]) from public, anon, authenticated;
revoke execute on function public.add_garment(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.create_outfit(uuid, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_categories(uuid[]) to service_role;
grant execute on function public.add_garment(uuid, text, uuid) to service_role;
grant execute on function public.create_outfit(uuid, text, text, uuid[]) to service_role;

insert into public.categories (name) values ('上衣'), ('下身'), ('外套'), ('鞋子'), ('配件');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clothing-photos', 'clothing-photos', false, 3145728, array['image/jpeg']);

commit;
