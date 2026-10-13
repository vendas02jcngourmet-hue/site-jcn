-- =====================================================================
-- JCN Gourmet — banco de dados (Supabase / PostgreSQL)
-- Rode no SQL Editor do Supabase, em um projeto novo.
-- Cobre: perfis e permissões, catálogo (CMS), tabela de preços única,
-- fogões com opção de grelha (ferro fundido ou aço carbono, um código
-- para cada), contas de e-commerce com produtos e valores liberados por
-- loja, forno avulso como opcional do fogão, loja do site para o consumidor
-- final (tabela + acréscimo, sem login), pedidos com PIX e etiquetas,
-- boleto parcelado aprovado pelo financeiro, visões do financeiro,
-- anexos e Storage. (A área do fornecedor foi retirada do projeto.)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- tipos ----------
-- vendedor: lança pedidos e cuida das contas de e-commerce dele (login, produtos e valores).
-- representante: entra pelo mesmo portal de vendas, mas só lança pedidos; não altera nada.
create type papel_usuario    as enum ('admin', 'vendedor', 'representante', 'ecommerce');
create type origem_pedido    as enum ('interno', 'ecommerce', 'site');   -- site = consumidor final, sem login
create type tipo_grelha      as enum ('ferro', 'aco');        -- ferro fundido ou aço carbono
create type status_pix       as enum ('sem_comprovante', 'em_analise', 'verificado', 'recusado');
create type forma_pagamento  as enum ('pix', 'boleto');
create type status_boleto    as enum ('pendente', 'aprovado', 'recusado');   -- quem decide é o financeiro (administração)
create type status_envio     as enum ('aguardando_pagamento', 'em_expedicao', 'enviado');
create type tipo_anexo       as enum ('comprovante_pix', 'etiqueta_envio');

-- =====================================================================
-- 1. USUÁRIOS
-- auth.users guarda e-mail e senha (Supabase Auth, JWT).
-- perfis guarda o papel e o que cada pessoa pode ver.
--
-- Contas de e-commerce: quem cria é o administrador, pelo painel. O
-- navegador não pode criar usuários do Auth, então o painel chama uma
-- Edge Function (com a service role) que faz auth.admin.createUser com
-- a senha escolhida e insere a linha em perfis. Como o Auth exige um
-- e-mail, a loja entra com o login e o site completa o endereço
-- (ex.: lojadaana -> lojadaana@lojas.jcngourmet.com.br).
-- =====================================================================
create table perfis (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null,                -- pessoa, ou nome da loja no e-commerce
  email       text not null unique,
  login       text unique check (login ~ '^[a-z0-9._-]{3,30}$'),   -- só e-commerce
  papel       papel_usuario not null default 'vendedor',
  empresa     text,
  documento   text,                         -- CNPJ ou CPF da loja
  cidade      text,
  contato     text,                         -- responsável e telefone
  vendedor_id uuid references perfis (id),  -- só e-commerce: de qual vendedor é a loja (obrigatório, ver gatilho validar_perfil)
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  check (papel <> 'ecommerce' or login is not null),
  check (papel = 'ecommerce' or vendedor_id is null)
);
create index on perfis (vendedor_id);

-- funções auxiliares usadas nas políticas (security definer evita recursão de RLS)
create or replace function meu_papel() returns papel_usuario
language sql stable security definer set search_path = public as $$
  select papel from perfis where id = auth.uid() and ativo
$$;

create or replace function sou_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(meu_papel() = 'admin', false)
$$;

create or replace function sou_interno() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(meu_papel() in ('admin', 'vendedor', 'representante'), false)   -- quem usa o portal de vendas
$$;

-- a loja de e-commerce indicada é de quem está logado (vendedor responsável)?
create or replace function loja_do_vendedor(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis l where l.id = p_loja and l.papel = 'ecommerce' and l.vendedor_id = auth.uid())
$$;

create or replace function sou_loja() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(meu_papel() = 'ecommerce', false)
$$;

-- =====================================================================
-- 2. CATÁLOGO (gerenciado pelo painel administrativo)
-- =====================================================================
create table categorias (
  id      uuid primary key default gen_random_uuid(),
  nome    text not null unique,
  slug    text not null unique,
  ativa   boolean not null default true,
  ordem   int not null default 0
);

create table produtos (
  id             uuid primary key default gen_random_uuid(),
  categoria_id   uuid not null references categorias (id) on delete restrict,
  nome           text not null,               -- ex.: Zilda
  codigo         text,                        -- ex.: FG4FSD-AZU; cada grelha de um fogão tem o seu
  cor            text,                        -- ex.: Azul Itatiaia
  cor_hex        text check (cor_hex ~ '^#[0-9A-Fa-f]{6}$'),
  frase          text,                        -- frase de destaque
  historia       text,                        -- texto do catálogo
  especificacoes jsonb not null default '[]', -- [["Queimadores","2 bocas simples e 2 duplas"], ...]
  -- Fogão vendido com as duas grelhas = dois produtos (código e preço próprios)
  -- com o mesmo "grupo". Nas vitrines os dois viram um cartão só, e a pessoa
  -- escolhe a grelha ao abrir. Fogão com uma grelha só fica com grupo nulo.
  grupo          text,
  grelha         tipo_grelha,                 -- nulo quando não se aplica (chapeira, mesa, Linha Colors...)
  subgrupo       text,                        -- título dentro da categoria, ex.: Perfil 5, queimadores simples
  mostrar_preco  boolean not null default false,
  ativo          boolean not null default true,
  ordem          int not null default 0,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  check (grupo is null or grelha is not null)
);
create index on produtos (categoria_id);
create unique index produtos_codigo on produtos (codigo) where codigo is not null;   -- um código, um produto
create unique index produtos_par    on produtos (grupo, grelha) where grupo is not null;   -- no grupo, uma de cada grelha

-- Tabela de preços única da JCN: um valor por produto, ou seja, por código.
-- Produto sem linha aqui está "a definir" e não entra em pedidos.
-- Fica fora da tabela produtos porque o catálogo é público e o preço não.
create table precos (
  produto_id     uuid primary key references produtos (id) on delete cascade,
  valor          numeric(12,2) not null check (valor > 0),
  atualizado_em  timestamptz not null default now()
);

create table fotos_produto (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references produtos (id) on delete cascade,
  caminho     text not null,                  -- caminho no bucket "publico"
  alt         text,
  ordem       int not null default 0
);
create index on fotos_produto (produto_id, ordem);

-- Forno é opcional e é outro produto (categoria Fornos avulsos), com código e
-- preço próprios. Esta tabela diz quais fornos servem em cada fogão: é o que a
-- ficha oferece depois da grelha, junto com "Sem forno". No pedido o forno
-- entra como um item à parte. Num fogão com duas grelhas, os dois códigos
-- recebem as mesmas linhas.
create table fornos_do_fogao (
  fogao_id  uuid not null references produtos (id) on delete cascade,
  forno_id  uuid not null references produtos (id) on delete cascade,
  ordem     int not null default 0,
  primary key (fogao_id, forno_id),
  check (fogao_id <> forno_id)
);
create index on fornos_do_fogao (forno_id);

-- o que cada loja de e-commerce enxerga e por quanto: uma linha por
-- produto liberado. Sem linha aqui, o produto não aparece para a loja.
create table catalogo_loja (
  loja_id     uuid not null references perfis (id) on delete cascade,
  produto_id  uuid not null references produtos (id) on delete cascade,
  preco       numeric(12,2) not null check (preco > 0),
  primary key (loja_id, produto_id)
);

-- dados que só usuários logados veem (ex.: chave PIX de recebimento)
create table configuracoes (
  chave          text primary key,           -- 'pix'
  valor          jsonb not null,             -- {"chave": "...", "favorecido": "...", "banco": "..."}
  atualizado_em  timestamptz not null default now()
);

-- textos e imagens editáveis do site (abertura, legendas, galeria)
create table conteudo_site (
  chave          text primary key,            -- 'hero_titulo', 'hero_texto', 'legenda_gourmet', ...
  valor          jsonb not null,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid references perfis (id)
);

create table galeria (
  id       uuid primary key default gen_random_uuid(),
  caminho  text not null,                     -- caminho no bucket "publico"
  alt      text,
  ordem    int not null default 0,
  ativo    boolean not null default true
);

-- =====================================================================
-- 3. PEDIDOS (Portal de vendas internas, Área do e-commerce e loja do site)
-- origem 'interno': lançado por vendedor ou admin, pela tabela de preços (precos).
-- origem 'ecommerce': enviado pela loja; o preço de cada item vem de
-- catalogo_loja (gatilho precificar_item), nunca do navegador.
-- origem 'site': consumidor final, sem login, pela função criar_pedido_site;
-- o preço é a tabela mais o acréscimo da loja do site (20% de início).
-- Pagamento: PIX (comprovante conferido) ou, só nos pedidos internos,
-- boleto parcelado. O boleto precisa ser aprovado pelo financeiro
-- (administração) antes de o pedido seguir para a expedição.
-- =====================================================================
create sequence pedido_numero_seq start 1041;

create table pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint not null unique default nextval('pedido_numero_seq'),
  origem           origem_pedido not null default 'interno',
  vendedor_id      uuid references perfis (id),            -- vendedor, ou a loja no e-commerce; nulo na loja do site
  cliente_nome     text not null,
  cliente_doc      text,                      -- CPF ou CNPJ
  cliente_cidade   text,
  cliente_telefone text,                      -- WhatsApp do consumidor (loja do site)
  cliente_email    text,
  entrega          jsonb,                     -- {"cep","rua","numero","complemento","bairro","cidade","uf"}
  acrescimo        numeric(5,2),              -- % sobre a tabela valendo no momento da compra (loja do site)
  chave_cliente    uuid not null default gen_random_uuid(),   -- o que o consumidor guarda para anexar outro comprovante
  observacoes      text,
  pix_status       status_pix not null default 'sem_comprovante',
  pix_conferido_por uuid references perfis (id),
  pix_conferido_em  timestamptz,
  forma_pagamento  forma_pagamento not null default 'pix',
  boleto_dias      int[],                     -- vencimento de cada parcela, em dias depois do pedido: {30,60,90}
  boleto_status    status_boleto,             -- nulo no PIX
  boleto_decidido_por uuid references perfis (id),
  boleto_decidido_em  timestamptz,
  boleto_motivo    text,                      -- preenchido na recusa
  envio_status     status_envio not null default 'aguardando_pagamento',
  criado_em        timestamptz not null default now(),
  check (forma_pagamento = 'pix' or origem = 'interno'),
  check ((forma_pagamento = 'boleto') = (boleto_dias is not null)),
  check ((forma_pagamento = 'boleto') = (boleto_status is not null)),
  check (boleto_dias is null or (cardinality(boleto_dias) between 1 and 12
         and boleto_dias <@ array[1, 2, 3, 4, 5, 15, 28, 30, 45, 60, 75, 90])),
  check ((origem = 'site') = (vendedor_id is null)),
  check (origem <> 'site' or (entrega is not null and cliente_telefone is not null and acrescimo is not null))
);
create index on pedidos (vendedor_id, criado_em desc);

create table itens_pedido (
  id           uuid primary key default gen_random_uuid(),
  pedido_id    uuid not null references pedidos (id) on delete cascade,
  produto_id   uuid references produtos (id) on delete set null,
  codigo       text,                          -- código do produto no momento da venda
  descricao    text not null,                 -- nome com a cor ou a grelha, no momento da venda
  quantidade   int not null check (quantidade > 0),
  preco_unit   numeric(12,2) not null check (preco_unit >= 0)
);
create index on itens_pedido (pedido_id);

create view pedidos_totais with (security_invoker = true) as
  select p.id, p.numero, coalesce(sum(i.quantidade * i.preco_unit), 0) as total
  from pedidos p left join itens_pedido i on i.pedido_id = p.id
  group by p.id;

-- Parcelas do boleto: nascem quando o financeiro aprova (gatilho ao_decidir_boleto),
-- em valores iguais, com a diferença dos centavos na última. O prazo conta da data do pedido.
create table parcelas_boleto (
  pedido_id     uuid not null references pedidos (id) on delete cascade,
  numero        int not null check (numero >= 1),
  dias          int not null,
  vencimento    date not null,
  valor         numeric(12,2) not null check (valor >= 0),
  recebida_em   timestamptz,                  -- o financeiro marca quando o boleto é pago
  recebida_por  uuid references perfis (id),
  primary key (pedido_id, numero)
);
create index on parcelas_boleto (vencimento) where recebida_em is null;

-- =====================================================================
-- 4. ANEXOS (comprovantes de PIX e etiquetas de envio em PDF)
-- O arquivo fica no Storage; aqui fica o vínculo e quem enviou.
-- Todo anexo pertence a um pedido.
-- =====================================================================
create table anexos (
  id               uuid primary key default gen_random_uuid(),
  tipo             tipo_anexo not null,
  bucket           text not null check (bucket = 'vendas'),
  caminho          text not null,
  nome_original    text not null,
  mime             text not null,
  tamanho_bytes    bigint not null,
  pedido_id        uuid not null references pedidos (id) on delete cascade,
  enviado_por      uuid references perfis (id),   -- nulo: comprovante enviado pelo consumidor da loja do site
  enviado_em       timestamptz not null default now(),
  unique (bucket, caminho),
  check (tipo <> 'etiqueta_envio' or mime = 'application/pdf')
);
create index on anexos (pedido_id);

-- =====================================================================
-- 5. GATILHOS
-- =====================================================================
create or replace function tocar_atualizado_em() returns trigger
language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;

create trigger precos_atualizado before update on precos
  for each row execute function tocar_atualizado_em();
create trigger produtos_atualizado before update on produtos
  for each row execute function tocar_atualizado_em();

-- novo comprovante de PIX coloca o pedido "em análise"
create or replace function ao_anexar_comprovante() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'comprovante_pix' then
    update pedidos set pix_status = 'em_analise', pix_conferido_por = null, pix_conferido_em = null
     where id = new.pedido_id and pix_status <> 'verificado';
  end if;
  return new;
end $$;

create trigger anexos_comprovante after insert on anexos
  for each row execute function ao_anexar_comprovante();

-- item de pedido: o valor nunca vem do navegador.
--  * e-commerce: o que o administrador liberou para aquela loja (catalogo_loja)
--  * venda interna: a tabela de preços da JCN (precos)
--  * loja do site: a tabela mais o acréscimo guardado no pedido
-- Só o administrador digita um valor diferente. A descrição leva a grelha
-- (ou a cor, na Linha Colors) e o código vai junto, para o pedido dizer
-- exatamente qual dos dois códigos do fogão foi vendido.
create or replace function precificar_item() returns trigger
language plpgsql security definer set search_path = public as $$
declare ped pedidos; pr produtos; valor numeric(12,2);
begin
  if new.produto_id is null then return new; end if;   -- produto apagado depois da venda: o item fica como está
  select * into ped from pedidos where id = new.pedido_id;
  select * into pr from produtos where id = new.produto_id;
  if not sou_admin() then
    if ped.origem = 'ecommerce' then
      select c.preco into valor from catalogo_loja c
       where c.loja_id = ped.vendedor_id and c.produto_id = pr.id and pr.ativo;
      if valor is null then raise exception 'Este produto não está liberado para a loja.'; end if;
    elsif ped.origem = 'site' then
      select round(p.valor * (1 + ped.acrescimo / 100), 2) into valor from precos p
        join categorias c on c.id = pr.categoria_id and c.ativa
       where p.produto_id = pr.id and pr.ativo;
      if valor is null then raise exception 'Este produto não está à venda na loja do site.'; end if;
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

create trigger itens_precificar before insert or update of produto_id, preco_unit on itens_pedido
  for each row execute function precificar_item();

-- regras de negócio do pedido:
--  * só admin confere o PIX e muda o status de envio
--  * vendedor e loja não trocam o dono, a origem nem o número
--  * expedição exige PIX verificado; "enviado" exige etiqueta anexada
create or replace function validar_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not sou_admin() and (new.vendedor_id, new.origem, new.numero)
       is distinct from (old.vendedor_id, old.origem, old.numero) then
    raise exception 'Só a administração altera estes dados do pedido.';
  end if;
  if (new.pix_status is distinct from old.pix_status
      and new.pix_status in ('verificado', 'recusado')) then
    if not sou_admin() then raise exception 'Só a administração confere o PIX.'; end if;
    new.pix_conferido_por := auth.uid(); new.pix_conferido_em := now();
  end if;
  -- boleto: só o financeiro (administração) aprova ou recusa; o vendedor pode pedir nova análise
  -- de um boleto recusado ou trocar o pedido para PIX enquanto o boleto não foi aprovado
  if new.forma_pagamento = 'boleto' and old.forma_pagamento = 'pix' and not sou_admin() and old.pix_status <> 'sem_comprovante' then
    raise exception 'Este pedido já tem comprovante de PIX.';
  end if;
  if new.forma_pagamento = 'boleto' then
    new.boleto_dias := (select array_agg(distinct d order by d) from unnest(new.boleto_dias) d);
    if old.forma_pagamento = 'pix' then new.boleto_status := 'pendente'; end if;
    if new.boleto_status is distinct from old.boleto_status and old.forma_pagamento = 'boleto' then
      if new.boleto_status in ('aprovado', 'recusado') or old.boleto_status = 'aprovado' then
        if not sou_admin() then raise exception 'Só o financeiro aprova ou recusa o boleto.'; end if;
      end if;
      if new.boleto_status = 'recusado' and old.envio_status <> 'aguardando_pagamento' then
        raise exception 'O pedido já saiu para a expedição.';
      end if;
      if new.boleto_status in ('aprovado', 'recusado') then
        new.boleto_decidido_por := auth.uid(); new.boleto_decidido_em := now();
        if new.boleto_status = 'aprovado' then new.boleto_motivo := null; end if;
      end if;
    end if;
    if not sou_admin() and old.boleto_status = 'aprovado' and new.boleto_dias is distinct from old.boleto_dias then
      raise exception 'O boleto já foi aprovado: os prazos não mudam mais.';
    end if;
    if not sou_admin() and old.forma_pagamento = 'boleto' then        -- quem decidiu, quando e o motivo são do financeiro
      new.boleto_decidido_por := old.boleto_decidido_por; new.boleto_decidido_em := old.boleto_decidido_em; new.boleto_motivo := old.boleto_motivo;
    end if;
  else
    if old.forma_pagamento = 'boleto' and old.boleto_status = 'aprovado' and not sou_admin() then
      raise exception 'O boleto já foi aprovado: a forma de pagamento não muda mais.';
    end if;
    new.boleto_dias := null; new.boleto_status := null; new.boleto_decidido_por := null; new.boleto_decidido_em := null; new.boleto_motivo := null;
  end if;
  if new.envio_status is distinct from old.envio_status then
    if not sou_admin() then raise exception 'Só a administração altera a expedição.'; end if;
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

create trigger pedidos_validar before update on pedidos
  for each row execute function validar_pedido();

-- pedido novo: boleto sempre começa pendente, com os prazos em ordem e sem repetição
create or replace function preparar_pedido() returns trigger
language plpgsql as $$
begin
  if new.forma_pagamento = 'boleto' then
    new.boleto_dias := (select array_agg(distinct d order by d) from unnest(new.boleto_dias) d);
    new.boleto_status := 'pendente';
  else
    new.boleto_dias := null; new.boleto_status := null;
  end if;
  new.boleto_decidido_por := null; new.boleto_decidido_em := null; new.boleto_motivo := null;
  return new;
end $$;
create trigger pedidos_preparar before insert on pedidos
  for each row execute function preparar_pedido();

-- aprovou: gera as parcelas. Deixou de estar aprovado (recusa, volta para PIX): apaga.
create or replace function ao_decidir_boleto() returns trigger
language plpgsql security definer set search_path = public as $$
declare centavos bigint; n int; cada bigint;
begin
  if new.boleto_status is not distinct from old.boleto_status and new.boleto_dias is not distinct from old.boleto_dias then return null; end if;
  delete from parcelas_boleto where pedido_id = new.id;
  if new.boleto_status = 'aprovado' then
    select round(coalesce(sum(quantidade * preco_unit), 0) * 100) into centavos from itens_pedido where pedido_id = new.id;
    n := cardinality(new.boleto_dias); cada := centavos / n;
    insert into parcelas_boleto (pedido_id, numero, dias, vencimento, valor)
    select new.id, t.i, t.d, new.criado_em::date + t.d, (case when t.i = n then centavos - cada * (n - 1) else cada end) / 100.0
    from unnest(new.boleto_dias) with ordinality as t (d, i);
  end if;
  return null;
end $$;
create trigger pedidos_boleto after update on pedidos
  for each row execute function ao_decidir_boleto();

-- parcela: só o financeiro marca como recebida; valor e vencimento não mudam por aqui
create or replace function validar_parcela() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.pedido_id, new.numero, new.dias, new.vencimento, new.valor) is distinct from (old.pedido_id, old.numero, old.dias, old.vencimento, old.valor) then
    raise exception 'A parcela só muda de recebida para em aberto, e vice-versa.';
  end if;
  if new.recebida_em is not null and old.recebida_em is null then new.recebida_por := auth.uid(); end if;
  if new.recebida_em is null then new.recebida_por := null; end if;
  return new;
end $$;
create trigger parcelas_validar before update on parcelas_boleto
  for each row execute function validar_parcela();

-- conta de e-commerce precisa dizer de qual vendedor é
create or replace function validar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.papel = 'ecommerce' then
    if new.vendedor_id is null or not exists (select 1 from perfis v where v.id = new.vendedor_id and v.papel = 'vendedor') then
      raise exception 'Informe de qual vendedor é este e-commerce.';
    end if;
  end if;
  if tg_op = 'UPDATE' and not sou_admin() and auth.uid() is not null and (new.papel, new.vendedor_id) is distinct from (old.papel, old.vendedor_id) then
    raise exception 'Só a administração troca o perfil ou o vendedor de uma conta.';
  end if;
  return new;
end $$;
create trigger perfis_validar before insert or update of papel, vendedor_id on perfis
  for each row execute function validar_perfil();

-- =====================================================================
-- 6. SEGURANÇA POR LINHA (RLS)
-- admin: tudo. vendedor: só os próprios pedidos. loja de e-commerce: só
-- o catálogo liberado para ela e os próprios pedidos. visitante do site:
-- só catálogo ativo e a loja do site.
-- =====================================================================
alter table perfis          enable row level security;
alter table categorias      enable row level security;
alter table produtos        enable row level security;
alter table precos          enable row level security;
alter table fotos_produto   enable row level security;
alter table fornos_do_fogao enable row level security;
alter table catalogo_loja   enable row level security;
alter table configuracoes   enable row level security;
alter table conteudo_site   enable row level security;
alter table galeria         enable row level security;
alter table pedidos         enable row level security;
alter table itens_pedido    enable row level security;
alter table parcelas_boleto enable row level security;
alter table anexos          enable row level security;

-- perfis
create policy perfis_ver on perfis for select to authenticated
  using (id = auth.uid() or sou_admin() or vendedor_id = auth.uid());   -- o vendedor enxerga as lojas dele
create policy perfis_admin on perfis for all to authenticated
  using (sou_admin()) with check (sou_admin());
-- o vendedor cria e altera só as contas de e-commerce dele (o usuário de login é criado
-- antes, por uma função de servidor com a chave de serviço do Supabase Auth)
create policy perfis_vendedor_criar on perfis for insert to authenticated
  with check (meu_papel() = 'vendedor' and papel = 'ecommerce' and vendedor_id = auth.uid());
create policy perfis_vendedor_editar on perfis for update to authenticated
  using (meu_papel() = 'vendedor' and papel = 'ecommerce' and vendedor_id = auth.uid())
  with check (papel = 'ecommerce' and vendedor_id = auth.uid());

-- catálogo: leitura pública do que está ativo, escrita só do admin
create policy categorias_publico on categorias for select to anon, authenticated
  using (ativa or sou_admin());
create policy categorias_admin on categorias for all to authenticated
  using (sou_admin()) with check (sou_admin());

create policy produtos_publico on produtos for select to anon, authenticated
  using ((ativo and exists (select 1 from categorias c where c.id = categoria_id and c.ativa))
         or sou_admin());
create policy produtos_admin on produtos for all to authenticated
  using (sou_admin()) with check (sou_admin());

create policy fotos_publico on fotos_produto for select to anon, authenticated using (true);
create policy fotos_admin on fotos_produto for all to authenticated
  using (sou_admin()) with check (sou_admin());

-- quais fornos servem em cada fogão: faz parte do catálogo, todos leem; só o admin altera.
-- (O preço do forno continua protegido em precos e catalogo_loja.)
create policy fornos_publico on fornos_do_fogao for select to anon, authenticated using (true);
create policy fornos_admin on fornos_do_fogao for all to authenticated
  using (sou_admin()) with check (sou_admin());

create policy conteudo_publico on conteudo_site for select to anon, authenticated using (true);
create policy conteudo_admin on conteudo_site for all to authenticated
  using (sou_admin()) with check (sou_admin());

create policy galeria_publico on galeria for select to anon, authenticated
  using (ativo or sou_admin());
create policy galeria_admin on galeria for all to authenticated
  using (sou_admin()) with check (sou_admin());

-- preços: o site só enxerga o preço de produtos com "mostrar_preco";
-- admin e vendedor enxergam a tabela inteira. A loja de e-commerce não lê
-- esta tabela (a loja enxerga os valores dela em catalogo_loja).
create policy precos_site on precos for select to anon, authenticated
  using (exists (select 1 from produtos p where p.id = produto_id and p.ativo and p.mostrar_preco));
create policy precos_internos on precos for select to authenticated
  using (sou_interno());
create policy precos_admin on precos for all to authenticated
  using (sou_admin()) with check (sou_admin());

-- catálogo por loja: a loja lê o próprio; só o admin libera e define valores
create policy catalogo_loja_ver on catalogo_loja for select to authenticated
  using (sou_admin() or (sou_loja() and loja_id = auth.uid()));
create policy catalogo_loja_admin on catalogo_loja for all to authenticated
  using (sou_admin()) with check (sou_admin());
-- o vendedor libera produtos e define valores para as lojas dele (o representante, não)
create policy catalogo_loja_vendedor on catalogo_loja for all to authenticated
  using (meu_papel() = 'vendedor' and loja_do_vendedor(loja_id))
  with check (meu_papel() = 'vendedor' and loja_do_vendedor(loja_id));

-- configurações (chave PIX): quem vende ou compra lê; só o admin altera
create policy configuracoes_ver on configuracoes for select to authenticated
  using (meu_papel() in ('admin', 'vendedor', 'representante', 'ecommerce'));
create policy configuracoes_admin on configuracoes for all to authenticated
  using (sou_admin()) with check (sou_admin());

-- pedidos: vendedor e loja só enxergam e criam os próprios
-- o vendedor também acompanha (sem alterar) os pedidos das lojas de e-commerce dele
create policy pedidos_ver on pedidos for select to authenticated
  using (sou_admin() or (meu_papel() in ('vendedor', 'representante', 'ecommerce') and vendedor_id = auth.uid())
         or (meu_papel() = 'vendedor' and loja_do_vendedor(vendedor_id)));
create policy pedidos_criar on pedidos for insert to authenticated
  with check (vendedor_id = auth.uid()
              and ((sou_interno() and origem = 'interno') or (sou_loja() and origem = 'ecommerce'))
              and pix_status = 'sem_comprovante'
              and (forma_pagamento = 'pix' or sou_interno())      -- boleto só no portal de vendas
              and envio_status = 'aguardando_pagamento');
-- o representante não entra aqui: depois de lançado, o pedido dele não muda mais pelas mãos dele
create policy pedidos_editar on pedidos for update to authenticated
  using (sou_admin() or (meu_papel() in ('vendedor', 'ecommerce') and vendedor_id = auth.uid()))
  with check (sou_admin() or vendedor_id = auth.uid());
create policy pedidos_apagar on pedidos for delete to authenticated using (sou_admin());

create policy itens_pedido_ver on itens_pedido for select to authenticated
  using (exists (select 1 from pedidos p where p.id = pedido_id));   -- herda a RLS de pedidos
create policy itens_pedido_criar on itens_pedido for insert to authenticated
  with check (exists (select 1 from pedidos p where p.id = pedido_id
                      and (sou_admin() or (p.vendedor_id = auth.uid()
                                           and p.pix_status = 'sem_comprovante'
                                           and p.boleto_status is distinct from 'aprovado'))));   -- depois do comprovante ou da aprovação os itens travam
create policy itens_pedido_admin on itens_pedido for all to authenticated
  using (sou_admin()) with check (sou_admin());

-- parcelas: quem enxerga o pedido enxerga as parcelas; só o financeiro marca como recebida
create policy parcelas_ver on parcelas_boleto for select to authenticated
  using (exists (select 1 from pedidos p where p.id = pedido_id));
create policy parcelas_receber on parcelas_boleto for update to authenticated
  using (sou_admin()) with check (sou_admin());

-- ordens de compra
-- anexos: quem enxerga o pedido enxerga os anexos dele
create policy anexos_ver on anexos for select to authenticated using (
  sou_admin() or exists (select 1 from pedidos p where p.id = pedido_id)
);
create policy anexos_enviar on anexos for insert to authenticated with check (
  enviado_por = auth.uid() and (
    sou_admin()
    or (bucket = 'vendas' and meu_papel() in ('vendedor', 'ecommerce')
        and exists (select 1 from pedidos p where p.id = pedido_id and p.vendedor_id = auth.uid()
                    and p.envio_status <> 'enviado'
                    and (tipo <> 'comprovante_pix' or p.pix_status <> 'verificado')))
    -- representante: só o comprovante de PIX que falta (ou foi recusado) no pedido dele
    or (bucket = 'vendas' and meu_papel() = 'representante' and tipo = 'comprovante_pix'
        and exists (select 1 from pedidos p where p.id = pedido_id and p.vendedor_id = auth.uid()
                    and p.forma_pagamento = 'pix' and p.pix_status in ('sem_comprovante', 'recusado')))
  )
);
create policy anexos_apagar on anexos for delete to authenticated
  using (sou_admin()
      or (enviado_por = auth.uid() and meu_papel() = 'ecommerce' and tipo = 'etiqueta_envio'
          and exists (select 1 from pedidos p where p.id = pedido_id
                      and p.envio_status = 'aguardando_pagamento')));

-- =====================================================================
-- 7. STORAGE
-- publico      -> fotos de produtos, galeria (leitura aberta)
-- vendas       -> pedidos/<pedido_id>/...   comprovantes de PIX e etiquetas
--                 (enviados pelo vendedor ou pela loja de e-commerce)
--                 site/<chave do pedido>/...  comprovante do consumidor final
-- O bucket privado só entrega o arquivo se houver uma linha em
-- "anexos" que a pessoa possa ver; o download usa URL assinada.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('publico',      'publico',      true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('vendas',       'vendas',       false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy publico_ler on storage.objects for select to anon, authenticated
  using (bucket_id = 'publico');
create policy publico_admin on storage.objects for all to authenticated
  using (bucket_id = 'publico' and sou_admin()) with check (bucket_id = 'publico' and sou_admin());

create policy privados_ler on storage.objects for select to authenticated using (
  bucket_id = 'vendas'
  and (sou_admin() or owner = auth.uid()
       or exists (select 1 from anexos a where a.bucket = bucket_id and a.caminho = name))
);
create policy vendas_enviar on storage.objects for insert to authenticated with check (
  bucket_id = 'vendas' and meu_papel() in ('admin', 'vendedor', 'representante', 'ecommerce')
  and (storage.foldername(name))[1] = 'pedidos'
  and exists (select 1 from pedidos p where p.id::text = (storage.foldername(name))[2]
              and (sou_admin() or p.vendedor_id = auth.uid()))   -- só no próprio pedido
);
create policy privados_apagar on storage.objects for delete to authenticated using (
  bucket_id = 'vendas' and (sou_admin() or owner = auth.uid())
);

-- =====================================================================
-- 8. LOJA DO SITE (consumidor final, sem login)
-- O visitante não lê "precos" nem grava em "pedidos": ele usa só o que
-- está aqui. Tudo é calculado no banco; do navegador vêm apenas os
-- dados do cliente e a lista de produtos e quantidades.
-- =====================================================================
insert into configuracoes (chave, valor) values ('loja_site', '{"ativa": true, "acrescimo": 20}')
on conflict (chave) do nothing;

-- Preço que o consumidor vê: tabela + acréscimo. A view roda com os direitos
-- do dono (de propósito, sem security_invoker): entrega só o preço final, só
-- de produto ativo, em categoria ativa, com preço, e só com a loja aberta.
create view vitrine as
  select p.id as produto_id, round(x.valor * (1 + (cfg.valor->>'acrescimo')::numeric / 100), 2) as preco
  from produtos p
  join categorias c on c.id = p.categoria_id and c.ativa
  join precos x on x.produto_id = p.id
  join configuracoes cfg on cfg.chave = 'loja_site' and (cfg.valor->>'ativa')::boolean
  where p.ativo;
grant select on vitrine to anon, authenticated;

-- chave PIX para o consumidor pagar (só com a loja aberta)
create or replace function pix_da_loja_site() returns jsonb
language sql stable security definer set search_path = public as $$
  select c.valor from configuracoes c
  where c.chave = 'pix' and exists (select 1 from configuracoes l where l.chave = 'loja_site' and (l.valor->>'ativa')::boolean)
$$;

-- p_cliente: {"nome","documento","telefone","email","observacoes","entrega":{"cep","rua","numero","complemento","bairro","cidade","uf"}}
-- p_itens:   [{"produto_id":"<uuid>","quantidade":2}, ...]   (o forno escolhido na ficha vem como mais um item)
create or replace function criar_pedido_site(p_cliente jsonb, p_itens jsonb)
returns table (numero bigint, chave uuid, total numeric)
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; ped pedidos; it jsonb; e jsonb := p_cliente->'entrega';
  so_num constant text := '\D';
begin
  select valor into cfg from configuracoes where configuracoes.chave = 'loja_site';
  if cfg is null or not (cfg->>'ativa')::boolean then raise exception 'A loja do site está fechada.'; end if;
  if length(trim(coalesce(p_cliente->>'nome', ''))) < 5 then raise exception 'Informe o nome completo ou a razão social.'; end if;
  if length(regexp_replace(coalesce(p_cliente->>'documento', ''), so_num, '', 'g')) not in (11, 14) then raise exception 'O CPF tem 11 números e o CNPJ tem 14.'; end if;
  if length(regexp_replace(coalesce(p_cliente->>'telefone', ''), so_num, '', 'g')) not between 10 and 11 then raise exception 'Informe o WhatsApp com DDD.'; end if;
  if e is null or length(regexp_replace(coalesce(e->>'cep', ''), so_num, '', 'g')) <> 8
     or trim(coalesce(e->>'rua', '')) = '' or trim(coalesce(e->>'numero', '')) = '' or trim(coalesce(e->>'cidade', '')) = '' or length(coalesce(e->>'uf', '')) <> 2 then
    raise exception 'Informe o endereço de entrega completo, com CEP.';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) not between 1 and 50 then raise exception 'A sacola está vazia.'; end if;
  insert into pedidos (origem, vendedor_id, cliente_nome, cliente_doc, cliente_cidade, cliente_telefone, cliente_email, entrega, acrescimo, observacoes)
  values ('site', null, trim(p_cliente->>'nome'), p_cliente->>'documento', (e->>'cidade') || ', ' || upper(e->>'uf'), p_cliente->>'telefone',
          nullif(trim(coalesce(p_cliente->>'email', '')), ''), e, (cfg->>'acrescimo')::numeric, nullif(trim(coalesce(p_cliente->>'observacoes', '')), ''))
  returning * into ped;
  for it in select * from jsonb_array_elements(p_itens) loop
    -- o gatilho precificar_item põe o valor (tabela + acréscimo), a descrição e o código
    insert into itens_pedido (pedido_id, produto_id, quantidade, preco_unit)
    values (ped.id, (it->>'produto_id')::uuid, (it->>'quantidade')::int, 0);
  end loop;
  return query select ped.numero, ped.chave_cliente, t.total from pedidos_totais t where t.id = ped.id;
end $$;

-- acompanhamento: número do pedido + CPF ou CNPJ da compra. Devolve só o andamento e os itens.
create or replace function acompanhar_pedido_site(p_numero bigint, p_documento text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('numero', p.numero, 'criado_em', p.criado_em, 'pix', p.pix_status, 'envio', p.envio_status,
    'total', (select coalesce(sum(i.quantidade * i.preco_unit), 0) from itens_pedido i where i.pedido_id = p.id),
    'itens', (select coalesce(jsonb_agg(jsonb_build_object('descricao', i.descricao, 'codigo', i.codigo, 'quantidade', i.quantidade, 'preco_unit', i.preco_unit)), '[]') from itens_pedido i where i.pedido_id = p.id))
  from pedidos p
  where p.origem = 'site' and p.numero = p_numero
    and regexp_replace(coalesce(p.cliente_doc, ''), '\D', '', 'g') = regexp_replace(coalesce(p_documento, ''), '\D', '', 'g')
    and coalesce(p_documento, '') <> ''
$$;

-- o Storage só aceita o arquivo do consumidor na pasta do próprio pedido, enquanto o PIX não foi conferido
create or replace function pedido_site_aceita_comprovante(p_chave text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pedidos p where p.origem = 'site' and p.chave_cliente::text = p_chave and p.pix_status <> 'verificado')
$$;
create policy site_enviar on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'vendas' and (storage.foldername(name))[1] = 'site'
  and pedido_site_aceita_comprovante((storage.foldername(name))[2])
);

-- depois do upload em vendas/site/<chave>/<arquivo>, o site registra o comprovante; o pedido vai para "em análise"
create or replace function anexar_comprovante_site(p_numero bigint, p_chave uuid, p_caminho text, p_nome text, p_mime text, p_tamanho bigint)
returns void language plpgsql security definer set search_path = public as $$
declare ped pedidos;
begin
  select * into ped from pedidos where origem = 'site' and numero = p_numero and chave_cliente = p_chave;
  if ped.id is null then raise exception 'Pedido não encontrado.'; end if;
  if ped.pix_status = 'verificado' then raise exception 'O pagamento deste pedido já foi conferido.'; end if;
  if p_caminho not like 'site/' || p_chave::text || '/%' then raise exception 'Arquivo fora da pasta do pedido.'; end if;
  if p_mime not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then raise exception 'Envie o comprovante em imagem ou PDF.'; end if;
  insert into anexos (tipo, bucket, caminho, nome_original, mime, tamanho_bytes, pedido_id, enviado_por)
  values ('comprovante_pix', 'vendas', p_caminho, p_nome, p_mime, p_tamanho, ped.id, null);
end $$;

revoke all on function pix_da_loja_site(), criar_pedido_site(jsonb, jsonb), acompanhar_pedido_site(bigint, text),
  pedido_site_aceita_comprovante(text), anexar_comprovante_site(bigint, uuid, text, text, text, bigint) from public;
grant execute on function pix_da_loja_site(), criar_pedido_site(jsonb, jsonb), acompanhar_pedido_site(bigint, text),
  pedido_site_aceita_comprovante(text), anexar_comprovante_site(bigint, uuid, text, text, text, bigint) to anon, authenticated;

-- =====================================================================
-- 8b. FINANCEIRO
-- "Vendido" = pedido com pagamento confirmado: PIX verificado ou boleto
-- aprovado. A venda de uma loja de e-commerce entra para o vendedor
-- responsável por ela. As visões respeitam a RLS de pedidos: a
-- administração vê tudo; o vendedor, só as vendas dele e das lojas dele.
-- =====================================================================
create view vendas_confirmadas with (security_invoker = true) as
  select p.id as pedido_id, p.numero, p.criado_em::date as data, p.origem, p.forma_pagamento,
         case p.origem when 'interno' then p.vendedor_id when 'ecommerce' then l.vendedor_id end as vendedor_id,
         case when p.origem = 'ecommerce' then p.vendedor_id end as loja_id,
         t.total,
         case when p.forma_pagamento = 'pix' then t.total
              else coalesce((select sum(b.valor) from parcelas_boleto b where b.pedido_id = p.id and b.recebida_em is not null), 0) end as recebido
  from pedidos p
  join pedidos_totais t on t.id = p.id
  left join perfis l on l.id = p.vendedor_id and p.origem = 'ecommerce'
  where (p.forma_pagamento = 'pix' and p.pix_status = 'verificado')
     or (p.forma_pagamento = 'boleto' and p.boleto_status = 'aprovado');

create view financeiro_por_vendedor with (security_invoker = true) as
  select date_trunc('month', v.data)::date as mes, v.vendedor_id,
         count(*) filter (where v.origem = 'interno') as pedidos_proprios,
         coalesce(sum(v.total) filter (where v.origem = 'interno'), 0) as valor_proprio,
         count(*) filter (where v.origem = 'ecommerce') as pedidos_das_lojas,
         coalesce(sum(v.total) filter (where v.origem = 'ecommerce'), 0) as valor_das_lojas,
         count(*) filter (where v.origem = 'site') as pedidos_do_site,
         coalesce(sum(v.total) filter (where v.origem = 'site'), 0) as valor_do_site,
         sum(v.total) as total, sum(v.recebido) as recebido
  from vendas_confirmadas v
  group by 1, 2;

create view parcelas_em_aberto with (security_invoker = true) as
  select b.vencimento, p.numero as pedido, p.cliente_nome, b.numero as parcela, cardinality(p.boleto_dias) as de, b.valor,
         b.vencimento - current_date as dias_para_vencer, b.pedido_id
  from parcelas_boleto b join pedidos p on p.id = b.pedido_id
  where b.recebida_em is null
  order by b.vencimento, p.numero, b.numero;

-- =====================================================================
-- 9. DADOS INICIAIS DO CATÁLOGO
-- Linha Colors (catálogo do 2º semestre de 2025), Catálogo JCN 2026 e
-- Tabela de preços JCN de julho de 2026 (valores e códigos da tabela).
-- =====================================================================
insert into categorias (nome, slug, ordem) values
  ('Linha Colors', 'colors', 1), ('Fogões baixa pressão', 'fogoes-baixa-pressao', 2), ('Fogões alta pressão', 'fogoes-alta-pressao', 3),
  ('Fogões camping', 'fogoes-camping', 4), ('Fornos cavalete', 'fornos-cavalete', 5), ('Fornos avulsos', 'fornos-avulsos', 6),
  ('Tachos fritadores', 'tachos-fritadores', 7), ('Sanduicheiras', 'sanduicheiras', 8), ('Chapeiras', 'chapeiras', 9),
  ('Discos de arado', 'discos-de-arado', 10), ('Picadores de legumes', 'picadores', 11), ('Engenhos', 'engenhos', 12),
  ('Mesas de panificação', 'mesas-de-panificacao', 13), ('Lança-chamas e mangueiras', 'lanca-chamas', 14), ('Banquetas', 'banquetas', 15),
  ('Cabideiros', 'cabideiros', 16), ('Prateleiras', 'prateleiras', 17), ('Portão pet', 'portao-pet', 18);

insert into produtos (categoria_id, nome, codigo, cor, cor_hex, frase, ordem, especificacoes)
select c.id, v.nome, v.codigo, v.cor, v.hex, v.frase, v.ordem,
  '[["Queimadores","2 bocas simples e 2 duplas"],["L × A × P","722,7 × 830 × 880,5 mm"],
    ["Corpo","Aço carbono"],["Grelha","Ferro fundido 30×30"],["Pintura","Eletrostática"],
    ["Forno interno","580,7 × 670,8 × 450,5 mm"],["Peso","57 kg"]]'::jsonb
from categorias c, (values
  ('Mateus',  'FG4FSDB-LAC', 'Laca Bege',     '#F1E7BE', 'Lar doce lar', 1),
  ('Zezé',    'FG4FSD-AMA',  'Amarelo',       '#F9AC22', 'Ele não é apenas um fogão', 2),
  ('Helena',  'FG4FSD-LRJ',  'Laranja',       '#F36421', 'Cuidar de si e de quem se ama!', 3),
  ('Dirce',   'FG4FSD-VER',  'Vermelho',      '#ED202A', 'Cozinhar também é se apaixonar', 4),
  ('Idalina', 'FG4FSD-PIK',  'Pink',          '#CE289C', 'A vida é uma festa', 5),
  ('Rosa',    'FG4FSD-ROS',  'Rosa Gold',     '#B15F65', 'A diva da cozinha', 6),
  ('Zilda',   'FG4FSD-AZU',  'Azul Itatiaia', '#4FC3E8', 'O calor que conforta e faz o tempo desacelerar', 7),
  ('Meire',   'FG4FSD-BRA',  'Branco',        '#F4F4F2', 'Ele é puro, essencial e eterno', 8),
  ('Bige',    'FG4FSB-CHU',  'Chumbo',        '#425771', 'O coringa do bom gosto', 9),
  ('Carlos',  'FG4FSD-PRE',  'Preto',         '#231F20', 'Ele tem presença', 10),
  ('Lair',    'FG4FSD-VRD',  'Verde',         '#75876F', 'Ele tem alma forte e espírito contemporâneo', 11)
) as v (nome, codigo, cor, hex, frase, ordem)
where c.slug = 'colors';

-- >>> catálogo 2026 (gerado)
-- Linha Colors: R$ 1.490,00 cada, conforme a tabela de julho de 2026.
insert into precos (produto_id, valor)
select p.id, 1490.00 from produtos p join categorias c on c.id = p.categoria_id where c.slug = 'colors';

-- Demais itens: 166 produtos. Nome, texto e ficha vêm do Catálogo JCN 2026 (arquivo de 07/04/2026);
-- código e valor vêm da Tabela de preços JCN de julho de 2026. Itens que só existem na tabela entram
-- sem texto e sem foto. 28 fogões têm as duas grelhas (mesmo "grupo", um código para cada).
-- 9 itens do catálogo não aparecem na tabela e ficam sem preço (valor nulo abaixo): cadastre pelo painel.
-- Última coluna: códigos dos fornos avulsos que servem no fogão (40 códigos de fogão). Regra usada, a conferir:
-- baixa pressão, de piso, Perfil 5 ou 7; forno pequeno nos fogões de 2 e 3 bocas, grande nos de 4 e 6.
create temporary table _carga (
  id uuid default gen_random_uuid(), slug text, nome text, codigo text, cor text, hex text, historia text,
  ordem int, specs text, grupo text, grelha text, subgrupo text, preco numeric(12,2), fornos text
);
insert into _carga (slug, nome, codigo, cor, hex, historia, ordem, specs, grupo, grelha, subgrupo, preco, fornos) values
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples, de mesa', 'FF006', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 12, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff006', 'ferro', 'Perfil 5, queimadores simples', 290.90, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples', 'FF008', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 13, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff008', 'ferro', 'Perfil 5, queimadores simples', 348.14, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores simples', 'FF029', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 14, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff029', 'ferro', 'Perfil 5, queimadores simples', 464.12, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples', 'FF010', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 15, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff010', 'ferro', 'Perfil 5, queimadores simples', 582.44, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples', 'FF020', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 16, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff020', 'ferro', 'Perfil 5, queimadores simples', 889.40, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 1 boca, queimador simples', 'FF983', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 17, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', '', 'aco', 'Perfil 5, queimadores simples', 193.02, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples, de mesa', 'FF982', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 18, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff006', 'aco', 'Perfil 5, queimadores simples', 242.90, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples', 'FF981', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 19, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff008', 'aco', 'Perfil 5, queimadores simples', 300.14, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores simples', 'FF980', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 20, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff029', 'aco', 'Perfil 5, queimadores simples', 410.86, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples', 'FF979', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 21, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff010', 'aco', 'Perfil 5, queimadores simples', 486.44, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples', 'FF978', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 22, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff020', 'aco', 'Perfil 5, queimadores simples', 745.86, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 1 boca, queimador duplo, de mesa', 'FF143', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 23, '[["Linha", "Perfil 5"], ["Versão", "De mesa"], ["Queimadores", "1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "39 × 150 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "3,5 kg"]]', 'g-ff143', 'ferro', 'Perfil 5, queimadores duplos', 218.12, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 1 boca, queimador duplo', 'FF141', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 24, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff141', 'ferro', 'Perfil 5, queimadores duplos', 267.32, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores duplos, de mesa', 'FF154', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 25, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff154', 'ferro', 'Perfil 5, queimadores duplos', 393.64, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores duplos', 'FF130', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 26, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff130', 'ferro', 'Perfil 5, queimadores duplos', 451.44, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores duplos', 'FF198', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 27, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff198', 'ferro', 'Perfil 5, queimadores duplos', 617.12, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores duplos', 'FF199', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 28, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff199', 'ferro', 'Perfil 5, queimadores duplos', 805.86, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores duplos', 'FF200', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 29, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff200', 'ferro', 'Perfil 5, queimadores duplos', 1211.94, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 1 boca, queimador duplo, de mesa', 'FF971', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 30, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Versão", "De mesa"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff143', 'aco', 'Perfil 5, queimadores duplos', 194.02, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 1 boca, queimador duplo', 'FF970', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 31, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff141', 'aco', 'Perfil 5, queimadores duplos', 241.62, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores duplos, de mesa', 'FF969', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 32, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff154', 'aco', 'Perfil 5, queimadores duplos', 343.76, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores duplos', 'FF968', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 33, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff130', 'aco', 'Perfil 5, queimadores duplos', 401.56, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores duplos', 'FF967', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 34, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff198', 'aco', 'Perfil 5, queimadores duplos', 561.04, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores duplos', 'FF966', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 35, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff199', 'aco', 'Perfil 5, queimadores duplos', 706.10, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores duplos', 'FF965', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 36, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff200', 'aco', 'Perfil 5, queimadores duplos', 1057.98, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples e duplos, de mesa', 'FF007', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 37, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff007', 'ferro', 'Perfil 5, queimadores simples e duplos', 342.36, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples e duplos', 'FF009', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 38, '[["Linha", "Perfil 5"], ["Queimadores", "1 simples e 1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "730 × 860 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "17 kg"]]', 'g-ff009', 'ferro', 'Perfil 5, queimadores simples e duplos', 394.88, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores simples e duplos', 'FF101', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 39, '[["Linha", "Perfil 5"], ["Queimadores", "2 simples e 1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "1070 × 860 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "22 kg"]]', 'g-ff101', 'ferro', 'Perfil 5, queimadores simples e duplos', 522.18, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples e duplos', 'FF011', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 40, '[["Linha", "Perfil 5"], ["Queimadores", "2 simples e 2 duplos"], ["Pressão", "Baixa"], ["L × A × P", "730 × 860 × 795 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"]]', 'g-ff011', 'ferro', 'Perfil 5, queimadores simples e duplos', 676.90, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples e duplos, com chapa', 'FF170', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 41, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"], ["Chapa", "Sim"]]', 'g-ff170', 'ferro', 'Perfil 5, queimadores simples e duplos', 1065.50, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples e duplos', 'FF019', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 42, '[["Linha", "Perfil 5"], ["Queimadores", "3 simples e 3 duplos"], ["Pressão", "Baixa"], ["L × A × P", "1070 × 860 × 795 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "38 kg"]]', 'g-ff019', 'ferro', 'Perfil 5, queimadores simples e duplos', 1034.76, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples e duplos, com chapa', 'FF202', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 43, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"], ["Chapa", "Sim"]]', 'g-ff202', 'ferro', 'Perfil 5, queimadores simples e duplos', 1354.64, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 8 bocas, queimadores simples e duplos', 'FF031', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 44, '[["Linha", "Perfil 5"], ["Bocas", "8"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff031', 'ferro', 'Perfil 5, queimadores simples e duplos', 1340.00, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples e duplos, de mesa', 'FF999', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 45, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff007', 'aco', 'Perfil 5, queimadores simples e duplos', 294.14, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 2 bocas, queimadores simples e duplos', 'FF998', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 46, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff009', 'aco', 'Perfil 5, queimadores simples e duplos', 347.58, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 3 bocas, queimadores simples e duplos', 'FF997', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 47, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff101', 'aco', 'Perfil 5, queimadores simples e duplos', 468.98, 'FF162,FF162TI,FF162TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples e duplos', 'FF996', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 48, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff011', 'aco', 'Perfil 5, queimadores simples e duplos', 583.86, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 4 bocas, queimadores simples e duplos, com chapa', 'FF995', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 49, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"], ["Chapa", "Sim"]]', 'g-ff170', 'aco', 'Perfil 5, queimadores simples e duplos', 971.70, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples e duplos', 'FF994', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 50, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff019', 'aco', 'Perfil 5, queimadores simples e duplos', 890.10, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 6 bocas, queimadores simples e duplos, com chapa', 'FF993', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 51, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"], ["Chapa", "Sim"]]', 'g-ff202', 'aco', 'Perfil 5, queimadores simples e duplos', 1210.16, 'FF163,FF163TI,FF163TV,FF163TV-I'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 5, 8 bocas, queimadores simples e duplos', 'FF992', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 5, desenvolvida para pequenos estabelecimentos ou residências, produzida em aço carbono, com grelhas 30×30 em aço carbono e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 52, '[["Linha", "Perfil 5"], ["Bocas", "8"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff031', 'aco', 'Perfil 5, queimadores simples e duplos', 1149.44, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 1 boca, queimador simples', 'FF124', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 53, '[["Linha", "Perfil 7"], ["Bocas", "1"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores simples', 273.32, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 2 bocas, queimadores simples', 'FF146', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 54, '[["Linha", "Perfil 7"], ["Bocas", "2"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores simples', 386.70, 'FF164,FF164TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 4 bocas, queimadores simples', 'FF132', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 55, '[["Linha", "Perfil 7"], ["Bocas", "4"], ["Queimadores", "Simples"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores simples', 657.66, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 1 boca, queimador duplo, de mesa', 'FF147', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 56, '[["Linha", "Perfil 7"], ["Versão", "De mesa"], ["Queimadores", "1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "395 × 155 × 475 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "4,5 kg"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 237.18, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 1 boca, queimador duplo', 'FF119', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 57, '[["Linha", "Perfil 7"], ["Bocas", "1"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 287.66, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 2 bocas, queimadores duplos', 'FF133', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 58, '[["Linha", "Perfil 7"], ["Bocas", "2"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 481.10, 'FF164,FF164TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 3 bocas, queimadores duplos', 'FF128', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 59, '[["Linha", "Perfil 7"], ["Bocas", "3"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 676.60, 'FF164,FF164TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 4 bocas, queimadores duplos', 'FF131', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 60, '[["Linha", "Perfil 7"], ["Bocas", "4"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 890.18, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 6 bocas, queimadores duplos', 'FF126', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 61, '[["Linha", "Perfil 7"], ["Bocas", "6"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 1277.16, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 8 bocas, queimadores duplos', 'FF153', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 62, '[["Linha", "Perfil 7"], ["Bocas", "8"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores duplos', 1658.82, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 2 bocas, queimadores simples e duplos', 'FF105', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 63, '[["Linha", "Perfil 7"], ["Queimadores", "1 simples e 1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "785 × 860 × 480 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "18 kg"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 432.88, 'FF164,FF164TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 3 bocas, queimadores simples e duplos', 'FF107', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 64, '[["Linha", "Perfil 7"], ["Queimadores", "2 simples e 1 duplo"], ["Pressão", "Baixa"], ["L × A × P", "1140 × 860 × 480 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 579.72, 'FF164,FF164TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 4 bocas, queimadores simples e duplos', 'FF109', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 65, '[["Linha", "Perfil 7"], ["Queimadores", "2 simples e 2 duplos"], ["Pressão", "Baixa"], ["L × A × P", "785 × 860 × 830 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "26 kg"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 757.54, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 4 bocas, queimadores simples e duplos, com chapa', 'FF111', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 66, '[["Linha", "Perfil 7"], ["Queimadores", "2 simples e 2 duplos"], ["Pressão", "Baixa"], ["L × A × P", "1140 × 860 × 830 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "43 kg"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 1109.70, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 6 bocas, queimadores simples e duplos', 'FF114', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 67, '[["Linha", "Perfil 7"], ["Queimadores", "3 simples e 3 duplos"], ["Pressão", "Baixa"], ["L × A × P", "1140 × 860 × 830 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "41 kg"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 1106.02, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 6 bocas, queimadores simples e duplos, com chapa', 'FF116', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 68, '[["Linha", "Perfil 7"], ["Queimadores", "3 simples e 3 duplos"], ["Pressão", "Baixa"], ["L × A × P", "1500 × 860 × 830 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "50 kg"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 1450.28, 'FF165,FF165TV'),
  ('fogoes-baixa-pressao', 'Fogão Perfil 7, 8 bocas, queimadores simples e duplos', 'FF168', 'Aço carbono', '#2B2B2B', 'Linha de fogão industrial Perfil 7, desenvolvida para grandes estabelecimentos, produzida em aço carbono, com grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. A linha vai de 1 a 8 bocas, em baixa e alta pressão. Fornos em aço carbono com pintura eletrostática.', 69, '[["Linha", "Perfil 7"], ["Bocas", "8"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, queimadores simples e duplos', 1441.68, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 2 bocas 40×40, queimadores duplos', 'FF503', 'Aço carbono', '#2B2B2B', '', 70, '[["Linha", "Perfil 8"], ["Bocas", "2"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores duplos', 829.24, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 3 bocas 40×40, queimadores duplos', '', 'Aço carbono', '#2B2B2B', '', 71, '[["Linha", "Perfil 8"], ["Bocas", "3"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores duplos', null, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 4 bocas 40×40, queimadores duplos', 'FF527', 'Aço carbono', '#2B2B2B', '', 72, '[["Linha", "Perfil 8"], ["Bocas", "4"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores duplos', 1519.00, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 6 bocas 40×40, queimadores duplos', 'FF545', 'Aço carbono', '#2B2B2B', '', 73, '[["Linha", "Perfil 8"], ["Bocas", "6"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores duplos', 2274.85, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 8 bocas 40×40, queimadores duplos', '', 'Aço carbono', '#2B2B2B', '', 74, '[["Linha", "Perfil 8"], ["Bocas", "8"], ["Queimadores", "Duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores duplos', null, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 2 bocas 40×40, queimadores simples e duplos', 'FF506', 'Aço carbono', '#2B2B2B', '', 75, '[["Linha", "Perfil 8"], ["Bocas", "2"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores simples e duplos', 686.29, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 3 bocas 40×40, queimadores simples e duplos', 'FF514', 'Aço carbono', '#2B2B2B', '', 76, '[["Linha", "Perfil 8"], ["Bocas", "3"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores simples e duplos', 1065.00, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 4 bocas 40×40, queimadores simples e duplos', 'FF520', 'Aço carbono', '#2B2B2B', '', 77, '[["Linha", "Perfil 8"], ["Bocas", "4"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores simples e duplos', 1194.68, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 6 bocas 40×40, queimadores simples e duplos', 'FF540', 'Aço carbono', '#2B2B2B', '', 78, '[["Linha", "Perfil 8"], ["Bocas", "6"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores simples e duplos', 1656.37, ''),
  ('fogoes-baixa-pressao', 'Fogão Perfil 8, 8 bocas 40×40, queimadores simples e duplos', 'FF543', 'Aço carbono', '#2B2B2B', '', 79, '[["Linha", "Perfil 8"], ["Bocas", "8"], ["Queimadores", "Simples e duplos"], ["Pressão", "Baixa"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, queimadores simples e duplos', 2178.54, ''),
  ('fogoes-baixa-pressao', 'Fogão inox 6 bocas com forno', '', 'Inox', '#9AA0A6', '', 80, '[["Linha", "Perfil 5"], ["Queimadores", "3 simples e 3 duplos"], ["L × A × P", "1070 × 860 × 795 mm"], ["Corpo", "Inox"], ["Forno", "Inox"], ["Forno interno", "300 × 480 × 580 mm"], ["Peso", "65 kg"]]', '', '', 'Inox', null, ''),
  ('fogoes-baixa-pressao', 'Fogão inox 2 bocas com forno', '', 'Inox', '#9AA0A6', '', 81, '[["Linha", "Perfil 7"], ["Queimadores", "2 duplos"], ["L × A × P", "785 × 860 × 480 mm"], ["Corpo", "Inox"], ["Forno", "Inox"], ["Forno interno", "Inox 30×30"], ["Peso", "18 kg sem forno"]]', '', '', 'Inox', null, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 20×20, de mesa', 'FF001', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 82, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 20×20"]]', '', 'ferro', 'Perfil 5, grelha 20×20', 118.42, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 20×20', '', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 83, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 20×20"]]', '', 'ferro', 'Perfil 5, grelha 20×20', 218.12, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 20×20, de mesa', 'FF002', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 84, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 20×20"]]', '', 'ferro', 'Perfil 5, grelha 20×20', 213.44, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 20×20', 'FF004', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 85, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 20×20"]]', '', 'ferro', 'Perfil 5, grelha 20×20', 271.56, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 20×20, especial', 'FF017', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 86, '[["Linha", "Alta pressão"], ["Queimadores", "Alta pressão"], ["L × A × P", "650 × 820 × 480 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 20×20"], ["Pintura", "Eletrostática"], ["Peso", "12 kg"]]', '', 'ferro', 'Perfil 5, grelha 20×20', 278.08, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 30×30, de mesa', 'FF103', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 87, '[["Linha", "Alta pressão"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["L × A × P", "390 × 150 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "3 kg"]]', 'g-ff103', 'ferro', 'Perfil 5, grelha 30×30', 163.28, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 30×30', 'FF140', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 88, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff140', 'ferro', 'Perfil 5, grelha 30×30', 217.90, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 30×30, de mesa', 'FF104', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 89, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff104', 'ferro', 'Perfil 5, grelha 30×30', 271.92, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 30×30', 'FF014', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 90, '[["Linha", "Alta pressão"], ["Queimadores", "Alta pressão"], ["L × A × P", "730 × 860 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "17 kg"]]', 'g-ff014', 'ferro', 'Perfil 5, grelha 30×30', 320.76, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 3 bocas 30×30', 'FF015', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 91, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff015', 'ferro', 'Perfil 5, grelha 30×30', 454.02, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 4 bocas 30×30', 'FF016', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 92, '[["Linha", "Alta pressão"], ["Queimadores", "Alta pressão"], ["L × A × P", "730 × 860 × 465 mm"], ["Corpo", "Aço carbono"], ["Grelha", "Ferro fundido 30×30"], ["Pintura", "Eletrostática"], ["Peso", "24,5 kg"]]', 'g-ff016', 'ferro', 'Perfil 5, grelha 30×30', 552.20, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 6 bocas 30×30', 'FF018', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 93, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff018', 'ferro', 'Perfil 5, grelha 30×30', 813.54, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 8 bocas 30×30', 'FF024', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 94, '[["Linha", "Perfil 5"], ["Bocas", "8"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', 'g-ff024', 'ferro', 'Perfil 5, grelha 30×30', 1052.98, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 30×30, de mesa', 'FF958', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 95, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff103', 'aco', 'Perfil 5, grelha 30×30', 138.24, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 1 boca 30×30', 'FF957', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 96, '[["Linha", "Perfil 5"], ["Bocas", "1"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff140', 'aco', 'Perfil 5, grelha 30×30', 195.52, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 30×30, de mesa', 'FF956', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 97, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff104', 'aco', 'Perfil 5, grelha 30×30', 223.66, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 2 bocas 30×30', 'FF955', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 98, '[["Linha", "Perfil 5"], ["Bocas", "2"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff014', 'aco', 'Perfil 5, grelha 30×30', 274.84, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 3 bocas 30×30', 'FF954', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 99, '[["Linha", "Perfil 5"], ["Bocas", "3"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff015', 'aco', 'Perfil 5, grelha 30×30', 395.28, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 4 bocas 30×30', 'FF953', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 100, '[["Linha", "Perfil 5"], ["Bocas", "4"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff016', 'aco', 'Perfil 5, grelha 30×30', 458.74, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 6 bocas 30×30', 'FF952', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 101, '[["Linha", "Perfil 5"], ["Bocas", "6"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff018', 'aco', 'Perfil 5, grelha 30×30', 669.00, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 5, 8 bocas 30×30', 'FF951', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 102, '[["Linha", "Perfil 5"], ["Bocas", "8"], ["Queimadores", "Alta pressão"], ["Grelha", "Aço carbono 30×30"]]', 'g-ff024', 'aco', 'Perfil 5, grelha 30×30', 853.46, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 1 boca 30×30, de mesa', 'FF134', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 103, '[["Linha", "Perfil 7"], ["Bocas", "1"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 173.50, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 1 boca 30×30', 'FF161', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 104, '[["Linha", "Perfil 7"], ["Bocas", "1"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 226.74, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 2 bocas 30×30, de mesa', 'FF135', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 105, '[["Linha", "Perfil 7"], ["Bocas", "2"], ["Versão", "De mesa"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 281.98, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 2 bocas 30×30', 'FF122', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 106, '[["Linha", "Perfil 7"], ["Bocas", "2"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 339.86, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 3 bocas 30×30', 'FF127', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 107, '[["Linha", "Perfil 7"], ["Bocas", "3"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 489.52, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 4 bocas 30×30', 'FF121', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 108, '[["Linha", "Perfil 7"], ["Bocas", "4"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 596.16, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 4 bocas 30×30, com chapa', 'FF201', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 109, '[["Linha", "Perfil 7"], ["Bocas", "4"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"], ["Chapa", "Sim"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 946.28, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 7, 6 bocas 30×30', 'FF125', 'Aço carbono', '#2B2B2B', 'Os fogões de alta pressão têm como aplicação a retomada rápida para alimentos que precisam manter um nível de temperatura. Disponíveis nos modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática. Bandejas coletoras de chapa de aço galvanizado, design moderno, facilidade de montagem e alta durabilidade. Os modelos 20×20 não acompanham bandejas coletoras.', 110, '[["Linha", "Perfil 7"], ["Bocas", "6"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 30×30"]]', '', 'ferro', 'Perfil 7, grelha 30×30', 862.04, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 8, 3 bocas 40×40', 'FF511', 'Aço carbono', '#2B2B2B', '', 111, '[["Linha", "Perfil 8"], ["Bocas", "3"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, grelha 40×40', 916.54, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 8, 4 bocas 40×40', 'FF546', 'Aço carbono', '#2B2B2B', '', 112, '[["Linha", "Perfil 8"], ["Bocas", "4"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, grelha 40×40', 1258.68, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 8, 6 bocas 40×40', 'FF529', 'Aço carbono', '#2B2B2B', '', 113, '[["Linha", "Perfil 8"], ["Bocas", "6"], ["Queimadores", "Alta pressão"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, grelha 40×40', 1812.37, ''),
  ('fogoes-alta-pressao', 'Fogão alta pressão Perfil 8, 4 bocas 40×40, queimadores simples e duplos', '', 'Aço carbono', '#2B2B2B', '', 114, '[["Linha", "Perfil 8"], ["Bocas", "4"], ["Queimadores", "Alta pressão, simples e duplos"], ["Grelha", "Ferro fundido 40×40"]]', '', 'ferro', 'Perfil 8, grelha 40×40', 1439.02, ''),
  ('fogoes-camping', 'Fogão camping aço carbono', 'F01BAMP', 'Aço carbono', '#2B2B2B', 'Fogão industrial camping de mesa a gás, com queimador de alta pressão. Ideal para caminhoneiros que precisam de praticidade na estrada ou para quem ama acampar e cozinhar ao ar livre com eficiência. Produto robusto, econômico e fácil de instalar.', 115, '[["Queimadores", "Alta pressão"], ["L × A × P", "27 × 13 × 27"], ["Corpo", "Reforçado"], ["Grelha", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "1,320 kg"]]', '', '', '', null, ''),
  ('fogoes-camping', 'Fogão camping inox', 'F01BCAMINOX', 'Inox', '#9AA0A6', 'Fogão industrial camping de mesa a gás, com queimador de alta pressão. Ideal para caminhoneiros que precisam de praticidade na estrada ou para quem ama acampar e cozinhar ao ar livre com eficiência. Produto robusto, econômico e fácil de instalar.', 116, '[["Queimadores", "Alta pressão"], ["L × A × P", "27 × 13 × 27"], ["Corpo", "Reforçado"], ["Grelha", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "1,320 kg"]]', '', '', '', null, ''),
  ('fogoes-camping', 'Fogão camping vermelho', 'F01BCAMPV', 'Vermelho', '#E3262E', 'Fogão industrial camping de mesa a gás, com queimador de alta pressão. Ideal para caminhoneiros que precisam de praticidade na estrada ou para quem ama acampar e cozinhar ao ar livre com eficiência. Produto robusto, econômico e fácil de instalar.', 117, '[["Queimadores", "Alta pressão"], ["L × A × P", "27 × 13 × 27"], ["Corpo", "Reforçado"], ["Grelha", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "1,320 kg"]]', '', '', '', null, ''),
  ('fogoes-camping', 'Fogão camping azul Itatiaia', 'F01BCAMPA', 'Azul Itatiaia', '#4FC3E8', 'Fogão industrial camping de mesa a gás, com queimador de alta pressão. Ideal para caminhoneiros que precisam de praticidade na estrada ou para quem ama acampar e cozinhar ao ar livre com eficiência. Produto robusto, econômico e fácil de instalar.', 118, '[["Queimadores", "Alta pressão"], ["L × A × P", "27 × 13 × 27"], ["Corpo", "Reforçado"], ["Grelha", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "1,320 kg"]]', '', '', '', null, ''),
  ('fornos-cavalete', 'Forno cavalete 86 litros, tampa de inox', 'FF152TI', 'Aço carbono', '#2B2B2B', '', 119, '[["Capacidade", "86 litros"], ["Tampa", "Tampa de inox"]]', '', '', '', 561.78, ''),
  ('fornos-cavalete', 'Forno cavalete 86 litros, tampa de vidro', 'FF152TV', 'Aço carbono', '#2B2B2B', '', 120, '[["Capacidade", "86 litros"], ["Tampa", "Tampa de vidro"]]', '', '', '', 556.26, ''),
  ('fornos-cavalete', 'Forno cavalete 115 litros, tampa de inox', 'FF022TI', 'Aço carbono', '#2B2B2B', '', 121, '[["Capacidade", "115 litros"], ["Tampa", "Tampa de inox"], ["Medida externa L × A × P", "580 × 1190 × 930 mm"], ["Medida interna L × A × P", "480 × 300 × 800 mm"], ["Porta", "Aço inox"], ["Corpo", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "31 kg"]]', '', '', '', 654.56, ''),
  ('fornos-cavalete', 'Forno cavalete 115 litros, tampa de vidro', 'FF022TV', 'Aço carbono', '#2B2B2B', '', 122, '[["Capacidade", "115 litros"], ["Tampa", "Tampa de vidro"], ["Medida externa L × A × P", "580 × 1190 × 930 mm"], ["Medida interna L × A × P", "480 × 300 × 800 mm"], ["Porta", "Aço inox"], ["Corpo", "Aço carbono"], ["Pintura", "Eletrostática"], ["Peso", "31 kg"]]', '', '', '', 665.12, ''),
  ('fornos-avulsos', 'Forno avulso pequeno, tampa pintada (Perfil 5)', 'FF162', 'Aço carbono', '#2B2B2B', '', 123, '[["Tamanho", "Pequeno"], ["Tampa", "Pintada"], ["Para fogões", "Perfil 5"]]', '', '', '', 308.58, ''),
  ('fornos-avulsos', 'Forno avulso pequeno, tampa de inox (Perfil 5)', 'FF162TI', 'Aço carbono', '#2B2B2B', '', 124, '[["Tamanho", "Pequeno"], ["Tampa", "Inox"], ["Para fogões", "Perfil 5"]]', '', '', '', 328.82, ''),
  ('fornos-avulsos', 'Forno avulso pequeno, tampa de vidro (Perfil 5)', 'FF162TV', 'Aço carbono', '#2B2B2B', '', 125, '[["Tamanho", "Pequeno"], ["Tampa", "Vidro"], ["Para fogões", "Perfil 5"]]', '', '', '', 344.44, ''),
  ('fornos-avulsos', 'Forno avulso pequeno, tampa de inox (Perfil 7)', 'FF164', 'Aço carbono', '#2B2B2B', '', 126, '[["Tamanho", "Pequeno"], ["Tampa", "Inox"], ["Para fogões", "Perfil 7"]]', '', '', '', 338.18, ''),
  ('fornos-avulsos', 'Forno avulso pequeno, tampa de vidro (Perfil 7)', 'FF164TV', 'Aço carbono', '#2B2B2B', '', 127, '[["Tamanho", "Pequeno"], ["Tampa", "Vidro"], ["Para fogões", "Perfil 7"], ["Observação", "Para fogões de 2 e 3 bocas"]]', '', '', '', 353.84, ''),
  ('fornos-avulsos', 'Forno avulso grande, tampa pintada (Perfil 5)', 'FF163', 'Aço carbono', '#2B2B2B', '', 128, '[["Tamanho", "Grande"], ["Tampa", "Pintada"], ["Para fogões", "Perfil 5"]]', '', '', '', 429.08, ''),
  ('fornos-avulsos', 'Forno avulso grande, tampa de inox (Perfil 5)', 'FF163TI', 'Aço carbono', '#2B2B2B', '', 129, '[["Tamanho", "Grande"], ["Tampa", "Inox"], ["Para fogões", "Perfil 5"], ["Observação", "220°"]]', '', '', '', 448.54, ''),
  ('fornos-avulsos', 'Forno avulso grande, tampa de vidro (Perfil 5)', 'FF163TV', 'Aço carbono', '#2B2B2B', '', 130, '[["Tamanho", "Grande"], ["Tampa", "Vidro"], ["Para fogões", "Perfil 5"]]', '', '', '', 444.54, ''),
  ('fornos-avulsos', 'Forno avulso grande em inox, tampa de vidro (Perfil 5)', 'FF163TV-I', 'Aço carbono', '#2B2B2B', '', 131, '[["Tamanho", "Grande"], ["Tampa", "Vidro"], ["Para fogões", "Perfil 5"], ["Observação", "Em inox"]]', '', '', '', 830.00, ''),
  ('fornos-avulsos', 'Forno avulso grande, tampa pintada (Perfil 7)', 'FF165', 'Aço carbono', '#2B2B2B', '', 132, '[["Tamanho", "Grande"], ["Tampa", "Pintada"], ["Para fogões", "Perfil 7"], ["Observação", "Com lã de vidro"]]', '', '', '', 450.48, ''),
  ('fornos-avulsos', 'Forno avulso grande, tampa de vidro (Perfil 7)', 'FF165TV', 'Aço carbono', '#2B2B2B', '', 133, '[["Tamanho", "Grande"], ["Tampa", "Vidro"], ["Para fogões", "Perfil 7"], ["Observação", "250°"]]', '', '', '', 478.00, ''),
  ('tachos-fritadores', 'Tacho fritador nº 14', '', 'Aço carbono', '#2B2B2B', '', 134, '[["Número", "14"]]', '', '', '', 91.47, ''),
  ('tachos-fritadores', 'Tacho fritador nº 16', '', 'Aço carbono', '#2B2B2B', '', 135, '[["Número", "16"]]', '', '', '', 125.00, ''),
  ('tachos-fritadores', 'Fritador a gás em aço carbono, nº 14, 6 litros', 'FRIT-6', 'Aço carbono', '#2B2B2B', '', 136, '[["Material", "Aço carbono"], ["Tacho", "Nº 14"], ["Capacidade", "6 litros"], ["Acompanha", "Tacho e suporte"]]', '', '', '', 253.15, ''),
  ('tachos-fritadores', 'Fritador a gás em aço inox, nº 14, 6 litros', 'FRIT-6I', 'Inox', '#9AA0A6', '', 137, '[["Material", "Aço inox"], ["Tacho", "Nº 14"], ["Capacidade", "6 litros"], ["Acompanha", "Tacho e suporte"]]', '', '', '', 310.28, ''),
  ('tachos-fritadores', 'Tacho fritador a gás', 'FRIT-40', 'Inox', '#9AA0A6', 'Ideal para estabelecimentos que buscam eficiência e praticidade, o tacho fritador a gás em inox de 6 litros é perfeito para frituras rápidas e uniformes. Fabricado em aço inoxidável, oferece alta durabilidade, fácil limpeza e excelente resistência à corrosão. Compacto e funcional, conta com queimador de alta performance que mantém a temperatura estável, garantindo alimentos crocantes e bem preparados.', 138, '[["Queimadores", "Alta pressão, em caulim de 120 mm"], ["A × L × P", "90 × 45 × 50 cm"], ["Corpo", "Aço inox"], ["Tacho", "Aço carbono esmaltado"], ["Peso bruto", "9 kg"], ["Acompanha", "Mangueira e válvula de alta pressão"]]', '', '', '', null, ''),
  ('sanduicheiras', 'Sanduicheira 40 cm com prensa', '4040SNDP', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 139, '[["A × L × P", "43 × 13 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Aço carbono, com puxador em madeira"], ["Peso", "11 kg"]]', '', '', '', 225.19, ''),
  ('sanduicheiras', 'Sanduicheira 60 cm com prensa', '4060SNDP', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 140, '[["A × L × P", "63 × 13 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Aço carbono, com puxador em madeira"], ["Peso", "13 kg"]]', '', '', '', 276.61, ''),
  ('sanduicheiras', 'Sanduicheira 80 cm com prensa', '4080SNDP', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 141, '[["A × L × P", "83 × 13 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Aço carbono, com puxador em madeira"], ["Peso", "15 kg"]]', '', '', '', 314.35, ''),
  ('sanduicheiras', 'Sanduicheira 40 cm sem prensa', '4040SND', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 142, '[["A × L × P", "43 × 10 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Não acompanha"], ["Peso", "7 kg"]]', '', '', '', 172.82, ''),
  ('sanduicheiras', 'Sanduicheira 60 cm sem prensa', '4060SND', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 143, '[["A × L × P", "63 × 10 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Não acompanha"], ["Peso", "9 kg"]]', '', '', '', 225.01, ''),
  ('sanduicheiras', 'Sanduicheira 80 cm sem prensa', '4080SND', 'Aço inox', '#9AA0A6', 'A sanduicheira JCN Gourmet é um equipamento para produzir sanduíches quentes a gás. Prensa em aço carbono, que proporciona maior temperatura e maior qualidade no alimento; o corpo externo é confeccionado em aço inox, sinônimo de qualidade e durabilidade.', 144, '[["A × L × P", "83 × 10 × 45 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/8 × 3,10 mm"], ["Prensa", "Não acompanha"], ["Peso", "11 kg"]]', '', '', '', 265.31, ''),
  ('chapeiras', 'Chapa bifeteira Classic 450', '4550CL', 'Aço inox', '#9AA0A6', 'A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.', 145, '[["L × A × P", "45,5 × 24 × 52 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 3/16 × 4,76 mm"], ["Peso", "16 kg"]]', '', '', '', 378.13, ''),
  ('chapeiras', 'Chapa bifeteira Classic 650', '6550CL', 'Aço inox', '#9AA0A6', 'A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.', 146, '[["L × A × P", "65,5 × 24 × 52 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 3/16 × 4,76 mm"], ["Peso", "21 kg"]]', '', '', '', 485.38, ''),
  ('chapeiras', 'Chapa bifeteira Classic 850', '8550CL', 'Aço inox', '#9AA0A6', 'A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.', 147, '[["L × A × P", "85 × 24 × 52 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 3/16 × 4,76 mm"], ["Peso", "26 kg"]]', '', '', '', 589.09, ''),
  ('chapeiras', 'Chapa bifeteira Classic 1050', '1050CL', 'Aço inox', '#9AA0A6', 'A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.', 148, '[["L × A × P", "105,5 × 24 × 52 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/4 × 6,3 mm"], ["Peso", "33 kg"]]', '', '', '', 797.45, ''),
  ('chapeiras', 'Chapa bifeteira Classic 1250', '1250CL', 'Aço inox', '#9AA0A6', 'A chapeira JCN Gourmet é um equipamento utilizado em bares, lanchonetes e demais localidades para produzir lanches e porções quentes a gás. Estrutura em aço inoxidável escovado, que facilita a limpeza, e chapa inteiriça de aço carbono SAE 1020: o calor é retido por mais tempo, alcançando a temperatura necessária para o bom selamento da carne.', 149, '[["L × A × P", "125,5 × 24 × 52 cm"], ["Corpo", "Aço inox"], ["Chapa", "Aço 1/4 × 6,3 mm"], ["Peso", "48 kg"]]', '', '', '', 919.54, ''),
  ('discos-de-arado', 'Disco de arado 30 cm', 'FD001', 'Aço carbono', '#2B2B2B', 'Ideal para uma culinária mais rústica, o disco de arado em aço carbono proporciona preparo uniforme, sabor caseiro e alta resistência. Perfeito para carnes, legumes e receitas feitas no fogo.', 150, '[["Cabo", "Madeira"], ["Disco", "Aço carbono"], ["Espessura do disco", "2 mm"], ["Tamanho do disco", "30 cm"], ["Disco e cabo", "60 cm"]]', '', '', '', 51.59, ''),
  ('discos-de-arado', 'Disco de arado 36 cm', 'FD002', 'Aço carbono', '#2B2B2B', 'Ideal para uma culinária mais rústica, o disco de arado em aço carbono proporciona preparo uniforme, sabor caseiro e alta resistência. Perfeito para carnes, legumes e receitas feitas no fogo.', 151, '[["Cabo", "Madeira"], ["Disco", "Aço carbono"], ["Espessura do disco", "2 mm"], ["Tamanho do disco", "36 cm"], ["Disco e cabo", "60 cm"]]', '', '', '', 65.87, ''),
  ('discos-de-arado', 'Disco de arado 40 cm', 'FD004', 'Aço carbono', '#2B2B2B', 'Ideal para uma culinária mais rústica, o disco de arado em aço carbono proporciona preparo uniforme, sabor caseiro e alta resistência. Perfeito para carnes, legumes e receitas feitas no fogo.', 152, '[["Cabo", "Madeira"], ["Disco", "Aço carbono"], ["Espessura do disco", "2 mm"], ["Tamanho do disco", "40 cm"], ["Disco e cabo", "60 cm"]]', '', '', '', 69.96, ''),
  ('discos-de-arado', 'Disco de arado 47 cm', 'FD003', 'Aço carbono', '#2B2B2B', 'Ideal para uma culinária mais rústica, o disco de arado em aço carbono proporciona preparo uniforme, sabor caseiro e alta resistência. Perfeito para carnes, legumes e receitas feitas no fogo.', 153, '[["Cabo", "Madeira"], ["Disco", "Aço carbono"], ["Espessura do disco", "2 mm"], ["Tamanho do disco", "47 cm"], ["Disco e cabo", "60 cm"]]', '', '', '', 94.34, ''),
  ('picadores', 'Picador de legumes pequeno', 'FP001', 'Preto craqueado', '#2B2B2B', 'Os cortadores de legumes JCN Gourmet facilitam na hora de fazer aquelas batatas palito crocantes e saborosas. Ideais para cortar legumes e frutas em palitos e cubos, para uso doméstico, comercial e industrial. É lavável, desmontável e possui base antiderrapante.', 154, '[["Uso", "Residencial"], ["Corpo", "Alumínio fundido"], ["Cabo", "Alumínio fundido"], ["Basculante", "Alumínio fundido"], ["Pintura", "Eletrostática (preto craqueado)"], ["Colunas", "Tubo de aço 5/8"], ["Facas", "Aço inox, padrão 10 mm"], ["Fixação", "Pés em tubo de aço 1/2"], ["A × L × P", "39 × 18 × 27,5 cm"], ["Peso líquido", "0,955 kg"]]', '', '', '', 71.72, ''),
  ('picadores', 'Picador de legumes médio', 'FP002', 'Preto craqueado', '#2B2B2B', 'Os cortadores de legumes JCN Gourmet facilitam na hora de fazer aquelas batatas palito crocantes e saborosas. Ideais para cortar legumes e frutas em palitos e cubos, para uso doméstico, comercial e industrial. É lavável, desmontável e possui base antiderrapante.', 155, '[["Uso", "Comercial"], ["Corpo", "Alumínio fundido"], ["Cabo", "Alumínio fundido"], ["Basculante", "Alumínio fundido"], ["Pintura", "Eletrostática (preto craqueado)"], ["Colunas", "Tubo de aço 5/8"], ["Facas", "Aço inox, padrão 10 mm"], ["Fixação", "Pés em tubo de aço 1/2"], ["A × L × P", "51 × 29 × 38 cm"], ["Peso líquido", "1,975 kg"]]', '', '', '', 122.71, ''),
  ('picadores', 'Picador de legumes grande', 'FP003', 'Preto craqueado', '#2B2B2B', 'Os cortadores de legumes JCN Gourmet facilitam na hora de fazer aquelas batatas palito crocantes e saborosas. Ideais para cortar legumes e frutas em palitos e cubos, para uso doméstico, comercial e industrial. É lavável, desmontável e possui base antiderrapante.', 156, '[["Uso", "Comercial"], ["Corpo", "Alumínio fundido"], ["Cabo", "Alumínio fundido"], ["Basculante", "Alumínio fundido"], ["Pintura", "Eletrostática (preto craqueado)"], ["Colunas", "Tubo de aço 5/8"], ["Facas", "Aço inox, padrão 10 mm"], ["Fixação", "Tripé soldado em tubo de aço 5/8"], ["A × L × P", "1,14 × 32 × 47 cm"], ["Peso líquido", "3,400 kg"]]', '', '', '', 138.72, ''),
  ('engenhos', 'Engenho com 2 rolos', 'P-30', 'Azul', '#27356B', 'Engenho para cana, usado para extrair caldo de cana e destinado ao uso doméstico. Moendas (rolos) em alumínio, engrenagens em ferro fundido e laterais em chapa de aço.', 157, '[["A × L × P", "28 × 25 × 25 cm"], ["Peso", "5,120 kg"], ["Material", "Moenda em alumínio, lateral em chapa de aço, engrenagem em ferro fundido"]]', '', '', '', 190.00, ''),
  ('engenhos', 'Engenho com 3 rolos', 'P-60', 'Azul', '#27356B', 'Engenho para cana, usado para extrair caldo de cana e destinado ao uso doméstico. Moendas (rolos) em alumínio, engrenagens em ferro fundido e laterais em chapa de aço.', 158, '[["A × L × P", "25 × 25 × 28 cm"], ["Peso", "9,010 kg"], ["Material", "Moenda em alumínio, lateral em chapa de aço, engrenagem em ferro fundido"], ["Produção média", "40 litros por hora"]]', '', '', '', 287.63, ''),
  ('mesas-de-panificacao', 'Mesa de panificação com paneleiro MPI 1360P', 'MPI-1360P', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 159, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Sim"], ["Medidas", "1300 × 600 × 840 mm"]]', '', '', '', 476.05, ''),
  ('mesas-de-panificacao', 'Mesa de panificação com paneleiro MPI 1660P', 'MPI-1660P', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 160, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Sim"], ["Medidas", "1600 × 600 × 840 mm"]]', '', '', '', 541.37, ''),
  ('mesas-de-panificacao', 'Mesa de panificação com paneleiro MPI 1860P', 'MPI-1860P', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 161, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Sim"], ["Medidas", "1800 × 600 × 840 mm"]]', '', '', '', 604.68, ''),
  ('mesas-de-panificacao', 'Mesa de panificação sem paneleiro MPI 1360', 'MPI-1360', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 162, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Não"], ["Medidas", "1300 × 600 × 840 mm"]]', '', '', '', 408.29, ''),
  ('mesas-de-panificacao', 'Mesa de panificação sem paneleiro MPI 1660', 'MPI-1660', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 163, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Não"], ["Medidas", "1600 × 600 × 840 mm"]]', '', '', '', 451.90, ''),
  ('mesas-de-panificacao', 'Mesa de panificação sem paneleiro MPI 1860', 'MPI-1860', 'Inox', '#9AA0A6', 'Prática, segura e higiênica: a escolha certa para a sua panificadora. A mesa de panificação em aço inox não contamina os alimentos, não retém odores e é fácil de limpar. Ideal para quem busca qualidade e confiança no preparo diário.', 164, '[["Tampo", "Aço inox 430"], ["Estrutura", "Aço carbono"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Paneleiro", "Não"], ["Medidas", "1800 × 600 × 840 mm"]]', '', '', '', 512.48, ''),
  ('lanca-chamas', 'Lança-chamas 1 m', 'LC1M', 'Preto', '#231F20', 'Versátil, potente e durável. O maçarico lança-chamas sapecador é ideal para sapecar carnes, aquecer ferragens, aplicar manta líquida e muito mais. É a ferramenta certa para cozinha, agro e construção.', 165, '[["Cabo", "Plástico ABS"], ["Bocal", "Zincado"], ["Mangueira", "1 metro"], ["Registro", "Fechamento de gás"], ["Registros", "1"]]', '', '', '', 55.68, ''),
  ('lanca-chamas', 'Lança-chamas 2 m', 'LC2M', 'Preto', '#231F20', 'Versátil, potente e durável. O maçarico lança-chamas sapecador é ideal para sapecar carnes, aquecer ferragens, aplicar manta líquida e muito mais. É a ferramenta certa para cozinha, agro e construção.', 166, '[["Cabo", "Plástico ABS"], ["Bocal", "Zincado"], ["Mangueira", "2 metros"], ["Registro", "Fechamento de gás"], ["Registros", "2"]]', '', '', '', 46.35, ''),
  ('lanca-chamas', 'Mangueira de alta pressão', 'KIT-AP', 'Preto', '#231F20', 'Ideal para fogões de alta pressão. Produto resistente, com tubo interno em PVC flexível e registro de fechamento de gás, garantindo segurança e praticidade no uso.', 167, '[["Tubo interno", "PVC flexível"], ["Registro", "Fechamento de gás"], ["Uso", "Fogões de alta pressão"]]', '', '', '', 18.20, ''),
  ('banquetas', 'Banqueta alta branca', 'BQA33CE-BR', 'Branco', '#F4F4F2', 'A banqueta alta é a escolha ideal para quem busca praticidade, conforto e um visual moderno para diversos ambientes. Perfeita para cozinhas, áreas gourmet, bares, bancadas e espaços comerciais. Com design funcional e estrutura resistente, oferece estabilidade e conforto no uso diário. Suas dimensões proporcionam uma altura ideal para bancadas altas.', 168, '[["Altura", "95 cm"], ["Largura", "38 cm"], ["Peso", "4,200 kg"], ["Encosto", "Sim"], ["Pés", "Emborrachados"], ["Código na tabela de preços", "CBA32EPC"]]', '', '', '', 96.55, ''),
  ('banquetas', 'Banqueta alta preta', 'BQA33CE-PT', 'Preto', '#231F20', 'A banqueta alta é a escolha ideal para quem busca praticidade, conforto e um visual moderno para diversos ambientes. Perfeita para cozinhas, áreas gourmet, bares, bancadas e espaços comerciais. Com design funcional e estrutura resistente, oferece estabilidade e conforto no uso diário. Suas dimensões proporcionam uma altura ideal para bancadas altas.', 169, '[["Altura", "95 cm"], ["Largura", "38 cm"], ["Peso", "4,200 kg"], ["Encosto", "Sim"], ["Pés", "Emborrachados"], ["Código na tabela de preços", "CBA32EPC"]]', '', '', '', 96.55, ''),
  ('banquetas', 'Banqueta baixa preta', 'BQB33CE-PT', 'Preto', '#231F20', 'Banqueta baixa de design moderno, ideal para pé de balcão. Compacta na medida certa, une conforto, praticidade e um visual contemporâneo que combina com qualquer área gourmet. Assento em napa.', 170, '[["Altura", "45 cm"], ["Largura", "30 cm"], ["Profundidade", "42 cm"], ["Assento", "Napa"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Código na tabela de preços", "006.01.0001"]]', '', '', '', 56.35, ''),
  ('banquetas', 'Banqueta baixa branca', 'BQB33CE-BR', 'Branco', '#F4F4F2', 'Banqueta baixa de design moderno, ideal para pé de balcão. Compacta na medida certa, une conforto, praticidade e um visual contemporâneo que combina com qualquer área gourmet. Assento em napa.', 171, '[["Altura", "45 cm"], ["Largura", "30 cm"], ["Profundidade", "42 cm"], ["Assento", "Napa"], ["Pintura", "Eletrostática"], ["Pés", "Emborrachados"], ["Código na tabela de preços", "006.01.0001"]]', '', '', '', 56.35, ''),
  ('cabideiros', 'Cabideiro branco', 'CAB-01', 'Branco', '#F4F4F2', 'O cabideiro em aço carbono combina resistência e praticidade no dia a dia, sendo ideal para pendurar roupas, bolsas e acessórios. Seu design se adapta a diferentes estilos de decoração, em halls, quartos ou escritórios.', 172, '[["Altura", "1,5 m"], ["Largura", "23 cm"], ["Material", "Aço carbono"]]', '', '', '', 120.39, ''),
  ('cabideiros', 'Cabideiro preto', 'CAB-02', 'Preto', '#231F20', 'O cabideiro em aço carbono combina resistência e praticidade no dia a dia, sendo ideal para pendurar roupas, bolsas e acessórios. Seu design se adapta a diferentes estilos de decoração, em halls, quartos ou escritórios.', 173, '[["Altura", "1,5 m"], ["Largura", "23 cm"], ["Material", "Aço carbono"]]', '', '', '', 120.39, ''),
  ('prateleiras', 'Prateleira de 3 bandejas', 'PRAT-3', 'Sem cor informada', '#9AA0A6', '', 174, '[["Bandejas", "3"]]', '', '', '', 86.70, ''),
  ('prateleiras', 'Prateleira de 4 bandejas', '', 'Sem cor informada', '#9AA0A6', '', 175, '[["Bandejas", "4"]]', '', '', '', 100.80, ''),
  ('prateleiras', 'Prateleira de 5 bandejas', '', 'Sem cor informada', '#9AA0A6', '', 176, '[["Bandejas", "5"]]', '', '', '', 116.70, ''),
  ('portao-pet', 'Portão pet 60 cm', 'PORT-PET', 'Sem cor informada', '#9AA0A6', '', 177, '[["Folha", "60 cm"], ["Extensor", "20 cm"]]', '', '', '', 82.94, '');

insert into produtos (id, categoria_id, nome, codigo, cor, cor_hex, historia, ordem, especificacoes, grupo, grelha, subgrupo)
select v.id, c.id, v.nome, nullif(v.codigo, ''), v.cor, v.hex, nullif(v.historia, ''), v.ordem, v.specs::jsonb,
       nullif(v.grupo, ''), nullif(v.grelha, '')::tipo_grelha, nullif(v.subgrupo, '')
from _carga v join categorias c on c.slug = v.slug;

insert into precos (produto_id, valor) select id, preco from _carga where preco is not null;

insert into fornos_do_fogao (fogao_id, forno_id, ordem)
select v.id, f.id, t.ordem
from _carga v cross join lateral unnest(string_to_array(v.fornos, ',')) with ordinality as t (codigo, ordem)
join _carga f on f.codigo = t.codigo
where v.fornos <> '';
drop table _carga;
-- <<< catálogo 2026

-- Primeiro administrador: crie o usuário em Authentication > Users e rode
--   insert into perfis (id, nome, email, papel, empresa)
--   values ('<uuid do usuário>', 'Nome', 'email@jcngourmet.com.br', 'admin', 'JCN Gourmet');
