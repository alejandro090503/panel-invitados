-- Álbum v2 (2026-10-11): sin token de servidor (el repo del panel es público).
-- Ver y ocultar fotos se valida con la contraseña del panel de ESE evento (se guarda su SHA-256).
begin;
alter table public.album_eventos add column if not exists clave_sha256 text;

drop function if exists public.album_listar(text, text);
drop function if exists public.album_ocultar(text, uuid, boolean);
drop function if exists public.album_expirados(text);
drop function if exists public.album_purgar(text, text);
drop function if exists public._album_token_ok(text);
drop table if exists public.album_privado;

create or replace function public._album_clave_ok(p_slug text, p_clave text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.album_eventos
                  where slug = p_slug and clave_sha256 is not null
                    and clave_sha256 = encode(digest(coalesce(p_clave, ''), 'sha256'), 'hex'))
$$;
revoke execute on function public._album_clave_ok(text, text) from public, anon, authenticated;

create or replace function public.album_listar(p_slug text, p_clave text)
returns table (id uuid, path text, thumb text, invitado text, oculto boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._album_clave_ok(p_slug, p_clave) then raise exception 'No autorizado'; end if;
  return query select f.id, f.path, f.thumb, f.invitado, f.oculto, f.created_at
                 from public.album_fotos f where f.slug = p_slug order by f.created_at desc;
end $$;

create or replace function public.album_ocultar(p_slug text, p_clave text, p_id uuid, p_oculto boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public._album_clave_ok(p_slug, p_clave) then raise exception 'No autorizado'; end if;
  update public.album_fotos set oculto = p_oculto where id = p_id and slug = p_slug;
end $$;

-- Limpieza: solo toca álbumes que ya cumplieron 3 semanas, así que no necesita llave.
create or replace function public.album_expirados()
returns table (slug text, path text, thumb text)
language sql stable security definer set search_path = public as $$
  select f.slug, f.path, f.thumb from public.album_fotos f
   where public.album_estado(f.slug) = 'expirado' limit 1000
$$;
create or replace function public.album_purgar(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.album_estado(p_slug) <> 'expirado' then raise exception 'Aún no expira'; end if;
  delete from public.album_fotos where slug = p_slug;
end $$;

grant execute on function public.album_listar(text, text), public.album_ocultar(text, text, uuid, boolean),
  public.album_expirados(), public.album_purgar(text) to anon, authenticated;
commit;
notify pgrst, 'reload schema';

-- ACTIVAR el álbum de UN evento (lo hace la sesión que genera el panel, por CLI):
-- insert into public.album_eventos (slug, nombre, url_boda, fecha_evento, clave_sha256)
-- values ('<slug-del-panel>', '<Nombre & Nombre>', 'https://<invitacion>.vercel.app', 'YYYY-MM-DD',
--         encode(extensions.digest('<contraseña-del-panel>', 'sha256'), 'hex'))
-- on conflict (slug) do update set fecha_evento = excluded.fecha_evento, clave_sha256 = excluded.clave_sha256;
