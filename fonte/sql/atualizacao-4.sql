-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 4 DO BANCO: FINANCEIRO, RH E "TRABALHE CONOSCO"
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
--  * novo login Financeiro: vê pedidos e o financeiro, confere PIX, aprova boletos e marca parcelas.
--  * RH Administrativo (tudo do RH, inclusive os logins do RH) e RH Assistente (currículos e reuniões,
--    sem apagar nada). Quem é do RH não vê nada de vendas, pedidos ou financeiro.
--  * formulário "Trabalhe conosco" na página inicial, com o currículo em arquivo (pasta privada "rh").
-- =====================================================================

-- 1. NOVOS PERFIS
alter type papel_usuario add value if not exists 'financeiro';
alter type papel_usuario add value if not exists 'rh_admin';
alter type papel_usuario add value if not exists 'rh_assistente';

-- (os perfis novos são comparados como texto: assim tudo funciona já nesta mesma execução)
create or replace function sou_financeiro() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(meu_papel()::text in ('admin', 'financeiro'), false)
$$;
create or replace function sou_rh() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(meu_papel()::text in ('admin', 'rh_admin', 'rh_assistente'), false)
$$;
create or replace function sou_rh_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(meu_papel()::text in ('admin', 'rh_admin'), false)
$$;
revoke all on function sou_financeiro(), sou_rh(), sou_rh_admin() from public, anon;
grant execute on function sou_financeiro(), sou_rh(), sou_rh_admin() to authenticated;

-- 2. LOGINS: o RH Administrativo cria e cuida só dos logins do RH; o Financeiro vê os nomes da equipe
drop policy if exists perfis_fin_ver on perfis;
create policy perfis_fin_ver on perfis for select to authenticated using (coalesce(meu_papel()::text = 'financeiro', false));
drop policy if exists perfis_rh_ver on perfis;
create policy perfis_rh_ver on perfis for select to authenticated using (coalesce(meu_papel()::text = 'rh_admin', false) and papel::text in ('rh_admin', 'rh_assistente'));
drop policy if exists perfis_rh_criar on perfis;
create policy perfis_rh_criar on perfis for insert to authenticated with check (coalesce(meu_papel()::text = 'rh_admin', false) and papel::text in ('rh_admin', 'rh_assistente') and vendedor_id is null);
drop policy if exists perfis_rh_editar on perfis;
create policy perfis_rh_editar on perfis for update to authenticated
  using (coalesce(meu_papel()::text = 'rh_admin', false) and papel::text in ('rh_admin', 'rh_assistente'))
  with check (papel::text in ('rh_admin', 'rh_assistente') and vendedor_id is null);

create or replace function validar_perfil() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.papel::text = 'ecommerce' then
    if new.vendedor_id is null or not exists (select 1 from perfis v where v.id = new.vendedor_id and v.papel::text = 'vendedor') then
      raise exception 'Informe de qual vendedor é este e-commerce.';
    end if;
  end if;
  if tg_op = 'UPDATE' and not sou_admin() and auth.uid() is not null and (new.papel, new.vendedor_id) is distinct from (old.papel, old.vendedor_id) then
    if not (coalesce(meu_papel()::text = 'rh_admin', false) and old.papel::text in ('rh_admin', 'rh_assistente') and new.papel::text in ('rh_admin', 'rh_assistente')) then
      raise exception 'Só a administração troca o perfil ou o vendedor de uma conta.';
    end if;
  end if;
  return new;
end $$;

create or replace function definir_senha(p_usuario uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare alvo perfis;
begin
  if auth.uid() is null then raise exception 'Entre com a sua conta.' using errcode = '42501'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha precisa de pelo menos 8 caracteres.'; end if;
  select * into alvo from perfis where id = p_usuario;
  if alvo.id is null then raise exception 'Conta não encontrada.'; end if;
  if not (sou_admin()
          or (meu_papel()::text = 'vendedor' and alvo.papel::text = 'ecommerce' and alvo.vendedor_id = auth.uid())
          or (meu_papel()::text = 'rh_admin' and alvo.papel::text in ('rh_admin', 'rh_assistente'))) then
    raise exception 'Você não tem permissão para trocar esta senha.' using errcode = '42501';
  end if;
  update auth.users set encrypted_password = crypt(p_senha, gen_salt('bf', 10)), updated_at = now() where id = p_usuario;
  if not found then raise exception 'Acesso não encontrado.'; end if;
  begin
    delete from auth.sessions where user_id = p_usuario and p_usuario <> auth.uid();
  exception when others then null;
  end;
end $$;

create or replace function liberar_email(p_email text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if coalesce(meu_papel()::text in ('admin', 'vendedor', 'rh_admin'), false) is not true then
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
revoke all on function definir_senha(uuid, text), liberar_email(text) from public, anon;
grant execute on function definir_senha(uuid, text), liberar_email(text) to authenticated;

-- 3. FINANCEIRO: vê todos os pedidos, confere o PIX, aprova ou recusa o boleto e marca as parcelas recebidas.
--    A expedição e os dados do pedido continuam com a administração.
drop policy if exists pedidos_ver on pedidos;
create policy pedidos_ver on pedidos for select to authenticated
  using (sou_admin() or sou_financeiro() or (meu_papel() in ('vendedor', 'representante', 'ecommerce') and vendedor_id = auth.uid())
         or (meu_papel() = 'vendedor' and loja_do_vendedor(vendedor_id)));
drop policy if exists pedidos_editar on pedidos;
create policy pedidos_editar on pedidos for update to authenticated
  using (sou_admin() or sou_financeiro() or (meu_papel() in ('vendedor', 'ecommerce') and vendedor_id = auth.uid()))
  with check (sou_admin() or sou_financeiro() or vendedor_id = auth.uid());
drop policy if exists parcelas_receber on parcelas_boleto;
create policy parcelas_receber on parcelas_boleto for update to authenticated using (sou_financeiro()) with check (sou_financeiro());

create or replace function validar_pedido() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare adm boolean := sou_admin(); fin boolean := sou_financeiro(); direto boolean := pg_trigger_depth() = 1;
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
    if not fin then
      if new.pix_status is distinct from old.pix_status
         and (direto or new.pix_status <> 'em_analise' or old.pix_status = 'verificado') then
        raise exception 'Só a administração confere o PIX.';
      end if;
      if direto then new.pix_conferido_por := old.pix_conferido_por; new.pix_conferido_em := old.pix_conferido_em; end if;
    elsif new.forma_pagamento is distinct from old.forma_pagamento or new.boleto_dias is distinct from old.boleto_dias then
      raise exception 'O financeiro não troca a forma de pagamento nem os prazos.';
    end if;
  end if;
  if new.pix_status is distinct from old.pix_status and new.pix_status in ('verificado', 'recusado') then
    new.pix_conferido_por := auth.uid(); new.pix_conferido_em := now();
  end if;
  if new.forma_pagamento = 'boleto' and old.forma_pagamento = 'pix' and not adm and old.pix_status <> 'sem_comprovante' then
    raise exception 'Este pedido já tem comprovante de PIX.';
  end if;
  if new.forma_pagamento = 'boleto' then
    new.boleto_dias := (select array_agg(distinct d order by d) from unnest(new.boleto_dias) d);
    if old.forma_pagamento = 'pix' then new.boleto_status := 'pendente'; end if;
    if new.boleto_status is distinct from old.boleto_status and old.forma_pagamento = 'boleto' then
      if new.boleto_status in ('aprovado', 'recusado') or old.boleto_status = 'aprovado' then
        if not (adm or fin) then raise exception 'Só o financeiro aprova ou recusa o boleto.'; end if;
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
    if not (adm or fin) and old.forma_pagamento = 'boleto' then
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

-- 4. TRABALHE CONOSCO: candidaturas, reuniões e a pasta privada dos currículos
create table if not exists candidaturas (
  id                uuid primary key default gen_random_uuid(),
  chave             uuid not null default gen_random_uuid(),     -- o que o navegador do candidato usa para enviar o arquivo
  nome              text not null check (length(trim(nome)) between 3 and 160),
  email             text not null check (length(email) between 5 and 160),
  telefone          text not null check (telefone ~ '^[0-9]{10,11}$'),
  cidade            text not null check (length(trim(cidade)) between 2 and 80),
  uf                text not null check (uf ~ '^[A-Z]{2}$'),
  nascimento        date,
  area              text not null check (length(area) <= 80),
  cargo             text check (length(cargo) <= 120),
  escolaridade      text check (length(escolaridade) <= 80),
  experiencia       text check (length(experiencia) <= 4000),
  disponibilidade   text check (length(disponibilidade) <= 80),
  pretensao         text check (length(pretensao) <= 60),
  linkedin          text check (length(linkedin) <= 300),
  mensagem          text check (length(mensagem) <= 2000),
  curriculo_caminho text,
  curriculo_nome    text,
  curriculo_mime    text,
  status            text not null default 'novo' check (status in ('novo', 'em_analise', 'entrevista', 'aprovado', 'reprovado', 'banco_talentos')),
  avaliacao         int check (avaliacao between 1 and 5),
  notas             text check (length(notas) <= 8000),
  visto_em          timestamptz,
  visto_por         uuid references perfis (id),
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index if not exists candidaturas_data on candidaturas (criado_em desc);

create table if not exists reunioes (
  id              uuid primary key default gen_random_uuid(),
  candidatura_id  uuid not null references candidaturas (id) on delete cascade,
  inicio          timestamptz not null,
  duracao_min     int not null default 30 check (duracao_min between 10 and 480),
  link            text check (length(link) <= 400),
  observacoes     text check (length(observacoes) <= 2000),
  status          text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada', 'faltou')),
  criado_por      uuid references perfis (id) default auth.uid(),
  criado_em       timestamptz not null default now()
);
create index if not exists reunioes_inicio on reunioes (inicio);

-- o gatilho de candidaturas: o arquivo do currículo entra uma vez e não muda mais (só o RH Administrativo corrige)
create or replace function tocar_candidatura() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if (new.chave, new.criado_em) is distinct from (old.chave, old.criado_em)
     or (new.curriculo_caminho is distinct from old.curriculo_caminho and old.curriculo_caminho is not null) then
    if not sou_rh_admin() then raise exception 'Estes dados da candidatura não mudam.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists candidaturas_tocar on candidaturas;
create trigger candidaturas_tocar before update on candidaturas for each row execute function tocar_candidatura();

alter table candidaturas enable row level security;
alter table reunioes enable row level security;
drop policy if exists candidaturas_ver on candidaturas;     create policy candidaturas_ver on candidaturas for select to authenticated using (sou_rh());
drop policy if exists candidaturas_editar on candidaturas;  create policy candidaturas_editar on candidaturas for update to authenticated using (sou_rh()) with check (sou_rh());
drop policy if exists candidaturas_apagar on candidaturas;  create policy candidaturas_apagar on candidaturas for delete to authenticated using (sou_rh_admin());
drop policy if exists reunioes_ver on reunioes;             create policy reunioes_ver on reunioes for select to authenticated using (sou_rh());
drop policy if exists reunioes_criar on reunioes;           create policy reunioes_criar on reunioes for insert to authenticated with check (sou_rh() and criado_por = auth.uid());
drop policy if exists reunioes_editar on reunioes;          create policy reunioes_editar on reunioes for update to authenticated using (sou_rh()) with check (sou_rh());
drop policy if exists reunioes_apagar on reunioes;          create policy reunioes_apagar on reunioes for delete to authenticated using (sou_rh_admin());
revoke all on candidaturas, reunioes from anon;
grant select, insert, update, delete on candidaturas, reunioes to authenticated;

-- o visitante não lê nem grava na tabela: só chama estas funções
create or replace function enviar_candidatura(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare tel text := regexp_replace(coalesce(p->>'telefone', ''), '\D', '', 'g'); c candidaturas; mail text := lower(trim(coalesce(p->>'email', '')));
begin
  if tel ~ '^55[0-9]{10,11}$' then tel := substr(tel, 3); end if;
  if length(trim(coalesce(p->>'nome', ''))) < 5 then raise exception 'Informe o nome completo.'; end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Informe um e-mail válido.'; end if;
  if length(tel) not between 10 and 11 then raise exception 'Informe o WhatsApp com DDD.'; end if;
  if length(trim(coalesce(p->>'cidade', ''))) < 2 or coalesce(p->>'uf', '') !~ '^[A-Za-z]{2}$' then raise exception 'Informe a cidade e o estado.'; end if;
  if length(trim(coalesce(p->>'area', ''))) < 2 then raise exception 'Escolha a área de interesse.'; end if;
  if coalesce((p->>'consentimento')::boolean, false) is not true then raise exception 'É preciso autorizar o uso dos dados para o processo seletivo.'; end if;
  if (select count(*) from candidaturas x where (x.email = mail or x.telefone = tel) and x.criado_em > now() - interval '1 day') >= 3 then
    raise exception 'Recebemos seus dados hoje. Se quiser corrigir algo, fale com a JCN pelo WhatsApp.';
  end if;
  if (select count(*) from candidaturas x where x.criado_em > now() - interval '1 day') >= 300 then
    raise exception 'Recebemos muitos currículos hoje. Tente de novo amanhã.';
  end if;
  insert into candidaturas (nome, email, telefone, cidade, uf, nascimento, area, cargo, escolaridade, experiencia, disponibilidade, pretensao, linkedin, mensagem)
  values (left(trim(p->>'nome'), 160), left(mail, 160), tel, left(trim(p->>'cidade'), 80), upper(p->>'uf'), nullif(p->>'nascimento', '')::date,
          left(trim(p->>'area'), 80), nullif(left(trim(coalesce(p->>'cargo', '')), 120), ''), nullif(left(trim(coalesce(p->>'escolaridade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'experiencia', '')), 4000), ''), nullif(left(trim(coalesce(p->>'disponibilidade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'pretensao', '')), 60), ''), nullif(left(trim(coalesce(p->>'linkedin', '')), 300), ''), nullif(left(trim(coalesce(p->>'mensagem', '')), 2000), ''))
  returning * into c;
  return jsonb_build_object('id', c.id, 'chave', c.chave);
end $$;

create or replace function candidatura_aceita_arquivo(p_chave text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from candidaturas c where c.chave::text = p_chave and c.curriculo_caminho is null and c.criado_em > now() - interval '2 hours')
$$;

create or replace function anexar_curriculo(p_id uuid, p_chave uuid, p_caminho text, p_nome text, p_mime text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c candidaturas;
begin
  select * into c from candidaturas where id = p_id and chave = p_chave;
  if c.id is null then raise exception 'Candidatura não encontrada.'; end if;
  if c.curriculo_caminho is not null then raise exception 'O currículo desta candidatura já foi enviado.'; end if;
  if p_caminho not like 'curriculos/' || p_chave::text || '/%' or length(p_caminho) > 300 then raise exception 'Arquivo fora da pasta da candidatura.'; end if;
  update candidaturas set curriculo_caminho = p_caminho, curriculo_nome = left(coalesce(p_nome, 'curriculo'), 160), curriculo_mime = left(p_mime, 120) where id = p_id;
end $$;

revoke all on function enviar_candidatura(jsonb), candidatura_aceita_arquivo(text), anexar_curriculo(uuid, uuid, text, text, text) from public;
grant execute on function enviar_candidatura(jsonb), candidatura_aceita_arquivo(text), anexar_curriculo(uuid, uuid, text, text, text) to anon, authenticated;



insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('rh', 'rh', false, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists rh_enviar on storage.objects;
create policy rh_enviar on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'rh' and (storage.foldername(name))[1] = 'curriculos' and candidatura_aceita_arquivo((storage.foldername(name))[2])
);
drop policy if exists rh_ler on storage.objects;
create policy rh_ler on storage.objects for select to authenticated using (bucket_id = 'rh' and sou_rh());
drop policy if exists rh_apagar on storage.objects;
create policy rh_apagar on storage.objects for delete to authenticated using (bucket_id = 'rh' and sou_rh_admin());

-- 5. CONFERÊNCIA: deve mostrar 3 perfis novos, 2 tabelas e 3 funções
select (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'papel_usuario' and e.enumlabel in ('financeiro', 'rh_admin', 'rh_assistente')) as perfis_novos,
       (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('candidaturas', 'reunioes')) as tabelas,
       (select count(*) from pg_proc where proname in ('enviar_candidatura', 'anexar_curriculo', 'candidatura_aceita_arquivo')) as funcoes;
