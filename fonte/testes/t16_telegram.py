# Avisos no Telegram: robô, ligar grupo e pessoa, e cada evento do site virando mensagem
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026')
def telegram_responde(chat_id, tipo, texto, titulo='Grupo'):
    # o robô pede as novidades (getUpdates); aqui fazemos o papel do Telegram respondendo
    banco("select tg_receber()")
    req = banco("select req_id from tg_estado")
    upd = int(banco("select ultimo_update from tg_estado")) + 1
    chat = {'id': chat_id, 'type': tipo, 'title': titulo, 'first_name': titulo}
    conteudo = json.dumps({'ok': True, 'result': [{'update_id': upd, 'message': {'chat': chat, 'text': texto}}]}).replace("'", "''")
    banco(f"insert into net._http_response (id, status_code, content) values ({req}, 200, '{conteudo}')")
    banco("select tg_receber()")
def fila(chat=None): return banco("select coalesce(string_agg(chat_id || ' » ' || left(replace(texto, chr(10), ' | '), 220), chr(10) order by id), '') from tg_fila where enviado_em is null" + (f" and chat_id = {chat}" if chat else ''))
def limpar(): banco("update tg_fila set enviado_em = now() where enviado_em is null")
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); W = lambda ms=300: pg.wait_for_timeout(ms)
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'avisos')
    ok('Falta o código' in pg.inner_text('.main') and pg.is_disabled('[data-act=tg-codigo]'), 'sem o robô: mostra o passo a passo do BotFather')
    pg.fill('#tgToken', 'abc'); pg.click('[data-act=tg-token]'); W(); ok('BotFather' in toast(pg), 'código inválido é recusado: ' + toast(pg))
    pg.fill('#tgToken', '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1'); pg.click('[data-act=tg-token]'); parado(pg)
    ok(banco("select decrypted_secret from vault.decrypted_secrets where name = 'telegram_token'") == '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1' and 'Ligado' in pg.inner_text('.main'), 'código do robô guardado no cofre')
    pg.fill('#tgNome', 'Grupo Vendas e Financeiro'); pg.uncheck('.tgSet[value=vendas]') if False else None; pg.check('.tgSet[value=financeiro]'); pg.click('[data-act=tg-codigo]'); parado(pg)
    cod = pg.inner_text('.tg-cod-txt code').split()[-1]; ok(cod.startswith('JCN-'), 'código para o grupo: ' + cod)
    pg.screenshot(path=R + '/testes/shots/t16_avisos.png', full_page=True)
    telegram_responde(-100111, 'supergroup', f'/start@jcngourmet_avisos_bot {cod}', 'JCN Vendas')
    ok(banco("select tipo || '|' || array_to_string(setores, ',') from tg_destinos where chat_id = -100111") == 'grupo|vendas,financeiro' and 'Pronto' in fila(-100111), 'o grupo mandou o código e ficou ligado; o robô responde "Pronto!"')
    banco("select tg_enviar()"); ok(banco("select count(*) from net.pedidos where metodo = 'POST' and url like '%/bot123456789:%/sendMessage' and corpo->>'chat_id' = '-100111'") == '1', 'a mensagem sai para a API do Telegram')
    telegram_responde(-100111, 'supergroup', '/start JCN-ZZZZZZ'); ok('não vale mais' in fila(-100111), 'código errado: o robô avisa'); limpar()
    pg.reload(); W(2000); ok(pg.locator('.tbl tbody tr').count() == 1 and 'Grupo Vendas e Financeiro' in pg.inner_text('.tbl tbody'), 'o grupo aparece na lista')
    # RH: grupo só do RH
    pg.fill('#tgNome', 'Grupo RH'); pg.uncheck('.tgSet[value=vendas]'); pg.uncheck('.tgSet[value=financeiro]'); pg.check('.tgSet[value=rh]'); pg.click('[data-act=tg-codigo]'); parado(pg)
    telegram_responde(-100222, 'group', '/start ' + pg.inner_text('.tg-cod-txt code').split()[-1], 'JCN RH'); limpar()
    pg.click('[data-act=tg-teste] >> nth=0'); parado(pg); ok('Teste de aviso' in fila(-100111), 'botão "Enviar teste"'); limpar(); sair(pg)
    # vendedora liga o próprio Telegram
    entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); pg.click('[data-act=meu-tg]'); W(); pg.click('[data-act=tg-meu-codigo]'); parado(pg)
    cod2 = pg.inner_text('.drawer .tg-cod-txt code').split()[-1]; telegram_responde(555, 'private', '/start ' + cod2, 'Marina'); limpar()
    ok(banco("select perfil_id = (select id from perfis where email = 'marina@jcn.test') from tg_destinos where chat_id = 555") == 't', 'vendedora ligou o próprio Telegram')
    pg.click('.drawer .x'); pg.reload(); W(2000); ok('Meu Telegram ✓' in pg.inner_text('.side'), 'menu mostra que está ligado')
    # retorno de ligação na hora pedida
    hoje = banco("select (now() at time zone 'America/Sao_Paulo')::date"); hora = banco("select to_char((now() at time zone 'America/Sao_Paulo') + interval '2 hours', 'HH24:MI')"); aviso = banco("select to_char((now() at time zone 'America/Sao_Paulo') + interval '105 minutes', 'HH24:MI')")
    ir(pg, 'ligacoes'); pg.fill('#lg-telefone', '(17) 99111-2222'); W(600); pg.fill('#lg-loja', 'Casa das Panelas'); pg.fill('#lg-comprador', 'João'); pg.fill('#lg-cidade', 'Catanduva')
    pg.check('input[name=lgres][value=retornar]'); pg.fill('#lg-tratativa', 'Pediu para ligar depois das 14h.'); pg.fill('#lg-retornar_em', hoje); pg.fill('#lg-retornar_hora', hora); W()
    ok('Telegram' in pg.inner_text('.grid-ret'), 'o formulário avisa que o lembrete vai pelo Telegram')
    pg.screenshot(path=R + '/testes/shots/t16_ligacao.png', clip={'x': 240, 'y': 380, 'width': 1200, 'height': 420})
    pg.click('[data-act=lig-salvar]'); parado(pg, 900)
    q = banco("select chat_id || '|' || to_char(enviar_em at time zone 'America/Sao_Paulo', 'HH24:MI') || '|' || (texto like '%Casa das Panelas%(17) 99111-2222%')::text from tg_fila where chave like 'retorno:%' and enviado_em is null")
    ok(q == f'555|{aviso}|true', f'retorno às {hora}: lembrete 15 minutos antes ({aviso}), no Telegram da vendedora: ' + q)
    pg.fill('#lg-telefone', '(17) 99111-2222'); W(800); pg.click('[data-act=lig-usar]'); W(); pg.check('input[name=lgres][value=cliente]'); pg.fill('#lg-tratativa', 'Fechou 2 fogões.'); pg.click('[data-act=lig-salvar]'); parado(pg, 900)
    ok(banco("select count(*) from tg_fila where chave like 'retorno:%' and enviado_em is null") == '0' and 'fechou com' in fila(-100111), 'nova ligação cancela o lembrete antigo; "fechou com" vai para Vendas'); limpar()
    # pedido com boleto
    ir(pg, 'catalogo'); pg.fill('#bv', 'FG4FSD-AZU'); pg.press('#bv', 'Enter'); W(); pg.click('.cards .card .btn'); W(); pg.click('[data-act=ficha-add]') if pg.locator('[data-act=ficha-add]').count() else None
    ir(pg, 'novo-pedido'); pg.fill('[data-p="cliente.nome"]', 'Padaria Central'); pg.check('#fpBoleto'); W(); pg.check('#bd-30'); W(); pg.click('[data-act=lancar-pedido]'); parado(pg, 1200)
    f = fila(-100111); ok('Pedido nº' in f and 'Padaria Central' in f and 'Boleto para aprovar' in f and 'R$ 1.490,00' in f, 'pedido novo e boleto para aprovar no grupo:\n' + f); limpar(); sair(pg)
    entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'financeiro'); pg.click('#finBoletos [data-act=abrir-pedido]'); W(); pg.click('[data-act=boleto-ok]'); parado(pg, 900); pg.click('.drawer .x')
    ok('Pagamento confirmado' in fila(-100111) and 'foi confirmado' in fila(555), 'boleto aprovado: aviso no grupo e no Telegram da vendedora'); limpar()
    # RH
    banco("insert into candidaturas (nome, email, telefone, cidade, uf, area) values ('Carlos Souza', 'c@x.com', '17988776655', 'Catanduva', 'SP', 'Pintura')")
    ok('Novo currículo' in fila(-100222) and fila(-100111) == '', 'currículo novo vai só para o grupo do RH')
    banco("insert into reunioes (candidatura_id, inicio, link) select id, now() + interval '3 hours', 'https://meet.google.com/abc' from candidaturas")
    ok(banco("select count(*) from tg_fila where chave like 'reuniao:%' and enviado_em is null") == '2', 'reunião: lembretes de 1 hora e 15 minutos antes')
    banco("update reunioes set status = 'cancelada'"); ok(banco("select count(*) from tg_fila where chave like 'reuniao:%' and enviado_em is null") == '0', 'reunião cancelada: lembretes apagados'); limpar()
    banco("select tg_resumo()"); ok('Financeiro hoje' in fila(-100111) and 'RH hoje' in fila(-100222), 'resumo das 8h para cada setor')
    pg.reload(); W(2000); ir(pg, 'avisos'); ok('Enviados nas últimas 24 horas' in pg.inner_text('.main'), 'painel mostra os envios'); pg.screenshot(path=R + '/testes/shots/t16_painel.png', full_page=True)
    limpar(); banco("update tg_fila set enviado_em = null, enviar_em = now() - interval '1 minute' where id = (select max(id) from tg_fila)"); n0 = banco("select count(*) from net.pedidos where metodo='POST'"); banco("select tg_enviar()")
    ok(int(banco("select count(*) from net.pedidos where metodo='POST'")) == int(n0) + 1, 'o relógio de 1 minuto envia o que está na hora')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:200])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
