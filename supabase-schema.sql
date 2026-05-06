-- Tabla invitados
-- Ejecutar en: Supabase > SQL Editor

create table if not exists invitados (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  pases      int  not null default 1,
  estado     text not null default 'pendiente'
             check (estado in ('pendiente', 'confirmó', 'declinó')),
  url_boda   text not null,
  created_at timestamptz not null default now()
);

-- Índice para filtrar por boda
create index if not exists idx_invitados_url_boda on invitados (url_boda);

-- Habilitar Row Level Security
alter table invitados enable row level security;

-- Política: lectura pública (panel usa anon key)
create policy "Lectura pública"
  on invitados for select
  using (true);

-- Política: inserción pública (el panel agrega invitados)
create policy "Inserción pública"
  on invitados for insert
  with check (true);

-- Política: actualización pública (confirmar desde la invitación)
create policy "Actualización pública"
  on invitados for update
  using (true);

-- Política: eliminación pública (el panel puede borrar)
create policy "Eliminación pública"
  on invitados for delete
  using (true);

-- Habilitar Realtime para esta tabla
-- (hacerlo también desde: Supabase > Database > Replication > invitados ON)
