# Cliques em sequência rápida (nada se perde), vendedor retirando etiqueta, compra na loja do site com alguém logado, sair em um aparelho não derruba o outro
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026')
banco("""insert into configuracoes (chave, valor) values ('pix', '{"chave": "12.345.678/0001-95", "favorecido": "JCN", "banco": ""}')""")
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); W = lambda ms=250: pg.wait_for_timeout(ms)
    pg.goto(B); W(1500); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026')
    pg.fill('#bv', 'FG4FSD-AZU'); pg.press('#bv', 'Enter'); W(); pg.click('.cards .card .btn'); W(); pg.click('[data-act=ficha-add]') if pg.locator('[data-act=ficha-add]').count() else None
    fechar_orc(pg, 'Cliente Rápido', comprovante=FX + 'comprovante.png')
    ok(banco("select count(*) || '|' || max(pix_status) from pedidos") == '1|em_analise', 'pedido lançado numa chamada só, com comprovante')
    # vendedora anexa e retira uma etiqueta
    pg.click('[data-act=abrir-pedido]'); W(); pg.set_input_files('[data-file=etq-pedido]', FX + 'etiqueta-1.pdf'); parado(pg, 900); ok(banco("select count(*) from anexos where tipo = 'etiqueta_envio'") == '1', 'vendedora anexa a etiqueta')
    pg.click('[data-act=etq-rem]'); W(150); pg.click('[data-act=etq-rem]') if pg.locator('[data-act=etq-rem]').count() else None; parado(pg, 900)
    ok(banco("select count(*) from anexos where tipo = 'etiqueta_envio'") == '0' and banco("select count(*) from storage.objects where name like '%etiqueta%'") == '0', 'e retira: some o registro e o arquivo')
    pg.set_input_files('[data-file=etq-pedido]', FX + 'etiqueta-1.pdf'); parado(pg, 900); pg.click('.drawer .x')
    # ---------- administração: dois cliques seguidos, sem esperar
    adm, e2 = pagina(br); adm.goto(B); adm.wait_for_timeout(1200); entrar(adm, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(adm, 'pedidos'); adm.click('[data-act=abrir-pedido]'); adm.wait_for_timeout(300)
    adm.evaluate("""() => { document.querySelector('[data-act=pix-ok]').click(); const b = document.querySelector('[data-act=envio][data-s=expedicao]'); b.disabled = false; b.click(); }""")
    parado(adm, 1500); st = banco("select pix_status || '|' || envio_status from pedidos"); ok(st == 'verificado|em_expedicao', 'conferir o PIX e liberar a expedição em cliques seguidos: os dois ficam gravados: ' + st)
    adm.click('[data-act=envio][data-s=enviado]'); parado(adm); adm.click('.drawer .x'); ok(banco("select envio_status from pedidos") == 'enviado', 'marcado como enviado')
    ir(adm, 'produtos'); adm.evaluate("""() => { [...document.querySelectorAll('[data-act=toggle-prod]')].slice(0, 4).forEach(t => t.click()); }"""); parado(adm, 2500)
    ok(banco("select count(*) from produtos where not ativo") == '4', 'quatro produtos desligados em cliques seguidos: os quatro gravados: ' + banco("select count(*) from produtos where not ativo"))
    adm.evaluate("""() => { [...document.querySelectorAll('[data-act=toggle-prod]')].slice(0, 4).forEach(t => t.click()); }"""); parado(adm, 2500); ok(banco("select count(*) from produtos where not ativo") == '0', 'e religados')
    # ---------- sair em um aparelho não derruba o outro
    outro, e3 = pagina(br); outro.goto(B); outro.wait_for_timeout(1200); entrar(outro, 'vendas', 'admin@jcn.test', 'Admin#2026'); sair(outro)
    ir(adm, 'usuarios'); ir(adm, 'pedidos'); adm.reload(); adm.wait_for_timeout(2000); ok(adm.locator('.side nav').count() == 1 and adm.locator('.tbl tbody tr').count() == 1, 'sair em um aparelho não tira a administração do outro')
    # ---------- vendedora logada compra na loja do site
    pg.click('[data-act=voltar-site]'); W(600); pg.evaluate("document.querySelector('#vitrine').scrollIntoView()"); W(400)
    pg.click('.vit-cards .card:has-text("Carlos") .btn'); W(); pg.click('[data-act=ficha-add]'); W(); pg.click('#vitSacola'); W()
    for k, v in dict(nome='Marina Tavares Compradora', doc='529.982.247-25', fone='(17) 99999-0000', cep='15800-000', rua='Rua Sete', numero='7', bairro='Centro', cidade='Catanduva').items(): pg.fill('#cp-' + k, v)
    pg.select_option('#cp-uf', 'SP'); pg.set_input_files('[data-file=comp-site]', FX + 'comprovante.png'); W(600); pg.click('[data-act=enviar-pedido-site]'); parado(pg, 1500)
    d = pg.inner_text('.drawer') if pg.locator('.drawer').count() else ''; ok('Pedido recebido' in d and 'R$ 1.788,00' in d, 'com a vendedora logada, a compra na loja do site mostra a confirmação: ' + d[:60].replace('\n', ' '))
    pg.click('.drawer .foot .btn'); W(); pg.click('.site-head [data-act=abrir-login]'); W(500); ir(pg, 'pedidos'); ok(pg.locator('.tbl tbody tr').count() == 1, 'e o pedido do site não se mistura com os pedidos dela no portal')
    todos = errs + e2 + e3; ok(not todos, 'sem erros no console: ' + ' | '.join(todos)[:400]); print('recusas:', recusas())
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
