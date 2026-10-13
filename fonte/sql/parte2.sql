
-- 2. O PREÇO DE TABELA NUNCA VAI PARA O VISITANTE NEM PARA AS LOJAS
-- O site mostra só o preço da loja (visão "vitrine": tabela + acréscimo).
-- O percentual do acréscimo fica só com a equipe interna; a loja de e-commerce lê apenas a chave PIX.
drop policy if exists precos_site on precos;
drop policy if exists configuracoes_ver on configuracoes;
create policy configuracoes_ver on configuracoes for select to authenticated
  using (sou_interno() or (sou_loja() and chave = 'pix'));

-- 3. ARQUIVOS PRIVADOS (comprovantes e etiquetas)
-- Quem enviou é reconhecido pela coluna atual do Storage (owner_id).
-- Comprovante registrado num pedido não pode mais ser apagado nem trocado por quem enviou;
-- etiqueta, só enquanto o pedido não saiu para a expedição.
drop policy if exists privados_ler on storage.objects;
create policy privados_ler on storage.objects for select to authenticated using (
  bucket_id = 'vendas'
  and (sou_admin()
       or (meu_papel() is not null and owner_id = auth.uid()::text)
       or exists (select 1 from anexos a where a.bucket = bucket_id and a.caminho = name))
);
drop policy if exists privados_apagar on storage.objects;
create policy privados_apagar on storage.objects for delete to authenticated using (
  bucket_id = 'vendas'
  and (sou_admin()
       or (meu_papel() is not null and owner_id = auth.uid()::text
           and not exists (select 1 from anexos a join pedidos p on p.id = a.pedido_id
                           where a.bucket = bucket_id and a.caminho = name
                             and (a.tipo = 'comprovante_pix' or p.envio_status <> 'aguardando_pagamento'))))
);
drop policy if exists vendas_enviar on storage.objects;
create policy vendas_enviar on storage.objects for insert to authenticated with check (
  bucket_id = 'vendas' and meu_papel() in ('admin', 'vendedor', 'representante', 'ecommerce')
  and (storage.foldername(name))[1] = 'pedidos'
  and exists (select 1 from pedidos p where p.id::text = (storage.foldername(name))[2]
              and (sou_admin() or (p.vendedor_id = auth.uid() and p.envio_status <> 'enviado')))   -- só no próprio pedido, antes do envio
);
-- o vendedor também retira a etiqueta que ele mesmo anexou, enquanto o pedido não saiu para a expedição
drop policy if exists anexos_apagar on anexos;
create policy anexos_apagar on anexos for delete to authenticated
  using (sou_admin()
      or (enviado_por = auth.uid() and meu_papel() in ('vendedor', 'ecommerce') and tipo = 'etiqueta_envio'
          and exists (select 1 from pedidos p where p.id = pedido_id
                      and p.envio_status = 'aguardando_pagamento')));
-- o anexo sempre aponta para a pasta do próprio pedido
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'anexos_caminho_do_pedido') then
    alter table anexos add constraint anexos_caminho_do_pedido
      check (caminho like 'pedidos/' || pedido_id::text || '/%' or caminho like 'site/%');
  end if;
end $$;

-- 4. LOGINS E SENHAS
-- O login nasce pelo cadastro oficial do Supabase Auth (a senha é guardada embaralhada, nunca em texto).
-- As funções abaixo cobrem o que o painel precisa e o cadastro oficial não faz sozinho.

-- a) a loja entra com o login; o site pergunta ao banco qual é o endereço interno daquele login
create or replace function email_do_login(p_login text) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select email from perfis where papel = 'ecommerce' and ativo and login = lower(trim(p_login))
$$;

-- b) trocar a senha de outra pessoa: a administração troca a de qualquer conta;
--    o vendedor, só a das lojas de e-commerce dele. Derruba as sessões abertas da conta.
create or replace function definir_senha(p_usuario uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare alvo perfis;
begin
  if auth.uid() is null then raise exception 'Entre com a sua conta.' using errcode = '42501'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha precisa de pelo menos 8 caracteres.'; end if;
  select * into alvo from perfis where id = p_usuario;
  if alvo.id is null then raise exception 'Conta não encontrada.'; end if;
  if not (sou_admin() or (meu_papel() = 'vendedor' and alvo.papel = 'ecommerce' and alvo.vendedor_id = auth.uid())) then
    raise exception 'Você não tem permissão para trocar esta senha.' using errcode = '42501';
  end if;
  update auth.users set encrypted_password = crypt(p_senha, gen_salt('bf', 10)), updated_at = now() where id = p_usuario;
  if not found then raise exception 'Acesso não encontrado.'; end if;
  begin
    delete from auth.sessions where user_id = p_usuario and p_usuario <> auth.uid();
  exception when others then null;       -- se o Supabase mudar esta tabela, a troca de senha continua valendo
  end;
end $$;

-- c) e-mail que já tem um login "solto" (alguém se cadastrou sozinho, ou um cadastro parou no meio):
--    o painel NUNCA aproveita esse login. Esta função apaga o login solto (só se ele não tiver conta)
--    e o painel cria outro, novo, com a senha escolhida. Quem tinha o login antigo fica sem acesso.
drop function if exists retomar_acesso(text, text);
create or replace function liberar_email(p_email text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if coalesce(meu_papel() in ('admin', 'vendedor'), false) is not true then
    raise exception 'Você não tem permissão para criar acessos.' using errcode = '42501';
  end if;
  if exists (select 1 from auth.users u join perfis p on p.id = u.id where lower(u.email) = lower(trim(p_email)))
     or exists (select 1 from perfis p where lower(p.email) = lower(trim(p_email))) then
    raise exception 'Já existe uma conta com este login ou e-mail.' using errcode = '23505';
  end if;
  delete from auth.users u where lower(u.email) = lower(trim(p_email)) and not exists (select 1 from perfis p where p.id = u.id);
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function email_do_login(text), definir_senha(uuid, text), liberar_email(text) from public, anon;
grant execute on function email_do_login(text) to anon, authenticated;
grant execute on function definir_senha(uuid, text), liberar_email(text) to authenticated;

-- 5. PEDIDOS: O QUE É DO SERVIDOR NÃO VEM DO NAVEGADOR
-- a) pedido novo: número, data e chave são sempre dados pelo banco
alter table pedidos alter column numero drop default;
create or replace function preparar_pedido() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.numero := nextval('pedido_numero_seq');
  new.chave_cliente := gen_random_uuid();
  new.pix_conferido_por := null; new.pix_conferido_em := null;
  if not sou_admin() then new.criado_em := now(); end if;
  if new.forma_pagamento = 'boleto' then
    new.boleto_dias := (select array_agg(distinct d order by d) from unnest(new.boleto_dias) d);
    new.boleto_status := 'pendente';
  else
    new.boleto_dias := null; new.boleto_status := null;
  end if;
  new.boleto_decidido_por := null; new.boleto_decidido_em := null; new.boleto_motivo := null;
  return new;
end $$;

-- b) item de pedido: sempre de um produto do cadastro, com o valor posto pelo banco
--    (e-commerce: valor liberado para a loja; venda interna: tabela; loja do site: tabela + acréscimo do pedido)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'itens_pedido_quantidade_max') then
    alter table itens_pedido add constraint itens_pedido_quantidade_max check (quantidade <= 9999);
  end if;
end $$;
create or replace function precificar_item() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare ped pedidos; pr produtos; valor numeric(12,2); adm boolean := sou_admin();
begin
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

drop policy if exists itens_pedido_criar on itens_pedido;
create policy itens_pedido_criar on itens_pedido for insert to authenticated
  with check (exists (select 1 from pedidos p where p.id = pedido_id
                      and (sou_admin() or (p.vendedor_id = auth.uid()
                                           and p.pix_status = 'sem_comprovante'
                                           and p.envio_status = 'aguardando_pagamento'
                                           and p.boleto_status is distinct from 'aprovado'))));

-- c) lançar o pedido inteiro de uma vez: ou entra com todos os itens, ou não entra nada.
--    A função roda com os direitos de quem chama: todas as regras acima continuam valendo.
create or replace function lancar_pedido(p_pedido jsonb, p_itens jsonb) returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare ped pedidos; boleto boolean := (p_pedido->>'forma_pagamento') = 'boleto';
begin
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) not between 1 and 200 then
    raise exception 'O pedido precisa de pelo menos um item.';
  end if;
  if length(trim(coalesce(p_pedido->>'cliente_nome', ''))) < 2 then raise exception 'Informe o nome do cliente.'; end if;
  insert into pedidos (origem, vendedor_id, cliente_nome, cliente_doc, cliente_cidade, observacoes, forma_pagamento, boleto_dias)
  values ((p_pedido->>'origem')::origem_pedido, auth.uid(), left(trim(p_pedido->>'cliente_nome'), 160),
          nullif(left(trim(coalesce(p_pedido->>'cliente_doc', '')), 40), ''), nullif(left(trim(coalesce(p_pedido->>'cliente_cidade', '')), 120), ''),
          nullif(left(trim(coalesce(p_pedido->>'observacoes', '')), 2000), ''),
          case when boleto then 'boleto' else 'pix' end::forma_pagamento,
          case when boleto then array(select x::int from jsonb_array_elements_text(p_pedido->'boleto_dias') x) end)
  returning * into ped;
  insert into itens_pedido (pedido_id, produto_id, quantidade, preco_unit)
  select ped.id, (x->>'produto_id')::uuid, (x->>'quantidade')::int, coalesce((x->>'preco_unit')::numeric, 0)   -- o valor só é aceito da administração; para os demais o gatilho põe o da tabela
    from jsonb_array_elements(p_itens) x;
  return jsonb_build_object('id', ped.id, 'numero', ped.numero);
end $$;
revoke all on function lancar_pedido(jsonb, jsonb) from public, anon;
grant execute on function lancar_pedido(jsonb, jsonb) to authenticated;

-- d) depois de lançado, quem vendeu só troca a forma de pagamento e os prazos do boleto.
--    Cliente, endereço, data, situação do PIX e expedição só mudam pelas mãos da administração
--    (o PIX vai sozinho para "em análise" quando chega um comprovante novo).
create or replace function validar_pedido() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare adm boolean := sou_admin(); direto boolean := pg_trigger_depth() = 1;
begin
  if not adm then
    if (new.id, new.numero, new.origem, new.vendedor_id, new.cliente_nome, new.cliente_doc, new.cliente_cidade, new.cliente_telefone,
        new.cliente_email, new.entrega, new.acrescimo, new.chave_cliente, new.observacoes, new.criado_em)
       is distinct from
       (old.id, old.numero, old.origem, old.vendedor_id, old.cliente_nome, old.cliente_doc, old.cliente_cidade, old.cliente_telefone,
        old.cliente_email, old.entrega, old.acrescimo, old.chave_cliente, old.observacoes, old.criado_em) then
      raise exception 'Só a administração altera estes dados do pedido.';
    end if;
    if new.envio_status is distinct from old.envio_status then raise exception 'Só a administração altera a expedição.'; end if;
    if new.pix_status is distinct from old.pix_status
       and (direto or new.pix_status <> 'em_analise' or old.pix_status = 'verificado') then
      raise exception 'Só a administração confere o PIX.';
    end if;
    if direto then new.pix_conferido_por := old.pix_conferido_por; new.pix_conferido_em := old.pix_conferido_em; end if;
  end if;
  if new.pix_status is distinct from old.pix_status and new.pix_status in ('verificado', 'recusado') then
    new.pix_conferido_por := auth.uid(); new.pix_conferido_em := now();
  end if;
  -- boleto: só o financeiro (administração) aprova ou recusa; o vendedor pode pedir nova análise
  -- de um boleto recusado ou trocar o pedido para PIX enquanto o boleto não foi aprovado
  if new.forma_pagamento = 'boleto' and old.forma_pagamento = 'pix' and not adm and old.pix_status <> 'sem_comprovante' then
    raise exception 'Este pedido já tem comprovante de PIX.';
  end if;
  if new.forma_pagamento = 'boleto' then
    new.boleto_dias := (select array_agg(distinct d order by d) from unnest(new.boleto_dias) d);
    if old.forma_pagamento = 'pix' then new.boleto_status := 'pendente'; end if;
    if new.boleto_status is distinct from old.boleto_status and old.forma_pagamento = 'boleto' then
      if new.boleto_status in ('aprovado', 'recusado') or old.boleto_status = 'aprovado' then
        if not adm then raise exception 'Só o financeiro aprova ou recusa o boleto.'; end if;
      end if;
      if new.boleto_status = 'recusado' and old.envio_status <> 'aguardando_pagamento' then
        raise exception 'O pedido já saiu para a expedição.';
      end if;
      if new.boleto_status in ('aprovado', 'recusado') then
        new.boleto_decidido_por := auth.uid(); new.boleto_decidido_em := now();
        if new.boleto_status = 'aprovado' then new.boleto_motivo := null; end if;
      end if;
    end if;
    if not adm and old.boleto_status = 'aprovado' and new.boleto_dias is distinct from old.boleto_dias then
      raise exception 'O boleto já foi aprovado: os prazos não mudam mais.';
    end if;
    if not adm and old.forma_pagamento = 'boleto' then        -- quem decidiu, quando e o motivo são do financeiro
      new.boleto_decidido_por := old.boleto_decidido_por; new.boleto_decidido_em := old.boleto_decidido_em; new.boleto_motivo := old.boleto_motivo;
    end if;
  else
    if old.forma_pagamento = 'boleto' and old.boleto_status = 'aprovado' and not adm then
      raise exception 'O boleto já foi aprovado: a forma de pagamento não muda mais.';
    end if;
    new.boleto_dias := null; new.boleto_status := null; new.boleto_decidido_por := null; new.boleto_decidido_em := null; new.boleto_motivo := null;
  end if;
  if new.envio_status is distinct from old.envio_status then
    if new.envio_status <> 'aguardando_pagamento' and not (
         (new.forma_pagamento = 'pix' and new.pix_status = 'verificado')
         or (new.forma_pagamento = 'boleto' and new.boleto_status = 'aprovado')) then
      raise exception 'A expedição só é liberada com o PIX verificado ou o boleto aprovado.';
    end if;
    if new.envio_status = 'enviado' and not exists
       (select 1 from anexos a where a.pedido_id = new.id and a.tipo = 'etiqueta_envio') then
      raise exception 'Anexe a etiqueta de envio antes de marcar como enviado.';
    end if;
  end if;
  return new;
end $$;

-- 6. LOJA DO SITE: LIMITES CONTRA ABUSO
-- Quantidade de 1 a 999 por item, textos com tamanho máximo, no máximo 5 pedidos em aberto por CPF/CNPJ
-- e 300 pedidos do site por dia (acima disso a loja pede para falar pelo WhatsApp).
create or replace function criar_pedido_site(p_cliente jsonb, p_itens jsonb)
returns table (numero bigint, chave uuid, total numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb; ped pedidos; it jsonb; e jsonb := p_cliente->'entrega'; ent jsonb; q int;
  so_num constant text := '\D'; doc text := regexp_replace(coalesce(p_cliente->>'documento', ''), '\D', '', 'g');
begin
  select valor into cfg from configuracoes where configuracoes.chave = 'loja_site';
  if cfg is null or not (cfg->>'ativa')::boolean then raise exception 'A loja do site está fechada.'; end if;
  if length(trim(coalesce(p_cliente->>'nome', ''))) not between 5 and 160 then raise exception 'Informe o nome completo ou a razão social.'; end if;
  if length(doc) not in (11, 14) then raise exception 'O CPF tem 11 números e o CNPJ tem 14.'; end if;
  if length(regexp_replace(coalesce(p_cliente->>'telefone', ''), so_num, '', 'g')) not between 10 and 11 then raise exception 'Informe o WhatsApp com DDD.'; end if;
  if e is null or length(regexp_replace(coalesce(e->>'cep', ''), so_num, '', 'g')) <> 8
     or trim(coalesce(e->>'rua', '')) = '' or trim(coalesce(e->>'numero', '')) = '' or trim(coalesce(e->>'cidade', '')) = '' or length(coalesce(e->>'uf', '')) <> 2 then
    raise exception 'Informe o endereço de entrega completo, com CEP.';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) not between 1 and 50 then raise exception 'A sacola está vazia.'; end if;
  if (select count(*) from pedidos p where p.origem = 'site' and p.pix_status <> 'verificado' and p.criado_em > now() - interval '7 days'
        and regexp_replace(coalesce(p.cliente_doc, ''), so_num, '', 'g') = doc) >= 5 then
    raise exception 'Já existem pedidos em aberto neste CPF ou CNPJ. Fale com a JCN pelo WhatsApp para continuar.';
  end if;
  if (select count(*) from pedidos p where p.origem = 'site' and p.criado_em > now() - interval '1 day') >= 300 then
    raise exception 'A loja recebeu muitos pedidos hoje. Fale com a JCN pelo WhatsApp para fechar a sua compra.';
  end if;
  ent := jsonb_build_object('cep', left(e->>'cep', 10), 'rua', left(trim(e->>'rua'), 160), 'numero', left(trim(e->>'numero'), 20),
    'complemento', left(trim(coalesce(e->>'complemento', '')), 80), 'bairro', left(trim(coalesce(e->>'bairro', '')), 80),
    'cidade', left(trim(e->>'cidade'), 80), 'uf', upper(e->>'uf'));
  insert into pedidos (origem, vendedor_id, cliente_nome, cliente_doc, cliente_cidade, cliente_telefone, cliente_email, entrega, acrescimo, observacoes)
  values ('site', null, trim(p_cliente->>'nome'), left(p_cliente->>'documento', 20), (ent->>'cidade') || ', ' || (ent->>'uf'), left(p_cliente->>'telefone', 20),
          nullif(left(trim(coalesce(p_cliente->>'email', '')), 160), ''), ent, (cfg->>'acrescimo')::numeric, nullif(left(trim(coalesce(p_cliente->>'observacoes', '')), 1000), ''))
  returning * into ped;
  for it in select * from jsonb_array_elements(p_itens) loop
    q := (it->>'quantidade')::int;
    if q is null or q not between 1 and 999 then raise exception 'A quantidade de cada item vai de 1 a 999.'; end if;
    -- o gatilho precificar_item põe o valor (tabela + acréscimo), a descrição e o código
    insert into itens_pedido (pedido_id, produto_id, quantidade, preco_unit)
    values (ped.id, (it->>'produto_id')::uuid, q, 0);
  end loop;
  return query select ped.numero, ped.chave_cliente, t.total from pedidos_totais t where t.id = ped.id;
end $$;

-- o Storage só aceita o arquivo do consumidor na pasta do próprio pedido, enquanto o PIX não foi conferido,
-- por até 15 dias e com no máximo 5 arquivos por pedido
create or replace function pedido_site_aceita_comprovante(p_chave text) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare ped pedidos; n int := 0;
begin
  select * into ped from pedidos p where p.origem = 'site' and p.chave_cliente::text = p_chave;
  if ped.id is null or ped.pix_status = 'verificado' or ped.criado_em < now() - interval '15 days' then return false; end if;
  if (select count(*) from anexos a where a.pedido_id = ped.id) >= 5 then return false; end if;
  begin
    select count(*) into n from storage.objects o where o.bucket_id = 'vendas' and o.name like 'site/' || p_chave || '/%';
  exception when others then n := 0;
  end;
  return n < 5;
end $$;

create or replace function anexar_comprovante_site(p_numero bigint, p_chave uuid, p_caminho text, p_nome text, p_mime text, p_tamanho bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ped pedidos;
begin
  select * into ped from pedidos where origem = 'site' and numero = p_numero and chave_cliente = p_chave;
  if ped.id is null then raise exception 'Pedido não encontrado.'; end if;
  if ped.pix_status = 'verificado' then raise exception 'O pagamento deste pedido já foi conferido.'; end if;
  if p_caminho not like 'site/' || p_chave::text || '/%' or length(p_caminho) > 300 then raise exception 'Arquivo fora da pasta do pedido.'; end if;
  if p_mime not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then raise exception 'Envie o comprovante em imagem ou PDF.'; end if;
  if (select count(*) from anexos a where a.pedido_id = ped.id) >= 5 then raise exception 'Este pedido já tem comprovantes demais. Fale com a JCN pelo WhatsApp.'; end if;
  insert into anexos (tipo, bucket, caminho, nome_original, mime, tamanho_bytes, pedido_id, enviado_por)
  values ('comprovante_pix', 'vendas', p_caminho, left(coalesce(p_nome, 'comprovante'), 120), p_mime, greatest(0, least(coalesce(p_tamanho, 0), 10485760)), ped.id, null);
end $$;

revoke all on function criar_pedido_site(jsonb, jsonb), pedido_site_aceita_comprovante(text), anexar_comprovante_site(bigint, uuid, text, text, text, bigint) from public;
grant execute on function criar_pedido_site(jsonb, jsonb), pedido_site_aceita_comprovante(text), anexar_comprovante_site(bigint, uuid, text, text, text, bigint) to anon, authenticated;

-- 7. CONFERÊNCIA (o resultado aparece embaixo, na aba Results: os três números devem ser maiores que zero)
select (select count(*) from fotos_produto) as fotos_cadastradas,
       (select count(*) from pg_proc where proname in ('email_do_login', 'definir_senha', 'liberar_email', 'lancar_pedido')) as funcoes_novas,
       (select count(*) from pg_policies where policyname in ('configuracoes_ver', 'privados_apagar', 'vendas_enviar', 'itens_pedido_criar')) as regras_atualizadas;
