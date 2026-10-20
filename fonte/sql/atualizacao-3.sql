-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 3 DO BANCO: ORÇAMENTOS DAS LIGAÇÕES
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
-- Precisa da atualização 2 (ligações e possíveis clientes) já rodada.
-- Cada orçamento é de uma loja da base de possíveis clientes, pode nascer de uma ligação,
-- guarda os itens com o preço combinado e, se não for concluído, o motivo.
-- =====================================================================

create table if not exists orcamentos (
  id              uuid primary key default gen_random_uuid(),
  numero          bigint generated always as identity unique,
  prospect_id     uuid not null references prospects (id) on delete cascade,
  ligacao_id      uuid references ligacoes (id) on delete set null,
  vendedor_id     uuid not null references perfis (id) default auth.uid(),
  situacao        text not null default 'aberto' check (situacao in ('aberto', 'concluido', 'nao_concluido')),
  validade        date,
  obs             text check (length(obs) <= 2000),
  motivo          text check (motivo in ('preco', 'frete', 'prazo', 'pagamento', 'concorrente', 'sem_estoque', 'desistiu', 'sem_resposta', 'outro')),
  motivo_detalhe  text check (length(motivo_detalhe) <= 4000),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  check (situacao <> 'nao_concluido' or motivo is not null)
);
create index if not exists orcamentos_prospect on orcamentos (prospect_id, criado_em desc);
create index if not exists orcamentos_data on orcamentos (criado_em desc);

create table if not exists orcamento_itens (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid not null references orcamentos (id) on delete cascade,
  ordem         int not null default 0,
  produto_id    uuid references produtos (id) on delete set null,
  descricao     text not null check (length(trim(descricao)) between 1 and 200),
  codigo        text check (length(codigo) <= 60),
  quantidade    int not null check (quantidade between 1 and 9999),
  preco_unit    numeric(12,2) not null check (preco_unit >= 0)
);
create index if not exists orcamento_itens_orc on orcamento_itens (orcamento_id, ordem);

-- quem fez o orçamento e quando é o banco que diz (a administração pode corrigir)
create or replace function preparar_orcamento() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if not sou_admin() then
    if tg_op = 'INSERT' then new.vendedor_id := auth.uid(); new.criado_em := now();
    else new.vendedor_id := old.vendedor_id; new.criado_em := old.criado_em; new.prospect_id := old.prospect_id; new.ligacao_id := old.ligacao_id; end if;
  end if;
  if new.situacao <> 'nao_concluido' then new.motivo := null; new.motivo_detalhe := null; end if;
  return new;
end $$;
drop trigger if exists orcamentos_preparar on orcamentos;
create trigger orcamentos_preparar before insert or update on orcamentos for each row execute function preparar_orcamento();

-- pode mexer no orçamento: quem fez ou a administração
create or replace function posso_mexer_orcamento(oid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select sou_admin() or exists (select 1 from orcamentos o where o.id = oid and o.vendedor_id = auth.uid() and sou_vendas())
$$;

alter table orcamentos      enable row level security;
alter table orcamento_itens enable row level security;
drop policy if exists orcamentos_ver on orcamentos;          create policy orcamentos_ver on orcamentos for select to authenticated using (sou_vendas());
drop policy if exists orcamentos_criar on orcamentos;        create policy orcamentos_criar on orcamentos for insert to authenticated with check (sou_vendas() and (vendedor_id = auth.uid() or sou_admin()));
drop policy if exists orcamentos_editar on orcamentos;       create policy orcamentos_editar on orcamentos for update to authenticated using (sou_admin() or (sou_vendas() and vendedor_id = auth.uid())) with check (sou_admin() or (sou_vendas() and vendedor_id = auth.uid()));
drop policy if exists orcamentos_apagar on orcamentos;       create policy orcamentos_apagar on orcamentos for delete to authenticated using (sou_admin());
drop policy if exists orcamento_itens_ver on orcamento_itens;    create policy orcamento_itens_ver on orcamento_itens for select to authenticated using (sou_vendas());
drop policy if exists orcamento_itens_mexer on orcamento_itens;  create policy orcamento_itens_mexer on orcamento_itens for all to authenticated using (posso_mexer_orcamento(orcamento_id)) with check (posso_mexer_orcamento(orcamento_id));
revoke all on orcamentos, orcamento_itens from anon;
grant select, insert, update, delete on orcamentos, orcamento_itens to authenticated;

-- gravar um orçamento de uma vez (cabeçalho e itens). Sem id cria; com id altera e troca os itens.
-- Roda com os direitos de quem chama: as regras acima continuam valendo.
create or replace function salvar_orcamento(p jsonb) returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare o orcamentos; it jsonb; n int := 0; sit text := coalesce(nullif(p->>'situacao', ''), 'aberto'); mot text := nullif(p->>'motivo', '');
begin
  if not sou_vendas() then raise exception 'Você não tem permissão para fazer orçamentos.' using errcode = '42501'; end if;
  if jsonb_typeof(p->'itens') is distinct from 'array' or jsonb_array_length(p->'itens') = 0 then raise exception 'Coloque pelo menos um item no orçamento.'; end if;
  if sit = 'nao_concluido' and mot is null then raise exception 'Escolha o motivo de o orçamento não ter sido concluído.'; end if;
  if nullif(p->>'id', '') is null then
    if not exists (select 1 from prospects where id = (p->>'prospect_id')::uuid) then raise exception 'Loja não encontrada na base.'; end if;
    insert into orcamentos (prospect_id, ligacao_id, situacao, validade, obs, motivo, motivo_detalhe)
    values ((p->>'prospect_id')::uuid, nullif(p->>'ligacao_id', '')::uuid, sit, nullif(p->>'validade', '')::date,
            nullif(trim(coalesce(p->>'obs', '')), ''), mot, nullif(trim(coalesce(p->>'motivo_detalhe', '')), ''))
    returning * into o;
  else
    update orcamentos set situacao = sit, validade = nullif(p->>'validade', '')::date, obs = nullif(trim(coalesce(p->>'obs', '')), ''),
           motivo = mot, motivo_detalhe = nullif(trim(coalesce(p->>'motivo_detalhe', '')), '')
     where id = (p->>'id')::uuid returning * into o;
    if o.id is null then raise exception 'Só quem fez o orçamento ou a administração pode alterá-lo.' using errcode = '42501'; end if;
    delete from orcamento_itens where orcamento_id = o.id;
  end if;
  for it in select * from jsonb_array_elements(p->'itens') loop
    n := n + 1;
    if length(trim(coalesce(it->>'descricao', ''))) < 1 then raise exception 'Escolha o produto do item %.', n; end if;
    if coalesce((it->>'quantidade')::int, 0) < 1 then raise exception 'Informe a quantidade do item %.', n; end if;
    insert into orcamento_itens (orcamento_id, ordem, produto_id, descricao, codigo, quantidade, preco_unit)
    values (o.id, n, case when coalesce(it->>'produto_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and exists (select 1 from produtos where id = (it->>'produto_id')::uuid) then (it->>'produto_id')::uuid end,
            trim(it->>'descricao'), nullif(trim(coalesce(it->>'codigo', '')), ''), (it->>'quantidade')::int, round(coalesce((it->>'preco_unit')::numeric, 0), 2));
  end loop;
  return jsonb_build_object('id', o.id, 'numero', o.numero);
end $$;
revoke all on function salvar_orcamento(jsonb), posso_mexer_orcamento(uuid) from public, anon;
grant execute on function salvar_orcamento(jsonb), posso_mexer_orcamento(uuid) to authenticated;

-- CONFERÊNCIA: deve mostrar 2 tabelas e 1 função
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('orcamentos', 'orcamento_itens')) as tabelas,
       (select count(*) from pg_proc where proname = 'salvar_orcamento') as funcoes;
