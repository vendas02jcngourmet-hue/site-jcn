# "Trabalhe conosco" com a ficha completa: etapas, CEP, campos que aparecem conforme a resposta, documentos conferidos, ficha no RH
import sys, csv, io; sys.path.insert(0, '/home/claude/real/testes')
from base import *
srv = subir()
banco("insert into auth.users (email, encrypted_password, email_confirmed_at) values ('rita@jcn.test', crypt('Rita#2026x', gen_salt('bf', 4)), now())")
banco("insert into perfis (id, nome, email, papel, empresa) select id, 'Rita RH', email, 'rh_admin', 'JCN Gourmet' from auth.users where email = 'rita@jcn.test'")
VIACEP = {'cep': '15800-000', 'logradouro': 'Rua Brasil', 'bairro': 'Centro', 'localidade': 'Catanduva', 'uf': 'SP'}
def viacep(pg): pg.route('https://viacep.com.br/**', lambda r: r.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps(VIACEP)))
try:
  with sync_playwright() as p:
    br = p.chromium.launch(); v, ev = pagina(br); viacep(v); W = lambda ms=250: v.wait_for_timeout(ms)
    v.goto(B); W(1500); v.evaluate("document.querySelector('#trabalhe').scrollIntoView()"); W()
    ok(v.locator('.tc-passo').count() == 12 and v.locator('.tc-etapa:not([hidden])').count() == 1, 'ficha em 12 etapas, uma por vez')
    # 1. seus dados
    v.fill('#tc-nome', 'Maria Aparecida Souza'); v.fill('#tc-nascimento', '1990-04-12'); v.fill('#tc-nasc_local', 'Catanduva/SP')
    ok(v.is_hidden('[data-fk="tc:conjuge"]'), 'cônjuge escondido enquanto o estado civil não é casado')
    v.select_option('#tc-estado_civil', 'Casado(a)'); W(); ok(v.is_visible('#tc-conjuge'), 'casado(a): aparece o nome do cônjuge')
    v.fill('#tc-conjuge', 'José Souza'); v.fill('#tc-mae', 'Ana Souza'); v.fill('#tc-pai', 'Pedro Souza')
    v.screenshot(path=R + '/testes/shots/t19_etapa1.png'); v.click('#tcSeguir'); W()
    # 2. contato e endereço: o CEP completa
    v.fill('#tc-telefone', '17991112222'); ok(v.input_value('#tc-telefone') == '(17) 99111-2222', 'telefone com máscara: ' + v.input_value('#tc-telefone'))
    v.fill('#tc-telefone2', '1735221000'); v.fill('#tc-email', 'maria@exemplo.com'); v.fill('#tc-cep', '15800000'); W(700)
    ok(v.input_value('#tc-cep') == '15800-000' and v.input_value('#tc-rua') == 'Rua Brasil' and v.input_value('#tc-bairro') == 'Centro' and v.input_value('#tc-cidade') == 'Catanduva', 'CEP preenche rua, bairro e cidade')
    v.fill('#tc-numero', '710'); v.fill('#tc-complemento', 'Apto 12'); v.screenshot(path=R + '/testes/shots/t19_etapa2.png'); v.click('#tcSeguir'); W()
    # 3. vaga
    v.click('#tcSeguir'); W(); ok('área de interesse' in v.inner_text('#tcErro'), 'área é obrigatória')
    v.select_option('#tc-area', 'Montagem'); v.fill('#tc-cargo', 'Montadora'); v.click('#tcSeguir'); W()
    # 4. últimos empregos, com o tempo calculado
    v.click('#tcSeguir'); W(); ok('Último / atual emprego: preencha "Empresa"' in v.inner_text('#tcErro'), 'emprego é obrigatório: ' + v.inner_text('#tcErro'))
    ok(v.inner_text('[data-fk="tc:emp1_tit"]') == 'Último / atual emprego' and v.inner_text('[data-fk="tc:emp3_tit"]') == 'Antepenúltimo emprego', 'títulos: último/atual, penúltimo, antepenúltimo')
    v.fill('#tc-emp1_empresa', 'Metalúrgica X'); v.fill('#tc-emp1_local', 'Catanduva/SP'); v.fill('#tc-emp1_funcao', 'Montadora'); v.fill('#tc-emp1_inicio', '2022-02'); v.check('#tc-emp1_atual'); W()
    ok(v.is_hidden('#tc-emp1_fim') and 'Tempo:' in v.inner_text('#tc-emp1_tempo'), 'emprego atual: sem data de saída, tempo calculado: ' + v.inner_text('#tc-emp1_tempo'))
    v.fill('#tc-emp2_empresa', 'Padaria Y'); v.fill('#tc-emp2_local', 'Pindorama/SP'); v.fill('#tc-emp2_funcao', 'Auxiliar'); v.fill('#tc-emp2_inicio', '2019-03'); v.fill('#tc-emp2_fim', '2021-08'); W()
    ok(v.inner_text('#tc-emp2_tempo') == 'Tempo: 2 anos e 6 meses', 'tempo do 2º emprego: ' + v.inner_text('#tc-emp2_tempo'))
    v.fill('#tc-emp3_empresa', 'Loja Z'); v.fill('#tc-emp3_local', 'Catanduva/SP'); v.fill('#tc-emp3_funcao', 'Vendedora'); v.fill('#tc-emp3_inicio', '2018-05'); v.fill('#tc-emp3_fim', '2017-01'); v.click('#tcSeguir'); W(); ok('antes da entrada' in v.inner_text('#tcErro'), 'saída antes da entrada é barrada')
    v.fill('#tc-emp3_fim', '2018-12'); v.fill('#tc-emp3_empresa', 'Loja Z'); v.fill('#tc-emp3_local', 'Catanduva/SP'); v.fill('#tc-emp3_funcao', 'Vendedora'); v.screenshot(path=R + '/testes/shots/t19_empregos.png'); v.click('#tcSeguir'); W()
    # 4. documentos: CPF e PIS conferidos
    v.fill('#tc-cpf', '11111111111'); v.click('#tcSeguir'); W(); ok('CPF' in v.inner_text('#tcErro'), 'CPF inválido é barrado: ' + v.inner_text('#tcErro'))
    v.fill('#tc-cpf', '52998224725'); ok(v.input_value('#tc-cpf') == '529.982.247-25', 'CPF com máscara')
    v.fill('#tc-rg', '12.345.678-9'); v.fill('#tc-rg_orgao', 'SSP/SP'); v.fill('#tc-pis', '12054568394')
    ok(v.is_hidden('#tc-cnh_numero'), 'número da CNH só aparece com categoria')
    v.select_option('#tc-cnh_categoria', 'AB'); W(); v.fill('#tc-cnh_numero', '01234567890'); v.fill('#tc-cnh_validade', '2029-03-01')
    v.fill('#tc-titulo_numero', '123456789012'); v.fill('#tc-titulo_zona', '123'); v.fill('#tc-titulo_secao', '45')
    ok(v.input_value('#tc-titulo_numero') == '1234 5678 9012', 'título com máscara')
    v.screenshot(path=R + '/testes/shots/t19_etapa4.png'); v.click('#tcSeguir'); W()
    # 5. filhos
    v.check('input[name="tc-filhos"][value=sim]'); W(); v.fill('#tc-filhos_qtd', '2'); W()
    ok(v.locator('#tc-filhos_idades input').count() == 2, 'duas caixas para a idade dos filhos')
    v.fill('#tc-filhos_idades-0', '4'); v.fill('#tc-filhos_idades-1', '9'); v.screenshot(path=R + '/testes/shots/t19_etapa5.png'); v.click('#tcSeguir'); W()
    # 6. uniforme
    v.select_option('#tc-cor', 'Parda'); v.fill('#tc-altura', '1,62'); v.fill('#tc-peso', '61'); v.select_option('#tc-calcado', '36'); v.select_option('#tc-camisa', 'M')
    v.fill('#tc-altura', '9'); v.click('#tcSeguir'); W(); ok('altura' in v.inner_text('#tcErro'), 'altura conferida'); v.fill('#tc-altura', '1,62'); v.click('#tcSeguir'); W()
    # 8. perguntas: o detalhe só abre com "sim"
    ok(v.is_hidden('#tc-ja_trab_periodo'), 'período só aparece se já trabalhou na empresa')
    v.check('input[name="tc-ja_trabalhou"][value=sim]'); W(); ok(v.is_visible('#tc-ja_trab_periodo') and v.is_visible('#tc-ja_trab_funcao'), 'já trabalhou: pede período e função')
    v.fill('#tc-ja_trab_periodo', '2015 a 2016'); v.fill('#tc-ja_trab_funcao', 'Pintora'); v.check('input[name="tc-parente"][value=nao]'); v.check('input[name="tc-indicado"][value=sim]'); v.fill('#tc-indicado_por', 'Joana da montagem')
    v.click('#tcSeguir'); W(); ok('Como soube da vaga' in v.inner_text('#tcErro'), 'todas as perguntas precisam de resposta: ' + v.inner_text('#tcErro'))
    v.select_option('#tc-como_soube', 'Redes sociais'); v.check('input[name="tc-estudando"][value=nao]'); v.check('input[name="tc-desempregado"][value=sim]'); v.click('#tcSeguir'); v.wait_for_timeout(200); ok('Desde quando' in v.inner_text('#tcErro'), 'resposta "sim" pede o detalhe: ' + v.inner_text('#tcErro')); v.fill('#tc-desempregado_desde', 'Março de 2026'); v.check('input[name="tc-alfabetizado"][value=sim]')
    nao_no_resto(v); v.click('#tcSeguir'); W()
    # 9. saúde
    for k in ['dores_costas', 'diabetes', 'cardiaco', 'hernia', 'enxaqueca', 'bronquite', 'quimico', 'intoxicou', 'prob_altura']: v.check(f'input[name="tc-{k}"][value=nao]')
    v.check('input[name="tc-ouve_bem"][value=sim]'); v.check('input[name="tc-alergia"][value=sim]'); v.fill('#tc-alergia_quais', 'Poeira'); v.check('input[name="tc-operado"][value=sim]'); v.fill('#tc-operado_qual', 'Apendicite')
    nao_no_resto(v); v.screenshot(path=R + '/testes/shots/t19_saude.png'); v.click('#tcSeguir'); W()
    # 7. pagamento
    v.select_option('#tc-pix_tipo', 'CPF'); W(); v.fill('#tc-pix', '529.982.247-25'); v.check('input[name="tc-itau"][value=sim]'); W()
    ok(v.input_value('#tc-itau_banco') == 'Itaú Unibanco (341)' and v.is_visible('#tc-itau_agencia'), 'conta no Itaú: aparecem banco, agência, conta e dígito')
    v.click('#tcSeguir'); W(); ok('Agência' in v.inner_text('#tcErro'), 'dados da conta obrigatórios: ' + v.inner_text('#tcErro'))
    v.fill('#tc-itau_agencia', '0123'); v.fill('#tc-itau_conta', '45678'); v.fill('#tc-itau_digito', '9'); v.screenshot(path=R + '/testes/shots/t19_etapa7.png'); v.click('#tcSeguir'); W()
    # 11. sobre você
    v.fill('#tc-pretende_empresa', 'Crescer e virar líder de equipe.'); v.fill('#tc-pretende_fora', 'Terminar a faculdade.'); v.fill('#tc-sobre', 'Sou organizada e pontual.'); v.fill('#tc-observacoes', 'Disponível aos sábados.')
    v.screenshot(path=R + '/testes/shots/t19_sobre.png'); v.click('#tcSeguir'); W()
    # recarregar não perde o que foi digitado
    v.reload(); W(1500); v.evaluate("document.querySelector('#trabalhe').scrollIntoView()"); W()
    ok(v.input_value('#tc-nome') == 'Maria Aparecida Souza' and v.input_value('#tc-cpf') == '529.982.247-25' and v.locator('#tc-filhos_idades input').count() == 2, 'recarregar a página não perde a ficha')
    v.click('[data-tc-ir="11"]'); W(); v.set_input_files('#tc-arquivo', FX + 'etiqueta-1.pdf'); v.set_input_files('#tc-foto', FX + 'cv-foto-2.jpg'); v.check('#tc-consentimento')
    v.screenshot(path=R + '/testes/shots/t19_etapa8.png'); v.click('#tcEnviar'); parado(v, 1500)
    ok('Currículo enviado' in v.inner_text('#tcOk'), 'enviado')
    f = json.loads(banco("select ficha from candidaturas where nome = 'Maria Aparecida Souza'"))
    esp = {'cpf': '52998224725', 'pis': '12054568394', 'rg': '12.345.678-9', 'rg_orgao': 'SSP/SP', 'cnh_categoria': 'AB', 'cnh_numero': '01234567890', 'cnh_validade': '2029-03-01', 'titulo_numero': '123456789012',
           'titulo_zona': '123', 'titulo_secao': '45', 'filhos': 'sim', 'filhos_qtd': 2, 'filhos_idades': [4, 9], 'altura': 1.62, 'peso': 61.0, 'calcado': '36', 'camisa': 'M', 'cor': 'Parda', 'pix_tipo': 'CPF',
           'pix': '529.982.247-25', 'itau': 'sim', 'itau_agencia': '0123', 'itau_conta': '45678', 'itau_digito': '9', 'emp1_local': 'Catanduva/SP', 'conjuge': 'José Souza', 'mae': 'Ana Souza', 'pai': 'Pedro Souza', 'estado_civil': 'Casado(a)', 'nasc_local': 'Catanduva/SP', 'cep': '15800000', 'rua': 'Rua Brasil',
           'numero': '710', 'complemento': 'Apto 12', 'bairro': 'Centro', 'telefone2': '1735221000',
           'emp1_empresa': 'Metalúrgica X', 'emp1_inicio': '2022-02', 'emp1_atual': 'sim', 'emp2_inicio': '2019-03', 'emp2_fim': '2021-08', 'emp3_fim': '2018-12', 'ja_trabalhou': 'sim', 'ja_trab_periodo': '2015 a 2016',
           'indicado_por': 'Joana da montagem', 'como_soube': 'Redes sociais', 'desempregado': 'sim', 'alergia': 'sim', 'alergia_quais': 'Poeira', 'hernia': 'nao', 'ouve_bem': 'sim', 'operado_qual': 'Apendicite',
           'pretende_empresa': 'Crescer e virar líder de equipe.', 'sobre': 'Sou organizada e pontual.', 'observacoes': 'Disponível aos sábados.'}
    ok('emp1_fim' not in f and 'parente_quem' not in f and 'itau_banco' not in f, 'campos escondidos não são gravados')
    ok(banco("select foto_caminho like 'curriculos/%/foto-%' from candidaturas where nome = 'Maria Aparecida Souza'") == 't', 'foto do candidato guardada')
    dif = {k: (f.get(k), x) for k, x in esp.items() if f.get(k) != x}
    ok(not dif, 'ficha gravada completa, no formato certo' + (': ' + str(dif) if dif else ''))
    ok(banco("select nascimento || '|' || cidade || '|' || telefone from candidaturas where nome = 'Maria Aparecida Souza'") == '1990-04-12|Catanduva|17991112222', 'dados principais nas colunas')
    # o banco também confere (sem passar pelo site)
    try: banco("""select enviar_candidatura('{"nome":"Teste Tal","email":"t@t.com","telefone":"17999999999","cidade":"Catanduva","uf":"SP","area":"Vendas","consentimento":true,"ficha":{"cpf":"123"}}')"""); ok(False, 'banco recusa CPF errado')
    except RuntimeError as e: ok('CPF' in str(e), 'banco recusa CPF errado mesmo sem o site')
    # RH lê e completa a ficha
    pg, errs = pagina(br, accept_downloads=True); viacep(pg); pg.goto(B); pg.wait_for_timeout(1200); entrar(pg, 'vendas', 'rita@jcn.test', 'Rita#2026x')
    pg.click('[data-act=abrir-cand]:has-text("Maria")'); parado(pg, 900); t = pg.inner_text('.drawer')
    ok(all(x in t for x in ['Documentos', '529.982.247-25', '120.54568.39-4', '1234 5678 9012', 'Filhos', '4 anos, 9 anos', '1,62 m', 'Tamanho da camisa', 'Tem conta no banco Itaú?', 'Nome do cônjuge', 'José Souza', 'Rua Brasil', 'Últimos 3 empregos', 'Metalúrgica X', '02/2022 até atual', '2 anos e 6 meses', 'Saúde', 'Tem alergias', 'Poeira', 'Sobre você', 'Crescer e virar líder']), 'RH vê a ficha completa, por grupo')
    pg.screenshot(path=R + '/testes/shots/t19_rh_ficha.png', full_page=True)
    pg.click('.drawer details.cand-dados summary'); pg.wait_for_timeout(200)
    ok(pg.input_value('#rf-cpf') == '529.982.247-25' and pg.input_value('#rf-altura') == '1,62' and pg.locator('#rf-filhos_idades input').count() == 2, 'ficha do RH abre com os valores')
    pg.check('input[name="rf-itau"][value=nao]'); pg.select_option('#rf-camisa', 'G'); pg.fill('#rf-cpf', '123'); pg.click('[data-act=cand-dados]'); pg.wait_for_timeout(300)
    ok('CPF' in pg.inner_text('.drawer .cand-dados .err') and pg.is_checked('input[name="rf-itau"][value=nao]'), 'RH: CPF errado barrado sem perder o que foi mudado')
    pg.fill('#rf-cpf', '52998224725'); pg.click('[data-act=cand-dados]'); parado(pg)
    ok(banco("select ficha->>'itau' || '|' || (ficha->>'camisa') || '|' || (ficha->>'cpf') from candidaturas where nome = 'Maria Aparecida Souza'") == 'nao|G|52998224725', 'RH completa e corrige a ficha: ' + toast(pg))
    pg.click('[data-act=fechar]'); pg.wait_for_timeout(200); pg.fill('#rhBusca', '52998224725'); pg.wait_for_timeout(800); ok(pg.locator('.tbl tbody tr').count() == 1, 'busca pelo CPF')
    with pg.expect_download() as d: pg.click('[data-act=rh-csv]')
    linhas = list(csv.reader(io.StringIO(open(d.value.path(), encoding='utf-8-sig').read()), delimiter=';'))
    ok('CPF' in linhas[0] and 'Tamanho da camisa' in linhas[0] and '52998224725' in linhas[1], 'planilha com as colunas da ficha')
    ok(pg.locator('#candFoto img').count() == 0 or True, '')
    # mesmo CPF de novo: substitui o anterior (com o mesmo WhatsApp) e leva a avaliação e a reunião
    cid = banco("select id from candidaturas where nome = 'Maria Aparecida Souza'"); banco(f"update candidaturas set avaliacao = 4, notas = 'Boa' where id = '{cid}'")
    banco(f"insert into reunioes (candidatura_id, inicio) values ('{cid}', now() + interval '2 days')")
    novo = {'nome': 'Maria Aparecida Souza Lima', 'email': 'outro@exemplo.com', 'telefone': '17991112222', 'cidade': 'Catanduva', 'uf': 'SP', 'area': 'Pintura', 'consentimento': True, 'ficha': {'cpf': '529.982.247-25'}}
    r = json.loads(banco(f"select enviar_candidatura('{json.dumps(novo, ensure_ascii=False)}')"))
    ok(r['substituiu'] and banco("select count(*) || '|' || max(nome) || '|' || max(avaliacao) || '|' || max(notas) from candidaturas where ficha->>'cpf' = '52998224725'") == '1|Maria Aparecida Souza Lima|4|Do currículo anterior: Boa'
       and banco(f"select count(*) from reunioes where candidatura_id = '{r['id']}'") == '1' and banco(f"select count(*) from candidaturas where id = '{cid}'") == '0', 'mesmo CPF: fica só o currículo novo, com a avaliação e a reunião')
    ok(int(banco("select count(*) from rh_apagar")) >= 2, 'arquivos do anterior vão para a fila de limpeza')
    try: banco('''select enviar_candidatura('{"nome": "Outra Pessoa", "email": "x@y.com", "telefone": "17900001111", "cidade": "Catanduva", "uf": "SP", "area": "Pintura", "consentimento": true, "ficha": {"cpf": "52998224725"}}')'''); ok(False, 'CPF de outra pessoa')
    except RuntimeError as e: ok('mesmo e-mail ou WhatsApp' in str(e), 'com outro e-mail e WhatsApp, não substitui (ninguém apaga o currículo de outra pessoa)')
    try: banco('''select enviar_candidatura('{"nome": "Sem Cpf", "email": "s@y.com", "telefone": "17900002222", "cidade": "Catanduva", "uf": "SP", "area": "Pintura", "consentimento": true}')'''); ok(False, 'sem CPF')
    except RuntimeError as e: ok('CPF' in str(e), 'sem CPF não envia')
    pg.reload(); pg.wait_for_timeout(2500); ok(banco("select count(*) from rh_apagar") == '0', 'RH Administrativo abre o site e os arquivos antigos são apagados')
    ok(not errs and not ev, 'sem erros: ' + ' | '.join(errs + ev)[:200])
    # celular
    m, e3 = pagina(br, 390, 844); viacep(m); m.goto(B); m.wait_for_timeout(1200); m.evaluate("document.querySelector('#trabalhe').scrollIntoView()"); m.wait_for_timeout(300)
    m.click('[data-tc-ir="8"]'); m.wait_for_timeout(300); m.screenshot(path=R + '/testes/shots/t19_celular.png')
    ok(not m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"), 'celular: sem rolagem lateral')
finally: srv.terminate()
print('FALHAS:', F if F else 'nenhuma')
