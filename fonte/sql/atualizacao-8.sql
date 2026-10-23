-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 8 DO BANCO: "TRABALHE CONOSCO" COM EMPREGOS, PERGUNTAS, SAÚDE E SOBRE VOCÊ
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez. Precisa da atualização 7.
-- As respostas novas entram na mesma "ficha" do candidato, que só o RH (e a administração) lê.
-- =====================================================================
alter table candidaturas drop constraint if exists candidaturas_ficha_tamanho;
alter table candidaturas add constraint candidaturas_ficha_tamanho check (pg_column_size(ficha) < 60000);

create or replace function cv_ficha_limpa(j jsonb) returns jsonb
language plpgsql immutable set search_path = public, pg_temp as $$
declare r jsonb := '{}'; k text; v text; t text[]; n numeric; q int := 0;
  tipadas text[] := array['telefone2', 'cep', 'cpf', 'pis', 'cnh_numero', 'titulo_numero', 'titulo_zona', 'titulo_secao', 'filhos', 'itau', 'cnh_validade', 'altura', 'peso', 'calcado', 'filhos_qtd', 'filhos_idades'];
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
  -- as outras respostas (empregos, perguntas, saúde, sobre você): texto, com nomes simples e tamanho limitado
  for k, v in select key, value #>> '{}' from jsonb_each(j) where jsonb_typeof(value) in ('string', 'number', 'boolean') order by key loop
    if r ? k or k = any (tipadas) or k !~ '^[a-z][a-z0-9_]{1,29}$' then continue; end if;
    v := nullif(trim(v), ''); if v is null then continue; end if;
    if k ~ '^emp[123]_(inicio|fim)$' and v !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Confira as datas dos empregos (mês e ano).'; end if;
    r := r || jsonb_build_object(k, left(v, 2000));
    q := q + 1; exit when q >= 150;
  end loop;
  return r;
end $$;
revoke all on function cv_ficha_limpa(jsonb) from public, anon;

-- CONFERÊNCIA: deve mostrar "Pintura" e "2019-03"
select cv_ficha_limpa('{"emp1_funcao": "Pintura", "emp1_inicio": "2019-03", "lixo-com-traco": "x"}')->>'emp1_funcao' as funcao,
       cv_ficha_limpa('{"emp1_inicio": "2019-03"}')->>'emp1_inicio' as inicio;
