import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir(); F2 = '/tmp/claude-0/-home-claude-site-jcn/90de04ff-9fd3-52fc-9db3-a4982247f63f/scratchpad/foto2.png'
n = lambda cod: banco(f"select count(*) from fotos_produto f join produtos p on p.id = f.produto_id where p.codigo = '{cod}'")
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); W = lambda ms=300: pg.wait_for_timeout(ms)
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026')
    ir(pg, 'produtos'); pg.fill('#bp', 'FF008'); pg.press('#bp', 'Enter'); W(); pg.click('[data-act=editar-produto]'); W()
    antes = n('FF008'); pg.set_input_files('[data-file=foto-produto]', [FX + 'comprovante.png', F2]); W(1500); pg.click('[data-act=salvar-produto]'); parado(pg, 1500)
    ok(int(n('FF008')) == int(antes) + 2, f'no cadastro do produto: duas fotos de uma vez ({antes} → {n("FF008")})')
    ir(pg, 'galeria'); pg.fill('#galBusca', 'FF029'); W(700); ok('Sem foto ainda' in pg.inner_text('.galcard') or pg.locator('.galcard img').count() >= 1, 'a administração vê o produto na galeria mesmo sem foto')
    a2 = n('FF029'); b2 = n('FF980'); pg.click('.galcard [data-act=gal-editar]'); W(); pg.set_input_files('.drawer [data-file=gal-foto]', [FX + 'comprovante.png', F2]); parado(pg, 2500); pg.click('.drawer .x'); W()
    ok(int(n('FF029')) == int(a2) + 2 and n('FF980') == b2, f'na galeria: duas fotos de uma vez, só na grelha escolhida ({a2} → {n("FF029")}; a outra fica {n("FF980")})')
    pg.screenshot(path=R + '/testes/shots/t10_galeria_admin.png')
    ir(pg, 'conteudo'); g0 = len(json.loads(banco("select valor->'galeria' from conteudo_site where chave='site'") or '[]'))
    pg.set_input_files('[data-file=foto-galeria]', [FX + 'comprovante.png', F2]); parado(pg, 2500)
    ok(len(json.loads(banco("select valor->'galeria' from conteudo_site where chave='site'"))) == max(g0, 4) + 2, 'galeria do site: duas fotos de uma vez')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:200])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
