-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 2 DO BANCO: REGISTRO DE LIGAÇÕES E POSSÍVEIS CLIENTES
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
-- Quem usa: administração e vendedores (os representantes e as lojas não veem).
-- A base de possíveis clientes é única para a equipe: um vendedor vê se a loja
-- já foi procurada por outro, e o histórico de tratativas de cada uma.
-- =====================================================================

create or replace function sou_vendas() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(meu_papel() in ('admin', 'vendedor'), false)
$$;

-- possível cliente: uma linha por telefone
create table if not exists prospects (
  id              uuid primary key default gen_random_uuid(),
  loja            text not null check (length(trim(loja)) between 2 and 160),
  telefone        text not null unique check (telefone ~ '^[0-9]{10,13}$'),   -- só números, com DDD
  comprador       text check (length(comprador) <= 120),
  cidade          text not null check (length(trim(cidade)) between 2 and 80),
  uf              text not null check (uf ~ '^[A-Z]{2}$'),
  email           text check (length(email) <= 160),
  observacoes     text check (length(observacoes) <= 2000),
  situacao        text not null default 'novo'
                  check (situacao in ('novo', 'interessado', 'retornar', 'nao_atendeu', 'sem_interesse', 'cliente', 'numero_errado')),
  proximo_contato date,
  ultima_ligacao  timestamptz,
  criado_por      uuid references perfis (id) default auth.uid(),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists prospects_cidade on prospects (uf, cidade);

-- cada ligação feita, com o resultado e a tratativa
create table if not exists ligacoes (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references prospects (id) on delete cascade,
  vendedor_id  uuid not null references perfis (id) default auth.uid(),
  feita_em     timestamptz not null default now(),
  resultado    text not null check (resultado in ('interessado', 'retornar', 'nao_atendeu', 'sem_interesse', 'cliente', 'numero_errado')),
  tratativa    text not null check (length(trim(tratativa)) between 1 and 4000),
  retornar_em  date
);
create index if not exists ligacoes_data on ligacoes (feita_em desc);
create index if not exists ligacoes_prospect on ligacoes (prospect_id, feita_em desc);

-- quem ligou e quando é sempre o banco que diz (a administração pode lançar ligação de outra data)
create or replace function preparar_ligacao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not sou_admin() then new.vendedor_id := auth.uid(); new.feita_em := now(); end if;
  return new;
end $$;
drop trigger if exists ligacoes_preparar on ligacoes;
create trigger ligacoes_preparar before insert on ligacoes for each row execute function preparar_ligacao();

-- a última ligação define a situação do possível cliente e o próximo contato
create or replace function ao_registrar_ligacao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update prospects p set situacao = new.resultado, ultima_ligacao = new.feita_em, proximo_contato = new.retornar_em, atualizado_em = now()
   where p.id = new.prospect_id and (p.ultima_ligacao is null or p.ultima_ligacao <= new.feita_em);
  return null;
end $$;
drop trigger if exists ligacoes_situacao on ligacoes;
create trigger ligacoes_situacao after insert on ligacoes for each row execute function ao_registrar_ligacao();

create or replace function tocar_prospect() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if tg_op = 'UPDATE' and not sou_admin() then new.criado_por := old.criado_por; new.criado_em := old.criado_em; end if;
  if tg_op = 'INSERT' and not sou_admin() then new.criado_por := auth.uid(); new.criado_em := now(); end if;
  return new;
end $$;
drop trigger if exists prospects_tocar on prospects;
create trigger prospects_tocar before insert or update on prospects for each row execute function tocar_prospect();

alter table prospects enable row level security;
alter table ligacoes  enable row level security;
drop policy if exists prospects_ver on prospects;      create policy prospects_ver on prospects for select to authenticated using (sou_vendas());
drop policy if exists prospects_criar on prospects;    create policy prospects_criar on prospects for insert to authenticated with check (sou_vendas());
drop policy if exists prospects_editar on prospects;   create policy prospects_editar on prospects for update to authenticated using (sou_vendas()) with check (sou_vendas());
drop policy if exists prospects_apagar on prospects;   create policy prospects_apagar on prospects for delete to authenticated using (sou_admin());
drop policy if exists ligacoes_ver on ligacoes;        create policy ligacoes_ver on ligacoes for select to authenticated using (sou_vendas());
drop policy if exists ligacoes_criar on ligacoes;      create policy ligacoes_criar on ligacoes for insert to authenticated with check (sou_vendas() and (vendedor_id = auth.uid() or sou_admin()));
drop policy if exists ligacoes_admin on ligacoes;      create policy ligacoes_admin on ligacoes for all to authenticated using (sou_admin()) with check (sou_admin());
revoke all on prospects, ligacoes from anon;
grant select, insert, update, delete on prospects, ligacoes to authenticated;

-- registrar uma ligação de uma vez: acha o possível cliente pelo telefone (ou cria) e grava a ligação.
-- Roda com os direitos de quem chama: as regras acima continuam valendo.
create or replace function registrar_ligacao(p jsonb) returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare tel text := regexp_replace(coalesce(p->>'telefone', ''), '\D', '', 'g'); pr prospects; lg ligacoes;
begin
  if not sou_vendas() then raise exception 'Você não tem permissão para registrar ligações.' using errcode = '42501'; end if;
  if tel ~ '^55[0-9]{10,11}$' then tel := substr(tel, 3); end if;
  if length(tel) not between 10 and 11 then raise exception 'Informe o telefone com DDD (10 ou 11 números).'; end if;
  if length(trim(coalesce(p->>'loja', ''))) < 2 then raise exception 'Informe o nome da loja.'; end if;
  if length(trim(coalesce(p->>'cidade', ''))) < 2 or coalesce(p->>'uf', '') !~ '^[A-Za-z]{2}$' then raise exception 'Informe a cidade e o estado.'; end if;
  if length(trim(coalesce(p->>'tratativa', ''))) < 1 then raise exception 'Escreva a tratativa da ligação.'; end if;
  select * into pr from prospects where telefone = tel;
  if pr.id is null then
    insert into prospects (loja, telefone, comprador, cidade, uf, email)
    values (trim(p->>'loja'), tel, nullif(trim(coalesce(p->>'comprador', '')), ''), trim(p->>'cidade'), upper(p->>'uf'), nullif(trim(coalesce(p->>'email', '')), ''))
    returning * into pr;
  else
    update prospects set loja = trim(p->>'loja'), comprador = coalesce(nullif(trim(coalesce(p->>'comprador', '')), ''), comprador),
      cidade = trim(p->>'cidade'), uf = upper(p->>'uf'), email = coalesce(nullif(trim(coalesce(p->>'email', '')), ''), email)
     where id = pr.id returning * into pr;
  end if;
  insert into ligacoes (prospect_id, resultado, tratativa, retornar_em)
  values (pr.id, p->>'resultado', trim(p->>'tratativa'), nullif(p->>'retornar_em', '')::date)
  returning * into lg;
  return jsonb_build_object('prospect_id', pr.id, 'ligacao_id', lg.id);
end $$;
revoke all on function registrar_ligacao(jsonb), sou_vendas() from public, anon;
grant execute on function registrar_ligacao(jsonb), sou_vendas() to authenticated;

-- nomes da equipe de vendas: o vendedor vê quem ligou para cada loja (só nome e perfil, nada mais)
create or replace function nomes_da_equipe() returns table (id uuid, nome text, papel papel_usuario)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.nome, p.papel from perfis p where sou_vendas() and p.papel in ('admin', 'vendedor')
$$;
revoke all on function nomes_da_equipe() from public, anon;
grant execute on function nomes_da_equipe() to authenticated;

-- CONFERÊNCIA: deve mostrar 2 tabelas e 1 função
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('prospects', 'ligacoes')) as tabelas,
       (select count(*) from pg_proc where proname = 'registrar_ligacao') as funcoes;
