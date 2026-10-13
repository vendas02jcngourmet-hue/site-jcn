import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
banco("insert into auth.users (email, encrypted_password, email_confirmed_at) values ('adminmaster@jcn.test', crypt('Senha#Forte1', gen_salt('bf', 4)), now())")
banco("insert into perfis (id, nome, email, papel, empresa) select id, 'Admin Master', email, 'admin', 'JCN Gourmet' from auth.users where email = 'adminmaster@jcn.test'")
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); pg.goto(B); pg.wait_for_timeout(1200)
    entrar(pg, 'vendas', 'AdminMaster', 'Senha#Forte1'); ok(len(nav(pg)) == 9 and 'Admin Master' in pg.inner_text('.who'), 'entra só com o nome AdminMaster')
    sair(pg); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ok(len(nav(pg)) == 9, 'e-mail completo continua funcionando')
    ok(not errs, 'sem erros: ' + ' | '.join(errs))
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
