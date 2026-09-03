-- Rode isto no Supabase (SQL Editor > New query > Run).
-- Adiciona uma "lápide" de exclusão: em vez de apagar a linha na hora,
-- marcamos excluido=true. Assim, quando outro aparelho sincronizar,
-- ele vê a marca e apaga a cópia local dele também — a Dona Josefa
-- não vai mais "voltar" depois de excluída em outro dispositivo.

alter table public.pacientes add column if not exists excluido boolean not null default false;

create index if not exists pacientes_excluido_idx on public.pacientes(excluido);
