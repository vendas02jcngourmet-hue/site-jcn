# Supabase ainda com "Confirm email" ligado: o painel explica o que fazer em vez de criar um login que não entra
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir({'EMU_AUTOCONFIRMA': '0'})
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); pg.goto(B); pg.wait_for_timeout(1200); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'usuarios')
    pg.fill('#nuNome', 'Marina'); pg.fill('#nuEmail', 'marina@jcn.test'); pg.fill('#nuSenha', 'Marina#2026'); pg.click('[data-act=user-add]'); parado(pg)
    ok('Confirm email' in toast(pg) and banco("select count(*) from auth.users") == '1', 'com a confirmação de e-mail ligada, nada é criado e o painel diz onde desligar: ' + toast(pg))
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
