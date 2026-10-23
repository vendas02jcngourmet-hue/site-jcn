# Currículos mandados em foto no grupo do RH do Telegram viram candidaturas no site
import sys, shutil; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
ARQ = '/var/tmp/pgjcn/emu-arquivos/'
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Rita RH', 'rita@jcn.test', 'rh_admin', 'Rita#2026x'); conta('Ana Assistente', 'ana@jcn.test', 'rh_assistente', 'Ana#2026xx')
banco("select vault.create_secret('123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw1', 'telegram_token', '')")
banco("insert into tg_destinos (chat_id, nome, tipo, setores) values (-100555, 'RH JCN', 'grupo', '{rh}'), (-100777, 'Vendas JCN', 'grupo', '{vendas}')")
def telegram_manda(msgs):
    banco("select tg_receber()"); req = banco("select req_id from tg_estado"); upd = int(banco("select ultimo_update from tg_estado"))
    res = [{'update_id': upd + i + 1, 'message': m} for i, m in enumerate(msgs)]
    banco(f"insert into net._http_response (id, status_code, content) values ({req}, 200, '{json.dumps({'ok': True, 'result': res}, ensure_ascii=False).replace(chr(39), chr(39) * 2)}')")
    banco("select tg_receber()")
def foto(chat, mid, autor=42, legenda=None, grupo=None):
    m = {'message_id': mid, 'chat': {'id': chat, 'type': 'group', 'title': 'G'}, 'from': {'id': autor, 'first_name': 'Rita', 'last_name': 'RH'}, 'photo': [{'file_id': f'peq{mid}', 'file_size': 900}, {'file_id': f'grande{mid}', 'file_size': 90000}]}
    if legenda: m['caption'] = legenda
    if grupo: m['media_group_id'] = grupo
    return m
def funcao_guarda(p, arquivo):
    """faz o papel da função curriculo-telegram: guarda o arquivo e chama cv_do_telegram como service_role"""
    caminho = f"curriculos/telegram/g{-p['chat_id']}-{p['message_id']}.jpg"
    shutil.copy(FX + arquivo, ARQ + 'rh__' + caminho.replace('/', '_'))
    banco(f"insert into storage.objects (bucket_id, name, metadata) values ('rh', '{caminho}', '{{\"mimetype\":\"image/jpeg\"}}')")
    q = json.dumps({**p, 'caminho': caminho, 'mime': 'image/jpeg'}, ensure_ascii=False).replace("'", "''")
    return json.loads(banco(f"set role service_role; select cv_do_telegram('{q}')").splitlines()[-1])
def pedidos(): return [json.loads(x) for x in banco("select corpo from net.pedidos where url like '%/functions/v1/curriculo-telegram' order by id").splitlines() if x]
try:
    LEG = 'Joana Pereira Lima\n(17) 99123-4567\nCatanduva/SP\njoana.lima@exemplo.com\nVaga de montagem'
    telegram_manda([foto(-100555, 10, legenda=LEG, grupo='alb1'), foto(-100555, 11, grupo='alb1'), foto(-100777, 12, legenda='foto do fogão'),
                    {'message_id': 13, 'chat': {'id': -100555, 'type': 'group'}, 'from': {'id': 42}, 'text': 'bom dia'}])
    ps = pedidos()
    ok(len(ps) == 2 and [p['message_id'] for p in ps] == [10, 11], 'só as fotos do grupo do RH chamam a função (o grupo de vendas e o texto não): ' + str([p['message_id'] for p in ps]))
    ok(ps[0]['file_id'] == 'grande10' and ps[0]['legenda'] == LEG and ps[0]['grupo'] == 'alb1', 'pede a foto no tamanho maior, com a legenda')
    for r in ('anon', 'authenticated'):
        try: banco(f"set role {r}; select tg_cv_config()"); ok(False, f'{r} não lê o segredo')
        except RuntimeError: ok(True, f'{r} não lê o código do robô nem o segredo')
        try: banco(f"set role {r}; select cv_do_telegram('{{}}')"); ok(False, f'{r} não cadastra')
        except RuntimeError: ok(True, f'{r} não consegue cadastrar currículo pela porta do Telegram')
    r1 = funcao_guarda(ps[0], 'cv-foto-1.jpg'); r2 = funcao_guarda(ps[1], 'cv-foto-2.jpg')
    ok(r1['novo'] and not r2['novo'] and r2['paginas'] == 2, 'o álbum vira um currículo só com 2 páginas')
    ok(banco("select nome || '|' || telefone || '|' || cidade || '|' || uf || '|' || email || '|' || area || '|' || origem from candidaturas") == 'Joana Pereira Lima|17991234567|Catanduva|SP|joana.lima@exemplo.com|A definir|telegram', 'nome, WhatsApp, cidade e e-mail lidos da legenda')
    ok('Currículo cadastrado no site: <b>Joana Pereira Lima' in banco("select string_agg(texto, '#') from tg_fila where chat_id = -100555"), 'o robô responde no grupo do RH')
    ok(banco("select count(*) from tg_fila where texto like '%Novo currículo%'") == '0', 'não manda o aviso de "currículo novo" (foi o próprio RH que mandou)')
    # foto solta sem legenda, logo depois, da mesma pessoa: entra no mesmo currículo; outra com legenda vira outro
    r3 = funcao_guarda({**foto(-100555, 20), 'chat_id': -100555, 'message_id': 20, 'autor': 42, 'file_id': 'x'}, 'cv-foto-2.jpg')
    ok(not r3['novo'] and r3['paginas'] == 3, 'foto sem legenda logo em seguida vira mais uma página')
    r4 = funcao_guarda({'chat_id': -100555, 'message_id': 21, 'autor': 42, 'legenda': 'Pedro Henrique Alves', 'autor_nome': 'Rita RH'}, 'cv-foto-1.jpg')
    ok(r4['novo'] and banco("select coalesce(telefone, '-') || coalesce(cidade, '-') from candidaturas where nome = 'Pedro Henrique Alves'") == '--', 'outra foto com outro nome vira outro currículo (dados a completar)')
    banco("alter table candidaturas disable trigger candidaturas_tocar; update candidaturas set atualizado_em = now() - interval '10 minutes'; alter table candidaturas enable trigger candidaturas_tocar")
    r5 = funcao_guarda({'chat_id': -100555, 'message_id': 22, 'autor': 42, 'autor_nome': 'Rita RH'}, 'cv-foto-1.jpg')
    ok(r5['novo'] and 'Currículo do Telegram' in r5['nome'], 'foto sem legenda bem depois vira currículo novo com nome provisório')
    ok('Dica: escreva o nome' in banco("select texto from tg_fila order by id desc limit 1"), 'e o robô dá a dica de escrever o nome na legenda')
    with sync_playwright() as p:
        br = p.chromium.launch(); W = lambda pg, ms=300: pg.wait_for_timeout(ms)
        pg, errs = pagina(br, accept_downloads=True); pg.goto(B); W(pg, 1200); entrar(pg, 'vendas', 'rita@jcn.test', 'Rita#2026x')
        ok(pg.locator('.tbl tbody tr .chip.tg').count() == 3, 'lista mostra a etiqueta "Telegram"')
        ok('Dados a completar' in pg.inner_text('.tbl'), 'avisa quando faltam os dados')
        pg.screenshot(path=R + '/testes/shots/t17_lista.png')
        pg.click('[data-act=abrir-cand]:has-text("Joana")'); parado(pg, 900)
        print(pg.inner_text('.drawer .arqs')); ok(pg.locator('.drawer .arqs li').count() == 3 and 'Página 3' in pg.inner_text('.drawer .arqs'), 'ficha mostra as 3 páginas')
        pg.click('.drawer [data-act=cv-ver][data-i="1"]'); W(pg, 800); ok(pg.locator('.viewer img').count() == 1 and pg.evaluate("document.querySelector('.viewer img').naturalWidth") == 620, 'abre a página 2 na tela')
        pg.click('[data-act=fechar-viewer]'); W(pg)
        with pg.expect_download() as d: pg.click('.drawer [data-act=cv-baixar][data-i="2"]')
        ok(d.value.suggested_filename.endswith('.jpg'), 'baixa a página 3')
        ok(pg.locator('.drawer details.cand-dados[open]').count() == 1, 'área "A definir": a parte de completar dados já vem aberta')
        pg.select_option('.drawer [data-cdd=area]', 'Montagem'); pg.fill('.drawer [data-cdd=cargo]', 'Montadora'); pg.screenshot(path=R + '/testes/shots/t17_ficha.png')
        pg.click('[data-act=cand-dados]'); parado(pg)
        ok(banco("select area || '|' || cargo || '|' || jsonb_array_length(arquivos) from candidaturas where nome like 'Joana%'") == 'Montagem|Montadora|3', 'RH completa a área e o cargo: ' + toast(pg))
        pg.click('[data-act=fechar]'); W(pg); pg.click('[data-act=abrir-cand]:has-text("Pedro")'); parado(pg, 900)
        pg.fill('.drawer [data-cdd=telefone]', '17 9812'); pg.click('[data-act=cand-dados]'); W(pg); ok('DDD' in pg.inner_text('.drawer .cand-dados .err'), 'confere o WhatsApp')
        pg.fill('.drawer [data-cdd=telefone]', '(17) 98123-4455'); pg.fill('.drawer [data-cdd=cidade]', 'Pindorama'); pg.fill('.drawer [data-cdd=uf]', 'sp'); pg.click('[data-act=cand-dados]'); parado(pg)
        ok(banco("select telefone || '|' || cidade || '|' || uf from candidaturas where nome like 'Pedro%'") == '17981234455|Pindorama|SP', 'telefone e cidade completados')
        pg.fill('#rhBusca', 'pindorama'); W(pg, 800); ok(pg.locator('.tbl tbody tr').count() == 1, 'a busca acha pela cidade completada')
        ok(not errs, 'sem erros no console: ' + str(errs[:3]))
        # assistente não mexe na lista de arquivos
        a, e2 = pagina(br); a.goto(B); W(a, 1200); entrar(a, 'vendas', 'ana@jcn.test', 'Ana#2026xx')
        uid = banco("select id from auth.users where email = 'ana@jcn.test'")
        try: banco(f"set role authenticated; set request.jwt.claim.sub = '{uid}'; update candidaturas set arquivos = '[]' where nome like 'Joana%'"); res = 'mudou'
        except RuntimeError as x: res = str(x)
        ok('não mudam' in res, 'RH assistente não consegue apagar páginas: ' + res[:60])
        a.click('[data-act=abrir-cand]:has-text("Joana")'); parado(a, 900); ok(a.locator('.drawer .arqs li').count() == 3, 'assistente vê as 3 páginas')
finally:
    srv.terminate()
print('FALHAS:', F) if F else print('TUDO CERTO')
