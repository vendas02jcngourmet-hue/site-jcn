# Fotos do mesmo álbum chegam ao mesmo tempo na função: tem que dar um currículo só, com a legenda valendo
import sys, subprocess, time, json; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
PSQL = ['psql', '-h', '/var/tmp/pgjcn', '-p', '5544', '-U', 'postgres', '-d', 'jcn_emu', '-X', '-q', '-At', '-c']
def pag(mid, legenda=None):
    p = {'chat_id': -100555, 'message_id': mid, 'autor': 42, 'autor_nome': 'Rita', 'grupo': 'alb9', 'caminho': f'curriculos/telegram/g100555-{mid}.jpg', 'mime': 'image/jpeg'}
    if legenda: p['legenda'] = legenda
    return json.dumps(p, ensure_ascii=False).replace("'", "''")
try:
    # a página 2 (sem legenda) chega primeiro e demora; a 1 (com legenda) e a 3 chegam no meio
    a = subprocess.Popen(PSQL + [f"begin; set role service_role; select cv_do_telegram('{pag(22)}'); select pg_sleep(1.5); commit;"], stdout=subprocess.DEVNULL)
    time.sleep(0.4)
    b = subprocess.Popen(PSQL + [f"set role service_role; select cv_do_telegram('{pag(21, 'Carlos Souza' + chr(10) + '(17) 99123-4567')}')"], stdout=subprocess.DEVNULL)
    c = subprocess.Popen(PSQL + [f"set role service_role; select cv_do_telegram('{pag(23)}')"], stdout=subprocess.DEVNULL)
    for x in (a, b, c): x.wait()
    r = banco("select count(*) || '|' || max(nome) || '|' || max(telefone) || '|' || max(jsonb_array_length(arquivos)) from candidaturas where tg_grupo = 'alb9'")
    ok(r == '1|Carlos Souza|17991234567|3', 'três páginas ao mesmo tempo: um currículo só, com o nome e o WhatsApp da legenda: ' + r)
    ok(banco("select string_agg(a->>'msg', ',' order by o) from candidaturas, jsonb_array_elements(arquivos) with ordinality as t(a, o) where tg_grupo = 'alb9'") == '21,22,23'
       and banco("select curriculo_caminho from candidaturas where tg_grupo = 'alb9'").endswith('-21.jpg'), 'páginas na ordem em que foram mandadas')
    t = banco("select string_agg(texto, ' || ') from tg_fila where enviado_em is null and chat_id = -100555")
    ok(t.count('Currículo cadastrado') == 1 and 'Carlos Souza' in t and 'Dica' not in t, 'o robô confirma uma vez só, já com o nome: ' + t.replace('\n', ' '))
    banco(f"set role service_role; select cv_do_telegram('{pag(23)}')")
    ok(banco("select jsonb_array_length(arquivos) from candidaturas where tg_grupo = 'alb9'") == '3', 'se a mesma foto chegar duas vezes, não duplica a página')
    # tela de avisos: diz se a função do Supabase está respondendo
    banco("select vault.create_secret('123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1', 'telegram_token', '')")
    banco("insert into tg_destinos (chat_id, nome, tipo, setores) values (-100555, 'RH JCN', 'grupo', '{rh}')")
    banco('''select tg_cv_pedir('{"message_id": 30, "chat": {"id": -100555}, "from": {"id": 42}, "photo": [{"file_id": "x", "file_size": 10}]}'::jsonb)''')
    req = banco("select cv_req from tg_estado"); banco(f"insert into net._http_response (id, status_code, content) values ({req}, 401, 'Missing authorization header')")
    with sync_playwright() as p:
        br = p.chromium.launch(); pg, errs = pagina(br); pg.goto(B); pg.wait_for_timeout(1200); entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'avisos')
        ok('Falta desligar a verificação de JWT' in pg.inner_text('#painelCvTG'), 'função sem a verificação desligada: a tela avisa o que fazer')
        banco(f"update net._http_response set status_code = 200, content = '{{}}' where id = {req}"); pg.reload(); pg.wait_for_timeout(1500); ir(pg, 'avisos')
        ok('Funcionando' in pg.inner_text('#painelCvTG') and 'Já chegaram 1' in pg.inner_text('#painelCvTG'), 'função respondendo: "Funcionando"')
        pg.locator('#painelCvTG').screenshot(path=R + '/testes/shots/t18_painel.png')
        ok(not errs, 'sem erros: ' + ' | '.join(errs)[:200])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
