# Trabalhe conosco, RH (administrativo e assistente), avisos e login do Financeiro
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
import urllib.error
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Rita RH', 'rita@jcn.test', 'rh_admin', 'Rita#2026x'); conta('Fábio Financeiro', 'fabio@jcn.test', 'financeiro', 'Fabio#2026'); conta('Marina', 'marina@jcn.test', 'vendedor', 'Marina#2026')
PDF = FX + 'etiqueta-1.pdf'
def etapa(pg, n):
    pg.click(f'[data-tc-ir="{n}"]'); pg.wait_for_timeout(150)
CPFS = iter(['52998224725', '11144477735', '39053344705'])
def preencher(pg, nome='Carlos Alberto Souza', email='carlos@exemplo.com', fone='(17) 98877-6655', area='Solda e serralheria'):
    etapa(pg, 0); pg.fill('#tc-nome', nome)
    etapa(pg, 1); pg.fill('#tc-telefone', fone); pg.fill('#tc-email', email); pg.fill('#tc-cidade', 'Catanduva')
    etapa(pg, 2); pg.select_option('#tc-area', area); pg.fill('#tc-cargo', 'Soldador'); pg.select_option('#tc-escolaridade', 'Curso técnico'); pg.fill('#tc-experiencia', '5 anos de solda MIG na Metalúrgica X.'); pg.select_option('#tc-disponibilidade', 'Imediata')
    etapa(pg, 3); pg.check('#tc-emp1_nenhum')
    etapa(pg, 4); pg.fill('#tc-cpf', next(CPFS))
    etapa(pg, 5); nao_no_resto(pg)
    etapa(pg, 7); pg.select_option('#tc-como_soube', 'Redes sociais'); nao_no_resto(pg)
    etapa(pg, 8); nao_no_resto(pg)
    etapa(pg, 9); nao_no_resto(pg)
    etapa(pg, 11)
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); W = lambda pg, ms=300: pg.wait_for_timeout(ms)
    v, ev = pagina(br); v.goto(B); W(v, 1500)
    ok(v.locator('.site-head nav a[href="#trabalhe"]').count() == 1, 'menu do site tem "Trabalhe conosco"')
    v.evaluate("document.querySelector('#trabalhe').scrollIntoView()"); W(v); v.click('#tcSeguir'); W(v); ok('nome completo' in v.inner_text('#tcErro'), 'valida a etapa antes de seguir: ' + v.inner_text('#tcErro'))
    etapa(v, 11); v.click('#tcEnviar'); W(v); ok('nome completo' in v.inner_text('#tcErro') and v.is_visible('#tc-nome'), 'ao enviar, volta para a etapa com o erro')
    preencher(v); v.click('#tcEnviar'); W(v); ok('currículo' in v.inner_text('#tcErro'), 'pede o currículo')
    v.set_input_files('#tc-arquivo', FX + 'nao-e-pdf.txt'); v.click('#tcEnviar'); W(v); ok('PDF' in v.inner_text('#tcErro'), 'recusa arquivo de texto')
    v.set_input_files('#tc-arquivo', PDF); v.click('#tcEnviar'); W(v); ok('autorização' in v.inner_text('#tcErro'), 'pede a autorização (LGPD)')
    v.screenshot(path=R + '/testes/shots/t15_form.png', full_page=False)
    v.check('#tc-consentimento'); v.click('#tcEnviar'); parado(v, 1500)
    ok('Currículo enviado' in v.inner_text('#tcOk'), 'candidatura enviada: ' + v.inner_text('#tcOk')[:60])
    ok(banco("select nome || '|' || telefone || '|' || area || '|' || (curriculo_caminho like 'curriculos/%')::text || '|' || status from candidaturas") == 'Carlos Alberto Souza|17988776655|Solda e serralheria|true|novo', 'gravada no banco, com o currículo na pasta privada')
    v.screenshot(path=R + '/testes/shots/t15_ok.png')
    # RH administrativo
    pg, errs = pagina(br, accept_downloads=True); pg.goto(B); W(pg, 1200)
    pg.click('.site-head [data-act=abrir-login]'); W(pg); ok('Equipe JCN' in pg.inner_text('[role=tablist]'), 'aba de login agora é "Equipe JCN"')
    entrar(pg, 'vendas', 'rita@jcn.test', 'Rita#2026x')
    ok(nav(pg) == ['Currículos', 'Reuniões', 'Equipe do RH'], 'RH administrativo vê só o RH: ' + ' | '.join(nav(pg)))
    ok('1 currículo novo' in pg.inner_text('.avisos') and pg.locator('.tbl tbody tr.nao-lido').count() == 1, 'aviso de currículo novo e linha destacada')
    pg.screenshot(path=R + '/testes/shots/t15_curriculos.png')
    pg.click('[data-act=abrir-cand]'); parado(pg, 900); ok(banco("select status || '|' || (visto_em is not null)::text from candidaturas") == 'em_analise|true', 'ao abrir: marcado como lido e em análise')
    with pg.expect_download() as d: pg.click('.drawer [data-act=cv-baixar]')
    ok(d.value.suggested_filename == 'etiqueta-1.pdf', 'baixa o currículo enviado')
    pg.click('.drawer [data-act=cd-nota][data-n="4"]'); W(pg); pg.fill('.drawer [data-cd=notas]', 'Boa experiência em MIG.'); pg.click('[data-act=cand-salvar]'); parado(pg)
    ok(banco("select avaliacao || '|' || notas from candidaturas") == '4|Boa experiência em MIG.', 'avaliação e anotações gravadas')
    amanha = banco("select current_date + 1"); pg.fill('.drawer [data-ag=data]', amanha); pg.fill('.drawer [data-ag=hora]', '14:30')
    urls = []; pg.context.on('request', lambda r: urls.append(r.url))
    with pg.context.expect_page() as nova: pg.click('[data-act=reu-agendar]')
    parado(pg, 1500); url = next((x for x in urls if 'calendar.google.com' in x), '')
    ok('calendar.google.com/calendar/render' in url and 'carlos%40exemplo.com' in url and 'vcon=meet' in url, 'abre o Google Agenda com o candidato convidado e o Meet: ' + url[:120])
    ok(banco("select count(*) from reunioes where status = 'agendada'") == '1' and banco("select status from candidaturas") == 'entrevista', 'reunião gravada; candidato vai para "Entrevista"')
    nova.value.close(); pg.click('.drawer .x'); W(pg)
    ir(pg, 'rh-agenda'); ok('Próximos 7 dias (1)' in pg.inner_text('.main') or 'Hoje (1)' in pg.inner_text('.main'), 'reunião aparece na agenda')
    pg.click('[data-act=reu-link]'); W(pg); pg.fill('#reuLinkIn', 'https://meet.google.com/abc-defg-hij'); pg.click('[data-act=reu-link-salvar]'); parado(pg)
    ok(banco("select link from reunioes") == 'https://meet.google.com/abc-defg-hij' and pg.locator('a[href="https://meet.google.com/abc-defg-hij"]').count() >= 1, 'link do Meet colado e botão "Entrar na reunião"')
    # aviso de reunião chegando
    banco("update reunioes set inicio = now() + interval '10 minutes'"); pg.evaluate("localStorage.removeItem('jcn-avisos-reuniao')"); pg.reload(); W(pg, 2500)
    ok('Reunião em' in toast(pg) or 'Reunião hoje' in pg.inner_text('.main'), 'aviso de reunião chegando: ' + toast(pg))
    pg.screenshot(path=R + '/testes/shots/t15_agenda.png', full_page=True)
    # aviso de currículo novo com a página aberta
    v2, e2 = pagina(br); v2.goto(B); W(v2, 1200); v2.evaluate("document.querySelector('#trabalhe').scrollIntoView()"); preencher(v2, 'Ana Paula Lima', 'ana@exemplo.com', '(17) 99111-0000', 'Pintura')
    v2.set_input_files('#tc-arquivo', FX + 'comprovante.png'); v2.check('#tc-consentimento'); v2.click('#tcEnviar'); parado(v2, 1500)
    ir(pg, 'rh'); pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); W(pg, 31500)
    ok('Novo currículo' in toast(pg) or 'Ana Paula' in pg.inner_text('.main'), 'o RH é avisado do currículo novo sem recarregar: ' + toast(pg))
    pg.select_option('[data-k=area]', 'Pintura'); W(pg); ok(pg.locator('.tbl tbody tr').count() == 1, 'filtro por área')
    pg.select_option('[data-k=area]', ''); W(pg); pg.click('.tile-bt[data-k=entrevista]'); W(pg); ok(pg.locator('.tbl tbody tr').count() == 1 and 'Carlos' in pg.inner_text('.tbl tbody'), 'filtro por situação clicando no quadro')
    # equipe do RH
    ir(pg, 'rh-equipe'); pg.fill('#rqNome', 'Bia Assistente'); pg.fill('#rqEmail', 'bia@jcn.test'); pg.fill('#rqSenha', 'Bia#2026xx'); pg.click('[data-act=rhq-add]'); parado(pg, 900)
    ok(banco("select papel from perfis where email = 'bia@jcn.test'") == 'rh_assistente' and 'bia@jcn.test' in pg.inner_text('.acesso'), 'RH administrativo cria login de RH assistente')
    ok(errs == [], 'sem erros (RH adm): ' + ' | '.join(errs)[:200]); sair(pg)
    # RH assistente
    entrar(pg, 'vendas', 'bia@jcn.test', 'Bia#2026xx'); ok(nav(pg) == ['Currículos', 'Reuniões'], 'RH assistente: ' + ' | '.join(nav(pg)))
    pg.click('[data-act=abrir-cand] >> nth=0'); W(pg); ok(pg.locator('[data-act=cand-apagar]').count() == 0, 'assistente não tem o botão de apagar'); pg.click('.drawer .x'); sair(pg)
    # Financeiro
    entrar(pg, 'vendas', 'fabio@jcn.test', 'Fabio#2026'); ok(nav(pg) == ['Financeiro', 'Pedidos'], 'login do Financeiro: ' + ' | '.join(nav(pg))); sair(pg)
    # segurança direta
    K = 'sb_publishable_teste'
    def http(caminho, token=None, corpo=None, metodo='GET', tipo='application/json'):
        h = {'apikey': K, 'Prefer': 'return=representation'}
        if corpo is not None: h['Content-Type'] = tipo
        if token: h['Authorization'] = 'Bearer ' + token
        d = corpo if isinstance(corpo, bytes) else (json.dumps(corpo).encode() if corpo is not None else None)
        rq = urllib.request.Request(B + caminho, data=d, method=metodo, headers=h)
        try: r = urllib.request.urlopen(rq); t = r.read(); return r.status, (json.loads(t) if t and r.headers.get_content_type() == 'application/json' else t)
        except urllib.error.HTTPError as e: t = e.read(); return e.code, (json.loads(t) if t[:1] in (b'{', b'[') else t)
    tok = lambda e, s: http('auth/v1/token?grant_type=password', corpo={'email': e, 'password': s}, metodo='POST')[1]['access_token']
    cam = banco("select curriculo_caminho from candidaturas where nome like 'Carlos%'")
    ok(http('rest/v1/candidaturas?select=*')[0] in (401, 403), 'visitante não lê as candidaturas')
    ok(http('storage/v1/object/authenticated/rh/' + cam)[0] == 400, 'visitante não baixa currículo')
    mar = tok('marina@jcn.test', 'Marina#2026'); ok(http('rest/v1/candidaturas?select=*', mar)[1] == [] and http('storage/v1/object/authenticated/rh/' + cam, mar)[0] == 400, 'vendedora não vê currículos')
    fab = tok('fabio@jcn.test', 'Fabio#2026'); ok(http('rest/v1/candidaturas?select=*', fab)[1] == [], 'financeiro não vê currículos')
    bia = tok('bia@jcn.test', 'Bia#2026xx'); rid = banco("select id from candidaturas limit 1")
    ok(http('rest/v1/pedidos?select=*', bia)[1] == [] and http('rest/v1/precos?select=*', bia)[1] == [] and http('rest/v1/prospects?select=*', bia)[1] == [], 'RH não vê pedidos, preços nem a base de clientes')
    ok(http('rest/v1/candidaturas?id=eq.' + rid, bia, metodo='DELETE')[1] == [] and banco("select count(*) from candidaturas") == '2', 'assistente não apaga candidatura')
    rita = tok('rita@jcn.test', 'Rita#2026x'); mid = banco("select id from perfis where email='marina@jcn.test'")
    ok(http('rest/v1/perfis?id=eq.' + mid, rita, {'ativo': False}, 'PATCH')[1] == [] and http('rest/v1/rpc/definir_senha', rita, {'p_usuario': mid, 'p_senha': 'Invasor#123'}, 'POST')[0] == 403, 'RH não mexe em contas de outros setores')
    st, j = http('rest/v1/perfis?id=eq.' + banco("select id from perfis where email='bia@jcn.test'"), rita, {'papel': 'admin'}, 'PATCH'); ok(st >= 400 or j == [], 'RH não promove ninguém a administrador')
    ok(http('rest/v1/rpc/enviar_candidatura', corpo={'p': {'nome': 'Teste Tal', 'email': 'x@y.com', 'telefone': '17999999999', 'cidade': 'X', 'uf': 'SP', 'area': 'Vendas', 'consentimento': False}}, metodo='POST')[0] == 400, 'sem autorização LGPD o banco recusa')
    ok(http('storage/v1/object/rh/curriculos/00000000-0000-0000-0000-000000000000/x.pdf', corpo=open(PDF, 'rb').read(), metodo='POST', tipo='application/pdf')[0] == 400, 'ninguém envia arquivo para a pasta do RH sem candidatura')
    # financeiro confere PIX
    pid = banco("select id from produtos where codigo = 'FG4FSD-AZU'")
    st, j = http('rest/v1/rpc/lancar_pedido', mar, {'p_pedido': {'origem': 'interno', 'cliente_nome': 'Loja X'}, 'p_itens': [{'produto_id': pid, 'quantidade': 1}]}, 'POST'); ped = j['id']
    http(f'rest/v1/pedidos?id=eq.{ped}', mar, {'forma_pagamento': 'boleto', 'boleto_dias': [30]}, 'PATCH')
    st, j = http(f'rest/v1/pedidos?id=eq.{ped}', fab, {'boleto_status': 'aprovado'}, 'PATCH'); ok(st == 200 and j[0]['boleto_status'] == 'aprovado', 'financeiro aprova o boleto')
    st, j = http(f'rest/v1/pedidos?id=eq.{ped}', fab, {'envio_status': 'em_expedicao'}, 'PATCH'); ok(st == 400, 'financeiro não mexe na expedição')
    st, j = http(f'rest/v1/pedidos?id=eq.{ped}', fab, {'cliente_nome': 'outro'}, 'PATCH'); ok(st == 400, 'nem nos dados do pedido')
    ok(http(f'rest/v1/parcelas_boleto?pedido_id=eq.{ped}', fab, {'recebida_em': '2026-10-23T12:00:00Z'}, 'PATCH')[0] == 200 and banco("select count(*) from parcelas_boleto where recebida_em is not null") == '1', 'financeiro marca parcela recebida')
    ok(not ev and not e2, 'sem erros no site: ' + ' | '.join(ev + e2)[:200])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
