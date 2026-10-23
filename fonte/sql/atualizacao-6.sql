-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 6 DO BANCO: CURRÍCULOS PELO GRUPO DO RH NO TELEGRAM
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
-- Foto ou arquivo (PDF, Word) mandado no grupo do RH vira um currículo no site, com o arquivo guardado.
-- A legenda da primeira foto vira o nome (e o telefone, e-mail e cidade, se estiverem escritos).
-- Fotos sem legenda mandadas logo em seguida (até 3 minutos, pela mesma pessoa) entram no mesmo currículo.
-- Quem baixa o arquivo do Telegram e guarda no Supabase é a função "curriculo-telegram" (Edge Function).
-- =====================================================================

-- 1. CANDIDATURA QUE VEM DO TELEGRAM: os dados pessoais podem ficar para o RH completar
alter table candidaturas add column if not exists origem text not null default 'site';
alter table candidaturas add column if not exists arquivos jsonb not null default '[]';
alter table candidaturas add column if not exists tg_chat bigint;
alter table candidaturas add column if not exists tg_grupo text;
alter table candidaturas add column if not exists tg_autor bigint;
alter table candidaturas alter column email drop not null;
alter table candidaturas alter column telefone drop not null;
alter table candidaturas alter column cidade drop not null;
alter table candidaturas alter column uf drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'candidaturas_origem') then
    alter table candidaturas add constraint candidaturas_origem check (origem in ('site', 'telegram'));
  end if;
end $$;
-- os currículos que já vieram pelo site passam a ter o arquivo também na lista de arquivos
update candidaturas set arquivos = jsonb_build_array(jsonb_build_object('caminho', curriculo_caminho, 'nome', curriculo_nome, 'mime', curriculo_mime))
 where curriculo_caminho is not null and arquivos = '[]';
create or replace function anexar_curriculo(p_id uuid, p_chave uuid, p_caminho text, p_nome text, p_mime text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c candidaturas;
begin
  select * into c from candidaturas where id = p_id and chave = p_chave;
  if c.id is null then raise exception 'Candidatura não encontrada.'; end if;
  if c.curriculo_caminho is not null then raise exception 'O currículo desta candidatura já foi enviado.'; end if;
  if p_caminho not like 'curriculos/' || p_chave::text || '/%' or length(p_caminho) > 300 then raise exception 'Arquivo fora da pasta da candidatura.'; end if;
  update candidaturas set curriculo_caminho = p_caminho, curriculo_nome = left(coalesce(p_nome, 'curriculo'), 160), curriculo_mime = left(p_mime, 120),
    arquivos = jsonb_build_array(jsonb_build_object('caminho', p_caminho, 'nome', left(coalesce(p_nome, 'curriculo'), 160), 'mime', left(p_mime, 120)))
   where id = p_id;
end $$;
revoke all on function anexar_curriculo(uuid, uuid, text, text, text) from public;
grant execute on function anexar_curriculo(uuid, uuid, text, text, text) to anon, authenticated;

-- a lista de arquivos e a origem só mudam pelo próprio sistema (ou pelo RH Administrativo)
create or replace function tocar_candidatura() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if (new.chave, new.criado_em) is distinct from (old.chave, old.criado_em)
     or (new.curriculo_caminho is distinct from old.curriculo_caminho and old.curriculo_caminho is not null and auth.uid() is not null)
     or ((new.arquivos, new.origem, new.tg_chat, new.tg_grupo, new.tg_autor) is distinct from (old.arquivos, old.origem, old.tg_chat, old.tg_grupo, old.tg_autor) and auth.uid() is not null) then
    if not sou_rh_admin() then raise exception 'Estes dados da candidatura não mudam.'; end if;
  end if;
  return new;
end $$;

-- currículo do Telegram não gera o aviso de "currículo novo" (quem mandou foi o próprio RH)
create or replace function tg_candidatura() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.origem = 'telegram' then return null; end if;
  perform tg_avisar('rh', '📋 <b>Novo currículo</b>' || E'\n' || tg_esc(new.nome) || ' · ' || tg_esc(new.area) || case when new.cargo is not null then ' (' || tg_esc(new.cargo) || ')' else '' end
    || E'\n' || tg_esc(coalesce(new.cidade, '')) || '/' || coalesce(new.uf, '') || ' · WhatsApp ' || tg_tel(new.telefone), 'cand:' || new.id, now() + interval '1 minute');
  return null;
end $$;

-- 2. SEGREDO ENTRE O BANCO E A FUNÇÃO (gerado aqui, guardado no cofre)
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'tg_cv_segredo') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'tg_cv_segredo', 'Segredo da função curriculo-telegram');
  end if;
end $$;
create or replace function tg_cv_config() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('token', tg_token(), 'segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'tg_cv_segredo' limit 1))
$$;
revoke all on function tg_cv_config() from public, anon, authenticated;
grant execute on function tg_cv_config() to service_role;

-- 3. O BANCO CHAMA A FUNÇÃO DO SUPABASE PARA CADA FOTO OU ARQUIVO (e guarda a última chamada, para a tela de avisos conferir)
alter table tg_estado add column if not exists cv_req bigint;
alter table tg_estado add column if not exists cv_em timestamptz;
create or replace function tg_cv_pedir(msg jsonb) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare f jsonb := case when msg ? 'photo' then (msg->'photo')->(jsonb_array_length(msg->'photo') - 1) else msg->'document' end;
begin
  update tg_estado set cv_em = now(), cv_req = net.http_post(
    url := 'https://kazrmgbqrfanhbtdxidi.supabase.co/functions/v1/curriculo-telegram',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-jcn-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'tg_cv_segredo' limit 1)),
    body := jsonb_build_object('chat_id', msg->'chat'->'id', 'message_id', msg->'message_id', 'autor', msg->'from'->'id', 'autor_nome', concat_ws(' ', msg->'from'->>'first_name', msg->'from'->>'last_name'),
      'grupo', msg->>'media_group_id', 'legenda', msg->>'caption', 'file_id', f->>'file_id', 'tamanho', f->'file_size',
      'nome_arquivo', coalesce(f->>'file_name', 'foto-' || (msg->>'message_id') || '.jpg'), 'mime', coalesce(f->>'mime_type', 'image/jpeg')),
    timeout_milliseconds := 20000) where id = 1;
end $$;
revoke all on function tg_cv_pedir(jsonb) from public, anon, authenticated;

create or replace function cv_texto_ok(p_nome text) returns text
language sql immutable set search_path = public, pg_temp as $$
  select '✅ Currículo cadastrado no site: <b>' || tg_esc(p_nome) || '</b>'
    || case when p_nome like 'Currículo do Telegram%' then E'\nDica: escreva o nome da pessoa na legenda da foto para ele já entrar com o nome.' else '' end
    || E'\nFotos sem legenda mandadas em seguida entram no mesmo currículo.'
$$;
-- 4. A FUNÇÃO DEVOLVE O ARQUIVO GUARDADO: aqui o currículo é criado (ou a página é juntada)
-- As fotos de um álbum chegam ao mesmo tempo: a trava por grupo do Telegram faz uma esperar a outra,
-- para todas caírem no mesmo currículo. Se a foto com legenda chegar depois, a legenda vale do mesmo jeito.
create or replace function cv_legenda(leg text) returns jsonb
language plpgsql immutable set search_path = public, pg_temp as $$
declare linha1 text := nullif(trim(split_part(coalesce(leg, ''), E'\n', 1)), ''); tel text;
begin
  tel := regexp_replace(coalesce(substring(coalesce(leg, '') from '\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}'), ''), '\D', '', 'g');
  if linha1 is not null and (linha1 ~ '\d{4}' or linha1 ~ '@') then linha1 := null; end if;
  return jsonb_build_object('nome', left(linha1, 160), 'telefone', case when length(tel) between 10 and 11 then tel end,
    'email', lower(substring(coalesce(leg, '') from '([^@\s]+@[^@\s]+\.[^@\s]+)')),
    'cidade', trim(substring(coalesce(leg, '') from '([A-Za-zÀ-ú'' ]{3,40})\s*[/-]\s*[A-Z]{2}\M')),
    'uf', substring(coalesce(leg, '') from '[A-Za-zÀ-ú'' ]{3,40}\s*[/-]\s*([A-Z]{2})\M'));
end $$;

create or replace function cv_do_telegram(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare c candidaturas; leg text := nullif(trim(coalesce(p->>'legenda', '')), ''); d jsonb := cv_legenda(leg); novo boolean := false; provisorio boolean;
  quem text := coalesce(nullif(trim(p->>'autor_nome'), ''), 'RH');
  arq jsonb := jsonb_build_object('caminho', p->>'caminho', 'nome', left(coalesce(p->>'nome_arquivo', regexp_replace(p->>'caminho', '^.*/', ''), 'arquivo'), 160),
                                  'mime', left(coalesce(p->>'mime', ''), 120), 'msg', (p->>'message_id')::bigint);
begin
  perform pg_advisory_xact_lock(hashtextextended('cv-telegram:' || (p->>'chat_id'), 0));     -- uma página por vez, por grupo
  if p->>'grupo' is not null then
    select * into c from candidaturas where tg_grupo = p->>'grupo' and tg_chat = (p->>'chat_id')::bigint order by criado_em limit 1;
  end if;
  if c.id is null and leg is null then        -- foto sem legenda logo depois de outra, da mesma pessoa: página do mesmo currículo
    select * into c from candidaturas where origem = 'telegram' and tg_chat = (p->>'chat_id')::bigint and tg_autor = (p->>'autor')::bigint
       and atualizado_em > now() - interval '3 minutes' order by atualizado_em desc limit 1;
  end if;
  if c.id is not null and exists (select 1 from jsonb_array_elements(c.arquivos) x where x->>'caminho' = p->>'caminho') then
    return jsonb_build_object('id', c.id, 'nome', c.nome, 'novo', false, 'paginas', jsonb_array_length(c.arquivos));    -- o Telegram mandou de novo: nada muda
  end if;
  if c.id is null then
    insert into candidaturas (origem, nome, email, telefone, cidade, uf, area, mensagem, tg_chat, tg_grupo, tg_autor, status)
    values ('telegram', coalesce(d->>'nome', 'Currículo do Telegram ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI')),
            d->>'email', d->>'telefone', d->>'cidade', d->>'uf', 'A definir',
            left('Enviado pelo Telegram por ' || quem || coalesce(E':\n' || leg, ''), 2000),
            (p->>'chat_id')::bigint, p->>'grupo', (p->>'autor')::bigint, 'novo')
    returning * into c;
    novo := true;
  elsif leg is not null and c.nome like 'Currículo do Telegram%' then
    -- a página com a legenda chegou depois de outra do mesmo álbum: os dados da legenda passam a valer
    update candidaturas set nome = coalesce(d->>'nome', nome), telefone = coalesce(telefone, d->>'telefone'), email = coalesce(email, d->>'email'),
      cidade = coalesce(cidade, d->>'cidade'), uf = coalesce(uf, d->>'uf'), mensagem = left('Enviado pelo Telegram por ' || quem || E':\n' || leg, 2000)
     where id = c.id returning * into c;
    update tg_fila set texto = cv_texto_ok(c.nome) where chave = 'cvok:' || c.id and enviado_em is null;
    if not found and c.nome not like 'Currículo do Telegram%' then
      insert into tg_fila (chat_id, texto) values ((p->>'chat_id')::bigint, '✏️ Nome do currículo atualizado pela legenda: <b>' || tg_esc(c.nome) || '</b>');
    end if;
  end if;
  -- páginas na ordem em que foram mandadas no Telegram; a primeira é a do currículo principal
  update candidaturas set arquivos = (select jsonb_agg(x order by (x->>'msg')::bigint nulls first) from jsonb_array_elements(arquivos || arq) x)
   where id = c.id returning * into c;
  update candidaturas set curriculo_caminho = arquivos->0->>'caminho', curriculo_nome = arquivos->0->>'nome', curriculo_mime = arquivos->0->>'mime'
   where id = c.id returning * into c;
  if novo then
    insert into tg_fila (chat_id, texto, chave) values ((p->>'chat_id')::bigint, cv_texto_ok(c.nome), 'cvok:' || c.id);
  end if;
  return jsonb_build_object('id', c.id, 'nome', c.nome, 'novo', novo, 'paginas', jsonb_array_length(c.arquivos));
end $$;
revoke all on function cv_do_telegram(jsonb), cv_legenda(text), cv_texto_ok(text) from public, anon, authenticated;
grant execute on function cv_do_telegram(jsonb) to service_role;

-- quando a função não consegue guardar o arquivo, avisa no grupo
create or replace function cv_telegram_erro(p_chat bigint, p_msg text) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into tg_fila (chat_id, texto) values (p_chat, '⚠️ Não consegui cadastrar este arquivo: ' || tg_esc(left(p_msg, 300)))
$$;
revoke all on function cv_telegram_erro(bigint, text) from public, anon, authenticated;
grant execute on function cv_telegram_erro(bigint, text) to service_role;

-- 5. O RECEPTOR DO ROBÔ PASSA A RECONHECER FOTOS E ARQUIVOS NOS GRUPOS DO RH
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
        if (msg ? 'photo' or msg ? 'document') and exists (select 1 from tg_destinos d where d.chat_id = (chat->>'id')::bigint and d.ativo and 'rh' = any (d.setores)) then
          perform tg_cv_pedir(msg);       -- currículo mandado no grupo do RH: a função do Supabase baixa o arquivo e cadastra
          continue;
        end if;
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
revoke all on function tg_receber() from public, anon, authenticated;

-- a tela "Avisos no Telegram" mostra se a função respondeu da última vez
create or replace function tg_status() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare e tg_estado; cst int; ccorpo text;
begin
  if not sou_admin() then raise exception 'Só a administração.' using errcode = '42501'; end if;
  select * into e from tg_estado where id = 1;
  if e.cv_req is not null then select status_code, left(content, 200) into cst, ccorpo from net._http_response where id = e.cv_req; end if;
  return jsonb_build_object('token', tg_token() is not null,
    'cron', exists (select 1 from cron.job where jobname = 'jcn-telegram'),
    'pendentes', (select count(*) from tg_fila where enviado_em is null),
    'enviados_24h', (select count(*) from tg_fila where enviado_em > now() - interval '1 day' and coalesce(status_http, 200) between 0 and 299),
    'falhas_24h', (select count(*) from tg_fila where enviado_em > now() - interval '1 day' and status_http >= 300),
    'ultimo_erro', (select r2.content from tg_fila f join net._http_response r2 on r2.id = f.req_id where f.status_http >= 300 order by f.enviado_em desc limit 1),
    'cv', case when e.cv_em is null then null else jsonb_build_object('em', e.cv_em, 'status', cst, 'corpo', ccorpo) end,
    'cv_total', (select count(*) from candidaturas where origem = 'telegram'));
end $$;
revoke all on function tg_status() from public, anon;
grant execute on function tg_status() to authenticated;

-- 6. CONFERÊNCIA: deve mostrar 1 segredo e 3 funções
select (select count(*) from vault.secrets where name = 'tg_cv_segredo') as segredo,
       (select count(*) from pg_proc where proname in ('cv_do_telegram', 'tg_cv_pedir', 'tg_cv_config')) as funcoes;
