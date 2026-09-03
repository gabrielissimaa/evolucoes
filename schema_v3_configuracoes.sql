-- Rode isto no Supabase (SQL Editor > New query > Run).
-- Guarda as customizações que você fizer nos protocolos (itens a avaliar / sinais de alarme editados).

create table if not exists public.configuracoes (
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null,
  valor jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.configuracoes enable row level security;

create policy "select own config" on public.configuracoes
  for select using (auth.uid() = user_id);

create policy "insert own config" on public.configuracoes
  for insert with check (auth.uid() = user_id);

create policy "update own config" on public.configuracoes
  for update using (auth.uid() = user_id);
