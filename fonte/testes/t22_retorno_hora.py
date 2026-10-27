# Ligações: cada vendedor vê só as dele; retorno com dia e hora; aviso no Telegram 15 minutos antes
import sys, urllib.error; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026'); conta('Bruno Castro', 'bruno@jcn.test', 'vendedor', 'Bruno#2026')
banco("select vault.create_secret('123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1', 'telegram_token', '')")
banco("insert into tg_destinos (chat_id, nome, tipo, setores) values (-100111, 'Vendas', 'grupo', '{vendas}')")
banco("insert into tg_destinos (chat_id, nome, tipo, setores, perfil_id) select 555, 'Marina', 'pessoa', '{}', id from perfis where email = 'marina@jcn.test'")
aviso = lambda: banco("select coalesce(string_agg(chat_id || '|' || to_char(enviar_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI'), ','), '') from tg_fila where chave like 'retorno:%' and enviado_em is null")
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); W = lambda ms=300: pg.wait_for_timeout(ms)
    amanha = banco("select current_date + 1")
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ir(pg, 'ligacoes')
    pg.fill('#lg-telefone', '(17) 99111-2222'); W(600); pg.fill('#lg-loja', 'Casa das Panelas'); pg.fill('#lg-cidade', 'Catanduva')
    pg.check('input[name=lgres][value=retornar]'); pg.fill('#lg-tratativa', 'Pediu para ligar amanhã às 14h30.'); pg.fill('#lg-retornar_em', amanha); pg.click('[data-act=lig-salvar]'); W()
    ok('hora do retorno' in pg.inner_text('#lgErro'), 'com o dia marcado, a hora é obrigatória: ' + pg.inner_text('#lgErro'))
    pg.fill('#lg-retornar_hora', '14:30'); pg.screenshot(path=R + '/testes/shots/t22_form.png', clip={'x': 240, 'y': 380, 'width': 1200, 'height': 440}); pg.click('[data-act=lig-salvar]'); parado(pg, 900)
    ok(aviso() == f'555|{amanha} 14:15', 'aviso no Telegram da vendedora 15 minutos antes (14:15): ' + aviso())
    ok(banco("select proximo_contato || ' ' || proximo_hora from prospects") == f'{amanha} 14:30:00', 'a loja guarda o dia e a hora do retorno')
    # muda a hora pela ficha da loja: o aviso acompanha
    ir(pg, 'clientes'); ok('às 14:30' in pg.inner_text('.tbl tbody'), 'lista de possíveis clientes mostra a hora')
    pg.click('[data-act=abrir-prospect]'); W(); pg.fill('[data-pd=proximo_hora]', '16:00'); pg.click('[data-act=prospect-salvar]'); parado(pg)
    ok(aviso() == f'555|{amanha} 15:45', 'mudou a hora na ficha da loja: o aviso passa para 15:45: ' + aviso())
    pg.fill('[data-pd=proximo_hora]', ''); pg.click('[data-act=prospect-salvar]'); W(); ok('hora do próximo contato' in pg.inner_text('.drawer .err'), 'na ficha da loja, a hora também é obrigatória')
    pg.screenshot(path=R + '/testes/shots/t22_ficha.png'); pg.click('.drawer .x'); W()
    # retorno de hoje, com a hora, na tela de ligações
    banco("update prospects set proximo_contato = current_date, proximo_hora = '23:59'"); pg.reload(); W(2000); ir(pg, 'ligacoes')
    ok('às 23:59' in pg.inner_text('.main') and pg.locator('[data-chg=lig-meus]').count() == 0, 'retornos de hoje com a hora')
    pg.screenshot(path=R + '/testes/shots/t22_retornos.png', full_page=True)
    sair(pg)
    # o outro vendedor não vê as ligações dela, nem pela tela nem direto no banco
    entrar(pg, 'vendas', 'bruno@jcn.test', 'Bruno#2026'); ir(pg, 'ligacoes'); ok('Casa das Panelas' not in pg.inner_text('.main'), 'Bruno não vê a ligação nem o retorno da Marina')
    K = 'sb_publishable_teste'
    def http(caminho, token):
        rq = urllib.request.Request(B + caminho, headers={'apikey': K, 'Authorization': 'Bearer ' + token})
        return json.loads(urllib.request.urlopen(rq).read())
    def tok(e, s):
        rq = urllib.request.Request(B + 'auth/v1/token?grant_type=password', data=json.dumps({'email': e, 'password': s}).encode(), method='POST', headers={'apikey': K, 'Content-Type': 'application/json'})
        return json.loads(urllib.request.urlopen(rq).read())['access_token']
    ok(http('rest/v1/ligacoes?select=*', tok('bruno@jcn.test', 'Bruno#2026')) == [] and len(http('rest/v1/ligacoes?select=*', tok('marina@jcn.test', 'Marina#2026'))) == 1, 'no banco: cada vendedor só lê as ligações dele')
    ok(len(http('rest/v1/ligacoes?select=*', tok('admin@jcn.test', 'Admin#2026'))) == 1, 'a administração continua vendo todas')
    sair(pg); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'rel-lig'); pg.select_option('[data-k=per]', 'tudo'); W(); ok('Casa das Panelas' in pg.inner_text('.main'), 'relatório da administração com todas as ligações')
    # virou cliente: o aviso some
    banco("update prospects set situacao = 'cliente'"); ok(aviso() == '', 'loja que virou cliente: o aviso é cancelado')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:200])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
