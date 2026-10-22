# Orçamentos das ligações: itens, aba "Por que não foi concluído", ficha da loja e relatório
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
import urllib.error
srv = subir()
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
conta('Marina Tavares', 'marina@jcn.test', 'vendedor', 'Marina#2026'); conta('Bruno Castro', 'bruno@jcn.test', 'vendedor', 'Bruno#2026'); conta('Paulo', 'paulo@jcn.test', 'representante', 'Paulo#2026')
# dois produtos com preço, para escolher no orçamento
p1, n1, v1 = banco("select p.id || '|' || p.nome || '|' || r.valor from produtos p join precos r on r.produto_id = p.id where p.ativo and r.valor > 0 order by p.ordem, p.id limit 1").split('|')
p2 = banco(f"select p.id from produtos p join precos r on r.produto_id = p.id where p.ativo and r.valor > 0 and p.id <> '{p1}' order by p.ordem desc, p.id limit 1")
cod = lambda pid: banco(f"select codigo from produtos where id = '{pid}'")
def escolher(pg, esc_, pid, qtd=1):
    # montador: busca pelo código, clica no produto, escolhe a grelha (se houver) e adiciona
    pg.fill(f'{esc_} [data-pk=busca]', cod(pid)); pg.wait_for_timeout(700); pg.click(f'{esc_} .pk-card >> nth=0'); pg.wait_for_timeout(300)
    if pg.locator(f'{esc_} [data-act=pk-grelha]').count(): pg.click(f'{esc_} [data-act=pk-grelha][data-id="{pid}"]'); pg.wait_for_timeout(200)
    for _ in range(qtd - 1): pg.click(f'{esc_} [data-act=pk-qtd][data-d="1"]'); pg.wait_for_timeout(120)
    pg.click(f'{esc_} [data-act=pk-add]'); pg.wait_for_timeout(300)
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); pg, errs = pagina(br, accept_downloads=True); W = lambda ms=300: pg.wait_for_timeout(ms)
    pg.goto(B); W(1200); entrar(pg, 'vendas', 'marina@jcn.test', 'Marina#2026'); ir(pg, 'ligacoes')
    ok(pg.locator('[data-act=lig-orc]').count() == 1, 'botão "Adicionar orçamento" na tela de ligações')
    pg.fill('#lg-telefone', '(17) 99111-2222'); W(600); pg.fill('#lg-loja', 'Casa das Panelas'); pg.fill('#lg-comprador', 'João'); pg.fill('#lg-cidade', 'Catanduva')
    pg.check('input[name=lgres][value=interessado]'); pg.fill('#lg-tratativa', 'Pediu orçamento de dois itens.')
    pg.click('[data-act=lig-orc]'); W()
    ok(pg.locator('#orcLig .orc-abas [role=tab]').count() == 2 and 'Por que não foi concluído' in pg.inner_text('#orcLig'), 'orçamento abre com as abas de itens e do motivo')
    pg.click('[data-act=lig-salvar]'); W(); ok('Orçamento' in pg.inner_text('#lgErro'), 'orçamento sem itens não salva: ' + pg.inner_text('#lgErro'))
    ok(pg.locator('#orcLig .pk-card').count() >= 5 and pg.locator('#orcLig .pk-cats .chip').count() >= 10, 'montador com categorias e produtos para clicar')
    escolher(pg, '#orcLig', p1, 2)
    ok(abs(float(pg.input_value('#orcLig [data-oi=preco_unit][data-i="0"]')) - float(v1)) < .01 and pg.input_value('#orcLig [data-oi=quantidade][data-i="0"]') == '2', 'escolher o produto já traz o preço da tabela e a quantidade')
    escolher(pg, '#orcLig', p2)
    pg.fill('#orcLig [data-oi=preco_unit][data-i="1"]', '150.5'); pg.press('#orcLig [data-oi=preco_unit][data-i="1"]', 'Tab'); W()
    pg.click('#orcLig [data-act=pk-livre]'); W(); pg.fill('#orcLig [data-oi=descricao][data-i="2"]', 'Frete até Catanduva'); pg.fill('#orcLig [data-oi=preco_unit][data-i="2"]', '80'); pg.press('#orcLig [data-oi=preco_unit][data-i="2"]', 'Tab'); W()
    esperado = 2 * float(v1) + 150.5 + 80
    tot = pg.inner_text('#orcTotal-lig'); ok(f'{esperado:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.') in tot, f'total do orçamento soma os itens: {tot}')
    pg.screenshot(path=R + '/testes/shots/t12_ligacao_orcamento.png', full_page=True)
    pg.click('[data-act=lig-salvar]'); parado(pg, 1200)
    ok('orçamento nº' in toast(pg).lower(), 'ligação e orçamento salvos juntos: ' + toast(pg))
    ok(banco("select count(*) from orcamentos o join ligacoes l on l.id = o.ligacao_id where o.situacao = 'aberto'") == '1' and banco("select count(*) from orcamento_itens") == '3', 'orçamento gravado ligado à ligação, com 3 itens')
    ok(abs(float(banco("select sum(quantidade * preco_unit) from orcamento_itens")) - esperado) < .01 and banco("select count(*) from orcamento_itens where produto_id is null and descricao = 'Frete até Catanduva'") == '1', 'itens com quantidade, preço combinado e item escrito à mão')
    ok(pg.locator('#orcLig').count() == 0 and pg.locator('[data-act=lig-orc]').count() == 1, 'o formulário limpa, sem o orçamento')
    ok('Casa das Panelas' in pg.inner_text('#painelOrc') and 'Em aberto (1)' in pg.inner_text('#painelOrc'), 'orçamento aparece em "Meus orçamentos"')
    ok('Orçamento nº' in pg.inner_text('.main'), 'a ligação mostra o orçamento dela')
    # abrir o orçamento e preencher a aba do motivo
    pg.click('#painelOrc [data-act=abrir-orc] >> nth=0'); W()
    pg.click('.drawer [data-act=orc-aba][data-aba=motivo]'); W()
    pg.fill('.drawer [data-oe=motivo_detalhe]', 'Achou o frete caro e o concorrente fez R$ 200 a menos.'); pg.select_option('.drawer [data-oe=motivo]', 'preco'); W()
    ok('Não concluído' in pg.inner_text('.drawer'), 'escolher o motivo marca o orçamento como não concluído')
    pg.screenshot(path=R + '/testes/shots/t12_motivo.png')
    pg.click('[data-act=orc-salvar]'); parado(pg, 900)
    ok(banco("select situacao || '|' || motivo || '|' || motivo_detalhe from orcamentos") == 'nao_concluido|preco|Achou o frete caro e o concorrente fez R$ 200 a menos.', 'motivo e texto de por que não foi concluído gravados')
    ok(banco("select count(*) from orcamento_itens") == '3', 'salvar de novo não duplica os itens')
    # situação "não concluído" sem motivo não passa
    pg.click('.drawer [data-act=orc-aba][data-aba=itens]'); W(); pg.select_option('.drawer [data-oe=situacao]', 'aberto'); W(); pg.click('[data-act=orc-salvar]'); parado(pg, 900)
    ok(banco("select situacao || '|' || coalesce(motivo, '-') from orcamentos") == 'aberto|-', 'voltar para "Em aberto" limpa o motivo')
    pg.select_option('.drawer [data-oe=situacao]', 'nao_concluido'); W(); pg.click('[data-act=orc-salvar]'); W()
    ok('motivo' in pg.inner_text('.drawer .err') and pg.get_attribute('.drawer [data-aba=motivo]', 'aria-selected') == 'true', 'não concluído sem motivo: pede o motivo e abre a aba')
    pg.select_option('.drawer [data-oe=motivo]', 'concorrente'); W(); pg.fill('.drawer [data-oe=motivo_detalhe]', 'Comprou da Venâncio.'); pg.click('[data-act=orc-salvar]'); parado(pg, 900)
    ok(banco("select motivo from orcamentos") == 'concorrente', 'motivo trocado')
    # pela ficha da loja: novo orçamento
    pg.click('.drawer [data-act=abrir-prospect]'); W(); ok('Orçamentos (1)' in pg.inner_text('.drawer'), 'a ficha da loja lista os orçamentos')
    pg.click('[data-act=orc-novo]'); W(); escolher(pg, '.drawer', p1); pg.select_option('.drawer [data-oe=situacao]', 'concluido'); W(); pg.click('[data-act=orc-salvar]'); parado(pg, 900)
    ok(banco("select count(*) from orcamentos where situacao = 'concluido' and ligacao_id is null") == '1', 'novo orçamento pela ficha da loja, já concluído')
    ok(pg.locator('.drawer a[href^="https://wa.me/5517991112222?text="]').count() == 1, 'orçamento salvo pode ser enviado pelo WhatsApp')
    pg.click('.drawer [data-act=fechar]'); W(); sair(pg)
    # outro vendedor vê, mas não altera
    entrar(pg, 'vendas', 'bruno@jcn.test', 'Bruno#2026'); ir(pg, 'ligacoes'); pg.check('[data-chg=orc-todos]'); W(); pg.click('#painelOrc [data-act=orc-f][data-f=todos]'); W()
    ok(pg.locator('#painelOrc tbody tr').count() == 2, 'vendedor vê os orçamentos da equipe')
    pg.click('#painelOrc [data-act=abrir-orc] >> nth=0'); W(); ok(pg.locator('.drawer [data-act=orc-salvar]').count() == 0 and pg.locator('.drawer [data-oe=situacao][disabled], .drawer [data-oe=motivo][disabled]').count() == 1, 'orçamento de outro vendedor abre só para ver')
    pg.click('.drawer [data-act=fechar]'); W(); sair(pg)
    # administração: relatório
    entrar(pg, 'vendas', 'admin@jcn.test', 'Admin#2026'); ir(pg, 'rel-lig'); pg.select_option('[data-k=per]', 'hoje'); W()
    t = pg.inner_text('#relOrc').replace('\n', ' | ')
    ok('Orçamentos | 2' in t and 'Não concluídos | 1' in t and 'Comprou de outro fornecedor' in t and 'Venâncio' in t, 'relatório mostra orçamentos e por que não foram concluídos: ' + t[:220])
    pg.screenshot(path=R + '/testes/shots/t12_relatorio.png', full_page=True)
    with pg.expect_download() as d: pg.click('[data-act=orc-csv]')
    csv = open(d.value.path(), encoding='utf-8-sig').read(); ok(csv.count('\n') == 2 and 'Comprou da Venâncio.' in csv, 'baixar orçamentos em planilha')
    pg.click('#relOrc [data-act=abrir-orc] >> nth=0'); W(); pg.click('[data-act=orc-apagar]'); W(150); pg.click('[data-act=orc-apagar]'); parado(pg)
    ok(banco("select count(*) from orcamentos") == '1', 'administração apaga um orçamento')
    # segurança direta
    K = 'sb_publishable_teste'
    def http(caminho, token=None, corpo=None, metodo='GET'):
        h = {'apikey': K, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
        if token: h['Authorization'] = 'Bearer ' + token
        rq = urllib.request.Request(B + caminho, data=json.dumps(corpo).encode() if corpo is not None else None, method=metodo, headers=h)
        try: r = urllib.request.urlopen(rq); return r.status, json.loads(r.read() or 'null')
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or 'null')
    tok = lambda e, s: http('auth/v1/token?grant_type=password', corpo={'email': e, 'password': s}, metodo='POST')[1]['access_token']
    oid = banco("select id from orcamentos limit 1"); pid = banco("select id from prospects limit 1")
    ok(http('rest/v1/orcamentos?select=*')[0] in (401, 403) and http('rest/v1/orcamento_itens?select=*')[0] in (401, 403), 'visitante não lê orçamentos')
    rep = tok('paulo@jcn.test', 'Paulo#2026'); ok(http('rest/v1/orcamentos?select=*', rep)[1] == [] and http('rest/v1/rpc/salvar_orcamento', rep, {'p': {'prospect_id': pid, 'itens': [{'descricao': 'x', 'quantidade': 1, 'preco_unit': 1}]}}, 'POST')[0] == 403, 'representante não lê nem cria orçamento')
    bru = tok('bruno@jcn.test', 'Bruno#2026')
    st, j = http('rest/v1/rpc/salvar_orcamento', bru, {'p': {'id': oid, 'situacao': 'aberto', 'itens': [{'descricao': 'forjado', 'quantidade': 1, 'preco_unit': 1}]}}, 'POST')
    ok(st >= 400 and banco("select count(*) from orcamento_itens where descricao = 'forjado'") == '0', 'vendedor não altera orçamento de outro')
    ok(http('rest/v1/orcamento_itens?orcamento_id=eq.' + oid, bru, metodo='DELETE')[1] == [] and http('rest/v1/orcamentos?id=eq.' + oid, bru, metodo='DELETE')[1] == [], 'vendedor não apaga itens nem orçamento de outro')
    st, j = http('rest/v1/rpc/salvar_orcamento', bru, {'p': {'prospect_id': pid, 'itens': [{'descricao': 'Fogão', 'quantidade': 1, 'preco_unit': 10}]}}, 'POST')
    ok(st == 200 and banco(f"select v.email from orcamentos o join perfis v on v.id = o.vendedor_id where o.id = '{j['id']}'") == 'bruno@jcn.test', 'vendedor cria orçamento no próprio nome')
    ok(not errs, 'sem erros: ' + ' | '.join(errs)[:300])
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
