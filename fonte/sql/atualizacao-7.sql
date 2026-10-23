-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 7 DO BANCO: FICHA COMPLETA DO "TRABALHE CONOSCO"
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez.
-- O formulário passa a ter documentos (CPF, RG, PIS, CNH, título), endereço completo, filiação,
-- cônjuge, filhos, medidas para uniforme, chave PIX e conta no Itaú. Tudo fica na coluna "ficha",
-- que só o RH (e a administração) lê. O banco confere e limpa cada campo antes de guardar.
-- =====================================================================
alter table candidaturas add column if not exists ficha jsonb not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'candidaturas_ficha_tamanho') then
    alter table candidaturas add constraint candidaturas_ficha_tamanho check (pg_column_size(ficha) < 16000);
  end if;
end $$;

create or replace function cpf_valido(c text) returns boolean
language plpgsql immutable set search_path = public, pg_temp as $$
declare d text := regexp_replace(coalesce(c, ''), '\D', '', 'g'); s int; r int;
begin
  if length(d) <> 11 or d ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(d, i, 1)::int * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> substr(d, 10, 1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(d, i, 1)::int * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = substr(d, 11, 1)::int;
end $$;
create or replace function pis_valido(c text) returns boolean
language plpgsql immutable set search_path = public, pg_temp as $$
declare d text := regexp_replace(coalesce(c, ''), '\D', '', 'g'); pesos int[] := array[3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; s int := 0; r int;
begin
  if length(d) <> 11 or d ~ '^(\d)\1{10}$' then return false; end if;
  for i in 1..10 loop s := s + substr(d, i, 1)::int * pesos[i]; end loop;
  r := 11 - (s % 11); if r >= 10 then r := 0; end if;
  return r = substr(d, 11, 1)::int;
end $$;

-- só os campos conhecidos, cada um no formato certo
create or replace function cv_ficha_limpa(j jsonb) returns jsonb
language plpgsql immutable set search_path = public, pg_temp as $$
declare r jsonb := '{}'; k text; v text; t text[]; n numeric;
begin
  if j is null or jsonb_typeof(j) <> 'object' then return '{}'; end if;
  foreach k in array array['nasc_local:80', 'estado_civil:30', 'cor:30', 'mae:160', 'pai:160', 'conjuge:160', 'rua:120', 'numero:15', 'complemento:60', 'bairro:80',
                           'rg:20', 'rg_orgao:20', 'cnh_categoria:12', 'camisa:6', 'pix_tipo:20', 'pix:120'] loop
    v := nullif(trim(j->>split_part(k, ':', 1)), '');
    if v is not null then r := r || jsonb_build_object(split_part(k, ':', 1), left(v, split_part(k, ':', 2)::int)); end if;
  end loop;
  foreach k in array array['telefone2|10|11|o outro telefone', 'cep|8|8|o CEP', 'cpf|11|11|o CPF', 'pis|11|11|o PIS', 'cnh_numero|9|11|o número da CNH',
                           'titulo_numero|12|12|o número do título de eleitor', 'titulo_zona|1|4|a zona eleitoral', 'titulo_secao|1|4|a seção eleitoral'] loop
    t := string_to_array(k, '|'); v := regexp_replace(coalesce(j->>t[1], ''), '\D', '', 'g');
    if t[1] = 'telefone2' and v ~ '^55[0-9]{10,11}$' then v := substr(v, 3); end if;
    if v <> '' then
      if length(v) < t[2]::int or length(v) > t[3]::int then raise exception 'Confira %.', t[4]; end if;
      r := r || jsonb_build_object(t[1], v);
    end if;
  end loop;
  if r ? 'cpf' and not cpf_valido(r->>'cpf') then raise exception 'O CPF informado não é válido.'; end if;
  if r ? 'pis' and not pis_valido(r->>'pis') then raise exception 'O número do PIS não é válido.'; end if;
  foreach k in array array['filhos', 'itau'] loop
    v := lower(coalesce(j->>k, '')); if v in ('sim', 'nao') then r := r || jsonb_build_object(k, v); end if;
  end loop;
  v := nullif(trim(coalesce(j->>'cnh_validade', '')), '');
  if v is not null then
    if v !~ '^\d{4}-\d{2}-\d{2}' then raise exception 'Confira o vencimento da CNH.'; end if;
    r := r || jsonb_build_object('cnh_validade', left(v, 10));
  end if;
  v := replace(nullif(trim(coalesce(j->>'altura', '')), ''), ',', '.');
  if v is not null then
    if v !~ '^\d{1,3}(\.\d{1,2})?$' then raise exception 'Confira a altura.'; end if;
    n := v::numeric; if n > 3 then n := n / 100; end if;
    if n not between 1 and 2.3 then raise exception 'Confira a altura.'; end if;
    r := r || jsonb_build_object('altura', round(n, 2));
  end if;
  v := replace(nullif(trim(coalesce(j->>'peso', '')), ''), ',', '.');
  if v is not null then
    if v !~ '^\d{2,3}(\.\d{1,2})?$' or v::numeric not between 30 and 250 then raise exception 'Confira o peso.'; end if;
    r := r || jsonb_build_object('peso', round(v::numeric, 1));
  end if;
  v := nullif(trim(coalesce(j->>'calcado', '')), '');
  if v is not null and v ~ '^\d{2}$' and v::int between 15 and 55 then r := r || jsonb_build_object('calcado', v); end if;
  v := nullif(trim(coalesce(j->>'filhos_qtd', '')), '');
  if v is not null and coalesce(r->>'filhos', '') = 'sim' then
    if v !~ '^\d{1,2}$' or v::int not between 1 and 15 then raise exception 'Confira quantos filhos.'; end if;
    r := r || jsonb_build_object('filhos_qtd', v::int);
  end if;
  if jsonb_typeof(j->'filhos_idades') = 'array' and coalesce(r->>'filhos', '') = 'sim' then
    r := r || jsonb_build_object('filhos_idades', coalesce((select jsonb_agg(x::int order by o) from (select e #>> '{}' as x, o from jsonb_array_elements(j->'filhos_idades') with ordinality as a(e, o)) z
                                                            where x ~ '^\d{1,2}$' and x::int <= 60 and o <= 15), '[]'));
  end if;
  return r;
end $$;

create or replace function limpar_ficha() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.ficha := cv_ficha_limpa(new.ficha);
  return new;
end $$;
drop trigger if exists candidaturas_ficha on candidaturas;
create trigger candidaturas_ficha before insert or update of ficha on candidaturas for each row execute function limpar_ficha();

-- o "Trabalhe conosco" manda a ficha junto
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
  insert into candidaturas (nome, email, telefone, cidade, uf, nascimento, area, cargo, escolaridade, experiencia, disponibilidade, pretensao, linkedin, mensagem, ficha)
  values (left(trim(p->>'nome'), 160), left(mail, 160), tel, left(trim(p->>'cidade'), 80), upper(p->>'uf'), nullif(p->>'nascimento', '')::date,
          left(trim(p->>'area'), 80), nullif(left(trim(coalesce(p->>'cargo', '')), 120), ''), nullif(left(trim(coalesce(p->>'escolaridade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'experiencia', '')), 4000), ''), nullif(left(trim(coalesce(p->>'disponibilidade', '')), 80), ''),
          nullif(left(trim(coalesce(p->>'pretensao', '')), 60), ''), nullif(left(trim(coalesce(p->>'linkedin', '')), 300), ''), nullif(left(trim(coalesce(p->>'mensagem', '')), 2000), ''),
          coalesce(p->'ficha', '{}'))
  returning * into c;
  return jsonb_build_object('id', c.id, 'chave', c.chave);
end $$;
revoke all on function enviar_candidatura(jsonb) from public;
grant execute on function enviar_candidatura(jsonb) to anon, authenticated;
revoke all on function cv_ficha_limpa(jsonb), cpf_valido(text), pis_valido(text) from public, anon;

-- CONFERÊNCIA: deve mostrar 1 coluna e 3 funções
select (select count(*) from information_schema.columns where table_name = 'candidaturas' and column_name = 'ficha') as coluna,
       (select count(*) from pg_proc where proname in ('cv_ficha_limpa', 'cpf_valido', 'pis_valido')) as funcoes;
