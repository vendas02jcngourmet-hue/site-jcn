# Sessão (continuar logado, renovar, cair), troca de senha, conta desativada, atualização entre aparelhos, texto malicioso, celular e falta de conexão
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir({'EMU_VALIDADE': '5'})          # o bilhete de acesso vale só 5 segundos: o site precisa renová-lo sozinho o tempo todo
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026')
banco("""insert into configuracoes (chave, valor) values ('pix', '{"chave": "12.345.678/0001-95", "favorecido": "JCN", "banco": ""}')""")
pid = lambda cod: banco(f"select id from produtos where codigo = '{cod}'")
def rapido(pg):   # o site confere novidades a cada 2 segundos neste teste (no ar: 30)
    pg.route('**/config.js', lambda r: r.fulfill(content_type='application/javascript', body=f"window.CONFIG={{url:'{B.rstrip('/')}',chave:'sb_publishable_teste',dominio_dos_logins:'jcn.test',segundos_entre_atualizacoes:2}};"))
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); W = lambda ms=250: pg.wait_for_timeout(ms); rapido(pg)
    pg.goto(B); W(1500); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ir(pg, 'pedidos')
    # ---------- continuar logado e renovar o acesso
    pg.reload(); W(2500); ok(pg.locator('.side nav').count() == 1 and 'Marina Tavares' in pg.inner_text('.who') and 'Pedidos' in pg.inner_text('.main h1'), 'depois de recarregar a página a vendedora continua dentro, na mesma tela')
    ok('Marina#2026' not in pg.evaluate("JSON.stringify(localStorage) + JSON.stringify(sessionStorage)"), 'a senha não fica guardada no navegador')
    W(6000); ir(pg, 'catalogo'); pg.fill('#bv', 'FG4FSD-AZU'); pg.press('#bv', 'Enter'); W(); pg.click('.cards .card .btn'); W(); pg.click('[data-act=ficha-add]') if pg.locator('[data-act=ficha-add]').count() else None
    ir(pg, 'novo-pedido'); pg.fill('[data-p="cliente.nome"]', 'Depois de renovar'); pg.click('[data-act=lancar-pedido]'); parado(pg, 800)
    ok(banco("select count(*) from pedidos where cliente_nome = 'Depois de renovar'") == '1', 'com o bilhete vencido, o site renova sozinho e o pedido é gravado')
    # ---------- atualização entre aparelhos
    adm, e2 = pagina(br); rapido(adm); adm.goto(B); adm.wait_for_timeout(1200); entrar(adm, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(adm, 'pedidos'); n0 = adm.locator('.tbl tbody tr').count()
    ir(pg, 'catalogo'); pg.fill('#bv', 'FG4FSD-PRE'); pg.press('#bv', 'Enter'); W(); pg.click('.cards .card .btn'); W(); pg.click('[data-act=ficha-add]') if pg.locator('[data-act=ficha-add]').count() else None
    ir(pg, 'novo-pedido'); pg.fill('[data-p="cliente.nome"]', 'Pedido novo'); pg.set_input_files('[data-file=comp-novo]', FX + 'comprovante.png'); W(600); pg.click('[data-act=lancar-pedido]'); parado(pg, 800)
    adm.wait_for_timeout(4500); ok(n0 == 1 and adm.locator('.tbl tbody tr').count() == 2 and 'Pedido novo' in adm.inner_text('.tbl tbody'), 'o pedido lançado em um aparelho aparece no outro sem recarregar a página')
    adm.click('tr:has-text("Pedido novo") [data-act=abrir-pedido]'); adm.wait_for_timeout(300); adm.click('[data-act=pix-ok]'); parado(adm); pg.wait_for_timeout(4500)
    ok('verificado' in pg.inner_text('tr:has-text("Pedido novo")').lower(), 'e a vendedora vê o PIX conferido pela administração: ' + pg.inner_text('tr:has-text("Pedido novo")').replace('\t', ' | ')[:120])
    adm.click('.drawer .x')
    # ---------- trocar a própria senha
    pg.click('[data-act=minha-senha]'); W(); pg.fill('#msNova', 'curta'); pg.fill('#msDeNovo', 'curta'); pg.click('[data-act=salvar-minha-senha]'); W(); ok('8 caracteres' in pg.inner_text('.drawer'), 'senha curta não passa')
    pg.fill('#msNova', 'NovaMarina#9'); pg.fill('#msDeNovo', 'NovaMarina#8'); pg.click('[data-act=salvar-minha-senha]'); W(); ok('iguais' in pg.inner_text('.drawer'), 'as duas digitações precisam bater')
    pg.fill('#msNova', 'NovaMarina#9'); pg.fill('#msDeNovo', 'NovaMarina#9'); pg.click('[data-act=salvar-minha-senha]'); parado(pg); ok('Senha trocada' in toast(pg), 'a própria pessoa troca a senha: ' + toast(pg))
    sair(pg); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ok('incorretos' in pg.inner_text('.err'), 'a senha antiga deixa de funcionar')
    entrar(pg, 'vendas', 'marina@jcn.test', 'NovaMarina#9'); ok(pg.locator('.side nav').count() == 1, 'a nova funciona')
    # ---------- conta desativada com a pessoa dentro
    ir(adm, 'usuarios'); adm.click('tr:has-text("Marina Tavares") [data-act=toggle-user]'); parado(adm); pg.wait_for_timeout(5000)
    ok(pg.locator('.login').count() == 1 and 'desativada' in pg.inner_text('.err'), 'administração desativa a conta: a vendedora é tirada do portal em seguida: ' + (pg.inner_text('.err') if pg.locator('.err').count() else ''))
    entrar(pg, 'vendas', 'marina@jcn.test', 'NovaMarina#9'); ok('inativa' in pg.inner_text('.err'), 'e não entra mais: ' + pg.inner_text('.err'))
    adm.click('tr:has-text("Marina Tavares") [data-act=toggle-user]'); parado(adm); entrar(pg, 'vendas', 'marina@jcn.test', 'NovaMarina#9'); ok(pg.locator('.side nav').count() == 1, 'reativada, volta a entrar')
    # ---------- administração troca a senha: a sessão antiga cai
    adm.click('tr:has-text("Marina Tavares") [data-act=user-senha]'); adm.wait_for_timeout(200); adm.click('tr:has-text("Marina Tavares") [data-act=user-senha]'); parado(adm); nova = adm.inner_text('#acDados dd >> nth=1')
    # ---------- texto malicioso vindo de fora (pedido do site)
    mal = '<img src=x onerror="window.__invadido=1">'; cli, e3 = pagina(br); cli.goto(B); cli.wait_for_timeout(1500); cli.evaluate("document.querySelector('#vitrine').scrollIntoView()"); cli.wait_for_timeout(300)
    cli.click('.vit-cards .card:has-text("Zilda") .btn'); cli.wait_for_timeout(250); cli.click('[data-act=ficha-add]'); cli.wait_for_timeout(250); cli.click('#vitSacola'); cli.wait_for_timeout(250)
    for k, v in dict(nome='Maria ' + mal, doc='529.982.247-25', fone='(17) 99999-0000', cep='15800-000', rua=mal, numero='1', bairro='Centro', cidade='Catanduva', obs='<script>window.__invadido=2</script>').items(): cli.fill('#cp-' + k, v)
    cli.select_option('#cp-uf', 'SP'); cli.set_input_files('[data-file=comp-site]', FX + 'comprovante.png'); cli.wait_for_timeout(600); cli.click('[data-act=enviar-pedido-site]'); parado(cli, 1200)
    ok(banco("select count(*) from pedidos where origem = 'site'") == '1', 'pedido do site com texto malicioso no nome, endereço e observações foi gravado')
    ir(adm, 'pedidos'); adm.wait_for_timeout(2500); adm.click('tr:has-text("Maria") [data-act=abrir-pedido]'); adm.wait_for_timeout(400)
    ok(adm.evaluate("window.__invadido") is None and cli.evaluate("window.__invadido") is None and adm.locator('.drawer img[src="x"]').count() == 0 and '<img src=x' in adm.inner_text('.drawer'), 'no painel o texto aparece como texto: nada é executado')
    csp = adm.evaluate("document.querySelector('meta[http-equiv=Content-Security-Policy]').content"); ok("script-src 'self'" in csp and "default-src 'self'" in csp, 'a página só aceita scripts do próprio site (CSP)')
    adm.click('.drawer .x')
    # ---------- servidor fora do ar
    off, e4 = pagina(br); off.route('**/rest/v1/**', lambda r: r.abort()); off.route('**/auth/v1/**', lambda r: r.abort()); off.goto(B); off.wait_for_timeout(2500)
    ok(off.inner_text('#heroTitle') != '' and off.locator('#rail button').count() == 11 and off.locator('.toast:not([hidden])').count() == 1, 'sem o banco, a página inicial abre mesmo assim e avisa: ' + toast(off))
    ok(off.locator('.vit-cards .card').count() == 0, 'e não mostra preço nenhum enquanto não fala com o banco')
    off.click('.site-head [data-act=abrir-login]'); off.wait_for_timeout(200); off.fill('#lgEmail', 'admin@jcn.test'); off.fill('#lgSenha', 'Admin#2026'); off.press('#lgSenha', 'Enter'); off.wait_for_timeout(800)
    ok('conexão' in off.inner_text('.err'), 'login sem conexão avisa: ' + off.inner_text('.err'))
    # ---------- celular
    m, e5 = pagina(br, 390, 800, color_scheme='dark', device_scale_factor=2, is_mobile=True, has_touch=True); m.goto(B); m.wait_for_timeout(2000)
    ok(not m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"), 'celular: página inicial sem rolagem lateral'); m.screenshot(path=R + '/testes/shots/t4m_home.png')
    m.evaluate("document.querySelector('#vitrine').scrollIntoView()"); m.wait_for_timeout(500); m.screenshot(path=R + '/testes/shots/t4m_loja.png'); ok(m.locator('.vit-cards .card').count() == 11, 'celular: loja com os 11 fogões')
    m.evaluate("scrollTo(0,0)"); m.wait_for_timeout(200); m.evaluate("document.querySelector('[data-act=abrir-login]').click()"); m.wait_for_timeout(300); m.fill('#lgEmail', 'admin@jcn.test'); m.fill('#lgSenha', 'Admin#2026'); m.press('#lgSenha', 'Enter'); m.wait_for_selector('.side nav', timeout=8000); m.wait_for_timeout(400)
    m.screenshot(path=R + '/testes/shots/t4m_admin.png'); ok(not m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"), 'celular: painel sem rolagem lateral')
    # ---------- sessão derrubada no servidor
    srv.terminate(); srv.wait(); import subprocess as sp
    srv = sp.Popen([sys.executable, R + '/emu/emu.py', DIST, str(PORTA)], stdout=sp.DEVNULL, stderr=sp.DEVNULL); time.sleep(1.5)
    adm.wait_for_timeout(5000)
    ok(adm.locator('.login').count() == 1 and 'sessão terminou' in adm.inner_text('.err'), 'quando o servidor não renova mais a sessão, o site volta para o login: ' + (adm.inner_text('.err') if adm.locator('.err').count() else adm.inner_text('.main h1')))
    ok('jcn-acesso' not in adm.evaluate("Object.keys(localStorage).join(',')"), 'e apaga o bilhete guardado no navegador')
    todos = [x for x in errs + e2 + e3 + e5 if 'ERR_CONNECTION_REFUSED' not in x and 'Failed to fetch' not in x]; ok(not todos, 'sem erros no console: ' + ' | '.join(todos)[:400])
finally:
  srv.terminate()
print('\nFALHAS:', F if F else 'nenhuma')
