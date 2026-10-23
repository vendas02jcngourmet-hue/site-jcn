-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 9 DO BANCO: UM CURRÍCULO POR CPF E FOTO DO CANDIDATO
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez. Precisa das atualizações 7 e 8.
--  * O CPF passa a ser obrigatório no "Trabalhe conosco". Se a pessoa mandar de novo, o currículo novo
--    substitui o anterior (desde que use o mesmo e-mail ou WhatsApp). Avaliação, anotações e reuniões passam para o novo.
--  * Os arquivos do currículo anterior entram numa fila e são apagados da pasta do RH quando o RH Administrativo abre o site.
--  * Foto do candidato (opcional).
-- =====================================================================
alter table candidaturas add column if not exists foto_caminho text;
alter table candidaturas add column if not exists foto_mime text;

-- se já houver CPF repetido, fica só o currículo mais novo
with rep as (select id, row_number() over (partition by ficha->>'cpf' order by criado_em desc) as n from candidaturas where ficha ? 'cpf')
update candidaturas c set ficha = c.ficha - 'cpf' from rep where rep.id = c.id and rep.n > 1;
create unique index if not exists candidaturas_cpf_unico on candidaturas ((ficha->>'cpf')) where ficha ? 'cpf';

create table if not exists rh_apagar (caminho text primary key, em timestamptz not null default now());
alter table rh_apagar enable row level security;
drop policy if exists rh_apagar_ver on rh_apagar;    create policy rh_apagar_ver on rh_apagar for select to authenticated using (sou_rh_admin());
drop policy if exists rh_apagar_tirar on rh_apagar;  create policy rh_apagar_tirar on rh_apagar for delete to authenticated using (sou_rh_admin());
revoke all on rh_apagar from anon;
grant select, delete on rh_apagar to authenticated;

create or replace function enviar_candidatura(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare tel text := regexp_replace(coalesce(p->>'telefone', ''), '\D', '', 'g'); c candidaturas; mail text := lower(trim(coalesce(p->>'email', '')));
  cpf text := regexp_replace(coalesce(p->'ficha'->>'cpf', ''), '\D', '', 'g'); ant candidaturas;
begin
  if tel ~ '^55[0-9]{10,11}$' then tel := substr(tel, 3); end if;
  if length(trim(coalesce(p->>'nome', ''))) < 5 then raise exception 'Informe o nome completo.'; end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Informe um e-mail válido.'; end if;
  if length(tel) not between 10 and 11 then raise exception 'Informe o WhatsApp com DDD.'; end if;
  if length(trim(coalesce(p->>'cidade', ''))) < 2 or coalesce(p->>'uf', '') !~ '^[A-Za-z]{2}$' then raise exception 'Informe a cidade e o estado.'; end if;
  if length(trim(coalesce(p->>'area', ''))) < 2 then raise exception 'Escolha a área de interesse.'; end if;
  if cpf = '' then raise exception 'Informe o CPF.'; end if;
  if not cpf_valido(cpf) then raise exception 'O CPF informado não é válido.'; end if;
  if coalesce((p->>'consentimento')::boolean, false) is not true then raise exception 'É preciso autorizar o uso dos dados para o processo seletivo.'; end if;
  if (select count(*) from candidaturas x where (x.email = mail or x.telefone = tel) and x.criado_em > now() - interval '1 day') >= 3 then
    raise exception 'Recebemos seus dados hoje. Se quiser corrigir algo, fale com a JCN pelo WhatsApp.';
  end if;
  if (select count(*) from candidaturas x where x.criado_em > now() - interval '1 day') >= 300 then
    raise exception 'Recebemos muitos currículos hoje. Tente de novo amanhã.';
  end if;
  -- um currículo por CPF: o envio novo substitui o anterior (só com o mesmo e-mail ou WhatsApp, para ninguém apagar o currículo de outra pessoa)
  perform pg_advisory_xact_lock(hashtextextended('cpf:' || cpf, 0));
  select * into ant from candidaturas where ficha->>'cpf' = cpf order by criado_em desc limit 1;
  if ant.id is not null then
    if not (lower(coalesce(ant.email, '')) = mail or coalesce(ant.telefone, '') = tel) then
      raise exception 'Já existe um currículo com este CPF. Para atualizar, use o mesmo e-mail ou WhatsApp do envio anterior, ou fale com o RH pelo WhatsApp.';
    end if;
    insert into rh_apagar (caminho) select x from (select ant.curriculo_caminho as x union select ant.foto_caminho union select a->>'caminho' from jsonb_array_elements(ant.arquivos) a) z
      where x is not null on conflict do nothing;
    update candidaturas set ficha = ficha - 'cpf' where ficha->>'cpf' = cpf;          -- libera o CPF para o novo
  end if;
  insert into candidaturas (nome, email, telefone, cidade, uf, nascimento, area, cargo, escolaridade, experiencia, disponibilidade, pretensao, linkedin, mensagem, ficha)
  values (left(trim(p->>'nome'), 160), left(mail, 160), tel, left(trim(p->>'cidade'), 80), upper(p->>'uf'), nullif(p->>'nascimento', '')::date,
          left(trim(p->>'area'), 80), nullif(left(trim(coalesce(p->>'cargo', '')), 120), ''), nullif(left(trim(coalesce(p->>'escolaridade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'experiencia', '')), 4000), ''), nullif(left(trim(coalesce(p->>'disponibilidade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'pretensao', '')), 60), ''), nullif(left(trim(coalesce(p->>'linkedin', '')), 300), ''), nullif(left(trim(coalesce(p->>'mensagem', '')), 2000), ''),
          coalesce(p->'ficha', '{}'))
  returning * into c;
  if ant.id is not null then
    -- o que o RH já tinha feito com o currículo anterior passa para o novo
    update reunioes set candidatura_id = c.id where candidatura_id = ant.id;
    update candidaturas set avaliacao = ant.avaliacao, notas = case when ant.notas is not null then left('Do currículo anterior: ' || ant.notas, 8000) end where id = c.id;
    delete from candidaturas where id = ant.id;
  end if;
  return jsonb_build_object('id', c.id, 'chave', c.chave, 'substituiu', ant.id is not null);
end $$;
revoke all on function enviar_candidatura(jsonb) from public;
grant execute on function enviar_candidatura(jsonb) to anon, authenticated;

-- a foto entra uma vez, na pasta da própria candidatura, logo depois do envio
create or replace function anexar_foto(p_id uuid, p_chave uuid, p_caminho text, p_mime text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c candidaturas;
begin
  select * into c from candidaturas where id = p_id and chave = p_chave;
  if c.id is null then raise exception 'Candidatura não encontrada.'; end if;
  if c.foto_caminho is not null or c.criado_em < now() - interval '2 hours' then raise exception 'A foto desta candidatura já foi enviada.'; end if;
  if p_caminho not like 'curriculos/' || p_chave::text || '/foto-%' or length(p_caminho) > 300 then raise exception 'Arquivo fora da pasta da candidatura.'; end if;
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp') then raise exception 'A foto precisa ser JPG ou PNG.'; end if;
  update candidaturas set foto_caminho = p_caminho, foto_mime = p_mime where id = p_id;
end $$;
revoke all on function anexar_foto(uuid, uuid, text, text) from public;
grant execute on function anexar_foto(uuid, uuid, text, text) to anon, authenticated;

-- a foto também só muda pelo próprio sistema (ou pelo RH Administrativo)
create or replace function tocar_candidatura() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.atualizado_em := now();
  if (new.chave, new.criado_em) is distinct from (old.chave, old.criado_em)
     or (new.curriculo_caminho is distinct from old.curriculo_caminho and old.curriculo_caminho is not null and auth.uid() is not null)
     or (new.foto_caminho is distinct from old.foto_caminho and auth.uid() is not null)
     or ((new.arquivos, new.origem, new.tg_chat, new.tg_grupo, new.tg_autor) is distinct from (old.arquivos, old.origem, old.tg_chat, old.tg_grupo, old.tg_autor) and auth.uid() is not null) then
    if not sou_rh_admin() then raise exception 'Estes dados da candidatura não mudam.'; end if;
  end if;
  return new;
end $$;

-- CONFERÊNCIA: deve mostrar 1 índice, 1 tabela e 1 função
select (select count(*) from pg_indexes where indexname = 'candidaturas_cpf_unico') as indice,
       (select count(*) from information_schema.tables where table_name = 'rh_apagar') as tabela,
       (select count(*) from pg_proc where proname = 'anexar_foto') as funcao;
