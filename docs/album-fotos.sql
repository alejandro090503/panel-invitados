-- Álbum de fotos por evento. Vive en el Supabase del formulario (bsjoelxktbvlavfoozhk),
-- que es el que tiene espacio; el panel lo usa con su llave pública + un token de servidor.
-- v1 (2026-10-11). Las funciones con token se reemplazaron en album-fotos-v2.sql (contraseña del panel).
begin;
create extension if not exists pgcrypto;

-- Existir en esta tabla = álbum activado para ESE evento. Ningún otro panel cambia.
create table if not exists public.album_eventos (
  slug text primary key,
  nombre text not null,
  url_boda text,
  fecha_evento date not null,
  created_at timestamptz not null default now()
);
create table if not exists public.album_fotos (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.album_eventos(slug) on delete cascade,
  path text not null,
  thumb text not null,
  invitado text,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists album_fotos_slug_idx on public.album_fotos (slug, created_at desc);
alter table public.album_eventos enable row level security;
alter table public.album_fotos enable row level security;
-- Sin políticas: nadie lee ni escribe directo; todo pasa por las funciones de abajo.
revoke all on public.album_eventos, public.album_fotos from anon, authenticated;

create table if not exists public.album_privado (clave text primary key, valor text not null);
revoke all on public.album_privado from anon, authenticated;
insert into public.album_privado (clave, valor) values ('token_sha256', '__HASH__')
  on conflict (clave) do update set valor = excluded.valor;

-- Ventanas (hora CDMX): abre el día del evento 00:00, se sube hasta 7 días después, se borra a las 3 semanas.
create or replace function public.album_estado(p_slug text) returns text
language sql stable security definer set search_path = public as $$
  select case
    when e.slug is null then 'no_existe'
    when now() < (e.fecha_evento::timestamp at time zone 'America/Mexico_City') then 'antes'
    when now() < ((e.fecha_evento + 8)::timestamp at time zone 'America/Mexico_City') then 'abierto'
    when now() < ((e.fecha_evento + 21)::timestamp at time zone 'America/Mexico_City') then 'cerrado'
    else 'expirado'
  end
  from (select 1) x left join public.album_eventos e on e.slug = p_slug
$$;

create or replace function public._album_token_ok(p_token text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.album_privado
                  where clave = 'token_sha256' and valor = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex'))
$$;
revoke execute on function public._album_token_ok(text) from public, anon, authenticated;

-- Público: datos para la página de subida y para mostrar el botón en el panel
create or replace function public.album_info(p_slug text)
returns table (slug text, nombre text, fecha_evento date, estado text, fotos bigint)
language sql stable security definer set search_path = public as $$
  select e.slug, e.nombre, e.fecha_evento, public.album_estado(e.slug),
         (select count(*) from public.album_fotos f where f.slug = e.slug)
    from public.album_eventos e where e.slug = p_slug
$$;

-- Público: registra una foto ya subida. Solo con el álbum abierto y con tope por evento.
create or replace function public.album_registrar(p_slug text, p_path text, p_thumb text, p_invitado text)
returns uuid language plpgsql security definer set search_path = public as $$
declare nuevo uuid;
begin
  if public.album_estado(p_slug) <> 'abierto' then raise exception 'El álbum no está abierto'; end if;
  if p_path not like p_slug || '/%' or p_thumb not like p_slug || '/%' then raise exception 'Ruta inválida'; end if;
  if (select count(*) from public.album_fotos where slug = p_slug) >= 3000 then raise exception 'El álbum llegó a su límite de fotos'; end if;
  insert into public.album_fotos (slug, path, thumb, invitado)
  values (p_slug, p_path, p_thumb, nullif(left(trim(coalesce(p_invitado, '')), 60), ''))
  returning id into nuevo;
  return nuevo;
end $$;

-- Con token (servidor del panel): listar, ocultar, limpiar
create or replace function public.album_listar(p_token text, p_slug text)
returns table (id uuid, path text, thumb text, invitado text, oculto boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._album_token_ok(p_token) then raise exception 'No autorizado'; end if;
  return query select f.id, f.path, f.thumb, f.invitado, f.oculto, f.created_at
                 from public.album_fotos f where f.slug = p_slug order by f.created_at desc;
end $$;

create or replace function public.album_ocultar(p_token text, p_id uuid, p_oculto boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public._album_token_ok(p_token) then raise exception 'No autorizado'; end if;
  update public.album_fotos set oculto = p_oculto where id = p_id;
end $$;

create or replace function public.album_expirados(p_token text)
returns table (slug text, path text, thumb text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._album_token_ok(p_token) then raise exception 'No autorizado'; end if;
  return query select f.slug, f.path, f.thumb from public.album_fotos f
                where public.album_estado(f.slug) = 'expirado' limit 1000;
end $$;

create or replace function public.album_purgar(p_token text, p_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public._album_token_ok(p_token) then raise exception 'No autorizado'; end if;
  if public.album_estado(p_slug) <> 'expirado' then raise exception 'Aún no expira'; end if;
  delete from public.album_fotos where slug = p_slug;
end $$;

grant execute on function public.album_estado(text), public.album_info(text),
  public.album_registrar(text, text, text, text), public.album_listar(text, text),
  public.album_ocultar(text, uuid, boolean), public.album_expirados(text), public.album_purgar(text, text)
  to anon, authenticated;

-- Bucket público: las rutas llevan un id imposible de adivinar y nadie puede listar el bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', true, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "album sube solo abierto" on storage.objects;
create policy "album sube solo abierto" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'album' and public.album_estado(split_part(name, '/', 1)) = 'abierto');
drop policy if exists "album borra expirado" on storage.objects;
create policy "album borra expirado" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'album' and public.album_estado(split_part(name, '/', 1)) = 'expirado');
drop policy if exists "album lee expirado" on storage.objects;
create policy "album lee expirado" on storage.objects for select to anon, authenticated
  using (bucket_id = 'album' and public.album_estado(split_part(name, '/', 1)) = 'expirado');

commit;
notify pgrst, 'reload schema';
