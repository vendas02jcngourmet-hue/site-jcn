# Registro de ligações, base de possíveis clientes e relatório
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
import urllib.error
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026'); conta('Bruno Castro', 'bruno@jcn.test', 'vendedor', 'Bruno#2026'); conta('Paulo', 'paulo@jcn.test', 'representante', 'Paulo#2026')
def registrar(pg, tel, loja, comp, cid, uf, res, trat, ret=''):
    pg.fill('#lg-telefone', tel); pg.wait_for_timeout(600); pg.fill('#lg-loja', loja); pg.fill('#lg-comprador', comp); pg.fill('#lg-cidade', cid); pg.select_option('#lg-uf', uf)
    pg.check(f'input[name=lgres][value={res}]'); pg.fill('#lg-tratativa', trat)
    if ret: pg.fill('#lg-retornar_em', ret); pg.fill('#lg-retornar_hora', '14:30')
    pg.click('[data-act=lig-salvar]'); parado(pg, 900)
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br, accept_downloads=True); W = lambda ms=300: pg.wait_for_timeout(ms)
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ir(pg, 'ligacoes')
    pg.click('[data-act=lig-salvar]'); W(); ok('telefone' in pg.inner_text('#lgErro'), 'sem dados não salva: ' + pg.inner_text('#lgErro'))
    hoje = banco("select current_date"); amanha = banco("select current_date + 1"); ontem = banco("select current_date - 1")
    registrar(pg, '(17) 99111-2222', 'Casa das Panelas', 'João', 'Catanduva', 'SP', 'interessado', 'Pediu tabela de fogões industriais.')
    ok('registrada' in toast(pg) and banco("select loja || '|' || telefone || '|' || situacao from prospects") == 'Casa das Panelas|17991112222|interessado', 'ligação gravada e loja entrou na base como "Interessado"')
    ok(pg.input_value('#lg-telefone') == '', 'o formulário limpa para a próxima ligação')
    registrar(pg, '17 3522-1000', 'Empório Rio Preto', 'Ana', 'São José do Rio Preto', 'SP', 'retornar', 'Ligar de novo amanhã depois das 14h.', amanha)
    registrar(pg, '(16) 98888-7777', 'Restaurante Sabor', '', 'Ribeirão Preto', 'SP', 'nao_atendeu', 'Ninguém atendeu.')
    # mesma loja de novo pelo telefone
    pg.fill('#lg-telefone', '17991112222'); W(900); ok('já está na base' in pg.inner_text('.aviso-lig') and 'Casa das Panelas' in pg.inner_text('.aviso-lig'), 'telefone já cadastrado: o site avisa e mostra a última ligação')
    pg.click('[data-act=lig-usar]'); W(); ok(pg.input_value('#lg-loja') == 'Casa das Panelas' and pg.input_value('#lg-cidade') == 'Catanduva', 'preenche com os dados da loja')
    pg.check('input[name=lgres][value=cliente]'); pg.fill('#lg-tratativa', 'Fechou 2 fogões FF011.'); pg.click('[data-act=lig-salvar]'); parado(pg, 900)
    ok(banco("select count(*) from prospects") == '3' and banco("select count(*) from ligacoes l join prospects p on p.id = l.prospect_id where p.telefone = '17991112222'") == '2' and banco("select situacao from prospects where telefone='17991112222'") == 'cliente', 'segunda ligação para a mesma loja: não duplica e a situação vira "Virou cliente"')
    pg.screenshot(path=R + '/testes/shots/t11_ligacoes.png', full_page=True)
    sair(pg)
    # outro vendedor vê a base e registra; retorno atrasado
    entrar(pg, 'vendas', 'bruno@jcn.test', 'Bruno#2026'); ir(pg, 'clientes')
    ok(pg.locator('.tbl tbody tr').count() == 3, 'a base é da equipe: outro vendedor vê as 3 lojas')
    pg.select_option('[data-k=cidade]', 'Catanduva'); W(); ok(pg.locator('.tbl tbody tr').count() == 1, 'filtro por cidade')
    pg.select_option('[data-k=cidade]', ''); W(); pg.select_option('[data-k=situacao]', 'retornar'); W(); ok(pg.locator('.tbl tbody tr').count() == 1 and 'Empório' in pg.inner_text('.tbl tbody'), 'filtro por situação')
    pg.select_option('[data-k=situacao]', ''); W(); pg.fill('#pcBusca', '98888'); W(700); ok(pg.locator('.tbl tbody tr').count() == 1, 'busca por parte do telefone')
    pg.fill('#pcBusca', ''); W(600); pg.click('[data-act=abrir-prospect] >> text=Casa das Panelas'); W()
    t = pg.inner_text('.drawer'); ok('0 ligações' in t and 'Fechou 2 fogões' not in t, 'outro vendedor não vê as ligações da Marina na ficha da loja: ' + t[:200].replace('\n', ' / '))
    pg.fill('[data-pd=comprador]', 'João Batista'); pg.click('[data-act=prospect-salvar]'); parado(pg); ok(banco("select comprador from prospects where telefone='17991112222'") == 'João Batista', 'vendedor atualiza os dados da loja')
    ok(pg.locator('[data-act=prospect-apagar],[data-act=lig-apagar]').count() == 0, 'vendedor não apaga loja nem ligação')
    pg.click('[data-act=lig-desta]'); W(); ok(pg.input_value('#lg-loja') == 'Casa das Panelas' and 'Ligações' in pg.inner_text('.main h1'), '"Registrar nova ligação" abre o formulário já preenchido')
    with pg.expect_download() as d: ir(pg, 'clientes'); pg.click('[data-act=pc-csv]')
    csv = open(d.value.path(), encoding='utf-8-sig').read(); ok(csv.count('\n') == 3 and 'Casa das Panelas' in csv and 'Virou cliente' in csv, 'baixar a base em planilha')
    banco(f"update prospects set proximo_contato = '{ontem}' where telefone = '1735221000'")
    pg.reload(); pg.wait_for_timeout(2500); ir(pg, 'ligacoes'); W()
    ok('Empório Rio Preto' not in pg.inner_text('.main') and 'Casa das Panelas' not in pg.inner_text('.main') and pg.locator('[data-chg=lig-meus]').count() == 0, 'outro vendedor não vê ligações nem retornos da Marina')
    sair(pg); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ir(pg, 'ligacoes'); W()
    ok('Empório Rio Preto' in pg.inner_text('.main') and 'às 14:30' in pg.inner_text('.main'), 'retorno atrasado aparece para a Marina, com a hora')
    sair(pg)
    # representante não vê
    entrar(pg, 'vendas', 'paulo@jcn.test', 'Paulo#2026'); ok('Ligações' not in nav(pg), 'representante não tem o registro de ligações'); sair(pg)
    # administração: relatório
    entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'rel-lig')
    pg.select_option('[data-k=per]', 'hoje'); W()
    tl = pg.inner_text('#relTiles').replace('\n', ' | '); ok('Ligações | 4 |' in tl and 'Viraram clientes | 1' in tl, 'relatório de hoje: ' + tl[:140])
    ok('Marina Tavares' in pg.inner_text('#relVend') and pg.locator('#relCid tbody tr').count() == 3, 'por vendedor e por cidade')
    pg.select_option('[data-k=per]', 'mes'); W(); ok(pg.locator('.barras .bdia').count() >= 1, 'ligações por dia no mês')
    pg.select_option('[data-k=vendedor]', banco("select id from perfis where email='bruno@jcn.test'")); W(); ok('Nenhuma ligação' in pg.inner_text('#relLista'), 'filtro por vendedor')
    pg.select_option('[data-k=vendedor]', ''); W(); pg.screenshot(path=R + '/testes/shots/t11_relatorio.png', full_page=True)
    with pg.expect_download() as d: pg.click('[data-act=rel-csv]')
    ok(open(d.value.path(), encoding='utf-8-sig').read().count('\n') == 4, 'baixar as ligações do período em planilha')
    ir(pg, 'clientes'); pg.click('[data-act=abrir-prospect] >> text=Restaurante Sabor'); W(); pg.click('[data-act=lig-apagar]'); W(150); pg.click('[data-act=lig-apagar]'); parado(pg)
    ok(banco("select count(*) from ligacoes") == '3', 'administração apaga uma ligação')
    # segurança direta
    K = 'sb_publishable_teste'
    def http(caminho, token=None, corpo=None, metodo='GET'):
        h = {'apikey': K, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
        if token: h['Authorization'] = 'Bearer ' + token
        rq = urllib.request.Request(B + caminho, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo, headers=h)
        try: r = urllib.request.urlopen(rq); return r.status, json.loads(r.read() or 'null')
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or 'null')
    tok = lambda e, s: http('auth/v1/token?grant_type=password', corpo={'email': e, 'password': s}, metodo='POST')[1]['access_token']
    ok(http('rest/v1/prospects?select=*')[0] in (401, 403) and http('rest/v1/ligacoes?select=*')[0] in (401, 403), 'visitante não lê a base nem as ligações')
    rep = tok('paulo@jcn.test', 'Paulo#2026'); ok(http('rest/v1/prospects?select=*', rep)[1] == [] and http('rest/v1/rpc/registrar_ligacao', rep, {'p': {'telefone': '17999990000', 'loja': 'X', 'cidade': 'Y', 'uf': 'SP', 'resultado': 'interessado', 'tratativa': 'x'}}, 'POST')[0] == 403, 'representante não lê nem registra')
    bru = tok('bruno@jcn.test', 'Bruno#2026'); mar_id = banco("select id from perfis where email='marina@jcn.test'")
    st, j = http('rest/v1/ligacoes', bru, [{'prospect_id': banco("select id from prospects limit 1"), 'vendedor_id': mar_id, 'resultado': 'cliente', 'tratativa': 'forjada', 'feita_em': '2020-01-01T00:00:00Z'}], 'POST')
    ok(st != 201 or (j[0]['vendedor_id'] != mar_id), 'vendedor não registra ligação em nome de outro')
    ok(http('rest/v1/ligacoes?id=eq.' + banco("select id from ligacoes limit 1"), bru, metodo='DELETE')[1] == [] and http('rest/v1/prospects?id=eq.' + banco("select id from prospects limit 1"), bru, metodo='DELETE')[1] == [], 'vendedor não apaga')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:300])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
