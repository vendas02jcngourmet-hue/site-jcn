-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 10 DO BANCO: LIGAÇÕES SÓ DO PRÓPRIO VENDEDOR E RETORNO COM HORA
-- Rode no Supabase: SQL Editor, cole tudo, botão Run. Pode rodar mais de uma vez. Precisa das atualizações 2 e 5.
--  * Cada vendedor vê só as próprias ligações (a administração continua vendo todas).
--  * O "próximo contato" da loja passa a ter hora, e o aviso no Telegram chega 15 minutos antes.
--    O aviso vai para o Telegram do vendedor da última ligação (ou para o grupo de Vendas, se ele não ligou o dele).
-- =====================================================================

-- 1. CADA VENDEDOR VÊ SÓ AS LIGAÇÕES DELE
drop policy if exists ligacoes_ver on ligacoes;
create policy ligacoes_ver on ligacoes for select to authenticated using (sou_admin() or (sou_vendas() and vendedor_id = auth.uid()));

-- 2. HORA DO PRÓXIMO CONTATO
alter table prospects add column if not exists proximo_hora time;
alter table ligacoes add column if not exists retornar_hora time;

create or replace function ao_registrar_ligacao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update prospects p set situacao = new.resultado, ultima_ligacao = new.feita_em, proximo_contato = new.retornar_em,
         proximo_hora = case when new.retornar_em is null then null else new.retornar_hora end, atualizado_em = now()
   where p.id = new.prospect_id and (p.ultima_ligacao is null or p.ultima_ligacao <= new.feita_em);
  return null;
end $$;

-- 3. AVISO NO TELEGRAM 15 MINUTOS ANTES DO RETORNO (vale para a ligação e para a mudança feita na ficha da loja)
create or replace function tg_retorno_prospect() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare l ligacoes; quem text; quando timestamptz;
begin
  delete from tg_fila where enviado_em is null and chave = 'retorno:' || new.id;
  if new.proximo_contato is null or new.situacao in ('cliente', 'sem_interesse', 'numero_errado') then return null; end if;
  quando := (new.proximo_contato + coalesce(new.proximo_hora, time '09:00')) at time zone 'America/Sao_Paulo';
  if quando < now() - interval '5 minutes' then return null; end if;
  select * into l from ligacoes where prospect_id = new.id order by feita_em desc limit 1;
  select nome into quem from perfis where id = coalesce(l.vendedor_id, auth.uid());
  perform tg_avisar_pessoa(coalesce(l.vendedor_id, auth.uid()), 'vendas',
    '📞 <b>Retornar a ligação daqui a 15 minutos</b> (' || to_char(coalesce(new.proximo_hora, time '09:00'), 'HH24:MI') || ')'
    || E'\nLoja: <b>' || tg_esc(new.loja) || '</b> · ' || tg_esc(new.cidade) || '/' || new.uf
    || case when new.comprador is not null then E'\nComprador: ' || tg_esc(new.comprador) else '' end
    || E'\nTelefone: ' || tg_tel(new.telefone)
    || case when l.tratativa is not null then E'\nÚltima conversa: ' || tg_esc(left(l.tratativa, 400)) else '' end
    || case when quem is not null then E'\n(vendedor: ' || tg_esc(quem) || ')' else '' end,
    'retorno:' || new.id, greatest(quando - interval '15 minutes', now()));
  return null;
end $$;
revoke all on function tg_retorno_prospect() from public, anon, authenticated;
drop trigger if exists tg_prospects_retorno on prospects;
create trigger tg_prospects_retorno after insert or update of proximo_contato, proximo_hora, situacao on prospects for each row execute function tg_retorno_prospect();

-- a ligação continua avisando quando a loja vira cliente; o lembrete do retorno agora sai pela loja (acima)
create or replace function tg_ligacao() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare p prospects; quem text;
begin
  if new.resultado = 'cliente' then
    select * into p from prospects where id = new.prospect_id;
    select nome into quem from perfis where id = new.vendedor_id;
    perform tg_avisar('vendas', '🎉 <b>' || tg_esc(quem) || '</b> fechou com <b>' || tg_esc(p.loja) || '</b> (' || tg_esc(p.cidade) || '/' || p.uf || ')' || E'\n' || tg_esc(left(new.tratativa, 300)));
  end if;
  return null;
end $$;
revoke all on function tg_ligacao() from public, anon, authenticated;

-- o resumo das 8h mostra o horário de cada retorno
create or replace function tg_resumo() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date; t text; v record; n int; s numeric;
begin
  select count(*), coalesce(sum(valor), 0) into n, s from parcelas_boleto where recebida_em is null and vencimento <= hoje;
  t := '☀️ <b>Financeiro hoje</b>' || E'\nParcelas vencendo hoje ou atrasadas: ' || n || ' (' || tg_brl(s) || ')'
    || E'\nPIX para conferir: ' || (select count(*) from pedidos where forma_pagamento = 'pix' and pix_status = 'em_analise')
    || E'\nBoletos para aprovar: ' || (select count(*) from pedidos where boleto_status = 'pendente');
  perform tg_avisar('financeiro', t);
  for v in select l.vendedor_id, count(*) as q, string_agg(tg_esc(p.loja) || coalesce(' às ' || to_char(p.proximo_hora, 'HH24:MI'), ''), ', ' order by p.proximo_hora nulls last) as lojas
             from prospects p join lateral (select * from ligacoes x where x.prospect_id = p.id order by x.feita_em desc limit 1) l on true
            where p.proximo_contato = hoje and p.situacao not in ('cliente', 'sem_interesse', 'numero_errado') group by l.vendedor_id loop
    perform tg_avisar_pessoa(v.vendedor_id, 'vendas', '☀️ <b>Retornos de hoje</b> (' || v.q || ')' || E'\n' || v.lojas);
  end loop;
  select count(*) into n from reunioes where status = 'agendada' and (inicio at time zone 'America/Sao_Paulo')::date = hoje;
  t := '☀️ <b>RH hoje</b>' || E'\nReuniões marcadas para hoje: ' || n || E'\nCurrículos ainda não lidos: ' || (select count(*) from candidaturas where visto_em is null);
  perform tg_avisar('rh', t);
end $$;
revoke all on function tg_resumo() from public, anon, authenticated;

-- 4. CONFERÊNCIA: deve mostrar 1 coluna e 1 gatilho
select (select count(*) from information_schema.columns where table_name = 'prospects' and column_name = 'proximo_hora') as coluna,
       (select count(*) from pg_trigger where tgname = 'tg_prospects_retorno') as gatilho;
