-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 11 DO BANCO: ORÇAMENTOS NO LUGAR DE "LANÇAR PEDIDO"
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez. Precisa das atualizações 1, 2 e 3.
--  * O orçamento pode ser para qualquer cliente (não só as lojas das ligações), com as condições de venda.
--  * Vendedores e representantes fazem orçamentos; cada um vê os seus (a administração vê todos).
--  * "Fechar orçamento" cria o pedido para faturamento, com os itens e os preços combinados no orçamento.
-- =====================================================================

-- 1. QUEM FAZ ORÇAMENTO
create or replace function sou_orcamentista() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(meu_papel()::text in ('admin', 'vendedor', 'representante'), false)
$$;
revoke all on function sou_orcamentista() from public, anon;
grant execute on function sou_orcamentista() to authenticated;

-- 2. DADOS DO CLIENTE E CONDIÇÕES NO ORÇAMENTO
alter table orcamentos alter column prospect_id drop not null;
alter table orcamentos add column if not exists cliente_nome text check (length(cliente_nome) <= 160);
alter table orcamentos add column if not exists cliente_doc text check (length(cliente_doc) <= 40);
alter table orcamentos add column if not exists cliente_contato text check (length(cliente_contato) <= 120);
alter table orcamentos add column if not exists cliente_telefone text check (length(cliente_telefone) <= 20);
alter table orcamentos add column if not exists cliente_email text check (length(cliente_email) <= 160);
alter table orcamentos add column if not exists cliente_cidade text check (length(cliente_cidade) <= 120);
alter table orcamentos add column if not exists forma_pagamento text not null default 'a_combinar' check (forma_pagamento in ('a_combinar', 'pix', 'boleto'));
alter table orcamentos add column if not exists boleto_dias int[];
alter table orcamentos add column if not exists frete text check (length(frete) <= 120);
alter table orcamentos add column if not exists prazo_entrega text check (length(prazo_entrega) <= 120);
alter table orcamentos add column if not exists vendedor_contato text check (length(vendedor_contato) <= 120);
alter table orcamentos add column if not exists pedido_id uuid references pedidos (id) on delete set null;
alter table orcamentos add column if not exists fechado_em timestamptz;
alter table pedidos add column if not exists orcamento_id uuid references orcamentos (id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orcamentos_tem_cliente') then
    alter table orcamentos add constraint orcamentos_tem_cliente check (prospect_id is not null or length(trim(coalesce(cliente_nome, ''))) >= 2);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orcamentos_dias_boleto') then
    alter table orcamentos add constraint orcamentos_dias_boleto check (boleto_dias is null or (cardinality(boleto_dias) between 1 and 12 and boleto_dias <@ array[1, 2, 3, 4, 5, 15, 28, 30, 45, 60, 75, 90]));
  end if;
end $$;

create or replace function preparar_orcamento() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if not sou_admin() then
    if tg_op = 'INSERT' then new.vendedor_id := auth.uid(); new.criado_em := now();
    else new.vendedor_id := old.vendedor_id; new.criado_em := old.criado_em; new.prospect_id := old.prospect_id; new.ligacao_id := old.ligacao_id; end if;
  end if;
  -- orçamento fechado (virou pedido) não muda mais; o pedido e a data do fechamento só vêm de fechar_orcamento
  if tg_op = 'UPDATE' and coalesce(current_setting('jcn.fechando_orcamento', true), '') <> 'sim' then
    if old.pedido_id is not null and not sou_admin() then raise exception 'Este orçamento já foi fechado e virou o pedido. Ele não muda mais.'; end if;
    new.pedido_id := old.pedido_id; new.fechado_em := old.fechado_em;
  elsif tg_op = 'INSERT' then new.pedido_id := null; new.fechado_em := null;
  end if;
  if new.situacao <> 'nao_concluido' then new.motivo := null; new.motivo_detalhe := null; end if;
  return new;
end $$;

-- 3. CADA UM VÊ E MEXE NOS SEUS ORÇAMENTOS (a administração em todos)
create or replace function posso_mexer_orcamento(oid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select sou_admin() or exists (select 1 from orcamentos o where o.id = oid and o.vendedor_id = auth.uid() and sou_orcamentista())
$$;
drop policy if exists orcamentos_ver on orcamentos;          create policy orcamentos_ver on orcamentos for select to authenticated using (sou_admin() or (sou_orcamentista() and vendedor_id = auth.uid()));
drop policy if exists orcamentos_criar on orcamentos;        create policy orcamentos_criar on orcamentos for insert to authenticated with check (sou_orcamentista() and (vendedor_id = auth.uid() or sou_admin()));
drop policy if exists orcamentos_editar on orcamentos;       create policy orcamentos_editar on orcamentos for update to authenticated using (sou_admin() or (sou_orcamentista() and vendedor_id = auth.uid())) with check (sou_admin() or (sou_orcamentista() and vendedor_id = auth.uid()));
drop policy if exists orcamento_itens_ver on orcamento_itens; create policy orcamento_itens_ver on orcamento_itens for select to authenticated using (posso_mexer_orcamento(orcamento_id));

-- 4. GRAVAR O ORÇAMENTO (cabeçalho, cliente, condições e itens de uma vez)
create or replace function salvar_orcamento(p jsonb) returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare o orcamentos; it jsonb; n int := 0; sit text := coalesce(nullif(p->>'situacao', ''), 'aberto'); mot text := nullif(p->>'motivo', '');
  pr prospects; forma text := coalesce(nullif(p->>'forma_pagamento', ''), 'a_combinar'); dias int[];
  t text := '';
begin
  if not sou_orcamentista() then raise exception 'Você não tem permissão para fazer orçamentos.' using errcode = '42501'; end if;
  if jsonb_typeof(p->'itens') is distinct from 'array' or jsonb_array_length(p->'itens') = 0 then raise exception 'Coloque pelo menos um item no orçamento.'; end if;
  if sit = 'nao_concluido' and mot is null then raise exception 'Escolha o motivo de o orçamento não ter sido fechado.'; end if;
  if sit = 'concluido' and nullif(p->>'id', '') is null then sit := 'aberto'; end if;
  if forma not in ('a_combinar', 'pix', 'boleto') then forma := 'a_combinar'; end if;
  if forma = 'boleto' then
    dias := (select array_agg(distinct x::int order by x::int) from jsonb_array_elements_text(coalesce(p->'boleto_dias', '[]')) x);
    if dias is null then raise exception 'Escolha os dias das parcelas do boleto.'; end if;
  end if;
  if nullif(p->>'prospect_id', '') is not null then select * into pr from prospects where id = (p->>'prospect_id')::uuid; end if;
  if pr.id is null and length(trim(coalesce(p->>'cliente_nome', ''))) < 2 then raise exception 'Informe o nome do cliente.'; end if;
  if nullif(p->>'id', '') is null then
    insert into orcamentos (prospect_id, cliente_nome, ligacao_id, situacao, validade, obs, motivo, motivo_detalhe)
    values (pr.id, coalesce(nullif(left(trim(coalesce(p->>'cliente_nome', '')), 160), ''), pr.loja), nullif(p->>'ligacao_id', '')::uuid, sit, nullif(p->>'validade', '')::date,
            nullif(trim(coalesce(p->>'obs', '')), ''), mot, nullif(trim(coalesce(p->>'motivo_detalhe', '')), ''))
    returning * into o;
  else
    update orcamentos set situacao = sit, validade = nullif(p->>'validade', '')::date, obs = nullif(trim(coalesce(p->>'obs', '')), ''),
           motivo = mot, motivo_detalhe = nullif(trim(coalesce(p->>'motivo_detalhe', '')), '')
     where id = (p->>'id')::uuid returning * into o;
    if o.id is null then raise exception 'Só quem fez o orçamento ou a administração pode alterá-lo.' using errcode = '42501'; end if;
    if o.pedido_id is not null and not sou_admin() then raise exception 'Este orçamento já foi fechado e virou o pedido. Ele não muda mais.'; end if;
    delete from orcamento_itens where orcamento_id = o.id;
  end if;
  update orcamentos set
    cliente_nome = coalesce(nullif(left(trim(coalesce(p->>'cliente_nome', '')), 160), ''), pr.loja),
    cliente_doc = nullif(left(trim(coalesce(p->>'cliente_doc', '')), 40), ''),
    cliente_contato = coalesce(nullif(left(trim(coalesce(p->>'cliente_contato', '')), 120), ''), pr.comprador),
    cliente_telefone = coalesce(nullif(left(regexp_replace(coalesce(p->>'cliente_telefone', ''), '\D', '', 'g'), 20), ''), pr.telefone),
    cliente_email = coalesce(nullif(left(lower(trim(coalesce(p->>'cliente_email', ''))), 160), ''), pr.email),
    cliente_cidade = coalesce(nullif(left(trim(coalesce(p->>'cliente_cidade', '')), 120), ''), case when pr.id is not null then pr.cidade || '/' || pr.uf end),
    forma_pagamento = forma, boleto_dias = dias,
    frete = nullif(left(trim(coalesce(p->>'frete', '')), 120), ''),
    prazo_entrega = nullif(left(trim(coalesce(p->>'prazo_entrega', '')), 120), ''),
    vendedor_contato = nullif(left(trim(coalesce(p->>'vendedor_contato', '')), 120), '')
   where id = o.id returning * into o;
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

-- 5. FECHAR O ORÇAMENTO: vira o pedido de faturamento, com os itens e os preços combinados
create or replace function precificar_item() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare ped pedidos; pr produtos; valor numeric(12,2); adm boolean := sou_admin();
begin
  -- fechamento de orçamento (fechar_orcamento): vale o preço combinado no orçamento, com o código e a descrição dele
  if tg_op = 'INSERT' and coalesce(current_setting('jcn.orcamento_preco', true), '') = 'sim' then return new; end if;
  if new.produto_id is null then
    -- só acontece quando um produto é apagado depois da venda (o item fica como está); ninguém cria item "avulso"
    if tg_op = 'INSERT' and not adm then raise exception 'Escolha um produto do cadastro.'; end if;
    return new;
  end if;
  select * into ped from pedidos where id = new.pedido_id;
  select * into pr from produtos where id = new.produto_id;
  if pr.id is null then raise exception 'Produto não encontrado.'; end if;
  if ped.origem = 'site' and (tg_op = 'INSERT' or not adm) then
    select round(p.valor * (1 + ped.acrescimo / 100), 2) into valor from precos p
      join categorias c on c.id = pr.categoria_id and c.ativa
     where p.produto_id = pr.id and pr.ativo;
    if valor is null then raise exception 'Este produto não está à venda na loja do site.'; end if;
    new.preco_unit := valor;
  elsif not adm then
    if ped.origem = 'ecommerce' then
      select c.preco into valor from catalogo_loja c
       where c.loja_id = ped.vendedor_id and c.produto_id = pr.id and pr.ativo;
      if valor is null then raise exception 'Este produto não está liberado para a loja.'; end if;
    else
      select p.valor into valor from precos p where p.produto_id = pr.id and pr.ativo;
      if valor is null then raise exception 'Este produto ainda não tem preço na tabela.'; end if;
    end if;
    new.preco_unit := valor;
  end if;
  if tg_op = 'INSERT' or new.produto_id is distinct from old.produto_id then
    new.codigo := pr.codigo;
    new.descricao := pr.nome || case
      when pr.grelha = 'ferro' then ', grelha ferro fundido'
      when pr.grelha = 'aco'   then ', grelha aço carbono'
      when pr.cor is not null and exists (select 1 from categorias c where c.id = pr.categoria_id and c.slug = 'colors')
        then ' (' || pr.cor || ')'
      else '' end;
  end if;
  return new;
end $$;

create or replace function fechar_orcamento(p_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare o orcamentos; pr prospects; ped pedidos; forma text := coalesce(nullif(p->>'forma_pagamento', ''), ''); dias int[];
begin
  select * into o from orcamentos where id = p_id for update;
  if o.id is null then raise exception 'Orçamento não encontrado.'; end if;
  if not (sou_admin() or (sou_orcamentista() and o.vendedor_id = auth.uid())) then raise exception 'Só quem fez o orçamento ou a administração pode fechá-lo.' using errcode = '42501'; end if;
  if o.pedido_id is not null then raise exception 'Este orçamento já foi fechado (pedido nº %).', (select numero from pedidos where id = o.pedido_id); end if;
  if not exists (select 1 from orcamento_itens where orcamento_id = o.id) then raise exception 'O orçamento não tem itens.'; end if;
  if exists (select 1 from orcamento_itens where orcamento_id = o.id and preco_unit <= 0) then raise exception 'Há item sem preço no orçamento. Coloque o preço antes de fechar.'; end if;
  if forma not in ('pix', 'boleto') then raise exception 'Escolha a forma de pagamento: PIX ou boleto parcelado.'; end if;
  if forma = 'boleto' then
    dias := (select array_agg(distinct x::int order by x::int) from jsonb_array_elements_text(coalesce(p->'boleto_dias', '[]')) x);
    if dias is null or cardinality(dias) > 12 or not dias <@ array[1, 2, 3, 4, 5, 15, 28, 30, 45, 60, 75, 90] then raise exception 'Escolha os dias das parcelas do boleto.'; end if;
  end if;
  if o.prospect_id is not null then select * into pr from prospects where id = o.prospect_id; end if;
  insert into pedidos (origem, vendedor_id, cliente_nome, cliente_doc, cliente_cidade, cliente_telefone, cliente_email, observacoes, forma_pagamento, boleto_dias, orcamento_id)
  values ('interno', o.vendedor_id, coalesce(o.cliente_nome, pr.loja), o.cliente_doc, coalesce(o.cliente_cidade, case when pr.id is not null then pr.cidade || '/' || pr.uf end),
          coalesce(o.cliente_telefone, pr.telefone), coalesce(o.cliente_email, pr.email),
          left('Orçamento nº ' || o.numero || case when o.prazo_entrega is not null then E'\nPrazo de entrega: ' || o.prazo_entrega else '' end
               || case when o.frete is not null then E'\nFrete: ' || o.frete else '' end || case when o.obs is not null then E'\n' || o.obs else '' end, 2000),
          forma::forma_pagamento, dias, o.id)
  returning * into ped;
  perform set_config('jcn.orcamento_preco', 'sim', true);
  insert into itens_pedido (pedido_id, produto_id, codigo, descricao, quantidade, preco_unit)
  select ped.id, i.produto_id, i.codigo, i.descricao, i.quantidade, i.preco_unit from orcamento_itens i where i.orcamento_id = o.id order by i.ordem;
  perform set_config('jcn.orcamento_preco', '', true);
  perform set_config('jcn.fechando_orcamento', 'sim', true);
  update orcamentos set situacao = 'concluido', pedido_id = ped.id, fechado_em = now(), forma_pagamento = forma, boleto_dias = dias where id = o.id;
  perform set_config('jcn.fechando_orcamento', '', true);
  return jsonb_build_object('pedido_id', ped.id, 'numero', ped.numero);
end $$;
revoke all on function fechar_orcamento(uuid, jsonb) from public, anon;
grant execute on function fechar_orcamento(uuid, jsonb) to authenticated;

-- 6. CONFERÊNCIA: deve mostrar 2 funções e 1 coluna
select (select count(*) from pg_proc where proname in ('fechar_orcamento', 'sou_orcamentista')) as funcoes,
       (select count(*) from information_schema.columns where table_name = 'pedidos' and column_name = 'orcamento_id') as coluna;
