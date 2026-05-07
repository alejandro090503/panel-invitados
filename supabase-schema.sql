-- ============================================
-- Panel de Invitados — Elysium Invitaciones
-- Multi-tenant: una tabla bodas + una tabla invitados
-- ============================================

-- Tabla bodas (config por cliente)
create table if not exists bodas (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  nombre     text not null,
  url_boda   text not null,
  password   text not null default 'elysium2026',
  created_at timestamptz not null default now()
);

create unique index if not exists idx_bodas_slug on bodas (slug);
alter table bodas enable row level security;
create policy "Lectura pública bodas" on bodas for select using (true);

-- Tabla invitados
create table if not exists invitados (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  pases      int  not null default 1,
  estado     text not null default 'pendiente'
             check (estado in ('pendiente', 'confirmó', 'declinó')),
  url_boda   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invitados_url_boda on invitados (url_boda);
alter table invitados enable row level security;
create policy "Lectura pública" on invitados for select using (true);
create policy "Inserción pública" on invitados for insert with check (true);
create policy "Actualización pública" on invitados for update using (true);
create policy "Eliminación pública" on invitados for delete using (true);

-- Habilitar Realtime
-- alter publication supabase_realtime add table invitados;

-- ============================================
-- Para agregar una nueva boda:
-- insert into bodas (slug, nombre, url_boda, password)
-- values ('carlos-victoria', 'Carlos & Victoria', 'https://boda-carlos-victoria.vercel.app', 'micontraseña123');
-- ============================================
