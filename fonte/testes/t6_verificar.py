# Página de conferência: banco como o usuário tem hoje (sem a atualização, com "Confirm email" ligado) e depois de tudo aplicado
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir({'SEM_ATUALIZACAO': '1', 'EMU_AUTOCONFIRMA': '0'})
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br); pg.goto(B + 'verificar.html'); pg.wait_for_timeout(2500)
    t = pg.inner_text('#lista'); ok('Falta: atualização 1' in t and 'Falta: confirmação de e-mail ligada' in t and 'Certo: dados reservados fechados' in t and 'Certo: catálogo no banco' in t, 'como está hoje: aponta a atualização que falta e o "Confirm email": ' + pg.inner_text('#resumo'))
    pg.screenshot(path=R + '/testes/shots/t6_antes.png', full_page=True)
    s, e2 = pagina(br); s.goto(B); s.wait_for_timeout(2000); ok(s.locator('#stripes .stripe').count() == 11 and not [x for x in e2 if 'PAGEERR' in x], 'mesmo sem a atualização, o site abre (só as fotos do banco ainda não vêm)')
    srv.terminate(); srv.wait(); srv = subir()
    pg.reload(); pg.wait_for_timeout(2500); t = pg.inner_text('#lista')
    ok(t.count('Certo:') == 7 and 'Falta' not in t and 'Atenção: site sem cadeado' in t, 'com tudo aplicado: 7 itens certos (o aviso de HTTPS é só do ambiente de teste): ' + pg.inner_text('#resumo'))
    pg.fill('#email', 'admin@jcn.test'); pg.fill('#senha', 'errada'); pg.click('#form button'); pg.wait_for_timeout(900); ok('não conferem' in pg.inner_text('#conta'), 'senha errada: ' + pg.inner_text('#conta')[:60])
    pg.fill('#senha', 'Admin#2026'); pg.click('#form button'); pg.wait_for_timeout(1500); ok('Conta de administrador pronta' in pg.inner_text('#conta') and '177 valores' not in pg.inner_text('#conta') and '168 valores' in pg.inner_text('#conta'), 'conta de administrador conferida: ' + pg.inner_text('#conta'))
    banco("insert into auth.users (email, encrypted_password, email_confirmed_at) values ('semperfil@jcn.test', crypt('SemPerfil#1', gen_salt('bf', 4)), now())")
    pg.fill('#email', 'semperfil@jcn.test'); pg.fill('#senha', 'SemPerfil#1'); pg.click('#form button'); pg.wait_for_timeout(1500); ok('ainda não tem perfil' in pg.inner_text('#conta'), 'usuário criado no Supabase mas sem o passo do perfil: ' + pg.inner_text('#conta')[:80])
    pg.screenshot(path=R + '/testes/shots/t6_depois.png', full_page=True)
    ok(not errs, 'sem erros no console: ' + ' | '.join(errs)[:300])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
