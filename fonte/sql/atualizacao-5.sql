-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 5 DO BANCO: AVISOS NO TELEGRAM
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
-- O próprio banco manda as mensagens pelo robô do Telegram da JCN:
--   vendas (pedido novo, pagamento confirmado, loja que virou cliente, retorno de ligação na hora pedida),
--   financeiro (PIX para conferir, boleto para aprovar, parcelas do dia), RH (currículo novo, reunião chegando)
--   e um resumo todo dia às 8h. O código do robô fica guardado no cofre do Supabase (Vault), nunca no site.
-- =====================================================================
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- 1. O RETORNO DA LIGAÇÃO PASSA A TER HORA
alter table ligacoes add column if not exists retornar_hora time;

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
  insert into ligacoes (prospect_id, resultado, tratativa, retornar_em, retornar_hora)
  values (pr.id, p->>'resultado', trim(p->>'tratativa'), nullif(p->>'retornar_em', '')::date, nullif(p->>'retornar_hora', '')::time)
  returning * into lg;
  return jsonb_build_object('prospect_id', pr.id, 'ligacao_id', lg.id);
end $$;
revoke all on function registrar_ligacao(jsonb) from public, anon;
grant execute on function registrar_ligacao(jsonb) to authenticated;

-- 2. QUEM RECEBE: grupos e pessoas do Telegram, cada um com os setores que quer acompanhar
create table if not exists tg_destinos (
  id         uuid primary key default gen_random_uuid(),
  chat_id    bigint not null unique,
  nome       text not null,
  tipo       text not null default 'pessoa' check (tipo in ('pessoa', 'grupo')),
  setores    text[] not null default '{}' check (setores <@ array['vendas', 'financeiro', 'rh', 'tudo']),
  perfil_id  uuid references perfis (id) on delete set null,      -- avisos pessoais (retornos de ligação, pagamento dos pedidos dela)
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);
create table if not exists tg_codigos (
  codigo     text primary key,
  nome       text not null,
  setores    text[] not null default '{}',
  perfil_id  uuid references perfis (id) on delete cascade,
  criado_por uuid references perfis (id) default auth.uid(),
  expira     timestamptz not null default now() + interval '2 days'
);
create table if not exists tg_fila (
  id          bigint generated always as identity primary key,
  chat_id     bigint not null,
  texto       text not null,
  chave       text,                                   -- para desmarcar um lembrete que mudou (reunião remarcada, novo retorno)
  enviar_em   timestamptz not null default now(),
  enviado_em  timestamptz,
  req_id      bigint,
  status_http int,
  criado_em   timestamptz not null default now()
);
create index if not exists tg_fila_pendente on tg_fila (enviar_em) where enviado_em is null;
create index if not exists tg_fila_chave on tg_fila (chave) where enviado_em is null;
create table if not exists tg_estado (id int primary key default 1 check (id = 1), ultimo_update bigint not null default 0, req_id bigint, req_em timestamptz);
insert into tg_estado (id) values (1) on conflict do nothing;

alter table tg_destinos enable row level security;
alter table tg_codigos enable row level security;
alter table tg_fila enable row level security;
alter table tg_estado enable row level security;
drop policy if exists tg_destinos_admin on tg_destinos; create policy tg_destinos_admin on tg_destinos for all to authenticated using (sou_admin()) with check (sou_admin());
drop policy if exists tg_destinos_meus on tg_destinos;  create policy tg_destinos_meus on tg_destinos for select to authenticated using (perfil_id = auth.uid());
drop policy if exists tg_codigos_admin on tg_codigos;   create policy tg_codigos_admin on tg_codigos for all to authenticated using (sou_admin()) with check (sou_admin());
revoke all on tg_destinos, tg_codigos, tg_fila, tg_estado from anon;
revoke all on tg_fila, tg_estado from authenticated;
grant select, insert, update, delete on tg_destinos, tg_codigos to authenticated;

-- 3. FUNÇÕES DE APOIO
create or replace function tg_token() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'telegram_token' order by created_at desc limit 1
$$;
revoke all on function tg_token() from public, anon, authenticated;

create or replace function tg_esc(t text) returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;
create or replace function tg_brl(v numeric) returns text language sql immutable as $$
  select 'R$ ' || replace(replace(replace(to_char(coalesce(v, 0), 'FM999G999G990D00'), ',', '#'), '.', ','), '#', '.')
$$;
create or replace function tg_tel(t text) returns text language sql immutable as $$
  select case when length(t) = 11 then '(' || substr(t, 1, 2) || ') ' || substr(t, 3, 5) || '-' || substr(t, 8)
              when length(t) = 10 then '(' || substr(t, 1, 2) || ') ' || substr(t, 3, 4) || '-' || substr(t, 7) else coalesce(t, '') end
$$;

-- coloca a mensagem na fila para cada destino do setor (e, se houver, para a pessoa)
create or replace function tg_avisar(p_setor text, p_texto text, p_chave text default null, p_quando timestamptz default now(), p_perfil uuid default null)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  insert into tg_fila (chat_id, texto, chave, enviar_em)
  select distinct d.chat_id, p_texto, p_chave, p_quando from tg_destinos d
   where d.ativo and ((p_setor is not null and d.setores && array[p_setor, 'tudo']) or (p_perfil is not null and d.perfil_id = p_perfil));
  get diagnostics n = row_count;
  return n;
end $$;
-- aviso pessoal: vai para o Telegram da pessoa; se ela não tiver, vai para o setor
create or replace function tg_avisar_pessoa(p_perfil uuid, p_setor text, p_texto text, p_chave text default null, p_quando timestamptz default now())
returns int language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from tg_destinos where ativo and perfil_id = p_perfil) then return tg_avisar(null, p_texto, p_chave, p_quando, p_perfil); end if;
  return tg_avisar(p_setor, p_texto, p_chave, p_quando);
end $$;
revoke all on function tg_avisar(text, text, text, timestamptz, uuid), tg_avisar_pessoa(uuid, text, text, text, timestamptz) from public, anon, authenticated;

-- 4. ENVIO (roda a cada minuto)
create or replace function tg_enviar() returns int
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare tok text := tg_token(); m record; n int := 0;
begin
  -- resultado dos envios anteriores
  update tg_fila f set status_http = r.status_code from net._http_response r where f.req_id = r.id and f.status_http is null;
  if tok is null then return 0; end if;
  for m in select * from tg_fila where enviado_em is null and enviar_em <= now() order by enviar_em, id limit 25 for update skip locked loop
    if m.enviar_em < now() - interval '6 hours' then update tg_fila set enviado_em = now(), status_http = -1 where id = m.id; continue; end if;   -- lembrete que passou da hora: não manda
    update tg_fila set enviado_em = now(), req_id = net.http_post(
        url := 'https://api.telegram.org/bot' || tok || '/sendMessage',
        body := jsonb_build_object('chat_id', m.chat_id, 'text', m.texto, 'parse_mode', 'HTML', 'disable_web_page_preview', true))
     where id = m.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 5. LIGAR UM GRUPO OU UMA PESSOA: a pessoa manda o código para o robô e o banco reconhece (roda a cada minuto)
create or replace function tg_receber() returns int
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare tok text := tg_token(); e tg_estado; r record; u jsonb; msg jsonb; chat jsonb; cod text; c tg_codigos; maior bigint; n int := 0;
begin
  if tok is null then return 0; end if;
  select * into e from tg_estado where id = 1;
  maior := e.ultimo_update;
  if e.req_id is not null then
    select * into r from net._http_response where id = e.req_id;
    if not found then
      if e.req_em > now() - interval '3 minutes' then return 0; end if;     -- resposta ainda não chegou
    elsif r.status_code = 200 then
      for u in select * from jsonb_array_elements(coalesce((r.content::jsonb)->'result', '[]')) loop
        maior := greatest(maior, (u->>'update_id')::bigint);
        msg := coalesce(u->'message', u->'channel_post'); chat := msg->'chat';
        cod := upper(substring(coalesce(msg->>'text', '') from '(?i)(JCN-[A-Z0-9]{6})'));
        if cod is null then continue; end if;
        select * into c from tg_codigos where codigo = cod and expira > now();
        if c.codigo is null then
          insert into tg_fila (chat_id, texto) values ((chat->>'id')::bigint, 'Este código não vale mais. Gere outro no site da JCN Gourmet.');
          continue;
        end if;
        insert into tg_destinos (chat_id, nome, tipo, setores, perfil_id)
        values ((chat->>'id')::bigint, left(coalesce(c.nome, chat->>'title', chat->>'first_name', 'Telegram'), 120), case when chat->>'type' in ('group', 'supergroup', 'channel') then 'grupo' else 'pessoa' end, c.setores, c.perfil_id)
        on conflict (chat_id) do update set setores = (select array(select distinct x from unnest(tg_destinos.setores || excluded.setores) x)),
          perfil_id = coalesce(excluded.perfil_id, tg_destinos.perfil_id), ativo = true, nome = excluded.nome;
        delete from tg_codigos where codigo = cod;
        insert into tg_fila (chat_id, texto) values ((chat->>'id')::bigint, '✅ Pronto! ' || tg_esc(c.nome) || ' vai receber os avisos da JCN Gourmet aqui'
          || case when cardinality(c.setores) > 0 then ' (' || array_to_string(c.setores, ', ') || ')' else '' end || '.');
        n := n + 1;
      end loop;
    end if;
  end if;
  update tg_estado set ultimo_update = maior, req_em = now(),
    req_id = net.http_get(url := 'https://api.telegram.org/bot' || tok || '/getUpdates?timeout=0&allowed_updates=%5B%22message%22%2C%22channel_post%22%5D&offset=' || (maior + 1))
   where id = 1;
  return n;
end $$;
revoke all on function tg_enviar(), tg_receber() from public, anon, authenticated;

-- 6. O QUE GERA AVISO
-- pedido novo (no fim da transação, quando os itens já estão gravados)
create or replace function tg_pedido_novo() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare tot numeric; quem text; resp uuid;
begin
  select total into tot from pedidos_totais where id = new.id;
  select nome into quem from perfis where id = new.vendedor_id;
  resp := case when new.origem = 'ecommerce' then (select vendedor_id from perfis where id = new.vendedor_id) else new.vendedor_id end;
  perform tg_avisar('vendas', '🛒 <b>Pedido nº ' || new.numero || '</b> · ' || case new.origem when 'site' then 'loja do site' when 'ecommerce' then 'e-commerce' else 'venda interna' end
    || E'\nCliente: ' || tg_esc(new.cliente_nome) || case when trim(coalesce(new.cliente_cidade, '')) <> '' then ' (' || tg_esc(new.cliente_cidade) || ')' else '' end
    || E'\nTotal: ' || tg_brl(tot) || case when quem is not null then E'\nPor: ' || tg_esc(quem) else '' end
    || case when new.forma_pagamento = 'boleto' then E'\nPagamento: boleto ' || array_to_string(new.boleto_dias, '/') || ' dias' else '' end, 'pedido:' || new.id);
  if new.forma_pagamento = 'boleto' then
    perform tg_avisar('financeiro', '📄 <b>Boleto para aprovar</b> · pedido nº ' || new.numero || E'\nCliente: ' || tg_esc(new.cliente_nome) || E'\nTotal: ' || tg_brl(tot)
      || ' em ' || cardinality(new.boleto_dias) || 'x (' || array_to_string(new.boleto_dias, '/') || ' dias)' || case when quem is not null then E'\nVendedor: ' || tg_esc(quem) else '' end);
  end if;
  return null;
end $$;
drop trigger if exists tg_pedidos_novo on pedidos;
create constraint trigger tg_pedidos_novo after insert on pedidos deferrable initially deferred for each row execute function tg_pedido_novo();

create or replace function tg_pedido_mudou() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare tot numeric; resp uuid;
begin
  select total into tot from pedidos_totais where id = new.id;
  resp := case when new.origem = 'ecommerce' then (select vendedor_id from perfis where id = new.vendedor_id) else new.vendedor_id end;
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
drop trigger if exists tg_pedidos_mudou on pedidos;
create trigger tg_pedidos_mudou after update on pedidos for each row execute function tg_pedido_mudou();

-- ligações: loja que virou cliente e o retorno no dia e na hora que o cliente pediu
create or replace function tg_ligacao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare p prospects; quem text; quando timestamptz;
begin
  select * into p from prospects where id = new.prospect_id;
  select nome into quem from perfis where id = new.vendedor_id;
  delete from tg_fila where enviado_em is null and chave = 'retorno:' || new.prospect_id;     -- uma ligação nova substitui o retorno marcado antes
  if new.resultado = 'cliente' then
    perform tg_avisar('vendas', '🎉 <b>' || tg_esc(quem) || '</b> fechou com <b>' || tg_esc(p.loja) || '</b> (' || tg_esc(p.cidade) || '/' || p.uf || ')' || E'\n' || tg_esc(left(new.tratativa, 300)));
  end if;
  if new.retornar_em is not null then
    quando := (new.retornar_em + coalesce(new.retornar_hora, time '09:00')) at time zone 'America/Sao_Paulo';
    if quando > now() - interval '5 minutes' then
      perform tg_avisar_pessoa(new.vendedor_id, 'vendas', '📞 <b>Hora de retornar a ligação</b>' || case when new.retornar_hora is null then ' (hoje)' else ' (' || to_char(new.retornar_hora, 'HH24:MI') || ')' end
        || E'\nLoja: <b>' || tg_esc(p.loja) || '</b> · ' || tg_esc(p.cidade) || '/' || p.uf || case when p.comprador is not null then E'\nComprador: ' || tg_esc(p.comprador) else '' end
        || E'\nTelefone: ' || tg_tel(p.telefone) || E'\nÚltima conversa: ' || tg_esc(left(new.tratativa, 400)) || E'\n(registrado por ' || tg_esc(quem) || ')',
        'retorno:' || new.prospect_id, greatest(quando, now()));
    end if;
  end if;
  return null;
end $$;
drop trigger if exists tg_ligacoes on ligacoes;
create trigger tg_ligacoes after insert on ligacoes for each row execute function tg_ligacao();

-- RH: currículo novo e lembretes de reunião (1 hora e 15 minutos antes)
create or replace function tg_candidatura() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform tg_avisar('rh', '📋 <b>Novo currículo</b>' || E'\n' || tg_esc(new.nome) || ' · ' || tg_esc(new.area) || case when new.cargo is not null then ' (' || tg_esc(new.cargo) || ')' else '' end
    || E'\n' || tg_esc(new.cidade) || '/' || new.uf || ' · WhatsApp ' || tg_tel(new.telefone), 'cand:' || new.id, now() + interval '1 minute');
  return null;
end $$;
drop trigger if exists tg_candidaturas on candidaturas;
create trigger tg_candidaturas after insert on candidaturas for each row execute function tg_candidatura();

create or replace function tg_reuniao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare c candidaturas; t text; m int;
begin
  delete from tg_fila where enviado_em is null and chave = 'reuniao:' || new.id;
  if new.status <> 'agendada' then return null; end if;
  select * into c from candidaturas where id = new.candidatura_id;
  foreach m in array array[60, 15] loop
    if new.inicio - make_interval(mins => m) > now() then
      t := '⏰ <b>Reunião em ' || case when m = 60 then '1 hora' else '15 minutos' end || '</b> (' || to_char(new.inicio at time zone 'America/Sao_Paulo', 'HH24:MI') || ')'
        || E'\nCandidato: ' || tg_esc(c.nome) || ' · ' || tg_esc(c.area) || case when new.link is not null then E'\nLink: ' || tg_esc(new.link) else E'\nAinda sem link do Meet no site.' end;
      perform tg_avisar('rh', t, 'reuniao:' || new.id, new.inicio - make_interval(mins => m));
    end if;
  end loop;
  return null;
end $$;
drop trigger if exists tg_reunioes on reunioes;
create trigger tg_reunioes after insert or update of inicio, status, link on reunioes for each row execute function tg_reuniao();

-- 7. RESUMO DE TODO DIA, 8h
create or replace function tg_resumo() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date; t text; v record; n int; s numeric;
begin
  -- financeiro
  select count(*), coalesce(sum(valor), 0) into n, s from parcelas_boleto where recebida_em is null and vencimento <= hoje;
  t := '☀️ <b>Financeiro hoje</b>' || E'\nParcelas vencendo hoje ou atrasadas: ' || n || ' (' || tg_brl(s) || ')'
    || E'\nPIX para conferir: ' || (select count(*) from pedidos where forma_pagamento = 'pix' and pix_status = 'em_analise')
    || E'\nBoletos para aprovar: ' || (select count(*) from pedidos where boleto_status = 'pendente');
  perform tg_avisar('financeiro', t);
  -- vendas: retornos de hoje de cada vendedor
  for v in select l.vendedor_id, count(*) as q, string_agg(tg_esc(p.loja) || coalesce(' às ' || to_char(l.retornar_hora, 'HH24:MI'), ''), ', ' order by l.retornar_hora nulls last) as lojas
             from prospects p join lateral (select * from ligacoes x where x.prospect_id = p.id order by x.feita_em desc limit 1) l on true
            where p.proximo_contato = hoje and p.situacao not in ('cliente', 'sem_interesse', 'numero_errado') group by l.vendedor_id loop
    perform tg_avisar_pessoa(v.vendedor_id, 'vendas', '☀️ <b>Retornos de hoje</b> (' || v.q || ')' || E'\n' || v.lojas);
  end loop;
  -- RH
  select count(*) into n from reunioes where status = 'agendada' and (inicio at time zone 'America/Sao_Paulo')::date = hoje;
  t := '☀️ <b>RH hoje</b>' || E'\nReuniões marcadas para hoje: ' || n || E'\nCurrículos ainda não lidos: ' || (select count(*) from candidaturas where visto_em is null);
  perform tg_avisar('rh', t);
end $$;
revoke all on function tg_pedido_novo(), tg_pedido_mudou(), tg_ligacao(), tg_candidatura(), tg_reuniao(), tg_resumo() from public, anon, authenticated;

-- 8. O QUE A ADMINISTRAÇÃO USA PELO SITE
create or replace function tg_salvar_token(p_token text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare sid uuid;
begin
  if not sou_admin() then raise exception 'Só a administração configura o robô.' using errcode = '42501'; end if;
  if coalesce(trim(p_token), '') !~ '^[0-9]{6,12}:[A-Za-z0-9_-]{30,50}$' then raise exception 'Este código não parece ser o do BotFather (exemplo: 123456789:ABCdef...).'; end if;
  select id into sid from vault.secrets where name = 'telegram_token';
  if sid is null then perform vault.create_secret(trim(p_token), 'telegram_token', 'Robô do Telegram da JCN Gourmet');
  else perform vault.update_secret(sid, trim(p_token)); end if;
  update tg_estado set ultimo_update = 0, req_id = null where id = 1;
end $$;
create or replace function tg_status() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not sou_admin() then raise exception 'Só a administração.' using errcode = '42501'; end if;
  return jsonb_build_object('token', tg_token() is not null,
    'cron', exists (select 1 from cron.job where jobname = 'jcn-telegram'),
    'pendentes', (select count(*) from tg_fila where enviado_em is null),
    'enviados_24h', (select count(*) from tg_fila where enviado_em > now() - interval '1 day' and coalesce(status_http, 200) between 0 and 299),
    'falhas_24h', (select count(*) from tg_fila where enviado_em > now() - interval '1 day' and status_http >= 300),
    'ultimo_erro', (select r.content from tg_fila f join net._http_response r on r.id = f.req_id where f.status_http >= 300 order by f.enviado_em desc limit 1));
end $$;
-- código para ligar um grupo ou uma pessoa (vale 2 dias)
create or replace function tg_codigo(p_nome text, p_setores text[], p_perfil uuid default null) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare cod text := 'JCN-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
begin
  if not (sou_admin() or (p_perfil = auth.uid() and coalesce(p_setores, '{}') = '{}')) then raise exception 'Você não tem permissão.' using errcode = '42501'; end if;
  if not coalesce(p_setores, '{}') <@ array['vendas', 'financeiro', 'rh', 'tudo'] then raise exception 'Setor inválido.'; end if;
  delete from tg_codigos where expira < now();
  insert into tg_codigos (codigo, nome, setores, perfil_id) values (cod, left(coalesce(nullif(trim(p_nome), ''), 'Telegram'), 120), coalesce(p_setores, '{}'), p_perfil);
  return cod;
end $$;
create or replace function tg_testar(p_destino uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not sou_admin() then raise exception 'Só a administração.' using errcode = '42501'; end if;
  insert into tg_fila (chat_id, texto) select chat_id, '🔔 Teste de aviso da JCN Gourmet: está tudo certo com ' || tg_esc(nome) || '.' from tg_destinos where id = p_destino;
end $$;
revoke all on function tg_salvar_token(text), tg_status(), tg_codigo(text, text[], uuid), tg_testar(uuid) from public, anon;
grant execute on function tg_salvar_token(text), tg_status(), tg_codigo(text, text[], uuid), tg_testar(uuid) to authenticated;

-- 9. RELÓGIO: a cada minuto envia e recebe; às 8h (11h UTC) manda o resumo do dia
select cron.schedule('jcn-telegram', '* * * * *', $$select tg_receber(); select tg_enviar();$$);
select cron.schedule('jcn-telegram-resumo', '0 11 * * *', $$select tg_resumo();$$);

-- 10. CONFERÊNCIA: deve mostrar 3 tabelas e 2 tarefas no relógio
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('tg_destinos', 'tg_codigos', 'tg_fila')) as tabelas,
       (select count(*) from cron.job where jobname like 'jcn-telegram%') as tarefas;
