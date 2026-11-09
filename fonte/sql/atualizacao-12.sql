-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 12 DO BANCO: EDITAR USUÁRIOS, CANCELAR E APAGAR PEDIDOS,
-- PRODUTOS E VALORES DO REPRESENTANTE
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez. Precisa das atualizações 1 a 11.
--  * A administração troca o e-mail de login de um usuário (o resto do cadastro ela já podia alterar).
--  * Pedido cancelado: fica na lista, marcado, e sai das contas do financeiro. Só a administração cancela,
--    desfaz o cancelamento ou apaga. Apagar um pedido que veio de orçamento devolve o orçamento para "Em aberto".
--  * Representante com produtos escolhidos: vê só esses produtos, pelos valores definidos pela administração
--    (igual às contas de e-commerce). No orçamento ele pode cobrar mais do cliente, nunca menos.
--    Representante sem nenhum produto escolhido continua com a Tabela de preços inteira.
-- =====================================================================

-- 1. TROCAR O E-MAIL DE LOGIN (só a administração; lojas de e-commerce entram pelo login, não pelo e-mail)
create or replace function definir_email(p_usuario uuid, p_email text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare alvo perfis; e text := lower(trim(coalesce(p_email, '')));
begin
  if not sou_admin() then raise exception 'Só a administração troca o e-mail de um usuário.' using errcode = '42501'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Informe um e-mail válido.'; end if;
  select * into alvo from perfis where id = p_usuario;
  if alvo.id is null then raise exception 'Conta não encontrada.'; end if;
  if alvo.papel = 'ecommerce' then raise exception 'A loja de e-commerce entra pelo login. Altere em Contas e-commerce.'; end if;
  if exists (select 1 from auth.users where lower(email) = e and id <> p_usuario) then raise exception 'Já existe um usuário com este e-mail.'; end if;
  update auth.users set email = e, updated_at = now() where id = p_usuario;
  if not found then raise exception 'Acesso não encontrado.'; end if;
  begin
    update auth.identities set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(e)), updated_at = now()
     where user_id = p_usuario and provider = 'email';
  exception when others then null;        -- se o Supabase mudar esta tabela, a troca continua valendo para o login
  end;
  update perfis set email = e where id = p_usuario;
end $$;
revoke all on function definir_email(uuid, text) from public, anon;
grant execute on function definir_email(uuid, text) to authenticated;

-- 2. PRODUTOS E VALORES DO REPRESENTANTE (na mesma tabela das lojas de e-commerce)
create or replace function rep_com_catalogo(p_uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from perfis r where r.id = p_uid and r.papel = 'representante')
     and exists (select 1 from catalogo_loja c where c.loja_id = p_uid)
$$;
revoke all on function rep_com_catalogo(uuid) from public, anon;
grant execute on function rep_com_catalogo(uuid) to authenticated;

drop policy if exists catalogo_loja_ver on catalogo_loja;
create policy catalogo_loja_ver on catalogo_loja for select to authenticated
  using (sou_admin() or (sou_loja() and loja_id = auth.uid()) or (coalesce(meu_papel()::text = 'representante', false) and loja_id = auth.uid()));
-- representante com produtos escolhidos não lê a tabela da JCN (vê os valores dele em catalogo_loja)
drop policy if exists precos_internos on precos;
create policy precos_internos on precos for select to authenticated
  using (sou_interno() and not rep_com_catalogo(auth.uid()));

-- item do orçamento de um representante com produtos escolhidos: só produto liberado, e nunca abaixo do valor dele
create or replace function conferir_item_orc_rep() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid; minimo numeric;
begin
  if sou_admin() then return new; end if;
  select vendedor_id into v from orcamentos where id = new.orcamento_id;
  if v is null or not rep_com_catalogo(v) then return new; end if;
  select c.preco into minimo from catalogo_loja c join produtos p on p.id = c.produto_id and p.ativo
   where c.loja_id = v and c.produto_id = new.produto_id;
  if minimo is null then raise exception '"%" não está entre os produtos liberados para você.', new.descricao; end if;
  if new.preco_unit < minimo then raise exception 'O valor de "%" não pode ficar abaixo de R$ %.', new.descricao, replace(to_char(minimo, 'FM999G999G990D00'), ',', '.'); end if;
  return new;
end $$;
drop trigger if exists orcamento_itens_rep on orcamento_itens;
create trigger orcamento_itens_rep before insert or update on orcamento_itens for each row execute function conferir_item_orc_rep();

create or replace function precificar_item() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare ped pedidos; pr produtos; valor numeric(12,2); adm boolean := sou_admin();
begin
  select * into ped from pedidos where id = new.pedido_id;
  -- fechamento de orçamento (fechar_orcamento): vale o preço combinado no orçamento, com o código e a descrição dele
  if tg_op = 'INSERT' and coalesce(current_setting('jcn.orcamento_preco', true), '') = 'sim' then
    if not adm and rep_com_catalogo(ped.vendedor_id) then
      select c.preco into valor from catalogo_loja c join produtos p on p.id = c.produto_id and p.ativo
       where c.loja_id = ped.vendedor_id and c.produto_id = new.produto_id;
      if valor is null then raise exception '"%" não está entre os produtos liberados para você.', new.descricao; end if;
      if new.preco_unit < valor then raise exception 'O valor de "%" está abaixo do liberado para você. Atualize o orçamento antes de fechar.', new.descricao; end if;
    end if;
    return new;
  end if;
  if new.produto_id is null then
    -- só acontece quando um produto é apagado depois da venda (o item fica como está); ninguém cria item "avulso"
    if tg_op = 'INSERT' and not adm then raise exception 'Escolha um produto do cadastro.'; end if;
    return new;
  end if;
  select * into pr from produtos where id = new.produto_id;
  if pr.id is null then raise exception 'Produto não encontrado.'; end if;
  if ped.origem = 'site' and (tg_op = 'INSERT' or not adm) then
    select round(p.valor * (1 + ped.acrescimo / 100), 2) into valor from precos p
      join categorias c on c.id = pr.categoria_id and c.ativa
     where p.produto_id = pr.id and pr.ativo;
    if valor is null then raise exception 'Este produto não está à venda na loja do site.'; end if;
    new.preco_unit := valor;
  elsif not adm then
    if ped.origem = 'ecommerce' or rep_com_catalogo(ped.vendedor_id) then
      select c.preco into valor from catalogo_loja c
       where c.loja_id = ped.vendedor_id and c.produto_id = pr.id and pr.ativo;
      if valor is null then raise exception 'Este produto não está liberado para %.', case when ped.origem = 'ecommerce' then 'a loja' else 'você' end; end if;
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

-- 3. PEDIDO CANCELADO
alter table pedidos add column if not exists cancelado_em timestamptz;
alter table pedidos add column if not exists cancelado_por uuid references perfis (id) on delete set null;
alter table pedidos add column if not exists cancelado_motivo text check (length(cancelado_motivo) <= 300);

create or replace function guardar_cancelamento() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare fora text[] := array['cancelado_em', 'cancelado_por', 'cancelado_motivo'];
begin
  if tg_op = 'INSERT' then
    new.cancelado_em := null; new.cancelado_por := null; new.cancelado_motivo := null;
    return new;
  end if;
  if (new.cancelado_em is null) is distinct from (old.cancelado_em is null) or new.cancelado_motivo is distinct from old.cancelado_motivo then
    if not sou_admin() then raise exception 'Só a administração cancela um pedido ou desfaz o cancelamento.' using errcode = '42501'; end if;
  end if;
  if old.cancelado_em is not null and new.cancelado_em is not null
     and (to_jsonb(new) - fora) is distinct from (to_jsonb(old) - fora) then
    raise exception 'O pedido nº % está cancelado. Desfaça o cancelamento antes de alterá-lo.', old.numero;
  end if;
  if new.cancelado_em is null then
    new.cancelado_por := null; new.cancelado_motivo := null;
  elsif old.cancelado_em is null then
    new.cancelado_em := now(); new.cancelado_por := auth.uid(); new.cancelado_motivo := nullif(left(trim(coalesce(new.cancelado_motivo, '')), 300), '');
  else
    new.cancelado_em := old.cancelado_em; new.cancelado_por := old.cancelado_por;
  end if;
  return new;
end $$;
drop trigger if exists pedidos_cancelamento on pedidos;
create trigger pedidos_cancelamento before insert or update on pedidos for each row execute function guardar_cancelamento();

-- comprovante ou etiqueta nova não entra em pedido cancelado
create or replace function anexo_em_cancelado() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from pedidos where id = new.pedido_id and cancelado_em is not null) then
    raise exception 'Este pedido está cancelado: não recebe comprovante nem etiqueta.';
  end if;
  return new;
end $$;
drop trigger if exists anexos_cancelado on anexos;
create trigger anexos_cancelado before insert on anexos for each row execute function anexo_em_cancelado();

-- 4. APAGAR O PEDIDO: o orçamento de onde ele veio volta para "Em aberto"
create or replace function reabrir_orcamento_do_pedido() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform set_config('jcn.fechando_orcamento', 'sim', true);
  update orcamentos set pedido_id = null, fechado_em = null, situacao = 'aberto' where pedido_id = old.id;
  perform set_config('jcn.fechando_orcamento', '', true);
  return old;
end $$;
drop trigger if exists pedidos_apagar_orcamento on pedidos;
create trigger pedidos_apagar_orcamento before delete on pedidos for each row execute function reabrir_orcamento_do_pedido();

-- 5. AVISO NO TELEGRAM QUANDO UM PEDIDO É CANCELADO (o resto igual à atualização 5)
create or replace function tg_pedido_mudou() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare tot numeric; resp uuid;
begin
  select total into tot from pedidos_totais where id = new.id;
  resp := case when new.origem = 'ecommerce' then (select vendedor_id from perfis where id = new.vendedor_id) else new.vendedor_id end;
  if new.cancelado_em is not null and old.cancelado_em is null then
    perform tg_avisar('vendas', '❌ <b>Pedido nº ' || new.numero || ' cancelado</b>' || E'\nCliente: ' || tg_esc(new.cliente_nome) || E'\nTotal: ' || tg_brl(tot)
      || case when new.cancelado_motivo is not null then E'\nMotivo: ' || tg_esc(new.cancelado_motivo) else '' end);
    if new.forma_pagamento = 'boleto' then
      perform tg_avisar('financeiro', '❌ Pedido nº ' || new.numero || ' (' || tg_esc(new.cliente_nome) || ') foi <b>cancelado</b>. O boleto sai das contas.');
    end if;
    if resp is not null and resp is distinct from auth.uid() then
      perform tg_avisar(null, '❌ O seu pedido nº ' || new.numero || ' (' || tg_esc(new.cliente_nome) || ') foi cancelado pela administração.'
        || case when new.cancelado_motivo is not null then E'\nMotivo: ' || tg_esc(new.cancelado_motivo) else '' end, null, now(), resp);
    end if;
    return null;
  end if;
  if new.cancelado_em is not null then return null; end if;
  if new.pix_status = 'em_analise' and old.pix_status is distinct from 'em_analise' and new.forma_pagamento = 'pix' then
    perform tg_avisar('financeiro', '💳 <b>PIX para conferir</b> · pedido nº ' || new.numero || E'\nCliente: ' || tg_esc(new.cliente_nome) || E'\nTotal: ' || tg_brl(tot));
  end if;
  if new.forma_pagamento = 'boleto' and new.boleto_status = 'pendente' and (old.boleto_status is distinct from 'pendente') then
    perform tg_avisar('financeiro', '📄 <b>Boleto para aprovar</b> · pedido nº ' || new.numero || E'\nCliente: ' || tg_esc(new.cliente_nome) || E'\nTotal: ' || tg_brl(tot)
      || ' (' || array_to_string(new.boleto_dias, '/') || ' dias)');
  end if;
  if (new.pix_status = 'verificado' and old.pix_status <> 'verificado') or (new.boleto_status = 'aprovado' and old.boleto_status is distinct from 'aprovado') then
    perform tg_avisar('vendas', '✅ <b>Pagamento confirmado</b> · pedido nº ' || new.numero || E'\nCliente: ' || tg_esc(new.cliente_nome) || E'\nTotal: ' || tg_brl(tot)
      || case when new.boleto_status = 'aprovado' then E'\nBoleto aprovado pelo financeiro' else E'\nPIX conferido' end);
    if resp is not null then perform tg_avisar(null, '✅ O pagamento do seu pedido nº ' || new.numero || ' (' || tg_esc(new.cliente_nome) || ') foi confirmado.', null, now(), resp); end if;
  end if;
  if (new.pix_status = 'recusado' and old.pix_status <> 'recusado') or (new.boleto_status = 'recusado' and old.boleto_status is distinct from 'recusado') then
    if resp is not null then
      perform tg_avisar_pessoa(resp, 'vendas', '⚠️ <b>' || case when new.boleto_status = 'recusado' then 'Boleto recusado' else 'Comprovante de PIX recusado' end || '</b> · pedido nº ' || new.numero
        || E'\nCliente: ' || tg_esc(new.cliente_nome) || case when new.boleto_motivo is not null then E'\nMotivo: ' || tg_esc(new.boleto_motivo) else '' end);
    end if;
  end if;
  if new.envio_status = 'enviado' and old.envio_status <> 'enviado' then
    perform tg_avisar('vendas', '🚚 Pedido nº ' || new.numero || ' (' || tg_esc(new.cliente_nome) || ') foi <b>enviado</b>.');
  end if;
  return null;
end $$;

-- 6. CONFERÊNCIA: deve mostrar 3 funções e 3 colunas
select (select count(*) from pg_proc where proname in ('definir_email', 'rep_com_catalogo', 'guardar_cancelamento')) as funcoes,
       (select count(*) from information_schema.columns where table_name = 'pedidos' and column_name like 'cancelado%') as colunas;
