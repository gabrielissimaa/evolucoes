-- Rode este script no Supabase: Project > SQL Editor > New query > cole e clique em "Run"

create table if not exists public.pacientes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create index if not exists pacientes_user_id_idx on public.pacientes(user_id);

alter table public.pacientes enable row level security;

create policy "select own pacientes" on public.pacientes
  for select using (auth.uid() = user_id);

create policy "insert own pacientes" on public.pacientes
  for insert with check (auth.uid() = user_id);

create policy "update own pacientes" on public.pacientes
  for update using (auth.uid() = user_id);

create policy "delete own pacientes" on public.pacientes
  for delete using (auth.uid() = user_id);
