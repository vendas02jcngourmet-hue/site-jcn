# Orçamentos no lugar de "Lançar pedido": cliente, produtos por cliques, condições, PDF, fechar (vira pedido) e permissões
import sys, subprocess, urllib.error; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
brl = lambda v: 'R$ ' + f'{v:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026'); conta('Bruno Castro', 'bruno@jcn.test', 'vendedor', 'Bruno#2026'); conta('Paulo Rep', 'paulo@jcn.test', 'representante', 'Paulo#2026')
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br, accept_downloads=True); W = lambda ms=300: pg.wait_for_timeout(ms)
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026')
    ok('Orçamentos' in nav(pg) and 'Lançar pedido' not in nav(pg), 'menu: "Orçamentos" no lugar de "Lançar pedido": ' + ' | '.join(nav(pg)))
    ir(pg, 'orcamentos'); pg.click('[data-act=oe-novo]'); W()
    pg.click('[data-act=oe-salvar]'); W(); ok('nome do cliente' in pg.inner_text('#oeErro'), 'pede o cliente: ' + pg.inner_text('#oeErro'))
    pg.fill('[data-oc=nome]', 'Restaurante Sabor da Terra Ltda'); pg.fill('[data-oc=doc]', '12.345.678/0001-95'); pg.fill('[data-oc=contato]', 'Sr. Antônio')
    pg.fill('[data-oc=telefone]', '(17) 99111-2222'); pg.fill('[data-oc=email]', 'compras@sabor.com'); pg.fill('[data-oc=cidade]', 'São José do Rio Preto/SP')
    # produtos por cliques: fogão com grelha e forno, e uma Colors
    pg.fill('#mont-oe [data-pk=busca]', 'FF011'); W(700); pg.click('#mont-oe .pk-card >> nth=0'); W()
    pg.click('#mont-oe [data-act=pk-grelha]:has-text("Aço carbono")'); pg.click('#mont-oe [data-act=pk-forno]:has-text("tampa de vidro") >> nth=0'); pg.click('#mont-oe [data-act=pk-qtd][data-d="1"]'); W(); pg.click('#mont-oe [data-act=pk-add]'); W()
    pg.fill('#mont-oe [data-pk=busca]', 'FG4FSD-AZU'); W(700); pg.click('#mont-oe .pk-card >> nth=0'); W(); pg.click('#mont-oe [data-act=pk-add]'); W()
    ok(pg.locator('.orc-desc').count() == 3, 'três itens no orçamento (fogão, forno e Zilda)')
    pg.fill('[data-oi=preco_unit][data-i="2"]', '1390'); pg.press('[data-oi=preco_unit][data-i="2"]', 'Tab'); W()
    esperado = 2 * 583.86 + 2 * 444.54 + 1390
    # condições
    pg.check('input[name=oeforma][value=boleto]'); W(); pg.check('[data-act=oe-dia][data-d="30"]'); W(); pg.check('[data-act=oe-dia][data-d="60"]'); W()
    pg.select_option('[data-ox=frete]', 'CIF (por conta da JCN)'); pg.fill('[data-ox=prazo]', '15 dias úteis'); pg.fill('[data-ox=vendedor_contato]', '(17) 99888-7777')
    pg.fill('.orc-itens ~ .grid2 [data-oe=validade], [data-oe=validade]', banco("select current_date + 10"))
    pg.fill('[data-oe=obs]', 'Instalação não inclusa.')
    pg.screenshot(path=R + '/testes/shots/t25_editor.png', full_page=True)
    pg.click('[data-act=oe-salvar]'); parado(pg, 1000)
    o = json.loads(banco("select row_to_json(o) from orcamentos o"))
    ok(o['cliente_nome'] == 'Restaurante Sabor da Terra Ltda' and o['cliente_telefone'] == '17991112222' and o['forma_pagamento'] == 'boleto' and o['boleto_dias'] == [30, 60] and o['frete'].startswith('CIF') and o['prazo_entrega'] == '15 dias úteis' and o['prospect_id'] is None,
       'orçamento gravado com cliente e condições')
    ok(abs(float(banco("select sum(quantidade * preco_unit) from orcamento_itens")) - esperado) < .01, f'itens e preço combinado gravados (total {esperado:.2f})')
    # PDF
    with pg.expect_download(timeout=30000) as d: pg.click('[data-act=oe-pdf]')
    caminho = d.value.path(); dados = open(caminho, 'rb').read(); nome = d.value.suggested_filename
    ok(dados[:5] == b'%PDF-' and nome.startswith('Orcamento-JCN-') and len(dados) > 20000, f'PDF gerado: {nome} ({len(dados)//1024} KB)')
    shutil = __import__('shutil'); shutil.copy(caminho, R + '/testes/shots/t25_orcamento.pdf')
    txt = subprocess.run(['pdftotext', '-layout', caminho, '-'], capture_output=True, text=True).stdout
    ok(all(x in txt for x in ['ORÇAMENTO', 'Restaurante Sabor da Terra Ltda', 'Marina Tavares', '(17) 99888-7777', 'FF996', 'FF163TV', 'Zilda', 'Boleto parcelado em 2x', '15 dias úteis', 'CIF', 'Instalação não inclusa', 'vendas@jcngourmet.com.br']) and brl(esperado) in txt,
       'PDF com empresa, cliente, vendedor, itens, total e condições')
    # fechar: vira pedido com os preços combinados
    pg.click('[data-act=oe-fechar]'); W(); ok(pg.locator('#painelFechar').count() == 1 and pg.is_checked('input[name=fcforma][value=boleto]'), 'fechar: já vem com o boleto das condições')
    pg.click('[data-act=oe-fechar-ok]'); parado(pg, 1500)
    ped = json.loads(banco("select row_to_json(p) from pedidos p"))
    ok(ped['orcamento_id'] == o['id'] and ped['forma_pagamento'] == 'boleto' and ped['boleto_dias'] == [30, 60] and ped['boleto_status'] == 'pendente' and ped['vendedor_id'] == o['vendedor_id'], 'pedido criado para o faturamento (boleto para o financeiro aprovar)')
    ok(abs(float(banco("select total from pedidos_totais")) - esperado) < .01 and banco("select preco_unit from itens_pedido where codigo = 'FG4FSD-AZU'") == '1390.00', 'pedido com os preços combinados no orçamento')
    ok(banco("select situacao || '|' || (pedido_id is not null)::text from orcamentos") == 'concluido|true' and 'virou o' in pg.inner_text('.main') and pg.locator('[data-act=oe-salvar]').count() == 0, 'orçamento fechado, ligado ao pedido e travado')
    pg.screenshot(path=R + '/testes/shots/t25_fechado.png')
    pg.click('[data-act=oe-voltar]'); W(); pg.click('[data-act=ol-sit][data-v=concluido]'); W(); ok('Restaurante Sabor' in pg.inner_text('#tblOrc') and 'pedido nº' in pg.inner_text('#tblOrc'), 'lista: "Fechados" com o número do pedido')
    pg.click('[data-act=ol-sit][data-v=todos]'); W(); pg.screenshot(path=R + '/testes/shots/t25_lista.png')
    # catálogo: "Adicionar ao orçamento"
    ir(pg, 'catalogo'); pg.fill('#bv', 'FG4FSD-PRE'); pg.press('#bv', 'Enter'); W(); pg.click('.cards .card [data-act=add-ao-pedido]'); W()
    ok('no orçamento' in toast(pg), 'catálogo: "Adicionar ao orçamento": ' + toast(pg))
    ir(pg, 'orcamentos'); ok('Novo orçamento' in pg.inner_text('.main h1') and 'Carlos' in pg.inner_text('.orc-itens'), 'o produto do catálogo entra num orçamento novo')
    sair(pg)
    # permissões
    K = 'sb_publishable_teste'
    def http(caminho, token, corpo=None, metodo='GET'):
        h = {'apikey': K, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
        rq = urllib.request.Request(B + caminho, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo, headers=h)
        try: r = urllib.request.urlopen(rq); t = r.read(); return r.status, json.loads(t) if t else None
        except urllib.error.HTTPError as e: return e.code, e.read().decode()[:200]
    def tok(e, s):
        rq = urllib.request.Request(B + 'auth/v1/token?grant_type=password', data=json.dumps({'email': e, 'password': s}).encode(), method='POST', headers={'apikey': K, 'Content-Type': 'application/json'})
        return json.loads(urllib.request.urlopen(rq).read())['access_token']
    bru = tok('bruno@jcn.test', 'Bruno#2026'); mar = tok('marina@jcn.test', 'Marina#2026')
    ok(http('rest/v1/orcamentos?select=*', bru)[1] == [] and http('rest/v1/orcamento_itens?select=*', bru)[1] == [], 'outro vendedor não vê os orçamentos da Marina')
    st, r = http('rest/v1/rpc/fechar_orcamento', bru, {'p_id': o['id'], 'p': {'forma_pagamento': 'pix'}}, 'POST'); ok(st >= 400, 'outro vendedor não fecha o orçamento dela')
    st, r = http('rest/v1/rpc/fechar_orcamento', mar, {'p_id': o['id'], 'p': {'forma_pagamento': 'pix'}}, 'POST'); ok(st >= 400 and 'já foi fechado' in str(r), 'não fecha duas vezes')
    st, r = http(f"rest/v1/orcamentos?id=eq.{o['id']}", mar, {'obs': 'mudei'}, 'PATCH'); ok(st >= 400, 'orçamento fechado não muda')
    st, r = http('rest/v1/rpc/salvar_orcamento', mar, {'p': {'cliente_nome': 'Teste', 'itens': [{'descricao': 'Frete', 'quantidade': 1, 'preco_unit': 0}]}}, 'POST'); oid = r['id']
    st, r = http('rest/v1/rpc/fechar_orcamento', mar, {'p_id': oid, 'p': {'forma_pagamento': 'pix'}}, 'POST'); ok(st >= 400 and 'sem preço' in str(r), 'item sem preço não fecha')
    st, r = http(f"rest/v1/orcamentos?id=eq.{oid}", mar, {'pedido_id': ped['id']}, 'PATCH'); ok(banco(f"select pedido_id is null from orcamentos where id = '{oid}'") == 't', 'ninguém liga orçamento a pedido na mão')
    # representante faz orçamento
    pg.goto(B); W(1000); entrar(pg, 'vendas', 'paulo@jcn.test', 'Paulo#2026'); ok('Orçamentos' in nav(pg), 'representante tem Orçamentos')
    ir(pg, 'orcamentos'); pg.click('[data-act=oe-novo]'); W(); pg.fill('[data-oc=nome]', 'Lanchonete do Zé'); pg.fill('#mont-oe [data-pk=busca]', 'FF105'); W(700); pg.click('#mont-oe .pk-card >> nth=0'); W(); pg.click('#mont-oe [data-act=pk-add]'); W()
    pg.click('[data-act=oe-salvar]'); parado(pg, 900); ok(banco("select count(*) from orcamentos o join perfis p on p.id = o.vendedor_id where p.email = 'paulo@jcn.test'") == '1', 'representante cria orçamento')
    pg.click('[data-act=oe-fechar]'); W(); pg.click('[data-act=oe-fechar-ok]'); parado(pg, 1500); ok(banco("select count(*) from pedidos p join perfis u on u.id = p.vendedor_id where u.email = 'paulo@jcn.test'") == '1', 'representante fecha e o pedido é dele')
    sair(pg)
    # administração: dados da empresa no PDF
    entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'orcamentos'); pg.click('#painelEmpresa summary'); pg.fill('[data-emp=cnpj]', '11.222.333/0001-81'); pg.press('[data-emp=cnpj]', 'Tab'); parado(pg, 900)
    pg.click('[data-act=ol-sit][data-v=todos]'); W(); ok(pg.locator('#tblOrc tbody tr').count() == 3, 'administração vê os orçamentos de todos')
    with pg.expect_download(timeout=30000) as d: pg.click('#tblOrc [data-act=oe-pdf] >> nth=0')
    txt = subprocess.run(['pdftotext', d.value.path(), '-'], capture_output=True, text=True).stdout; ok('11.222.333/0001-81' in txt, 'CNPJ da empresa sai no PDF')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:300])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
