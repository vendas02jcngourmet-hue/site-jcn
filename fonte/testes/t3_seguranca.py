# Ataques diretos às portas do servidor (sem passar pelas telas): cada papel tenta ler e gravar o que não pode
import sys; sys.path.insert(0, '/home/claude/real/testes')
from base import *
import urllib.error, urllib.parse
srv = subir()
K = 'sb_publishable_teste'
def http(metodo, caminho, corpo=None, token=None, tipo='application/json', pref=None):
    h = {'apikey': K}
    if token: h['Authorization'] = 'Bearer ' + token
    if pref: h['Prefer'] = pref
    d = None
    if corpo is not None:
        d = corpo if isinstance(corpo, bytes) else json.dumps(corpo).encode(); h['Content-Type'] = tipo
    rq = urllib.request.Request(B + caminho, data=d, method=metodo, headers=h)
    try:
        r = urllib.request.urlopen(rq); t = r.read(); st = r.status
    except urllib.error.HTTPError as e: t = e.read(); st = e.code
    try: return st, json.loads(t) if t else None
    except Exception: return st, t
REP = 'return=representation'
def login(email, senha): st, j = http('POST', 'auth/v1/token?grant_type=password', {'email': email, 'password': senha}); assert st == 200, j; return j['access_token'], j['user']['id']
def conta(nome, email, papel, senha):
    banco(f"insert into auth.users (email, encrypted_password, email_confirmed_at) values ('{email}', crypt('{senha}', gen_salt('bf', 4)), now())")
    banco(f"insert into perfis (id, nome, email, papel, empresa) select id, '{nome}', email, '{papel}', 'JCN Gourmet' from auth.users where email = '{email}'")
pid = lambda cod: banco(f"select id from produtos where codigo = '{cod}'")
vazio = lambda r: r[0] in (200, 206) and r[1] == []
negado = lambda r: r[0] in (400, 401, 403, 404, 409) or (r[0] in (200, 201) and r[1] == [])
try:
    conta('Marina', 'marina@jcn.test', 'vendedor', 'Marina#2026'); conta('Bruno', 'bruno@jcn.test', 'vendedor', 'Bruno#2026'); conta('Paulo', 'paulo@jcn.test', 'representante', 'Paulo#2026')
    banco("""insert into configuracoes (chave, valor) values ('pix', '{"chave": "segredo-pix"}')""")
    adm, admId = login('admin@jcn.test', 'Admin#2026'); mar, marId = login('marina@jcn.test', 'Marina#2026'); bru, bruId = login('bruno@jcn.test', 'Bruno#2026'); pau, pauId = login('paulo@jcn.test', 'Paulo#2026')
    zilda, carlos, ff011 = pid('FG4FSD-AZU'), pid('FG4FSD-PRE'), pid('FF011')
    # preparo legítimo: Marina cria uma loja, libera a Zilda a 1400 e lança um pedido com comprovante
    st, j = http('POST', 'auth/v1/signup', {'email': 'loja-lojam@jcn.test', 'password': 'LojaM#2026'}); lojaId = j['user']['id']
    st, j = http('POST', 'rest/v1/perfis', [{'id': lojaId, 'email': 'loja-lojam@jcn.test', 'nome': 'Loja M', 'login': 'lojam', 'papel': 'ecommerce', 'vendedor_id': marId}], mar, pref=REP); ok(st == 201, f'(preparo) vendedora cria o perfil da loja dela: {st}')
    st, j = http('POST', 'rest/v1/catalogo_loja', [{'loja_id': lojaId, 'produto_id': zilda, 'preco': 1400}], mar, pref=REP); ok(st == 201, f'(preparo) e libera a Zilda a 1400: {st}')
    loj, _ = login('loja-lojam@jcn.test', 'LojaM#2026')
    st, j = http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': marId, 'cliente_nome': 'Cliente da Marina'}], mar, pref=REP); pedM = j[0]['id']; ok(st == 201, '(preparo) pedido da Marina')
    st, j = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedM, 'produto_id': carlos, 'quantidade': 2, 'preco_unit': 1}], mar, pref=REP)
    ok(st == 201 and j[0]['preco_unit'] == 1490, f'vendedora manda o item com preço R$ 1,00: o banco ignora e grava o da tabela ({j[0]["preco_unit"]})')
    png = open(FX + 'comprovante.png', 'rb').read(); cam = f'pedidos/{pedM}/comp.png'
    st, j = http('POST', 'storage/v1/object/vendas/' + cam, png, mar, 'image/png'); ok(st == 200, '(preparo) comprovante da Marina no Storage')
    st, j = http('POST', 'rest/v1/anexos', [{'tipo': 'comprovante_pix', 'bucket': 'vendas', 'caminho': cam, 'nome_original': 'comp.png', 'mime': 'image/png', 'tamanho_bytes': len(png), 'pedido_id': pedM, 'enviado_por': marId}], mar, pref=REP); ok(st == 201, '(preparo) anexo registrado')
    st, j = http('POST', 'rest/v1/rpc/criar_pedido_site', {'p_cliente': {'nome': 'Maria de Souza', 'documento': '529.982.247-25', 'telefone': '17999990000', 'entrega': {'cep': '15800-000', 'rua': 'Rua A', 'numero': '1', 'cidade': 'Catanduva', 'uf': 'SP'}}, 'p_itens': [{'produto_id': zilda, 'quantidade': 1, 'preco_unit': 1, 'preco': 1}]})
    ok(st == 200 and j[0]['total'] == 1788, f'pedido do site com "preço 1" embutido: o banco calcula 1788,00 ({j[0]["total"] if st == 200 else j})'); numS, chaveS = j[0]['numero'], j[0]['chave']

    print('--- visitante (sem login)')
    for t in ['precos', 'pedidos', 'itens_pedido', 'perfis', 'configuracoes', 'catalogo_loja', 'anexos', 'parcelas_boleto', 'pedidos_totais', 'vendas_confirmadas', 'financeiro_por_vendedor', 'parcelas_em_aberto']:
        r = http('GET', f'rest/v1/{t}?select=*'); ok(vazio(r) or r[0] in (401, 403), f'visitante não lê {t}: {r[0]} {str(r[1])[:40]}')
    r = http('GET', 'rest/v1/vitrine?select=*'); ok(r[0] == 200 and len(r[1]) == 168 and set(r[1][0]) == {'produto_id', 'preco'}, f'visitante lê só o preço final da loja: {len(r[1])} linhas, colunas {sorted(r[1][0])}')
    ok(negado(http('POST', 'rest/v1/pedidos', [{'origem': 'site', 'cliente_nome': 'x', 'cliente_telefone': '1', 'entrega': {}, 'acrescimo': -90}], pref=REP)), 'visitante não grava direto em pedidos')
    ok(negado(http('PATCH', f'rest/v1/precos?produto_id=eq.{zilda}', {'valor': 1}, pref=REP)) and banco(f"select valor from precos where produto_id = '{zilda}'") == '1490.00', 'visitante não altera preço')
    ok(negado(http('PATCH', f'rest/v1/produtos?id=eq.{zilda}', {'nome': 'hackeado'}, pref=REP)) and negado(http('DELETE', f'rest/v1/produtos?id=eq.{zilda}', pref=REP)) and banco(f"select nome from produtos where id = '{zilda}'") == 'Zilda', 'visitante não altera nem apaga produto')
    ok(negado(http('POST', 'rest/v1/conteudo_site', [{'chave': 'site', 'valor': {'heroTitulo': 'hack'}}], pref=REP + ',resolution=merge-duplicates')) and negado(http('PATCH', 'rest/v1/configuracoes?chave=eq.loja_site', {'valor': {'ativa': True, 'acrescimo': -99}}, pref=REP)), 'visitante não muda os textos do site nem o acréscimo')
    ok(negado(http('POST', 'rest/v1/perfis', [{'id': admId, 'email': 'x@x.com', 'nome': 'x', 'papel': 'admin'}], pref=REP)), 'visitante não cria perfil')
    for fn, args in [('definir_senha', {'p_usuario': admId, 'p_senha': 'invasor123'}), ('liberar_email', {'p_email': 'admin@jcn.test'}), ('lancar_pedido', {'p_pedido': {'origem': 'interno', 'cliente_nome': 'xx'}, 'p_itens': [{'produto_id': zilda, 'quantidade': 1}]})]:
        r = http('POST', 'rest/v1/rpc/' + fn, args); ok(r[0] in (401, 403, 404), f'visitante não chama {fn}: {r[0]}')
    ok(login('admin@jcn.test', 'Admin#2026')[1] == admId, 'a senha da administração continua a mesma')
    r = http('GET', 'storage/v1/object/authenticated/vendas/' + cam); ok(r[0] == 400, f'visitante não baixa comprovante do Storage: {r[0]} {str(r[1])[:50]}')
    ok(http('GET', 'storage/v1/object/public/vendas/' + cam)[0] == 400, 'nem pelo endereço público (o bucket é privado)')
    ok(http('POST', f'storage/v1/object/vendas/pedidos/{pedM}/invasor.png', png, None, 'image/png')[0] == 400 and http('POST', 'storage/v1/object/vendas/site/00000000-0000-0000-0000-000000000000/x.png', png, None, 'image/png')[0] == 400 and http('POST', 'storage/v1/object/publico/x.png', png, None, 'image/png')[0] == 400, 'visitante não envia arquivo para pedido alheio, chave inventada nem para as fotos do site')
    r = http('POST', f'storage/v1/object/vendas/site/{chaveS}/virus.html', b'<script>', None, 'text/html'); ok(r[0] == 400, f'na pasta do próprio pedido só entra imagem ou PDF: {str(r[1])[:60]}')
    r = http('POST', f'storage/v1/object/vendas/site/{chaveS}/comp.png', png, None, 'image/png'); ok(r[0] == 200, 'o consumidor envia o comprovante na pasta do pedido dele')
    r = http('POST', 'rest/v1/rpc/anexar_comprovante_site', {'p_numero': numS, 'p_chave': '00000000-0000-0000-0000-000000000000', 'p_caminho': f'site/{chaveS}/comp.png', 'p_nome': 'c.png', 'p_mime': 'image/png', 'p_tamanho': 1}); ok(r[0] == 400, f'número do pedido sem a chave certa não anexa nada: {r[1].get("message")}')
    r = http('POST', 'rest/v1/rpc/anexar_comprovante_site', {'p_numero': numS, 'p_chave': chaveS, 'p_caminho': cam, 'p_nome': 'c.png', 'p_mime': 'image/png', 'p_tamanho': 1}); ok(r[0] == 400, f'nem aponta para o arquivo de outro pedido: {r[1].get("message")}')
    r = http('POST', 'rest/v1/rpc/acompanhar_pedido_site', {'p_numero': numS, 'p_documento': '11111111111'}); ok(r[1] is None, 'acompanhar pedido com CPF errado não devolve nada')
    r = http('POST', 'rest/v1/rpc/acompanhar_pedido_site', {'p_numero': numS, 'p_documento': '52998224725'}); ok(r[0] == 200 and set(r[1]) == {'numero', 'criado_em', 'pix', 'envio', 'total', 'itens'}, 'com o CPF certo devolve só o andamento (sem nome, endereço ou telefone)')
    r = http('POST', 'rest/v1/rpc/criar_pedido_site', {'p_cliente': {'nome': 'Maria de Souza', 'documento': '52998224725', 'telefone': '17999990000', 'entrega': {'cep': '15800000', 'rua': 'A', 'numero': '1', 'cidade': 'C', 'uf': 'SP'}}, 'p_itens': [{'produto_id': zilda, 'quantidade': -5}]}); ok(r[0] == 400, f'quantidade negativa é recusada: {str(r[1].get("message"))[:60]}')
    r = http('POST', 'rest/v1/rpc/email_do_login', {'p_login': 'lojam'}); ok(r[1] == 'loja-lojam@jcn.test', 'email_do_login devolve só o endereço interno da loja')
    r = http('POST', 'rest/v1/rpc/email_do_login', {'p_login': 'marina'}); ok(r[1] is None, 'e nada para quem não é loja')

    print('--- pessoa que se cadastra sozinha pela porta do Auth (sem perfil)')
    st, j = http('POST', 'auth/v1/signup', {'email': 'intruso@jcn.test', 'password': 'Intruso#2026'}); intr, intrId = j['access_token'], j['user']['id']
    for t in ['precos', 'pedidos', 'perfis', 'configuracoes', 'catalogo_loja', 'anexos']:
        ok(vazio(http('GET', f'rest/v1/{t}?select=*', token=intr)), f'sem perfil não lê {t}')
    ok(negado(http('POST', 'rest/v1/perfis', [{'id': intrId, 'email': 'intruso@jcn.test', 'nome': 'Intruso', 'papel': 'admin'}], intr, pref=REP)) and negado(http('POST', 'rest/v1/perfis', [{'id': intrId, 'email': 'intruso@jcn.test', 'nome': 'Intruso', 'papel': 'vendedor'}], intr, pref=REP)) and banco(f"select count(*) from perfis where id = '{intrId}'") == '0', 'sem perfil não consegue se dar um perfil')
    ok(negado(http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': intrId, 'cliente_nome': 'x'}], intr, pref=REP)), 'sem perfil não lança pedido')
    ok(http('POST', 'rest/v1/rpc/liberar_email', {'p_email': 'intruso@jcn.test'}, intr)[0] == 403 and negado(http('POST', 'rest/v1/rpc/lancar_pedido', {'p_pedido': {'origem': 'interno', 'cliente_nome': 'xx'}, 'p_itens': [{'produto_id': zilda, 'quantidade': 1}]}, intr)) and http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': admId, 'p_senha': 'outrasenha1'}, intr)[0] in (400, 403), 'sem perfil não troca senha de ninguém')
    ok(http('GET', 'storage/v1/object/authenticated/vendas/' + cam, token=intr)[0] == 400 and http('POST', f'storage/v1/object/vendas/pedidos/{pedM}/i.png', png, intr, 'image/png')[0] == 400, 'sem perfil não baixa nem envia arquivo de pedido')

    print('--- representante')
    r = http('GET', 'rest/v1/pedidos?select=*', token=pau); ok(vazio(r), 'representante não vê pedido da vendedora')
    ok(len(http('GET', 'rest/v1/precos?select=*', token=pau)[1]) == 168, 'representante lê a tabela de preços')
    st, j = http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': pauId, 'cliente_nome': 'Cliente do Paulo'}], pau, pref=REP); pedP = j[0]['id']; ok(st == 201, 'representante lança o pedido dele')
    http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedP, 'produto_id': zilda, 'quantidade': 1, 'preco_unit': 5}], pau, pref=REP)
    ok(negado(http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': marId, 'cliente_nome': 'em nome da Marina'}], pau, pref=REP)), 'representante não lança pedido em nome de outra pessoa')
    ok(negado(http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': pauId, 'cliente_nome': 'x', 'pix_status': 'verificado'}], pau, pref=REP)), 'nem pedido que já nasce "pago"')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedP}', {'cliente_nome': 'mudei'}, pau, pref=REP); ok(negado(r) and banco(f"select cliente_nome from pedidos where id = '{pedP}'") == 'Cliente do Paulo', 'representante não altera o pedido depois de lançado')
    ok(negado(http('PATCH', f'rest/v1/precos?produto_id=eq.{zilda}', {'valor': 1}, pau, pref=REP)) and negado(http('PATCH', f'rest/v1/produtos?id=eq.{zilda}', {'nome': 'x'}, pau, pref=REP)), 'representante não altera preço nem produto')
    ok(negado(http('POST', 'rest/v1/catalogo_loja', [{'loja_id': lojaId, 'produto_id': carlos, 'preco': 1}], pau, pref=REP)) and negado(http('GET', 'rest/v1/catalogo_loja?select=*', token=pau)), 'representante não libera produto nem vê os valores das lojas')
    st, j = http('POST', 'auth/v1/signup', {'email': 'loja-dopaulo@jcn.test', 'password': 'DoPaulo#2026'})
    ok(negado(http('POST', 'rest/v1/perfis', [{'id': j['user']['id'], 'email': 'loja-dopaulo@jcn.test', 'nome': 'x', 'login': 'dopaulo', 'papel': 'ecommerce', 'vendedor_id': pauId}], pau, pref=REP)) and http('POST', 'rest/v1/rpc/liberar_email', {'p_email': 'loja-dopaulo@jcn.test'}, pau)[0] == 403, 'representante não cria conta de e-commerce')
    ok(negado(http('PATCH', f'rest/v1/perfis?id=eq.{pauId}', {'papel': 'admin'}, pau, pref=REP)) and banco(f"select papel from perfis where id = '{pauId}'") == 'representante', 'representante não se promove a administrador')
    ok(http('POST', f'storage/v1/object/vendas/pedidos/{pedP}/etq.pdf', open(FX + 'etiqueta-1.pdf', 'rb').read(), pau, 'application/pdf')[0] == 200 and negado(http('POST', 'rest/v1/anexos', [{'tipo': 'etiqueta_envio', 'bucket': 'vendas', 'caminho': f'pedidos/{pedP}/etq.pdf', 'nome_original': 'e.pdf', 'mime': 'application/pdf', 'tamanho_bytes': 1, 'pedido_id': pedP, 'enviado_por': pauId}], pau, pref=REP)), 'representante não registra etiqueta de envio')

    print('--- outro vendedor')
    ok(vazio(http('GET', 'rest/v1/pedidos?select=*', token=bru)) and vazio(http('GET', 'rest/v1/itens_pedido?select=*', token=bru)) and vazio(http('GET', 'rest/v1/anexos?select=*', token=bru)), 'vendedor não vê pedidos, itens nem anexos de outro vendedor')
    r = http('GET', 'rest/v1/perfis?select=*', token=bru); ok(len(r[1]) == 1 and r[1][0]['id'] == bruId, 'vendedor só enxerga o próprio perfil (e as lojas dele)')
    ok(http('GET', 'storage/v1/object/authenticated/vendas/' + cam, token=bru)[0] == 400, 'não baixa o comprovante do pedido de outro vendedor')
    ok(http('DELETE', 'storage/v1/object/vendas/' + cam, token=bru)[0] == 400 and http('GET', 'storage/v1/object/authenticated/vendas/' + cam, token=mar)[0] == 200, 'nem apaga; a dona continua baixando')
    ok(negado(http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'cliente_nome': 'x'}, bru, pref=REP)) and negado(http('DELETE', f'rest/v1/pedidos?id=eq.{pedM}', token=bru, pref=REP)) and banco(f"select count(*) from pedidos where id = '{pedM}'") == '1', 'não altera nem apaga pedido alheio')
    ok(negado(http('POST', 'rest/v1/catalogo_loja', [{'loja_id': lojaId, 'produto_id': carlos, 'preco': 1}], bru, pref=REP)) and negado(http('PATCH', f'rest/v1/catalogo_loja?loja_id=eq.{lojaId}', {'preco': 1}, bru, pref=REP)) and negado(http('PATCH', f'rest/v1/perfis?id=eq.{lojaId}', {'ativo': False}, bru, pref=REP)), 'não mexe na loja de outro vendedor')
    ok(http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': lojaId, 'p_senha': 'invasor1234'}, bru)[0] == 403 and http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': admId, 'p_senha': 'invasor1234'}, bru)[0] == 403 and http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': marId, 'p_senha': 'invasor1234'}, bru)[0] == 403, 'não troca a senha da loja alheia, de outro vendedor nem da administração')
    st, j = http('POST', 'auth/v1/signup', {'email': 'loja-golpe@jcn.test', 'password': 'Golpe#2026x'})
    ok(negado(http('POST', 'rest/v1/perfis', [{'id': j['user']['id'], 'email': 'loja-golpe@jcn.test', 'nome': 'x', 'login': 'golpe', 'papel': 'ecommerce', 'vendedor_id': marId}], bru, pref=REP)) and negado(http('POST', 'rest/v1/perfis', [{'id': j['user']['id'], 'email': 'loja-golpe@jcn.test', 'nome': 'x', 'papel': 'admin'}], bru, pref=REP)), 'não cria loja no nome de outro vendedor nem cria administrador')
    ok(negado(http('PATCH', f'rest/v1/perfis?id=eq.{bruId}', {'papel': 'admin'}, bru, pref=REP)), 'vendedor não se promove a administrador')
    st, j = http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': bruId, 'cliente_nome': 'Cliente do Bruno', 'forma_pagamento': 'boleto', 'boleto_dias': [30], 'boleto_status': 'aprovado'}], bru, pref=REP); pedB = j[0]['id']
    ok(j[0]['boleto_status'] == 'pendente', 'boleto que tenta nascer "aprovado" entra como pendente')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedB}', {'boleto_status': 'aprovado'}, bru, pref=REP); ok(r[0] == 400 and 'financeiro' in r[1]['message'], f'vendedor não aprova o próprio boleto: {r[1]["message"]}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedB}', {'envio_status': 'enviado'}, bru, pref=REP); ok(r[0] == 400, f'nem libera a expedição: {r[1]["message"]}')
    http('PATCH', f'rest/v1/pedidos?id=eq.{pedB}', {'forma_pagamento': 'pix'}, bru, pref=REP)
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedB}', {'pix_status': 'verificado'}, bru, pref=REP); ok(r[0] == 400 and 'administração' in r[1]['message'], f'nem marca o próprio PIX como verificado: {r[1]["message"]}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedB}', {'vendedor_id': marId}, bru, pref=REP); ok(negado(r), 'nem passa o pedido para o nome de outra pessoa')
    ok(negado(http('PATCH', f'rest/v1/parcelas_boleto?pedido_id=eq.{pedB}', {'recebida_em': '2026-01-01'}, bru, pref=REP)) and negado(http('POST', 'rest/v1/precos', [{'produto_id': zilda, 'valor': 1}], bru, pref=REP + ',resolution=merge-duplicates')), 'nem marca parcela como recebida ou regrava a tabela de preços')

    print('--- loja de e-commerce')
    ok(vazio(http('GET', 'rest/v1/precos?select=*', token=loj)), 'a loja não lê a tabela de preços da JCN')
    r = http('GET', 'rest/v1/catalogo_loja?select=*', token=loj); ok(len(r[1]) == 1 and r[1][0]['preco'] == 1400, 'lê só o que foi liberado para ela')
    r = http('GET', 'rest/v1/perfis?select=*', token=loj); ok(len(r[1]) == 1 and r[1][0]['id'] == lojaId, 'só enxerga o próprio perfil')
    ok(vazio(http('GET', 'rest/v1/pedidos?select=*', token=loj)), 'não vê pedidos de mais ninguém')
    ok(negado(http('PATCH', f'rest/v1/catalogo_loja?loja_id=eq.{lojaId}', {'preco': 1}, loj, pref=REP)) and negado(http('POST', 'rest/v1/catalogo_loja', [{'loja_id': lojaId, 'produto_id': carlos, 'preco': 1}], loj, pref=REP)), 'não muda o próprio preço nem libera produto para si')
    ok(negado(http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': lojaId, 'cliente_nome': 'x'}], loj, pref=REP)) and negado(http('POST', 'rest/v1/pedidos', [{'origem': 'ecommerce', 'vendedor_id': lojaId, 'cliente_nome': 'x', 'forma_pagamento': 'boleto', 'boleto_dias': [30]}], loj, pref=REP)), 'não lança pedido como venda interna nem em boleto')
    st, j = http('POST', 'rest/v1/pedidos', [{'origem': 'ecommerce', 'vendedor_id': lojaId, 'cliente_nome': 'Loja M'}], loj, pref=REP); pedL = j[0]['id']
    st, j = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedL, 'produto_id': zilda, 'quantidade': 1, 'preco_unit': 10}], loj, pref=REP); ok(j[0]['preco_unit'] == 1400, 'item da loja com preço adulterado: o banco grava o valor liberado (1400)')
    r = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedL, 'produto_id': carlos, 'quantidade': 1, 'preco_unit': 10}], loj, pref=REP); ok(r[0] == 400 and 'liberado' in r[1]['message'], f'produto não liberado não entra no pedido: {r[1]["message"]}')
    ok(negado(http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedM, 'produto_id': zilda, 'quantidade': 1, 'preco_unit': 10}], loj, pref=REP)), 'não põe item em pedido alheio')
    ok(http('POST', f'storage/v1/object/vendas/pedidos/{pedM}/x.png', png, loj, 'image/png')[0] == 400, 'não envia arquivo para a pasta de pedido alheio')
    ok(http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': marId, 'p_senha': 'invasor1234'}, loj)[0] == 403, 'não troca a senha de ninguém')

    print('--- vendedora dona da loja e administração')
    r = http('GET', 'rest/v1/pedidos?select=*', token=mar); ok(len(r[1]) == 2, 'a vendedora vê o pedido dela e o da loja dela')
    ok(negado(http('PATCH', f'rest/v1/pedidos?id=eq.{pedL}', {'cliente_nome': 'x'}, mar, pref=REP)), 'mas só acompanha o pedido da loja, sem alterar')
    ok(http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': lojaId, 'p_senha': 'NovaDaLoja#1'}, mar)[0] == 204 and login('loja-lojam@jcn.test', 'NovaDaLoja#1')[1] == lojaId, 'a vendedora troca a senha da loja dela')
    ok(http('POST', 'rest/v1/rpc/definir_senha', {'p_usuario': lojaId, 'p_senha': 'curta'}, mar)[0] == 400, 'senha curta é recusada pelo banco')
    ok(negado(http('PATCH', f'rest/v1/perfis?id=eq.{lojaId}', {'papel': 'vendedor', 'vendedor_id': None}, mar, pref=REP)) and negado(http('PATCH', f'rest/v1/perfis?id=eq.{lojaId}', {'vendedor_id': bruId}, mar, pref=REP)), 'não transforma a loja em vendedor nem passa para outro vendedor')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'envio_status': 'em_expedicao'}, adm, pref=REP); ok(r[0] == 400 and 'PIX verificado' in r[1]['message'], f'nem a administração expede sem pagamento conferido: {r[1]["message"]}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'pix_status': 'verificado'}, adm, pref=REP); ok(r[0] == 200 and r[1][0]['pix_conferido_por'] == admId, 'a administração confere o PIX')
    r = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedM, 'produto_id': zilda, 'quantidade': 1, 'preco_unit': 1}], mar, pref=REP); ok(negado(r), 'com o PIX conferido, a vendedora não acrescenta item ao pedido')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'envio_status': 'enviado'}, adm, pref=REP); ok(r[0] == 400 and 'etiqueta' in r[1]['message'], f'"enviado" exige etiqueta: {r[1]["message"]}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'pix_status': 'sem_comprovante'}, mar, pref=REP); ok(r[0] == 400 and 'administração' in r[1]['message'], f'a vendedora não desfaz a conferência do PIX para reabrir o pedido: {r[1]["message"]}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedM}', {'criado_em': '2020-01-01T00:00:00Z'}, mar, pref=REP); ok(r[0] == 400, 'nem muda a data do pedido')

    print('--- pontos da revisão de segurança')
    # item "avulso" com preço inventado
    r = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedL, 'produto_id': None, 'descricao': 'Fogão Carlos', 'codigo': 'FG4FSD-PRE', 'quantidade': 10, 'preco_unit': 0.01}], loj, pref=REP); ok(r[0] == 400 and 'cadastro' in r[1]['message'], f'a loja não cria item sem produto, com preço inventado: {r[1].get("message")}')
    r = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedB, 'produto_id': None, 'descricao': 'x', 'quantidade': 1, 'preco_unit': 0}], bru, pref=REP); ok(r[0] == 400, 'o vendedor também não')
    ok(banco("select count(*) from itens_pedido where produto_id is null") == '0', 'nenhum item sem produto ficou no banco')
    # pedido inteiro de uma vez
    r = http('POST', 'rest/v1/rpc/lancar_pedido', {'p_pedido': {'origem': 'ecommerce', 'cliente_nome': 'Loja M'}, 'p_itens': [{'produto_id': zilda, 'quantidade': 1, 'preco_unit': 1}, {'produto_id': carlos, 'quantidade': 1}]}, loj)
    ok(r[0] == 400 and banco(f"select count(*) from pedidos where vendedor_id = '{lojaId}'") == '1', f'pedido com um item não liberado não entra pela metade: {r[1].get("message")}')
    r = http('POST', 'rest/v1/rpc/lancar_pedido', {'p_pedido': {'origem': 'interno', 'cliente_nome': 'Cliente 2 do Bruno', 'numero': 9000, 'vendedor_id': marId, 'pix_status': 'verificado'}, 'p_itens': [{'produto_id': zilda, 'quantidade': 2, 'preco_unit': 1}]}, bru)
    lin = banco(f"select p.vendedor_id = '{bruId}', p.pix_status, i.preco_unit, p.numero < 2000 from pedidos p join itens_pedido i on i.pedido_id = p.id where p.id = '{r[1]['id']}'"); ok(lin == 't|sem_comprovante|1490.00|t', f'lançar pedido pela função: dono, situação, número e preço são postos pelo banco: {lin}')
    r = http('POST', 'rest/v1/rpc/lancar_pedido', {'p_pedido': {'origem': 'interno', 'cliente_nome': 'Venda da administração'}, 'p_itens': [{'produto_id': zilda, 'quantidade': 1, 'preco_unit': 1300}]}, adm); ok(banco(f"select preco_unit from itens_pedido where pedido_id = '{r[1]['id']}'") == '1300.00', 'só a administração lança com valor negociado (1300,00)')
    # número, data e conferência forjados na criação
    st, j = http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': bruId, 'cliente_nome': 'Forjado', 'numero': 99999, 'criado_em': '2031-01-01T00:00:00Z', 'pix_conferido_por': admId, 'pix_conferido_em': '2026-01-01T00:00:00Z'}], bru, pref=REP)
    ok(st == 201 and j[0]['numero'] < 2000 and j[0]['criado_em'].startswith('2026') and j[0]['pix_conferido_por'] is None, f'pedido com número, data e "conferido por" forjados: o banco põe os dele (nº {j[0]["numero"]})'); pedF = j[0]['id']
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedF}', {'cliente_nome': 'Outro devedor'}, bru, pref=REP); ok(r[0] == 400, f'o vendedor não troca o cliente depois de lançado: {r[1].get("message")}')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedF}', {'pix_conferido_por': admId}, bru, pref=REP); ok(banco(f"select pix_conferido_por is null from pedidos where id = '{pedF}'") == 't', 'nem escreve quem "conferiu" o PIX')
    # comprovante enviado: não volta para "sem comprovante" para mexer nos itens
    http('POST', f'storage/v1/object/vendas/pedidos/{pedF}/c.png', png, bru, 'image/png'); http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedF, 'produto_id': zilda, 'quantidade': 1, 'preco_unit': 0}], bru, pref=REP)
    http('POST', 'rest/v1/anexos', [{'tipo': 'comprovante_pix', 'bucket': 'vendas', 'caminho': f'pedidos/{pedF}/c.png', 'nome_original': 'c.png', 'mime': 'image/png', 'tamanho_bytes': 1, 'pedido_id': pedF, 'enviado_por': bruId}], bru, pref=REP)
    ok(banco(f"select pix_status from pedidos where id = '{pedF}'") == 'em_analise', 'comprovante anexado: o pedido vai sozinho para "em análise"')
    r = http('PATCH', f'rest/v1/pedidos?id=eq.{pedF}', {'pix_status': 'sem_comprovante'}, bru, pref=REP); r2 = http('POST', 'rest/v1/itens_pedido', [{'pedido_id': pedF, 'produto_id': carlos, 'quantidade': 5, 'preco_unit': 0}], bru, pref=REP)
    ok(r[0] == 400 and negado(r2) and banco(f"select count(*) from itens_pedido where pedido_id = '{pedF}'") == '1', 'com o comprovante em análise, o vendedor não reabre o pedido nem acrescenta itens')
    ok(negado(http('POST', 'rest/v1/anexos', [{'tipo': 'comprovante_pix', 'bucket': 'vendas', 'caminho': cam, 'nome_original': 'c.png', 'mime': 'image/png', 'tamanho_bytes': 1, 'pedido_id': pedF, 'enviado_por': bruId}], bru, pref=REP)), 'nem registra no pedido dele um arquivo da pasta de outro pedido')
    r = http('DELETE', f'storage/v1/object/vendas/pedidos/{pedF}/c.png', token=bru); ok(r[0] == 400 and http('GET', f'storage/v1/object/authenticated/vendas/pedidos/{pedF}/c.png', token=adm)[0] == 200, 'comprovante registrado não pode ser apagado (nem trocado) por quem enviou')
    # a loja não lê o percentual do site
    r = http('GET', 'rest/v1/configuracoes?select=*', token=loj); ok([x['chave'] for x in r[1]] == ['pix'], 'a loja lê só a chave PIX; o acréscimo do site fica com a equipe interna')
    # login "plantado" antes do cadastro
    st, j = http('POST', 'auth/v1/signup', {'email': 'loja-futura@jcn.test', 'password': 'Plantado#1'}); plantado, plantadoId = j['access_token'], j['user']['id']
    ok(http('POST', 'rest/v1/rpc/liberar_email', {'p_email': 'admin@jcn.test'}, bru)[0] == 409 and http('POST', 'rest/v1/rpc/liberar_email', {'p_email': 'marina@jcn.test'}, bru)[0] == 409 and banco("select count(*) from auth.users where email in ('admin@jcn.test', 'marina@jcn.test')") == '2', 'liberar_email não apaga login de quem tem conta')
    r = http('POST', 'rest/v1/rpc/liberar_email', {'p_email': 'loja-futura@jcn.test'}, bru); st, j = http('POST', 'auth/v1/signup', {'email': 'loja-futura@jcn.test', 'password': 'DoBruno#2026'}); novoId = j['user']['id']
    http('POST', 'rest/v1/perfis', [{'id': novoId, 'email': 'loja-futura@jcn.test', 'nome': 'Loja Futura', 'login': 'futura', 'papel': 'ecommerce', 'vendedor_id': bruId}], bru, pref=REP)
    ok(r[1] is True and novoId != plantadoId and banco(f"select count(*) from auth.users where id = '{plantadoId}'") == '0' and vazio(http('GET', 'rest/v1/perfis?select=*', token=plantado)) and vazio(http('GET', 'rest/v1/catalogo_loja?select=*', token=plantado)), 'quem "plantou" um login com o e-mail da loja antes do cadastro fica de fora: o painel cria um login novo e apaga o antigo')
    # loja do site
    cli = {'nome': 'Maria de Souza', 'documento': '529.982.247-25', 'telefone': '17999990000', 'entrega': {'cep': '15800-000', 'rua': 'Rua A', 'numero': '1', 'cidade': 'Catanduva', 'uf': 'SP'}}
    r = http('POST', 'rest/v1/rpc/criar_pedido_site', {'p_cliente': cli, 'p_itens': [{'produto_id': zilda, 'quantidade': 1000}]}); ok(r[0] == 400, f'loja do site: quantidade acima de 999 é recusada: {r[1].get("message")}')
    r = http('POST', 'rest/v1/rpc/criar_pedido_site', {'p_cliente': cli, 'p_itens': [{'produto_id': zilda, 'quantidade': 1}]}, adm); ok(r[0] == 200 and r[1][0]['total'] == 1788, f'compra na loja do site feita com a administração logada sai com o preço certo: {r[1][0]["total"] if r[0] == 200 else r[1]}')
    for i in range(6): r = http('POST', 'rest/v1/rpc/criar_pedido_site', {'p_cliente': cli, 'p_itens': [{'produto_id': zilda, 'quantidade': 1}]})
    ok(r[0] == 400 and 'em aberto' in r[1]['message'] and banco("select count(*) from pedidos where origem = 'site'") == '5', f'no máximo 5 pedidos em aberto por CPF: {r[1]["message"]}')
    for i in range(6): r = http('POST', f'storage/v1/object/vendas/site/{chaveS}/extra{i}.png', png, None, 'image/png')
    ok(r[0] == 400 and banco(f"select count(*) from storage.objects where name like 'site/{chaveS}/%'") == '5', 'no máximo 5 arquivos por pedido do site')

    print('--- conta desativada')
    http('PATCH', f'rest/v1/perfis?id=eq.{marId}', {'ativo': False}, adm, pref=REP)
    ok(vazio(http('GET', 'rest/v1/precos?select=*', token=mar)) and vazio(http('GET', 'rest/v1/pedidos?select=*', token=mar)) and negado(http('POST', 'rest/v1/pedidos', [{'origem': 'interno', 'vendedor_id': marId, 'cliente_nome': 'x'}], mar, pref=REP)) and http('GET', 'storage/v1/object/authenticated/vendas/' + cam, token=mar)[0] == 400, 'conta desativada perde o acesso na hora, mesmo com a sessão aberta')
    print('recusas registradas pelo servidor:', len(recusas()))
finally:
    srv.terminate()
print('\nFALHAS:', F if F else 'nenhuma')
